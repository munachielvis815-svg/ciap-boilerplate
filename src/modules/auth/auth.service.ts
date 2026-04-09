import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { compare, hash } from 'bcrypt';
import { OAuth2Client } from 'google-auth-library';
import { createHash, randomUUID } from 'crypto';
import { sign, verify } from 'jsonwebtoken';
import { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';
import type { Algorithm, SignOptions } from 'jsonwebtoken';
import type { Request } from 'express';
import type { AppRole, PublicOnboardingRole } from '@constants/roles.constant';
import type { NewAuditLog, OauthAccount, User } from '@database/drizzle/schema';
import {
  AccountDisabledException,
  DuplicateEmailException,
  ExternalApiException,
  InvalidCredentialsException,
  InvalidEnumException,
  InvalidTokenException,
  MissingFieldException,
  TokenExpiredException,
} from '@common/exceptions';
import { UsersRepository } from '@modules/users/users.repository';
import { SessionsService } from '@modules/sessions/sessions.service';
import { AuthRepository } from './auth.repository';
import type { AuthResponseDto, AuthUserDto } from './dto/auth-response.dto';
import type { AdminSignupDto } from './dto/admin-signup.dto';
import type { GoogleAuthDto } from './dto/google-auth.dto';
import type { LoginDto } from './dto/login.dto';
import type { OAuth2Provider } from './dto/oauth2-provider.dto';
import type { RefreshTokenDto } from './dto/refresh-token.dto';
import type { SignupDto } from './dto/signup.dto';
import type { RequestUser } from '@/types';

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

type GoogleTokenExchangePayload = {
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: Date | null;
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
      throw new DuplicateEmailException(email);
    }

    const requestedRole: PublicOnboardingRole = dto.role || 'user';

    const passwordHash = await hash(dto.password, this.getBcryptRounds());
    const tenantId = await this.resolveTenantForSignup(
      requestedRole,
      dto.name,
      email,
    );

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

  async adminSignup(
    dto: AdminSignupDto,
    request: Request,
  ): Promise<AuthResponseDto> {
    const expectedAdminSignupKey =
      this.configService.get<string>('ADMIN_SIGNUP_KEY');
    if (!expectedAdminSignupKey) {
      throw new MissingFieldException('ADMIN_SIGNUP_KEY');
    }

    if (dto.adminSignupKey !== expectedAdminSignupKey) {
      throw new InvalidCredentialsException({
        reason: 'invalid-admin-signup-key',
      });
    }

    const email = dto.email.toLowerCase();
    const existing = await this.usersRepository.findByEmail(email);
    if (existing) {
      throw new DuplicateEmailException(email);
    }

    const passwordHash = await hash(dto.password, this.getBcryptRounds());
    const tenantId = await this.resolveAdminTenantId();

    const createdUser = await this.usersRepository.create({
      tenantId,
      email,
      name: dto.name,
      passwordHash,
      role: 'admin',
      authProvider: 'local',
      isActive: true,
      isEmailVerified: true,
    });

    await this.writeAuditLog({
      userId: createdUser.id,
      action: 'signup',
      entity: 'users',
      entityId: String(createdUser.id),
      metadata: {
        role: createdUser.role,
        tenantId: createdUser.tenantId,
        flow: 'admin-signup',
      },
      ipAddress: this.getIpAddress(request),
      userAgent: request.headers['user-agent'] || null,
    });

    return this.issueTokens(createdUser, request);
  }

  async login(dto: LoginDto, request: Request): Promise<AuthResponseDto> {
    const user = await this.usersRepository.findByEmail(
      dto.email.toLowerCase(),
    );
    if (!user || !user.passwordHash) {
      throw new InvalidCredentialsException();
    }

    const validPassword = await compare(dto.password, user.passwordHash);
    if (!validPassword) {
      throw new InvalidCredentialsException();
    }

    if (!user.isActive) {
      throw new AccountDisabledException({ userId: user.id });
    }

    if (user.role === 'admin') {
      throw new InvalidCredentialsException({
        reason: 'use-admin-login-endpoint',
      });
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

  async adminLogin(dto: LoginDto, request: Request): Promise<AuthResponseDto> {
    const user = await this.usersRepository.findByEmail(
      dto.email.toLowerCase(),
    );
    if (!user || !user.passwordHash || user.role !== 'admin') {
      throw new InvalidCredentialsException();
    }

    const validPassword = await compare(dto.password, user.passwordHash);
    if (!validPassword) {
      throw new InvalidCredentialsException();
    }

    if (!user.isActive) {
      throw new AccountDisabledException({ userId: user.id });
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
        flow: 'admin-login',
      },
      ipAddress: this.getIpAddress(request),
      userAgent: request.headers['user-agent'] || null,
    });

    return tokenResponse;
  }

  async loginWithGoogle(
    dto: GoogleAuthDto,
    request: Request,
    googleTokens?: GoogleTokenExchangePayload,
  ): Promise<AuthResponseDto> {
    const payload = await this.verifyGoogleIdToken(dto.idToken);

    const googleSubject = payload.sub;
    const email = String(payload.email || '').toLowerCase();
    const name = payload.name || 'Google User';

    if (!googleSubject || !email) {
      throw new InvalidTokenException({
        provider: 'google',
        reason: 'invalid-payload',
      });
    }

    let user: User | null = null;
    const existingOauth = await this.authRepository.findOauthAccount(
      'google',
      googleSubject,
    );
    let oauthAccount: OauthAccount | null = existingOauth;

    if (existingOauth) {
      user = await this.usersRepository.findByIdOrNull(existingOauth.userId);
    } else {
      user = await this.usersRepository.findByEmail(email);
      if (!user) {
        const role: PublicOnboardingRole = dto.role || 'user';
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

      oauthAccount = await this.authRepository.createOauthAccount({
        userId: user.id,
        provider: 'google',
        providerUserId: googleSubject,
        email,
      });
    }

    if (!user) {
      throw new InvalidCredentialsException({ provider: 'google' });
    }

    await this.usersRepository.markEmailVerified(user.id);
    await this.usersRepository.updateLastLogin(user.id);
    await this.saveGoogleOauthTokens(oauthAccount, googleTokens, email);

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

    const latestUser =
      (await this.usersRepository.findByIdOrNull(user.id)) || user;
    return this.issueTokens(latestUser, request);
  }

  async loginWithGoogleAuthorizationCode(
    code: string,
    request: Request,
  ): Promise<AuthResponseDto> {
    if (!code?.trim()) {
      throw new MissingFieldException('code');
    }

    const client = this.getGoogleClient();
    try {
      const { tokens } = await client.getToken({
        code,
        redirect_uri: this.getGoogleRedirectUri(),
      });

      if (!tokens.id_token) {
        throw new InvalidTokenException({
          provider: 'google',
          reason: 'missing-id-token',
        });
      }

      return this.loginWithGoogle(
        {
          idToken: tokens.id_token,
          role: 'user',
        },
        request,
        {
          accessToken: tokens.access_token ?? undefined,
          refreshToken: tokens.refresh_token ?? undefined,
          expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
        },
      );
    } catch (error) {
      if (
        error instanceof MissingFieldException ||
        error instanceof InvalidTokenException
      ) {
        throw error;
      }

      if (this.isGoogleInvalidGrantError(error)) {
        throw new InvalidTokenException({
          provider: 'google',
          reason: 'invalid-grant',
        });
      }

      this.logger.error(
        'Google OAuth authorization code exchange failed',
        error instanceof Error ? error.stack : undefined,
      );
      throw new ExternalApiException('Google OAuth', {
        reason: 'token-exchange-failed',
      });
    }
  }

  async refresh(
    dto: RefreshTokenDto,
    request: Request,
  ): Promise<AuthResponseDto> {
    const decoded = this.verifyRefreshToken(dto.refreshToken);
    const session = await this.sessionsService.findActiveSessionById(
      decoded.sid,
    );
    if (!session) {
      throw new InvalidTokenException({ reason: 'session-expired' });
    }

    const providedHash = this.hashToken(dto.refreshToken);
    if (providedHash !== session.refreshTokenHash) {
      await this.sessionsService.revokeSessionById(session.id);
      throw new InvalidTokenException({ reason: 'refresh-token-mismatch' });
    }

    const user = await this.usersRepository.findByIdOrNull(decoded.sub);
    if (!user || !user.isActive) {
      throw new AccountDisabledException({ userId: decoded.sub });
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

  async logout(
    userId: number,
    sessionId: string,
    request: Request,
  ): Promise<{ success: boolean }> {
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
      throw new InvalidTokenException({ reason: 'session-invalid' });
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
      throw new InvalidEnumException('provider', ['google'], {
        providedValue: provider,
      });
    }

    const client = this.getGoogleClient();
    const url = client.generateAuthUrl({
      access_type: 'offline',
      scope: [
        'openid',
        'email',
        'profile',
        'https://www.googleapis.com/auth/youtube.readonly',
        'https://www.googleapis.com/auth/yt-analytics.readonly',
      ],
      redirect_uri: this.getGoogleRedirectUri(),
      prompt: 'consent',
    });

    return {
      provider,
      redirectUri: this.getGoogleRedirectUri(),
      authorizationUrl: url,
    };
  }

  async refreshGoogleOauthTokensForUser(
    targetUserId: number,
    actor: RequestUser,
  ): Promise<{ accessToken: string; tokenExpiresAt: Date | null }> {
    if (actor.role !== 'admin' && actor.id !== targetUserId) {
      throw new InvalidCredentialsException({
        reason: 'cross-user-google-token-refresh-forbidden',
      });
    }

    if (actor.role !== 'admin' && actor.id === targetUserId) {
      const actorRecord = await this.usersRepository.findByIdOrNull(actor.id);
      if (!actorRecord || actorRecord.tenantId !== actor.tenantId) {
        throw new InvalidCredentialsException({
          reason: 'tenant-context-mismatch',
        });
      }
    }

    const oauthAccount =
      await this.authRepository.findOauthAccountByUserAndProvider(
        targetUserId,
        'google',
      );
    if (!oauthAccount) {
      throw new InvalidTokenException({
        provider: 'google',
        reason: 'oauth-account-not-found',
      });
    }

    if (!oauthAccount.refreshToken) {
      throw new InvalidTokenException({
        provider: 'google',
        reason: 'missing-refresh-token',
      });
    }

    try {
      const googleClient = this.getGoogleClient();
      googleClient.setCredentials({
        refresh_token: oauthAccount.refreshToken,
      });

      const { credentials } = await googleClient.refreshAccessToken();
      const accessToken = credentials.access_token ?? oauthAccount.accessToken;

      if (!accessToken) {
        throw new InvalidTokenException({
          provider: 'google',
          reason: 'missing-access-token',
        });
      }

      const tokenExpiresAt = credentials.expiry_date
        ? new Date(credentials.expiry_date)
        : oauthAccount.tokenExpiresAt;
      const refreshToken =
        credentials.refresh_token ?? oauthAccount.refreshToken;

      await this.authRepository.updateOauthAccountTokens(oauthAccount.id, {
        accessToken,
        refreshToken,
        tokenExpiresAt,
      });

      return {
        accessToken,
        tokenExpiresAt,
      };
    } catch (error) {
      if (error instanceof InvalidTokenException) {
        throw error;
      }

      if (this.isGoogleInvalidGrantError(error)) {
        throw new InvalidTokenException({
          provider: 'google',
          reason: 'invalid-grant',
        });
      }

      throw new ExternalApiException('Google OAuth', {
        reason: 'refresh-token-exchange-failed',
      });
    }
  }

  private async issueTokens(
    user: User,
    request: Request,
  ): Promise<AuthResponseDto> {
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

    const refreshToken = sign(
      refreshTokenPayload,
      this.getRefreshPrivateKey(),
      {
        algorithm: 'ES512',
        expiresIn: this.getRefreshExpiresIn() as SignOptions['expiresIn'],
      },
    );

    await this.sessionsService.createSession({
      id: sessionId,
      userId: user.id,
      refreshTokenHash: this.hashToken(refreshToken),
      userAgent: request.headers['user-agent'] || null,
      ipAddress: this.getIpAddress(request),
      expiresAt: new Date(
        Date.now() + this.parseDurationToMs(this.getRefreshExpiresIn()),
      ),
      revokedAt: null,
    });

    return {
      user: this.mapUser(user),
      accessToken,
      refreshToken,
      expiresIn: Math.floor(
        this.parseDurationToMs(this.getAccessExpiresIn()) / 1000,
      ),
    };
  }

  private verifyRefreshToken(token: string): RefreshTokenPayload {
    try {
      const decoded = verify(token, this.getRefreshPublicKey(), {
        algorithms: ['ES512' satisfies Algorithm],
      });

      if (typeof decoded !== 'object' || !decoded) {
        throw new InvalidTokenException({ reason: 'invalid-refresh-payload' });
      }

      const sub = Number((decoded as { sub?: number | string }).sub);
      const sid = String((decoded as { sid?: string }).sid || '');
      const tenantId = Number(
        (decoded as { tenantId?: number | string }).tenantId,
      );

      if (!sub || !sid || !tenantId) {
        throw new InvalidTokenException({ reason: 'invalid-refresh-payload' });
      }

      return { sub, sid, tenantId };
    } catch (error) {
      if (error instanceof TokenExpiredError) {
        throw new TokenExpiredException();
      }
      if (error instanceof JsonWebTokenError) {
        throw new InvalidTokenException({ reason: error.message });
      }
      throw error;
    }
  }

  private async verifyGoogleIdToken(idToken: string) {
    try {
      const ticket = await this.getGoogleClient().verifyIdToken({
        idToken,
        audience: this.getGoogleClientId(),
      });
      const payload = ticket.getPayload();
      if (!payload) {
        throw new InvalidTokenException({ provider: 'google' });
      }
      return payload;
    } catch (error) {
      if (error instanceof InvalidTokenException) {
        throw error;
      }
      throw new ExternalApiException('Google OAuth', {
        reason: 'token-verification-failed',
      });
    }
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

  private isGoogleInvalidGrantError(error: unknown): boolean {
    if (!error || typeof error !== 'object') {
      return false;
    }

    const candidate = error as {
      message?: unknown;
      response?: {
        data?: {
          error?: unknown;
        };
      };
    };

    if (candidate.response?.data?.error === 'invalid_grant') {
      return true;
    }

    return (
      typeof candidate.message === 'string' &&
      candidate.message.includes('invalid_grant')
    );
  }

  private async resolveTenantForSignup(
    role: PublicOnboardingRole,
    displayName: string,
    email: string,
  ): Promise<number> {
    if (role === 'sme' || role === 'creator') {
      const preferredSlugBase = this.slugify(
        displayName || email.split('@')[0] || role,
      );
      const preferredSlug = `${preferredSlugBase}-${role}`;
      const existing =
        await this.usersRepository.findTenantBySlug(preferredSlug);
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
    const publicTenant =
      await this.usersRepository.findTenantBySlug(publicTenantSlug);
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

  private async resolveAdminTenantId(): Promise<number> {
    const adminTenantSlug = 'platform-admin';
    const existing =
      await this.usersRepository.findTenantBySlug(adminTenantSlug);
    if (existing) {
      return existing.id;
    }

    const created = await this.usersRepository.createTenant({
      name: 'Platform Admin',
      slug: adminTenantSlug,
      isActive: true,
    });
    return created.id;
  }

  private async saveGoogleOauthTokens(
    oauthAccount: OauthAccount | null,
    googleTokens: GoogleTokenExchangePayload | undefined,
    email: string,
  ): Promise<void> {
    if (!oauthAccount) {
      return;
    }

    if (!googleTokens?.accessToken && !googleTokens?.refreshToken) {
      return;
    }

    await this.authRepository.updateOauthAccountTokens(oauthAccount.id, {
      accessToken: googleTokens.accessToken ?? oauthAccount.accessToken,
      refreshToken: googleTokens.refreshToken ?? oauthAccount.refreshToken,
      tokenExpiresAt:
        googleTokens.expiresAt === undefined
          ? oauthAccount.tokenExpiresAt
          : googleTokens.expiresAt,
      email,
    });
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
    const rounds = Number(
      this.configService.get<string>('BCRYPT_ROUNDS') || '10',
    );
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
      throw new MissingFieldException('GOOGLE_CLIENT_ID');
    }
    return clientId;
  }

  private getGoogleRedirectUri(): string {
    return (
      this.configService.get<string>('GOOGLE_REDIRECT_URI') ||
      'http://localhost:3000/auth/socials/google/callback'
    );
  }

  private normalizePemKey(
    rawValue: string | undefined,
    envName: string,
  ): string {
    if (!rawValue) {
      throw new MissingFieldException(envName);
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
