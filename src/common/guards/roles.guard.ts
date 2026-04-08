import {
  CanActivate,
  ExecutionContext,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { AppRole } from '@constants/roles.constant';
import { ROLES_KEY } from '@decorators/index';
import {
  InsufficientPermissionsException,
  InvalidTokenException,
} from '@common/exceptions';
import type { RequestUser } from '@/types';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<AppRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{ user?: RequestUser }>();
    const user = request.user;

    if (!user) {
      throw new InvalidTokenException({ reason: 'missing-auth-context' });
    }

    if (!requiredRoles.includes(user.role)) {
      throw new InsufficientPermissionsException(requiredRoles.join(', '), {
        userRole: user.role,
      });
    }

    return true;
  }
}
