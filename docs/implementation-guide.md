# API Implementation Guide

This guide is the practical workflow for adding or changing API endpoints in this repo.

## 1) Plan Before Coding

1. Confirm business goal and affected module.
2. Search for an existing endpoint pattern in `src/modules/*`.
3. Decide if this is:
   - controller-only change
   - service logic change
   - repository/schema change

Track substantial work in `tasks/todo.md`.

## 2) Design the Contract

Define:

- HTTP method and route
- request DTO
- response DTO
- auth requirements (`@Public` or bearer + guards)
- RBAC (`@Roles`) and ability policy (`@RequireAbilities`)
- error cases and status codes

## 3) Implement in Layers

### Controller

- Add route + Swagger decorators:
  - `@ApiTags`
  - `@ApiOperation`
  - `@ApiResponse`
  - `@ApiBearerAuth('access-token')` for protected routes
- Keep methods thin; delegate to service.

### Service

- Add orchestration/business logic.
- Enforce tenant boundaries and authorization semantics.
- Use typed exceptions for expected failures.

### Repository (if needed)

- Add or reuse Drizzle queries.
- Keep DB logic in repository files only.

## 4) Wire Security Correctly

### Public endpoint

- Add `@Public()`
- Do not apply auth guards unless intentionally mixed behavior

### Protected endpoint

- Use `JwtAuthGuard`
- Add role and ability checks when needed:
  - `@Roles(...)`
  - `@RequireAbilities(...)`
- For user-scoped resources, enforce tenant/self checks in service logic.

## 5) Update Swagger and Usage Docs

Every API change must update both:

1. `docs/api.md`:
   - endpoint list
   - request/response examples
   - auth behavior
   - error behavior if changed
2. Swagger decorators in controller DTOs/responses

Also update these when relevant:

- `docs/database.md` if schema/query behavior changed
- `docs/environment.md` if new env keys are required
- `docs/project-structure.md` if module/layout changed

## 6) Database Changes (when required)

1. Edit only `src/database/drizzle/schema.ts`.
2. Run `pnpm run db:generate`.
3. Run `pnpm run db:migrate`.
4. Verify feature behavior against updated schema.

Avoid hand-editing migration SQL unless absolutely necessary.

## 7) Validation and Verification

Minimum checks:

```bash
pnpm run typecheck
pnpm run lint
```

For route behavior changes, also run targeted tests or manual route checks.

## 8) API Change Checklist

- [ ] Controller route added/updated with Swagger decorators
- [ ] DTOs reflect true request/response shape
- [ ] Service logic includes auth/tenant/policy enforcement
- [ ] Repository changes isolated to data layer
- [ ] `docs/api.md` updated
- [ ] Related docs updated (`database`, `environment`, `project-structure`) where applicable
- [ ] `tasks/todo.md` updated with plan/progress/result
