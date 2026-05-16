import { SetMetadata } from '@nestjs/common';
import type { AppRole } from '@constants/roles.constant';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: AppRole[]) => SetMetadata(ROLES_KEY, roles);
