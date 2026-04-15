import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { JwtPayload } from '@/types';

function normalizePem(value: string | undefined): string {
  if (!value) {
    throw new Error('JWT access public key is not configured');
  }

  return value.replace(/\\n/g, '\n');
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    const publicKey = normalizePem(
      configService.get<string>('JWT_ACCESS_PUBLIC_KEY'),
    );

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: publicKey,
      algorithms: ['ES256'],
    });
  }

  validate(payload: JwtPayload) {
    return {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
      tenantId: payload.tenantId,
      sessionId: payload.sid,
    };
  }
}
