import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  serial,
  jsonb,
  uuid,
  pgEnum,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const userRoleEnum = pgEnum('user_role', ['admin', 'user', 'sme', 'creator']);
export const authProviderEnum = pgEnum('auth_provider', ['local', 'google', 'github', 'linkedin']);
export const auditActionEnum = pgEnum('audit_action', [
  'signup',
  'login',
  'verify',
  'refresh',
  'logout',
  'update_profile',
  'role_change',
]);

/**
 * Tenants Table
 * Core multitenancy boundary for tenant-scoped resources.
 */
export const tenants = pgTable(
  'tenants',
  {
    id: serial('id').primaryKey(),
    name: text('name').notNull(),
    slug: text('slug').notNull().unique(),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdateFn(() => new Date()),
  },
  (table) => ({
    tenantsSlugIdx: index('tenants_slug_idx').on(table.slug),
  }),
);

/**
 * Users Table
 * Core user entity with authentication and profile information
 */
export const users = pgTable(
  'users',
  {
    id: serial('id').primaryKey(),
    tenantId: integer('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'restrict' }),
    email: text('email').notNull().unique(),
    name: text('name').notNull(),
    passwordHash: text('password_hash'),
    role: userRoleEnum('role').notNull().default('user'),
    authProvider: authProviderEnum('auth_provider').notNull().default('local'),
    oauthProviderId: text('oauth_provider_id'),
    isActive: boolean('is_active').notNull().default(true),
    isEmailVerified: boolean('is_email_verified').notNull().default(false),
    lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdateFn(() => new Date()),
  },
  (table) => ({
    usersEmailIdx: index('users_email_idx').on(table.email),
    usersRoleIdx: index('users_role_idx').on(table.role),
    usersTenantIdx: index('users_tenant_id_idx').on(table.tenantId),
    usersOauthIdentityUq: uniqueIndex('users_oauth_identity_uq').on(
      table.authProvider,
      table.oauthProviderId,
    ),
  }),
);

/**
 * OAuth Accounts Table
 * Supports one user linking multiple OAuth providers over time.
 */
export const oauthAccounts = pgTable(
  'oauth_accounts',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    provider: authProviderEnum('provider').notNull(),
    providerUserId: text('provider_user_id').notNull(),
    email: text('email'),
    accessToken: text('access_token'),
    refreshToken: text('refresh_token'),
    tokenExpiresAt: timestamp('token_expires_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdateFn(() => new Date()),
  },
  (table) => ({
    oauthUserIdx: index('oauth_accounts_user_id_idx').on(table.userId),
    oauthProviderIdx: index('oauth_accounts_provider_idx').on(table.provider),
    oauthProviderIdentityUq: uniqueIndex('oauth_accounts_provider_identity_uq').on(
      table.provider,
      table.providerUserId,
    ),
  }),
);

/**
 * Sessions Table
 * Stores refresh token sessions for revocation and lifecycle management.
 */
export const sessions = pgTable(
  'sessions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    refreshTokenHash: text('refresh_token_hash').notNull(),
    userAgent: text('user_agent'),
    ipAddress: text('ip_address'),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdateFn(() => new Date()),
  },
  (table) => ({
    sessionsUserIdx: index('sessions_user_id_idx').on(table.userId),
    sessionsExpiresIdx: index('sessions_expires_at_idx').on(table.expiresAt),
  }),
);

/**
 * Audit Logs Table
 * Tracks security and business-sensitive operations.
 */
export const auditLogs = pgTable(
  'audit_logs',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id').references(() => users.id, { onDelete: 'set null' }),
    action: auditActionEnum('action').notNull(),
    entity: text('entity').notNull(),
    entityId: text('entity_id'),
    metadata: jsonb('metadata'),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    auditLogsUserIdx: index('audit_logs_user_id_idx').on(table.userId),
    auditLogsActionIdx: index('audit_logs_action_idx').on(table.action),
    auditLogsCreatedIdx: index('audit_logs_created_at_idx').on(table.createdAt),
  }),
);

/**
 * Relations
 */
export const tenantsRelations = relations(tenants, ({ many }) => ({
  users: many(users),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [users.tenantId],
    references: [tenants.id],
  }),
  sessions: many(sessions),
  auditLogs: many(auditLogs),
  oauthAccounts: many(oauthAccounts),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

export const oauthAccountsRelations = relations(oauthAccounts, ({ one }) => ({
  user: one(users, {
    fields: [oauthAccounts.userId],
    references: [users.id],
  }),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  user: one(users, {
    fields: [auditLogs.userId],
    references: [users.id],
  }),
}));

/**
 * Type Exports
 */
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Tenant = typeof tenants.$inferSelect;
export type NewTenant = typeof tenants.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;
export type AuditLog = typeof auditLogs.$inferSelect;
export type NewAuditLog = typeof auditLogs.$inferInsert;
export type OauthAccount = typeof oauthAccounts.$inferSelect;
export type NewOauthAccount = typeof oauthAccounts.$inferInsert;
export type UserRole = (typeof userRoleEnum.enumValues)[number];

/**
 * Seed Data (for testing/development)
 */
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

export const SEED_USERS: NewUser[] = [
  {
    tenantId: 1,
    email: 'admin@example.com',
    name: 'Admin User',
    passwordHash: '$2b$10$5M08vRiLSRzYQmk6hJH8ieRq4UB0hCPlCHhn7kPF2hd3JGsY/LfQy', // admin123
    role: 'admin',
    authProvider: 'local',
    isActive: true,
    isEmailVerified: true,
  },
  {
    tenantId: 2,
    email: 'test@example.com',
    name: 'Test User',
    passwordHash: '$2b$10$BoVqeXXr3yEVCOD4Nztr1Olr3y4gAZo3MlyxKxhoNbhhX4zfy5pN6', // test123
    role: 'user',
    authProvider: 'local',
    isActive: true,
    isEmailVerified: false,
  },
  {
    tenantId: 3,
    email: 'creator@example.com',
    name: 'Creator User',
    passwordHash: '$2b$10$WQqMrlA9HWCde2V5YQ3h0.BCE7f8o4j1B99wPV6J1qnBfHeJjP/9S', // creator123
    role: 'creator',
    authProvider: 'local',
    isActive: true,
    isEmailVerified: true,
  },
];
