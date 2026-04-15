# Project Structure

Quick map of the repository and where new code should go.

## Top Level

- `src/`: application code
- `test/`: e2e tests
- `tasks/`: task planning and execution logs
- `agent-docs/`: agent-facing guidance
- `docs/`: longer-form project docs
- `src/swagger.ts`: Swagger configuration
- `src/main.ts`: bootstrap and global middleware/pipes

## Source Layout

- `src/modules/auth`: local/admin auth endpoints, token/session lifecycle, and strategies
- `src/modules/auth/socials`: social provider auth flows (Google), token refresh, and social metrics pull helpers
- `src/modules/ingestion`: ingestion entry module for external platform pulls
- `src/modules/ingestion/youtube`: YouTube ingestion routes and service
- `src/modules/creator-insights`: creator audience/content insight endpoints
- `src/modules/creator-discovery`: SME creator discovery + comparison endpoints
- `src/modules/health`: health endpoints and DTOs
- `src/modules/rbac`: role ability policy service and RBAC module wiring
- `src/modules/sessions`: session persistence module for refresh lifecycle
- `src/modules/users`: users controller, service, repository, DTOs
- `src/common/bases`: shared base classes
- `src/common/constants`: shared constants (RBAC roles + abilities)
- `src/common/decorators`: route metadata decorators (`Public`, `Roles`, `RequireAbilities`)
- `src/common/exceptions`: domain-specific exception classes
- `src/common/filters`: global exception filters
- `src/common/guards`: JWT auth, role guards, and ability guards
- `src/database/drizzle`: schema and generated migrations
- `src/database/seeds`: seed module and scripts
- `src/types`: shared TypeScript types

## Preferred Feature Module Shape

Use this pattern for new modules:

```text
src/modules/<feature>/
  <feature>.module.ts
  <feature>.controller.ts
  <feature>.service.ts
  <feature>.repository.ts
  dto/
```

Add `*.spec.ts` beside the source file for unit tests when needed.

## Ownership By Layer

- Controller: route params, query parsing, Swagger, HTTP status codes
- Service: business logic, orchestration, validation that depends on state
- Repository: Drizzle queries only
- DTO: request validation and response serialization

## Data Flow

Request -> controller -> service -> repository -> database -> service -> DTO -> response

Global validation and CORS are configured in `src/main.ts`.

## Placement Rules

- Shared exceptions belong in `src/common/exceptions`.
- Shared filters belong in `src/common/filters`.
- Schema changes belong in `src/database/drizzle/schema.ts`.
- Migrations stay under `src/database/drizzle/migrations/`.
- One-off or historical notes belong in `agent-docs/findings.md`.
- Reusable mistakes, lessons, and cautions belong in `agent-docs/lessons.md`.
- Task plans, progress notes, and task results belong in `tasks/todo.md`.

## Naming

- Files and folders: kebab-case
- Classes and enums: PascalCase
- Methods and variables: camelCase
- Constants: UPPER_SNAKE_CASE

## Imports

Prefer path aliases from `tsconfig.json`, especially:

- `@/*`
- `@modules/*`
- `@common/*`
- `@database/*`
- `@types/*`

## Add-New-Code Checklist

1. Put code in the narrowest correct module.
2. Keep HTTP, business, and query concerns separate.
3. Reuse shared exceptions and filters before creating new ones.
4. Update tests close to the changed behavior.
5. Record any durable architectural decision in `agent-docs/findings.md`.
6. Update this file if folders, modules, or placement rules changed.
