import type { AppRole } from './roles.constant';

export const ABILITY_VALUES = [
  'users:read:any',
  'users:read:tenant',
  'users:read:self',
  'users:list:any',
  'users:list:tenant',
  'auth:manage:any',
  'tenant:manage:self',
] as const;

export type AppAbility = (typeof ABILITY_VALUES)[number];

export const ROLE_ABILITIES: Record<AppRole, AppAbility[]> = {
  admin: ['users:read:any', 'users:list:any', 'auth:manage:any'],
  sme: ['users:read:tenant', 'users:list:tenant', 'tenant:manage:self'],
  creator: ['users:read:self', 'tenant:manage:self'],
  user: ['users:read:self'],
};
