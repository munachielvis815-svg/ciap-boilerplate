import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { AppRole } from '@constants/roles.constant';

type JwtStrategyPayload = {
  sub: number;
  email: string;
  role: AppRole;
  tenantId: number;
  sid: string;
  iat?: number;
  exp?: number;
};

function normalizePem(value: string | undefined): string {
  if (!value) {
    throw new Error('JWT access public key is not configured');
  }

  return value.replace(/\\n/g, '\n');
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    const publicKey = normalizePem(configService.get<string>('JWT_ACCESS_PUBLIC_KEY'));

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: publicKey,
      algorithms: ['ES256'],
    });
  }

  async validate(payload: JwtStrategyPayload) {
    return {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
      tenantId: payload.tenantId,
      sessionId: payload.sid,
    };
  }
}
