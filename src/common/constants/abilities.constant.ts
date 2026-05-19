import type { AppRole } from './roles.constant';

export const ABILITY_VALUES = [
  'users:read:any',
  'users:read:tenant',
  'users:read:self',
  'users:list:any',
  'users:list:tenant',
  'auth:manage:any',
  'tenant:manage:self',
  'socials:youtube:read:any',
  'socials:youtube:read:self',
  'socials:youtube:write:any',
  'socials:youtube:write:self',
  'socials:oauth:refresh:any',
  'socials:oauth:refresh:self',
  'creator:insights:read:any',
  'creator:insights:read:self',
  'sme:creator:discover:any',
  'sme:creator:compare:any',
] as const;

export type AppAbility = (typeof ABILITY_VALUES)[number];

export const ROLE_ABILITIES: Record<AppRole, AppAbility[]> = {
  admin: [
    'users:read:any',
    'users:list:any',
    'auth:manage:any',
    'socials:youtube:read:any',
    'socials:youtube:write:any',
    'socials:oauth:refresh:any',
    'creator:insights:read:any',
    'sme:creator:discover:any',
    'sme:creator:compare:any',
  ],
  sme: [
    'users:read:tenant',
    'users:list:tenant',
    'tenant:manage:self',
    'socials:youtube:read:self',
    'socials:youtube:write:self',
    'socials:oauth:refresh:self',
    'sme:creator:discover:any',
    'sme:creator:compare:any',
  ],
  creator: [
    'users:read:self',
    'tenant:manage:self',
    'socials:youtube:read:self',
    'socials:youtube:write:self',
    'socials:oauth:refresh:self',
    'creator:insights:read:self',
  ],
  user: [],
};
