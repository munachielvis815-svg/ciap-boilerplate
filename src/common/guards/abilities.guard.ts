import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ABILITIES_KEY } from '@decorators/index';
import { ROLE_ABILITIES } from '@constants/abilities.constant';
import type { AppAbility } from '@constants/abilities.constant';
import {
  InsufficientPermissionsException,
  InvalidTokenException,
} from '@common/exceptions';
import type { RequestUser } from '@/types';

@Injectable()
export class AbilitiesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredAbilities = this.reflector.getAllAndOverride<AppAbility[]>(
      ABILITIES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredAbilities || requiredAbilities.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{ user?: RequestUser }>();
    const user = request.user;

    if (!user) {
      throw new InvalidTokenException({ reason: 'missing-auth-context' });
    }

    const allowedAbilities = ROLE_ABILITIES[user.role] || [];
    const hasAnyAbility = requiredAbilities.some((ability) =>
      allowedAbilities.includes(ability),
    );

    if (!hasAnyAbility) {
      throw new InsufficientPermissionsException(requiredAbilities.join(', '), {
        userRole: user.role,
      });
    }

    return true;
  }
}
