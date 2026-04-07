# Project Findings & Discoveries

Auto-updating log of repository searches, architectural decisions, and implementation notes.

**Last Updated**: 2026-04-07  
**Version**: 1.0.0

## Archive

### Initial Setup (2026-04-07)
- **Decision**: Established NestJS v11 + TypeScript + Drizzle ORM + PostgreSQL architecture
- **Path Aliases**: Configured in tsconfig.json for modular imports
  - `@/*`: Root src reference
  - `@modules/*`: Feature modules
  - `@common/*`: Shared utilities
  - `@database/*`: Database layer
  - `@config/*`: Configuration
  - `@types/*`: Type definitions
  
- **Database**: NeonDB connection via `@neondatabase/serverless`
  - Schema location: `src/database/drizzle/schema.ts`
  - Migrations: `src/database/drizzle/migrations/`
  - Configuration: drizzle.config.ts updated with timestamp prefix

- **API Documentation**: Swagger/OpenAPI integrated
  - Added `@nestjs/swagger` and `swagger-ui-express`
  - Endpoint: `/api` (configure in main.ts)

- **TypeScript Strictness**: Enabled all strict flags
  - `noImplicitAny: true`, `strict: true`
  - `strictNullChecks`, `strictFunctionTypes`, `noImplicitReturns` enabled

- **pnpm Scripts**: Organized and standardized
  - Development: `pnpm run start:dev`
  - Database: `pnpm run db:generate`, `pnpm run db:migrate`, `pnpm run db:studio`
  - Testing: `pnpm run test`, `pnpm run test:e2e`, `pnpm run test:cov`

- **Module Structure**: Directory layout established
  - `src/modules/` - Feature modules
  - `src/common/` - Shared decorators, filters, guards, interceptors, etc.
  - `src/database/` - Database configuration and schema
  - `src/config/` - Application configuration

### Swagger & Logging Setup (2026-04-07)
- **Swagger/OpenAPI Documentation**: Configured in `main.ts`
  - Endpoint: `http://localhost:3000/api`
  - Bearer token authentication configured
  - Tags available: `health`
  - Persistent authorization enabled (remember token)
  
- **Logging System**: 
  - NestJS built-in logger with configurable log levels
  - Log levels: `error`, `warn`, `log`, `debug`, `verbose`
  - Environment variable: `LOG_LEVEL` (default: `debug`)
  - Bootstrap logs server startup info with port, Swagger URL, environment

- **CORS Configuration**:
  - Configurable via `CORS_ORIGIN` env variable
  - Methods: GET, POST, PUT, PATCH, DELETE
  - Headers: Content-Type, Authorization
  - Credentials: enabled

- **Global Validation Pipe**:
  - Whitelist enabled (strips unknown properties)
  - Forbid non-whitelisted properties enabled
  - Auto-transforms types when possible
  - Implicit conversion enabled

- **Health Check Endpoints**:
  - `GET /health` - Returns API health status and uptime
  - `GET /` - Returns API information and version
  - Both endpoints documented in Swagger

- **Environment Variables** (`.env` and `.env.example`):
  - `DATABASE_URL` - PostgreSQL connection string
  - `PORT` - Server port (default: 3000)
  - `HOST` - Server host (default: 0.0.0.0)
  - `NODE_ENV` - Environment (development, staging, production)
  - `LOG_LEVEL` - Logging level (error, warn, log, debug, verbose)
  - `LOG_FORMAT` - Log format (pretty for dev, json for prod)
  - `CORS_ORIGIN` - CORS allowed origin
  - `CORS_CREDENTIALS` - Allow credentials in CORS
  - `API_VERSION` - API version (default: v1)
  - `API_PREFIX` - API route prefix (default: /api)
  - `JWT_SECRET` - JWT signing secret (minimum 32 chars)
  - `JWT_EXPIRATION` - JWT expiration time
  - `JWT_REFRESH_SECRET` - JWT refresh secret (minimum 32 chars)
  - `JWT_REFRESH_EXPIRATION` - Refresh token expiration
  
### Comprehensive Environment Configuration (2026-04-07)
- **Environment Files**:
  - `.env` — Development defaults (committed to git)
  - `.env.example` — Template with all variables documented (committed to git)
  - `.env.staging` — Staging config with test keys (can be committed)
  - `.env.production` — Production config (⚠️ NEVER commit, use secrets vault instead)
  - `.env.*.local` — Personal local overrides (git-ignored)

- **NODE_ENV Usage**:
  - **Development**: `NODE_ENV=development` (default)
    - Debug logging, local database, relaxed CORS
    - 100 req/min rate limit
  - **Staging**: `NODE_ENV=staging`
    - Standard logging in JSON, staging database, test keys
    - 100 req/min rate limit
  - **Production**: `NODE_ENV=production`
    - Error-only logging in JSON, prod database, live keys
    - 50 req/min rate limit

- **Preseeded Environment Variables** (for future integrations):
  - **Email**: MAIL_HOST, MAIL_PORT, MAIL_USER, MAIL_PASSWORD, MAIL_FROM
  - **AWS S3**: AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_S3_BUCKET
  - **Stripe**: STRIPE_SECRET_KEY, STRIPE_PUBLIC_KEY
  - **OAuth2**: GOOGLE_CLIENT_ID/SECRET, GITHUB_CLIENT_ID/SECRET, MICROSOFT_CLIENT_ID/SECRET
  - **Monitoring**: SENTRY_DSN, SENTRY_ENVIRONMENT, SENTRY_TRACE_SAMPLE_RATE
  - **Rate Limiting**: RATE_LIMIT_WINDOW_MS, RATE_LIMIT_MAX_REQUESTS
  - **Cache**: CACHE_TTL, CACHE_MAX_SIZE
  - **File Upload**: MAX_FILE_SIZE, UPLOAD_DIR

- **Security**: 
  - `.env.production` explicitly added to `.gitignore`
  - `.env.*.local` git-ignored for personal secrets
  - JWT secrets require minimum 32 characters in staging/production
  - Production: Use secrets vault (AWS Secrets Manager, HashiCorp Vault, etc.)
  - See `docs/environment.md` for complete environment guide

### SWC Compiler Configuration (2026-04-07)

### Type Declarations Repository-Wide (2026-04-07)
- **Added Missing @types Packages**:
  - `@types/body-parser` - Types for body-parser middleware
  - `@types/cors` - Types for CORS package
  - `@types/jsonwebtoken` - Types for JWT handling
  - `@types/passport` - Types for Passport authentication
  - `@types/passport-jwt` - Types for JWT strategy
  
- **TypeScript Configuration**:
  - `tsconfig.json`: Strict mode enabled, path aliases configured
  - `tsconfig.build.json`: Extends main config, excludes test files
  - `types` field includes `["node", "jest"]` for proper type resolution
  - `declaration: true` generates `.d.ts` files for distribution
  
- **Type Safety Standards**:
  - `strict: true` - All strict type checks enabled
  - `noImplicitAny: true` - Disallow implicit any types
  - `strictNullChecks: true` - Null/undefined type checking
  - `noImplicitReturns: true` - Disallow implicit undefined returns
  - `forceConsistentCasingInFileNames: true` - Case-sensitive module resolution

### SWC Compiler Configuration (2026-04-07)
- **SWC Packages Added**: `@swc/cli`, `@swc/core`, `@swc/jest`
  - Fast TypeScript/JavaScript compiler alternative to ts-loader
  - Used for faster builds and test execution
  - Source maps enabled for debugging
  - External helpers enabled for code optimization

- **`.swcrc` Configuration Highlights**:
  - **Parse**: TypeScript with decorators support (NestJS requirement)
    - `decorators: true` and `decoratorsBeforeExport: true` for NestJS
    - Top-level await enabled
    - Dynamic imports enabled
    - Class fields and private methods supported
  
  - **Transform**:
    - `decoratorMetadata: true` - Reflect metadata for NestJS DI
    - `legacyDecorator: true` - Support legacy decorator syntax
    - `useDefineForClassFields: true` - ES2022 field initialization
  
  - **Module**: CommonJS output with proper interop
    - `type: "commonjs"` - Node.js compatible output
    - `strictMode: true` - Strict mode enabled
    - External helpers enabled
  
  - **Source Maps**: Enabled for development and debugging
    - `sourceMap: true`
    - `inlineSourcesContent: true`
  
  - **Build Optimization**:
    - Dead code elimination enabled
    - Keep class names (needed for reflection)
    - Keep function names (for debugging)
    - Node target: ES2021

---

## Discovery Log

Add entries as you discover patterns, dependencies, or make architectural decisions.

### Format
```
### Discovery Title (YYYY-MM-DD)
- **File(s)**: path/to/file.ts
- **Finding**: What you discovered
- **Action**: What will be done about it
- **Impact**: How it affects the project
```

### Example
```
### Circular Dependency in User Module (2026-04-08)
- **File(s)**: src/modules/users/users.service.ts, src/modules/users/users.repository.ts
- **Finding**: Service imports Repository which imports Service
- **Action**: Break circular dependency by using abstract interface
- **Impact**: Enables proper DI and testing
```

---

## Architecture Decisions

### ADR-001: Modular Service Repository Pattern
- Use Repository pattern for data access
- Services handle business logic
- Controllers expose HTTP endpoints
- Each feature gets its own module

### ADR-002: Path Aliases for Clarity
- Absolute imports via `@/*` instead of relative paths
- Cleaner refactoring when moving files
- Type safety with TypeScript resolution

### ADR-003: Database Schema First
- Drizzle ORM with explicit schema
- Migrations version-controlled
- NeonDB serverless connection

---

## New Features Log

When implementing new features, document here:

### Feature: User Authentication (Not Yet Implemented)
- Status: Planned
- Module Location: `src/modules/auth/`
- Dependencies: Required JWT, bcrypt
- Swagger Documentation: Required

---

## Code Quality Notes

- **Type Coverage**: Aim for 100% (no `any` types)
- **Testing**: Maintain >80% unit test coverage
- **E2E Tests**: Write for critical user flows
- **Documentation**: Swagger decorators on all endpoints

