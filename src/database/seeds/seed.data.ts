import type { NewTenant, NewUser } from '../drizzle/schema';

export type SeedUser = Omit<NewUser, 'tenantId'> & { tenantSlug: string };

export const SEED_TENANTS: NewTenant[] = [
  {
    name: 'Platform Admin',
    slug: 'platform-admin',
    isActive: true,
  },
  {
    name: 'SME Workspace',
    slug: 'sme-workspace',
    isActive: true,
  },
  {
    name: 'Creator Workspace',
    slug: 'creator-workspace',
    isActive: true,
  },
];

export const SEED_USERS: SeedUser[] = [
  {
    tenantSlug: 'platform-admin',
    email: 'admin@example.com',
    name: 'Admin User',
    passwordHash:
      '$2b$10$5M08vRiLSRzYQmk6hJH8ieRq4UB0hCPlCHhn7kPF2hd3JGsY/LfQy',
    role: 'admin',
    authProvider: 'local',
    isActive: true,
    isEmailVerified: true,
  },
  {
    tenantSlug: 'sme-workspace',
    email: 'sme1@example.com',
    name: 'SME User 1',
    passwordHash:
      '$2b$10$BoVqeXXr3yEVCOD4Nztr1Olr3y4gAZo3MlyxKxhoNbhhX4zfy5pN6',
    role: 'sme',
    authProvider: 'local',
    isActive: true,
    isEmailVerified: true,
  },
  {
    tenantSlug: 'creator-workspace',
    email: 'creator1@example.com',
    name: 'Creator User 1',
    passwordHash:
      '$2b$10$WQqMrlA9HWCde2V5YQ3h0.BCE7f8o4j1B99wPV6J1qnBfHeJjP/9S',
    role: 'creator',
    authProvider: 'local',
    isActive: true,
    isEmailVerified: true,
  },
  {
    tenantSlug: 'sme-workspace',
    email: 'sme2@example.com',
    name: 'SME User 2',
    passwordHash:
      '$2b$10$BoVqeXXr3yEVCOD4Nztr1Olr3y4gAZo3MlyxKxhoNbhhX4zfy5pN6',
    role: 'sme',
    authProvider: 'local',
    isActive: true,
    isEmailVerified: true,
  },
  {
    tenantSlug: 'sme-workspace',
    email: 'sme3@example.com',
    name: 'SME User 3',
    passwordHash:
      '$2b$10$BoVqeXXr3yEVCOD4Nztr1Olr3y4gAZo3MlyxKxhoNbhhX4zfy5pN6',
    role: 'sme',
    authProvider: 'local',
    isActive: true,
    isEmailVerified: true,
  },
  {
    tenantSlug: 'sme-workspace',
    email: 'sme4@example.com',
    name: 'SME User 4',
    passwordHash:
      '$2b$10$BoVqeXXr3yEVCOD4Nztr1Olr3y4gAZo3MlyxKxhoNbhhX4zfy5pN6',
    role: 'sme',
    authProvider: 'local',
    isActive: true,
    isEmailVerified: true,
  },
  {
    tenantSlug: 'sme-workspace',
    email: 'sme5@example.com',
    name: 'SME User 5',
    passwordHash:
      '$2b$10$BoVqeXXr3yEVCOD4Nztr1Olr3y4gAZo3MlyxKxhoNbhhX4zfy5pN6',
    role: 'sme',
    authProvider: 'local',
    isActive: true,
    isEmailVerified: true,
  },
  {
    tenantSlug: 'sme-workspace',
    email: 'sme6@example.com',
    name: 'SME User 6',
    passwordHash:
      '$2b$10$BoVqeXXr3yEVCOD4Nztr1Olr3y4gAZo3MlyxKxhoNbhhX4zfy5pN6',
    role: 'sme',
    authProvider: 'local',
    isActive: true,
    isEmailVerified: true,
  },
  {
    tenantSlug: 'sme-workspace',
    email: 'sme7@example.com',
    name: 'SME User 7',
    passwordHash:
      '$2b$10$BoVqeXXr3yEVCOD4Nztr1Olr3y4gAZo3MlyxKxhoNbhhX4zfy5pN6',
    role: 'sme',
    authProvider: 'local',
    isActive: true,
    isEmailVerified: true,
  },
  {
    tenantSlug: 'sme-workspace',
    email: 'sme8@example.com',
    name: 'SME User 8',
    passwordHash:
      '$2b$10$BoVqeXXr3yEVCOD4Nztr1Olr3y4gAZo3MlyxKxhoNbhhX4zfy5pN6',
    role: 'sme',
    authProvider: 'local',
    isActive: true,
    isEmailVerified: true,
  },
  {
    tenantSlug: 'sme-workspace',
    email: 'sme9@example.com',
    name: 'SME User 9',
    passwordHash:
      '$2b$10$BoVqeXXr3yEVCOD4Nztr1Olr3y4gAZo3MlyxKxhoNbhhX4zfy5pN6',
    role: 'sme',
    authProvider: 'local',
    isActive: true,
    isEmailVerified: true,
  },
  {
    tenantSlug: 'creator-workspace',
    email: 'creator2@example.com',
    name: 'Creator User 2',
    passwordHash:
      '$2b$10$WQqMrlA9HWCde2V5YQ3h0.BCE7f8o4j1B99wPV6J1qnBfHeJjP/9S',
    role: 'creator',
    authProvider: 'local',
    isActive: true,
    isEmailVerified: true,
  },
  {
    tenantSlug: 'creator-workspace',
    email: 'creator3@example.com',
    name: 'Creator User 3',
    passwordHash:
      '$2b$10$WQqMrlA9HWCde2V5YQ3h0.BCE7f8o4j1B99wPV6J1qnBfHeJjP/9S',
    role: 'creator',
    authProvider: 'local',
    isActive: true,
    isEmailVerified: true,
  },
  {
    tenantSlug: 'creator-workspace',
    email: 'creator4@example.com',
    name: 'Creator User 4',
    passwordHash:
      '$2b$10$WQqMrlA9HWCde2V5YQ3h0.BCE7f8o4j1B99wPV6J1qnBfHeJjP/9S',
    role: 'creator',
    authProvider: 'local',
    isActive: true,
    isEmailVerified: true,
  },
  {
    tenantSlug: 'creator-workspace',
    email: 'creator5@example.com',
    name: 'Creator User 5',
    passwordHash:
      '$2b$10$WQqMrlA9HWCde2V5YQ3h0.BCE7f8o4j1B99wPV6J1qnBfHeJjP/9S',
    role: 'creator',
    authProvider: 'local',
    isActive: true,
    isEmailVerified: true,
  },
  {
    tenantSlug: 'creator-workspace',
    email: 'creator6@example.com',
    name: 'Creator User 6',
    passwordHash:
      '$2b$10$WQqMrlA9HWCde2V5YQ3h0.BCE7f8o4j1B99wPV6J1qnBfHeJjP/9S',
    role: 'creator',
    authProvider: 'local',
    isActive: true,
    isEmailVerified: true,
  },
  {
    tenantSlug: 'creator-workspace',
    email: 'creator7@example.com',
    name: 'Creator User 7',
    passwordHash:
      '$2b$10$WQqMrlA9HWCde2V5YQ3h0.BCE7f8o4j1B99wPV6J1qnBfHeJjP/9S',
    role: 'creator',
    authProvider: 'local',
    isActive: true,
    isEmailVerified: true,
  },
  {
    tenantSlug: 'creator-workspace',
    email: 'creator8@example.com',
    name: 'Creator User 8',
    passwordHash:
      '$2b$10$WQqMrlA9HWCde2V5YQ3h0.BCE7f8o4j1B99wPV6J1qnBfHeJjP/9S',
    role: 'creator',
    authProvider: 'local',
    isActive: true,
    isEmailVerified: true,
  },
  {
    tenantSlug: 'creator-workspace',
    email: 'creator9@example.com',
    name: 'Creator User 9',
    passwordHash:
      '$2b$10$WQqMrlA9HWCde2V5YQ3h0.BCE7f8o4j1B99wPV6J1qnBfHeJjP/9S',
    role: 'creator',
    authProvider: 'local',
    isActive: true,
    isEmailVerified: true,
  },
  {
    tenantSlug: 'creator-workspace',
    email: 'creator10@example.com',
    name: 'Creator User 10',
    passwordHash:
      '$2b$10$WQqMrlA9HWCde2V5YQ3h0.BCE7f8o4j1B99wPV6J1qnBfHeJjP/9S',
    role: 'creator',
    authProvider: 'local',
    isActive: true,
    isEmailVerified: true,
  },
];
