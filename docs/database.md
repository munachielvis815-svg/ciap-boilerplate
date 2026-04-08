# Database Guide

Updated for the current schema on 2026-04-08.

## Stack

- ORM: Drizzle ORM
- Driver: `pg`
- Database: PostgreSQL (`DATABASE_URL`)
- Migration tool: `drizzle-kit`

## Source of Truth

- Schema file: `src/database/drizzle/schema.ts`
- Generated migrations: `src/database/drizzle/migrations/*.sql`
- Migration metadata: `src/database/drizzle/migrations/meta/*`

The repo workflow is schema-first: edit `schema.ts`, then generate migration SQL.

## Current Tables

### `tenants`

- Multitenancy boundary
- Key fields: `id`, `name`, `slug`, `is_active`, timestamps
- Key index/constraint: unique `slug`

### `users`

- Core identity + auth profile
- Key fields:
  - `tenant_id` (FK to tenants)
  - `email` (unique)
  - `name`
  - `password_hash` (nullable for OAuth users)
  - `role` enum: `admin | user | sme | creator`
  - `auth_provider` enum: `local | google | github | linkedin`
  - `oauth_provider_id`
  - `is_active`, `is_email_verified`, `last_login_at`, timestamps
- Key indexes:
  - email
  - role
  - tenant_id
  - unique `(auth_provider, oauth_provider_id)`

### `oauth_accounts`

- Provider linkage for one user to external auth providers
- Key fields:
  - `user_id` FK (`on delete cascade`)
  - `provider`, `provider_user_id`
  - `email`
  - `access_token`, `refresh_token`, `token_expires_at`
  - timestamps
- Key indexes:
  - user_id
  - provider
  - unique `(provider, provider_user_id)`

### `sessions`

- Refresh-token-backed sessions
- Key fields:
  - `id` (UUID)
  - `user_id` FK (`on delete cascade`)
  - `refresh_token_hash`
  - `user_agent`, `ip_address`
  - `expires_at`, `revoked_at`, timestamps
- Key indexes:
  - user_id
  - expires_at

### `audit_logs`

- Security and auth event trail
- Key fields:
  - `user_id` FK (`on delete set null`)
  - `action` enum: `signup | login | verify | refresh | logout | update_profile | role_change`
  - `entity`, `entity_id`
  - `metadata` (JSONB)
  - `ip_address`, `user_agent`, `created_at`
- Key indexes:
  - user_id
  - action
  - created_at

## Migration Workflow

1. Edit only `src/database/drizzle/schema.ts`.
2. Generate migration:

```bash
pnpm run db:generate
```

3. Review generated SQL and snapshot files.
4. Apply migration:

```bash
pnpm run db:migrate
```

5. Validate with app startup or tests.

## Seed Workflow

Seed entrypoint:

- `src/database/seeds/seed.ts`
- seed module/service: `src/database/seeds/seed.module.ts`, `seed.service.ts`

Commands:

```bash
pnpm run db:seed
pnpm run db:seed:prod
```

## Query Placement

- Keep Drizzle queries in repository classes (`src/modules/*/*.repository.ts`).
- Keep services focused on orchestration/business logic.
- Use schema type exports for type safety:
  - `User`, `NewUser`
  - `Session`, `NewSession`
  - `OauthAccount`, `NewOauthAccount`
  - `AuditLog`, `NewAuditLog`
  - `Tenant`, `NewTenant`

## Multi-tenant Rule

- Tenant-sensitive reads should use tenant-aware repository methods.
- Current code enforces tenant-aware access in `UsersService` for non-admin roles.

## Notes

- Refresh tokens are hashed before storage in `sessions`.
- OAuth provider tokens are currently stored in `oauth_accounts` when available from provider exchange.
- Existing migration SQL files are generated artifacts; do not hand-edit them unless absolutely necessary.
