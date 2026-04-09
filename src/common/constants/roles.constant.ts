export const ROLE_VALUES = ['admin', 'user', 'sme', 'creator'] as const;
export const PUBLIC_ONBOARDING_ROLE_VALUES = [
  'user',
  'sme',
  'creator',
] as const;

export type AppRole = (typeof ROLE_VALUES)[number];
export type PublicOnboardingRole =
  (typeof PUBLIC_ONBOARDING_ROLE_VALUES)[number];
