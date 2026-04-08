import {
  BadRequestException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { compare, hash } from 'bcrypt';
import { OAuth2Client } from 'google-auth-library';
import { createHash, randomUUID } from 'crypto';
import { sign, verify } from 'jsonwebtoken';
import type { Algorithm, SignOptions } from 'jsonwebtoken';
import type { Request } from 'express';
import type { AppRole } from '@constants/roles.constant';
import type { NewAuditLog, User } from '@database/drizzle/schema';
import { UsersRepository } from '@modules/users/users.repository';
import { SessionsService } from '@modules/sessions/sessions.service';
import { AuthRepository } from './auth.repository';
import type { AuthResponseDto, AuthUserDto } from './dto/auth-response.dto';
import type { GoogleAuthDto } from './dto/google-auth.dto';
import type { LoginDto } from './dto/login.dto';
import type { OAuth2Provider } from './dto/oauth2-provider.dto';
import type { RefreshTokenDto } from './dto/refresh-token.dto';
import type { SignupDto } from './dto/signup.dto';

type AccessTokenPayload = {
  sub: number;
  email: string;
  role: AppRole;
  tenantId: number;
  sid: string;
};

type RefreshTokenPayload = {
  sub: number;
  tenantId: number;
  sid: string;
};

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private oauthClient?: OAuth2Client;

  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly sessionsService: SessionsService,
    private readonly authRepository: AuthRepository,
    private readonly configService: ConfigService,
  ) {}

  async signup(dto: SignupDto, request: Request): Promise<AuthResponseDto> {
    const email = dto.email.toLowerCase();
    const existing = await this.usersRepository.findByEmail(email);
    if (existing) {
      throw new BadRequestException('Email already in use');
    }

    const requestedRole = dto.role || 'user';
    if (requestedRole === 'admin') {
      throw new BadRequestException('Admin role cannot be self-assigned');
    }

    const passwordHash = await hash(dto.password, this.getBcryptRounds());
    const tenantId = await this.resolveTenantForSignup(requestedRole, dto.name, email);

    const createdUser = await this.usersRepository.create({
      tenantId,
      email,
      name: dto.name,
      passwordHash,
      role: requestedRole,
      authProvider: 'local',
      isActive: true,
      isEmailVerified: false,
    });

    await this.writeAuditLog({
      userId: createdUser.id,
      action: 'signup',
      entity: 'users',
      entityId: String(createdUser.id),
      metadata: {
        role: createdUser.role,
        tenantId: createdUser.tenantId,
      },
      ipAddress: this.getIpAddress(request),
      userAgent: request.headers['user-agent'] || null,
    });

    return this.issueTokens(createdUser, request);
  }

  async login(dto: LoginDto, request: Request): Promise<AuthResponseDto> {
    const user = await this.usersRepository.findByEmail(dto.email.toLowerCase());
    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const validPassword = await compare(dto.password, user.passwordHash);
    if (!validPassword) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is inactive');
    }

    await this.usersRepository.updateLastLogin(user.id);
    const tokenResponse = await this.issueTokens(user, request);

    await this.writeAuditLog({
      userId: user.id,
      action: 'login',
      entity: 'users',
      entityId: String(user.id),
      metadata: {
        role: user.role,
        tenantId: user.tenantId,
      },
      ipAddress: this.getIpAddress(request),
      userAgent: request.headers['user-agent'] || null,
    });

    return tokenResponse;
  }

  async loginWithGoogle(dto: GoogleAuthDto, request: Request): Promise<AuthResponseDto> {
    const payload = await this.verifyGoogleIdToken(dto.idToken);

    const googleSubject = payload.sub;
    const email = String(payload.email || '').toLowerCase();
    const name = payload.name || 'Google User';

    if (!googleSubject || !email) {
      throw new UnauthorizedException('Invalid Google token payload');
    }

    let user: User | null = null;
    const existingOauth = await this.authRepository.findOauthAccount('google', googleSubject);

    if (existingOauth) {
      user = await this.usersRepository.findByIdOrNull(existingOauth.userId);
    } else {
      user = await this.usersRepository.findByEmail(email);
      if (!user) {
        const role = dto.role || 'user';
        const tenantId = await this.resolveTenantForSignup(role, name, email);
        user = await this.usersRepository.create({
          tenantId,
          email,
          name,
          passwordHash: null,
          role,
          authProvider: 'google',
          oauthProviderId: googleSubject,
          isActive: true,
          isEmailVerified: Boolean(payload.email_verified),
        });
      }

      await this.authRepository.createOauthAccount({
        userId: user.id,
        provider: 'google',
        providerUserId: googleSubject,
        email,
      });
    }

    if (!user) {
      throw new UnauthorizedException('Unable to authenticate Google user');
    }

    await this.usersRepository.markEmailVerified(user.id);
    await this.usersRepository.updateLastLogin(user.id);

    await this.writeAuditLog({
      userId: user.id,
      action: 'login',
      entity: 'oauth_accounts',
      entityId: googleSubject,
      metadata: {
        provider: 'google',
        tenantId: user.tenantId,
      },
      ipAddress: this.getIpAddress(request),
      userAgent: request.headers['user-agent'] || null,
    });

    const latestUser = (await this.usersRepository.findByIdOrNull(user.id)) || user;
    return this.issueTokens(latestUser, request);
  }

  async loginWithGoogleAuthorizationCode(
    code: string,
    request: Request,
  ): Promise<AuthResponseDto> {
    const client = this.getGoogleClient();
    const { tokens } = await client.getToken({
      code,
      redirect_uri: this.getGoogleRedirectUri(),
    });

    if (!tokens.id_token) {
      throw new UnauthorizedException('Google token exchange did not return an id_token');
    }

    return this.loginWithGoogle(
      {
        idToken: tokens.id_token,
      },
      request,
    );
  }

  async refresh(dto: RefreshTokenDto, request: Request): Promise<AuthResponseDto> {
    const decoded = this.verifyRefreshToken(dto.refreshToken);
    const session = await this.sessionsService.findActiveSessionById(decoded.sid);
    if (!session) {
      throw new UnauthorizedException('Session is invalid or expired');
    }

    const providedHash = this.hashToken(dto.refreshToken);
    if (providedHash !== session.refreshTokenHash) {
      await this.sessionsService.revokeSessionById(session.id);
      throw new UnauthorizedException('Refresh token mismatch');
    }

    const user = await this.usersRepository.findByIdOrNull(decoded.sub);
    if (!user || !user.isActive) {
      throw new UnauthorizedException('User unavailable');
    }

    await this.sessionsService.revokeSessionById(session.id);
    const nextTokenPair = await this.issueTokens(user, request);

    await this.writeAuditLog({
      userId: user.id,
      action: 'refresh',
      entity: 'sessions',
      entityId: session.id,
      metadata: {
        replacedByNewSession: true,
      },
      ipAddress: this.getIpAddress(request),
      userAgent: request.headers['user-agent'] || null,
    });

    return nextTokenPair;
  }

  async logout(userId: number, sessionId: string, request: Request): Promise<{ success: boolean }> {
    await this.sessionsService.revokeSessionById(sessionId);

    await this.writeAuditLog({
      userId,
      action: 'logout',
      entity: 'sessions',
      entityId: sessionId,
      metadata: {},
      ipAddress: this.getIpAddress(request),
      userAgent: request.headers['user-agent'] || null,
    });

    return { success: true };
  }

  async verifySession(
    userId: number,
    tenantId: number,
    sessionId: string,
    email: string,
    role: AppRole,
    request: Request,
  ) {
    const session = await this.sessionsService.findActiveSessionById(sessionId);
    if (!session || session.userId !== userId) {
      throw new UnauthorizedException('Session invalid');
    }

    await this.writeAuditLog({
      userId,
      action: 'verify',
      entity: 'sessions',
      entityId: sessionId,
      metadata: {},
      ipAddress: this.getIpAddress(request),
      userAgent: request.headers['user-agent'] || null,
    });

    return {
      valid: true,
      userId,
      tenantId,
      email,
      role,
      sessionId,
    };
  }

  prepareOauth2(provider: OAuth2Provider) {
    if (provider !== 'google') {
      throw new BadRequestException(`${provider} OAuth is not configured yet`);
    }

    const client = this.getGoogleClient();
    const url = client.generateAuthUrl({
      access_type: 'offline',
      scope: ['openid', 'email', 'profile'],
      redirect_uri: this.getGoogleRedirectUri(),
      prompt: 'consent',
    });

    return {
      provider,
      redirectUri: this.getGoogleRedirectUri(),
      authorizationUrl: url,
    };
  }

  private async issueTokens(user: User, request: Request): Promise<AuthResponseDto> {
    const sessionId = randomUUID();
    const accessTokenPayload: AccessTokenPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
      sid: sessionId,
    };
    const refreshTokenPayload: RefreshTokenPayload = {
      sub: user.id,
      tenantId: user.tenantId,
      sid: sessionId,
    };

    const accessToken = sign(accessTokenPayload, this.getAccessPrivateKey(), {
      algorithm: 'ES256',
      expiresIn: this.getAccessExpiresIn() as SignOptions['expiresIn'],
    });

    const refreshToken = sign(refreshTokenPayload, this.getRefreshPrivateKey(), {
      algorithm: 'ES512',
      expiresIn: this.getRefreshExpiresIn() as SignOptions['expiresIn'],
    });

    await this.sessionsService.createSession({
      id: sessionId,
      userId: user.id,
      refreshTokenHash: this.hashToken(refreshToken),
      userAgent: request.headers['user-agent'] || null,
      ipAddress: this.getIpAddress(request),
      expiresAt: new Date(Date.now() + this.parseDurationToMs(this.getRefreshExpiresIn())),
      revokedAt: null,
    });

    return {
      user: this.mapUser(user),
      accessToken,
      refreshToken,
      expiresIn: Math.floor(this.parseDurationToMs(this.getAccessExpiresIn()) / 1000),
    };
  }

  private verifyRefreshToken(token: string): RefreshTokenPayload {
    try {
      const decoded = verify(token, this.getRefreshPublicKey(), {
        algorithms: ['ES512' satisfies Algorithm],
      });

      if (typeof decoded !== 'object' || !decoded) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const sub = Number((decoded as { sub?: number | string }).sub);
      const sid = String((decoded as { sid?: string }).sid || '');
      const tenantId = Number((decoded as { tenantId?: number | string }).tenantId);

      if (!sub || !sid || !tenantId) {
        throw new UnauthorizedException('Invalid refresh token payload');
      }

      return { sub, sid, tenantId };
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  private async verifyGoogleIdToken(idToken: string) {
    const ticket = await this.getGoogleClient().verifyIdToken({
      idToken,
      audience: this.getGoogleClientId(),
    });
    const payload = ticket.getPayload();
    if (!payload) {
      throw new UnauthorizedException('Google token verification failed');
    }
    return payload;
  }

  private getGoogleClient(): OAuth2Client {
    if (!this.oauthClient) {
      this.oauthClient = new OAuth2Client(
        this.getGoogleClientId(),
        this.configService.get<string>('GOOGLE_CLIENT_SECRET') || '',
        this.getGoogleRedirectUri(),
      );
    }

    return this.oauthClient;
  }

  private async resolveTenantForSignup(
    role: AppRole,
    displayName: string,
    email: string,
  ): Promise<number> {
    if (role === 'sme' || role === 'creator') {
      const preferredSlugBase = this.slugify(displayName || email.split('@')[0] || role);
      const preferredSlug = `${preferredSlugBase}-${role}`;
      const existing = await this.usersRepository.findTenantBySlug(preferredSlug);
      if (existing) {
        return existing.id;
      }

      const createdTenant = await this.usersRepository.createTenant({
        name: `${displayName || role} Workspace`,
        slug: preferredSlug,
        isActive: true,
      });
      return createdTenant.id;
    }

    const publicTenantSlug = 'public-tenant';
    const publicTenant = await this.usersRepository.findTenantBySlug(publicTenantSlug);
    if (publicTenant) {
      return publicTenant.id;
    }

    const created = await this.usersRepository.createTenant({
      name: 'Public Tenant',
      slug: publicTenantSlug,
      isActive: true,
    });
    return created.id;
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private mapUser(user: User): AuthUserDto {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      tenantId: user.tenantId,
      isEmailVerified: user.isEmailVerified,
    };
  }

  private async writeAuditLog(log: NewAuditLog): Promise<void> {
    await this.authRepository.createAuditLog(log);
  }

  private parseDurationToMs(duration: string): number {
    const match = duration.match(/^(\d+)([smhd])$/i);
    if (!match) {
      return 15 * 60 * 1000;
    }

    const value = Number(match[1]);
    const unit = match[2].toLowerCase();

    if (unit === 's') return value * 1000;
    if (unit === 'm') return value * 60 * 1000;
    if (unit === 'h') return value * 60 * 60 * 1000;
    return value * 24 * 60 * 60 * 1000;
  }

  private getBcryptRounds(): number {
    const rounds = Number(this.configService.get<string>('BCRYPT_ROUNDS') || '10');
    return Number.isFinite(rounds) ? rounds : 10;
  }

  private getAccessExpiresIn(): string {
    return (
      this.configService.get<string>('JWT_ACCESS_EXPIRES_IN') ||
      this.configService.get<string>('JWT_EXPIRES_IN') ||
      '15m'
    );
  }

  private getRefreshExpiresIn(): string {
    return (
      this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') ||
      this.configService.get<string>('JWT_REFRESH_EXPIRATION') ||
      '7d'
    );
  }

  private getAccessPrivateKey(): string {
    return this.normalizePemKey(
      this.configService.get<string>('JWT_ACCESS_PRIVATE_KEY'),
      'JWT_ACCESS_PRIVATE_KEY',
    );
  }

  private getAccessPublicKey(): string {
    return this.normalizePemKey(
      this.configService.get<string>('JWT_ACCESS_PUBLIC_KEY'),
      'JWT_ACCESS_PUBLIC_KEY',
    );
  }

  private getRefreshPrivateKey(): string {
    return this.normalizePemKey(
      this.configService.get<string>('JWT_REFRESH_PRIVATE_KEY'),
      'JWT_REFRESH_PRIVATE_KEY',
    );
  }

  private getRefreshPublicKey(): string {
    return this.normalizePemKey(
      this.configService.get<string>('JWT_REFRESH_PUBLIC_KEY'),
      'JWT_REFRESH_PUBLIC_KEY',
    );
  }

  private getGoogleClientId(): string {
    const clientId = this.configService.get<string>('GOOGLE_CLIENT_ID');
    if (!clientId) {
      throw new BadRequestException('GOOGLE_CLIENT_ID is not configured');
    }
    return clientId;
  }

  private getGoogleRedirectUri(): string {
    return (
      this.configService.get<string>('GOOGLE_REDIRECT_URI') ||
      'http://localhost:3000/auth/google/callback'
    );
  }

  private normalizePemKey(rawValue: string | undefined, envName: string): string {
    if (!rawValue) {
      throw new BadRequestException(`${envName} is not configured`);
    }

    return rawValue.replace(/\\n/g, '\n');
  }

  private getIpAddress(request: Request): string | null {
    if (request.ip) {
      return request.ip;
    }

    const forwarded = request.headers['x-forwarded-for'];
    if (typeof forwarded === 'string') {
      return forwarded.split(',')[0].trim();
    }

    return null;
  }

  private slugify(value: string): string {
    return value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 40);
  }
}
