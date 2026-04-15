import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash, randomUUID } from 'node:crypto';
import {
  JsonWebTokenError,
  TokenExpiredError,
  sign,
  verify,
} from 'jsonwebtoken';
import type { Algorithm, SignOptions } from 'jsonwebtoken';
import type { Request } from 'express';
import type { AppRole } from '@constants/roles.constant';
import type { User } from '@database/drizzle/schema';
import {
  InvalidTokenException,
  MissingFieldException,
  TokenExpiredException,
} from '@common/exceptions';
import { SessionsService } from '@modules/sessions/sessions.service';
import type { AuthResponseDto, AuthUserDto } from './dto/auth-response.dto';
import { getRequestIp } from './auth.utils';

type AccessTokenPayload = {
  sub: number;
  email: string;
  role: AppRole;
  tenantId: number;
  sid: string;
};

export type RefreshTokenPayload = {
  sub: number;
  tenantId: number;
  sid: string;
};

@Injectable()
export class AuthTokensService {
  constructor(
    private readonly sessionsService: SessionsService,
    private readonly configService: ConfigService,
  ) {}

  async issueTokens(user: User, request: Request): Promise<AuthResponseDto> {
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
      ipAddress: getRequestIp(request),
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

  verifyRefreshToken(token: string): RefreshTokenPayload {
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

  hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  getAccessPublicKey(): string {
    return this.normalizePemKey(
      this.configService.get<string>('JWT_ACCESS_PUBLIC_KEY'),
      'JWT_ACCESS_PUBLIC_KEY',
    );
  }

  getAccessPrivateKey(): string {
    return this.normalizePemKey(
      this.configService.get<string>('JWT_ACCESS_PRIVATE_KEY'),
      'JWT_ACCESS_PRIVATE_KEY',
    );
  }

  getRefreshPublicKey(): string {
    return this.normalizePemKey(
      this.configService.get<string>('JWT_REFRESH_PUBLIC_KEY'),
      'JWT_REFRESH_PUBLIC_KEY',
    );
  }

  getRefreshPrivateKey(): string {
    return this.normalizePemKey(
      this.configService.get<string>('JWT_REFRESH_PRIVATE_KEY'),
      'JWT_REFRESH_PRIVATE_KEY',
    );
  }

  getAccessExpiresIn(): string {
    return (
      this.configService.get<string>('JWT_ACCESS_EXPIRES_IN') ||
      this.configService.get<string>('JWT_EXPIRES_IN') ||
      '15m'
    );
  }

  getRefreshExpiresIn(): string {
    return (
      this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') ||
      this.configService.get<string>('JWT_REFRESH_EXPIRATION') ||
      '7d'
    );
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

  private parseDurationToMs(duration: string): number {
    const match = /^(\d+)([smhd])$/i.exec(duration);
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

  private normalizePemKey(
    rawValue: string | undefined,
    envName: string,
  ): string {
    if (!rawValue) {
      throw new MissingFieldException(envName);
    }

    return rawValue.replaceAll(String.raw`\n`, '\n');
  }
}
