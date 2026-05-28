# Database Guide

Updated for the current schema on 2026-04-08.

## Stack

- ORM: Drizzle ORM
- Driver: `pg`
- Database: PostgreSQL (`DATABASE_URL`)
- Migration tool: `drizzle-kit`

## Source of Truth

<<<<<<< HEAD
- Schema file: `src/database/drizzle/schema.ts`
- Generated migrations: `src/database/drizzle/migrations/*.sql`
- Migration metadata: `src/database/drizzle/migrations/meta/*`
=======
- Schema file: `shared/database/drizzle/schema.ts`
- Generated migrations: `shared/database/drizzle/migrations/*.sql`
- Migration metadata: `shared/database/drizzle/migrations/meta/*`
>>>>>>> d8d4baa8b75c457da2acd9dbd014d9c3cc37ef56

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
  - `purpose` enum: `login | youtube-connect`
  - `email`
  - `access_token`, `refresh_token`, `token_expires_at`
  - timestamps
- Key indexes:
  - user_id
  - provider
  - unique `(user_id, provider, purpose)`
  - unique `(provider, provider_user_id, purpose)`

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

<<<<<<< HEAD
=======
### `worker_jobs`

- Persistent lifecycle tracking for scheduled and queued worker jobs
- Key fields:
  - `id` (UUID)
  - `parent_job_id` (nullable self-reference)
  - `queue_name`, `job_name`, `bullmq_job_id`
  - `request_id`
  - `user_id`, `tenant_id` (nullable FKs)
  - `status` enum: `pending | queued | active | retrying | completed | failed`
  - `attempts_made`, `max_attempts`
  - `scheduled_for`, `started_at`, `completed_at`, `failed_at`
  - `payload`, `result`, `error_message`, `error_details`
  - timestamps
- Key indexes:
  - `parent_job_id`
  - `(queue_name, status)`
  - `request_id`
  - `user_id`
  - `tenant_id`

>>>>>>> d8d4baa8b75c457da2acd9dbd014d9c3cc37ef56
### `user_profiles`

- Extended user profile data and creator influence score
- Key fields:
  - `user_id` (unique FK to users)
  - `display_name`, `bio`, `location`, `industry`
  - `website_url`, `avatar_url`
  - `creator_types` (text array)
  - `is_onboarded` (boolean)
  - `audience_size`
  - `influence_score`, `influence_score_updated_at`
- Key indexes:
  - unique `user_id`
  - `influence_score`

### `content_items`

- Cross-platform content catalog for creators
- Key fields:
  - `user_id` (FK to users)
  - `platform` enum: `youtube | tiktok | instagram | other`
  - `external_id`
  - `title`, `description`, `url`, `thumbnail_url`
  - `published_at`, `duration_seconds`
- Key indexes:
  - `user_id`
  - `platform`
  - unique `(platform, external_id)`

### `content_metrics`

- Normalized metric values for creators/content items
- Key fields:
  - `user_id` (FK to users)
  - `content_item_id` (nullable FK to content_items)
  - `platform`, `metric_name`, `metric_value`
  - `period_start`, `period_end`, `recorded_at`
- Key indexes:
  - `user_id`
  - `content_item_id`
  - `metric_name`
  - `recorded_at`

### `content_conversions`

- Normalized conversion outcomes for creators/content items
- Key fields:
  - `user_id` (FK to users)
  - `content_item_id` (nullable FK to content_items)
  - `platform`, `conversion_type`, `conversion_count`
  - `conversion_value`, `currency`
  - `period_start`, `period_end`, `recorded_at`
- Key indexes:
  - `user_id`
  - `content_item_id`
  - `conversion_type`

### `sme_scouted_creators`

- SME-specific creator shortlist table
- Key fields:
  - `sme_user_id` (FK to users)
  - `creator_user_id` (FK to users)
  - `status` enum: `scouted | contacted | archived`
  - timestamps
- Key indexes:
  - `sme_user_id`
  - `creator_user_id`
  - unique `(sme_user_id, creator_user_id)`

### `sme_campaigns`

- Campaign records owned by SME users
- Key fields:
  - `sme_user_id` (FK to users)
  - `name`, `description`
  - `status` enum: `draft | active | completed | cancelled`
  - `budget_amount`, `budget_currency`
  - `starts_at`, `ends_at`
  - timestamps
- Key indexes:
  - `sme_user_id`
  - `status`

### `sme_campaign_creators`

- Creator-to-campaign assignment table
- Key fields:
  - `campaign_id` (FK to sme_campaigns)
  - `creator_user_id` (FK to users)
  - `status` enum: `shortlisted | invited | active | removed`
  - timestamps
- Key indexes:
  - `campaign_id`
  - `creator_user_id`
  - unique `(campaign_id, creator_user_id)`

### `youtube_video_comments`

- Top-level comments pulled per YouTube video during ingestion
- Key fields:
  - `video_id` (FK to youtube_videos)
  - `youtube_comment_id`
  - `comment_type` (`top` or `latest`)
  - `author_display_name`, `author_channel_id`
  - `text_display`, `text_original`
  - `like_count`, `published_at`, `updated_at`
- Key indexes:
  - `video_id`
  - unique `youtube_comment_id`

### `youtube_audience_demographics`

- Audience breakdowns by age group, gender, and country
- Key fields:
  - `channel_id` (FK to youtube_channels)
  - `dimension_type` (`ageGroup | gender | country`)
  - `dimension_value`
  - `viewer_percentage`
  - `start_date`, `end_date`
- Key indexes:
  - `channel_id`
  - unique `(channel_id, dimension_type, dimension_value, start_date, end_date)`

## Migration Workflow

<<<<<<< HEAD
1. Edit only `src/database/drizzle/schema.ts`.
=======
1. Edit only `shared/database/drizzle/schema.ts`.
>>>>>>> d8d4baa8b75c457da2acd9dbd014d9c3cc37ef56
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

## Search Indexing

- Creator search uses PostgreSQL `pg_trgm` for fuzzy matching.
- Trigram indexes are created on `users.name` and `user_profiles.display_name`, `bio`, `industry`, plus a text expression over `creator_types`.
- Ensure `CREATE EXTENSION IF NOT EXISTS pg_trgm;` is applied before running search queries.

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
- SME scouting and campaign ownership are keyed by the authenticated SME user ID rather than by tenant alone.
- Existing migration SQL files are generated artifacts; do not hand-edit them unless absolutely necessary.
