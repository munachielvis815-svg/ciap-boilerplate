export const ROLE_VALUES = ['admin', 'user', 'sme', 'creator'] as const;

export type AppRole = (typeof ROLE_VALUES)[number];
