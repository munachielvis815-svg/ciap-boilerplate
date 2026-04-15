# Environment Configuration

Updated for the current runtime config on 2026-04-08.

## Loading Behavior

- `src/main.ts` uses `import 'dotenv/config'`, so `.env` values are loaded at startup.
- `ConfigModule.forRoot({ isGlobal: true, cache: true, expandVariables: true })` is enabled in `AppModule`.
- `ConfigService` is used in modules/services where needed (`AuthService`, `DatabaseModule`, OAuth scaffolding).

## Core Variables

### Required

- `DATABASE_URL`
- `JWT_ACCESS_PRIVATE_KEY`
- `JWT_ACCESS_PUBLIC_KEY`
- `JWT_REFRESH_PRIVATE_KEY`
- `JWT_REFRESH_PUBLIC_KEY`
- `GOOGLE_CLIENT_ID` (required for Google OAuth flows)
- `ADMIN_SIGNUP_KEY` (required for `/auth/admin/signup`)

### Common runtime

- `NODE_ENV` (default `development`)
- `PORT` (default `3000`)
- `APP_PORT` (compose host/container app port, default `3000`)
- `LOG_ENABLED` (default `true`)
- `LOG_BACKEND` (`pino`, `nest`, or `winston`; default `pino`)
- `LOG_HTTP_ENABLED` (default `true`, controls single-line HTTP access logs)
- `LOG_HTTP_MODE` (`off`, `errors`, `all`; default `errors`)
- `LOG_LEVEL` (default `info` when unset)
- `LOG_FORMAT` (`pretty` or `json`, defaults to `json` for invalid/missing values)
- `LOG_TO_FILE` (default `false`)
- `LOG_FILE_PATH` (default `./logs/ciap.log`)
- `LOG_FILE_LEVEL` (default inherits `LOG_LEVEL`)
- `LOG_FILE_SIZE` (default `50m`)
- `LOG_FILE_FREQUENCY` (default `daily`)
- `CORS_ORIGIN` (default `http://localhost:3000`)

### Auth and security

- `BCRYPT_ROUNDS` (default `10`)
- `JWT_ACCESS_EXPIRES_IN` (default `15m`)
- `JWT_REFRESH_EXPIRES_IN` (default `7d`)
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_LOGIN_REDIRECT_URI` (default fallback: `http://localhost:3000/auth/socials/google/login/callback`)
- `GOOGLE_YOUTUBE_REDIRECT_URI` (default fallback: `http://localhost:3000/ingestion/youtube/oauth2/callback`)
- `GOOGLE_REDIRECT_URI` (legacy fallback for older OAuth flows)
- Swagger metadata overrides:
  - `APP_NAME`
  - `APP_DESCRIPTION`
  - `APP_VERSION`
  - `APP_SUPPORT_NAME`
  - `APP_SUPPORT_URL`
  - `APP_SUPPORT_EMAIL`
  - `APP_LICENSE_NAME`
  - `APP_LICENSE_URL`

### Present but optional/future-facing in `.env.example`

- `API_VERSION`
- `API_PREFIX`
- `RATE_LIMIT_WINDOW_MS`
- `RATE_LIMIT_MAX_REQUESTS`
- `CACHE_TTL`
- `CACHE_MAX_SIZE`
- `MAX_FILE_SIZE`
- `UPLOAD_DIR`
- `MAIL_*`
- `GITHUB_CLIENT_ID`
- `GITHUB_CLIENT_SECRET`
- `SENTRY_*`

### Container stack (`docker-compose.yml`)

- `POSTGRES_DB`
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `POSTGRES_PORT`
- `REDIS_PORT`
- `REDIS_PASSWORD`
- `REDIS_URL`
- `BULLMQ_PREFIX`
- `BULLBOARD_PORT`
- `BULLBOARD_ROOT_PATH`

## Security Notes

- Keep `.env` and real secrets out of version control.
- Key values in PEM format are expected as escaped newlines (`\n`) and normalized at runtime.
- Do not log raw JWT keys, OAuth secrets, or database credentials.

## Runtime Features That Depend on Env

- Logger levels in NestFactory bootstrap are derived from `LOG_LEVEL`.
- Logger backend is powered by `nestjs-pino` and can be toggled by `LOG_ENABLED`.
- Logger provider can switch between `pino`, Nest default logger, and `winston` using `LOG_BACKEND`.
- HTTP access logs are emitted in concise single-line format (winston-style) when `LOG_HTTP_ENABLED=true`.
- HTTP access verbosity is controlled by `LOG_HTTP_MODE` (recommended `errors` for strict 4xx/5xx logging).
- Log format is enforced to `pretty` or `json` through `LOG_FORMAT`.
- File logging is enabled with `LOG_TO_FILE=true` and rotated through `pino-roll`.
- CORS origin is derived from `CORS_ORIGIN`.
- JWT signing and verification keys are pulled from env.
- Google OAuth client and redirect URI come from env.
- Admin onboarding flow validates `ADMIN_SIGNUP_KEY`.
- Database connection uses `DATABASE_URL`.
- BullMQ/Redis compose wiring uses `REDIS_HOST`, `REDIS_PORT`, and `REDIS_URL` values passed by Docker Compose.

## Setup Checklist

1. Copy `.env.example` to `.env`.
2. Provide valid PostgreSQL `DATABASE_URL` for your target runtime.
3. Generate/insert real ES256 and ES512 key pairs.
4. Set Google OAuth credentials if using `/auth/socials/google` or `/auth/socials/oauth2/google`.
5. Start app with `pnpm run start:dev`.
6. Verify:
   - `GET /health`
   - Swagger at `/api-docs`
   - auth routes under `/auth/*`

### Docker Compose quick start

1. Ensure `.env` contains non-placeholder JWT keys and OAuth values.
2. Run `docker compose up --build`.
3. Verify endpoints:
   - API: `http://localhost:${APP_PORT}/health`
   - Swagger: `http://localhost:${APP_PORT}/api-docs`
   - Bull Board: `http://localhost:${BULLBOARD_PORT}${BULLBOARD_ROOT_PATH}`
