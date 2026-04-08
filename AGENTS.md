# Agent Instructions

Project bootstrap for coding agents working in this repository.

## Purpose

Use this file as the default operating guide. Keep changes small, safe, typed, and consistent with the existing NestJS + Drizzle architecture. Maintain project knowledge as you work instead of treating docs as an afterthought.

## Default Mode

- Enter plan mode by default for every non-trivial task.
- Build a short implementation plan before editing code.
- Verify the plan against the repo, current constraints, and the user's request.
- Track progress while working instead of holding the whole plan in your head.
- If execution goes sideways, stop, re-evaluate, and re-plan immediately.
- Do not push ahead on a stale plan after new errors, failing tests, or contradictory evidence appear.

## Read Order

1. This file for default behavior.
2. `agent-docs/project-structure.md` for layout, ownership, and placement rules.
3. Task-specific docs only when relevant:
   - `agent-docs/patterns.md`
   - `agent-docs/testing.md`
   - `agent-docs/exceptions.md`
   - `agent-docs/api.md`
   - `agent-docs/database.md`
   - `agent-docs/environment.md`
4. `agent-docs/findings.md` for durable discoveries and decisions.
5. `agent-docs/lessons.md` for reusable lessons, mistakes, and cautions.

## Stack Snapshot

- Framework: NestJS 11
- Language: TypeScript with strict mode
- ORM: Drizzle ORM with `pg`
- Database: PostgreSQL via `DATABASE_URL`
- Package manager: `pnpm` only
- API docs: Swagger at `/api-docs`
- Current feature modules: `auth`, `health`, `rbac`, `sessions`, `users`

## Operating Rules

- Make the smallest safe change that solves the task.
- Preserve existing module boundaries: controller -> service -> repository.
- Use strict typing. Do not introduce `any`.
- Prefer path aliases over deep relative imports.
- Keep DTOs for API I/O and keep database records out of controllers.
- Add or update tests when behavior changes.
- Do not refactor unrelated code while implementing a focused task.
- Follow existing naming and file-placement patterns already used in `src/`.
- Prefer improving clarity and maintainability over cleverness.
- Explain meaningful changes clearly at the end of the task.

## Research And Repo Search

Before substantial work, search the repository for existing patterns:

- Look for similar modules, DTOs, exceptions, tests, and config first.
- Reuse established patterns before creating new ones.
- Verify assumptions against actual code, scripts, and config files.
- When introducing a new dependency or unfamiliar API, verify usage against official documentation and the installed version.

## Task Management

Use `tasks/todo.md` as the task log for planning and closeout.

### For each substantial task

1. Write or refresh a short plan in `tasks/todo.md`.
2. Verify the plan against the repo before implementation.
3. Track progress with brief status updates as major steps complete.
4. Document the final result, important changes, and verification outcome.

### Re-plan triggers

Immediately re-plan when:

- a test fails in a way the current plan did not anticipate
- logs or runtime errors contradict the current hypothesis
- the repo structure or existing pattern differs from what was assumed
- the user changes scope or corrects a previous assumption

Keep the task log compact. It should help execution, not become a second spec.

## Current Code Shape

### Source layout

- `src/modules/*`: feature modules
- `src/common/*`: shared exceptions, filters, bases, and cross-cutting utilities
- `src/database/*`: Drizzle schema, migrations, database module, seeds
- `src/types/*`: shared typings
- `src/swagger.ts`: Swagger setup
- `src/main.ts`: app bootstrap, CORS, global validation pipe

### Controller / service / repository split

- Controllers handle HTTP concerns and Swagger decorators.
- Services own business rules and orchestration.
- Repositories own Drizzle queries.

## Code Standards

- File names: kebab-case
- Classes / DTOs / modules: PascalCase
- Methods / variables: camelCase
- Constants: UPPER_SNAKE_CASE
- Return types should be explicit on public functions.
- Prefer `Promise.all` for independent async work.
- Throw typed HTTP exceptions or project exception classes for expected failures.

## Imports

Prefer these aliases when possible:

- `@/*`
- `@modules/*`
- `@common/*`
- `@database/*`
- `@types/*`
- Other aliases defined in `tsconfig.json`

## Runtime Conventions

- Global `ValidationPipe` is configured in `src/main.ts` with:
  - `whitelist: true`
  - `forbidNonWhitelisted: true`
  - `transform: true`
- CORS is enabled from env-driven configuration in `src/main.ts`.
- Swagger is configured in `src/swagger.ts`.

## Knowledge Maintenance

When you learn something durable while searching or implementing, update the appropriate project docs in the same task when practical.

### Docs Ownership Split

- `docs/` contains repository and API documentation for project users/contributors.
- `agent-docs/` contains agent workflow, lessons, findings, and internal coding guidance.
- Keep this separation strict: do not move agent process notes into `docs/`.

### API Documentation Is Mandatory

When creating or changing any API endpoint, update docs in the same task:

1. Update `docs/api.md` with route, auth mode, request/response, and errors.
2. Update `docs/implementation-guide.md` if implementation workflow or conventions changed.
3. Update related docs when applicable:
   - `docs/database.md` for schema/query contract changes
   - `docs/environment.md` for new env requirements
   - `docs/project-structure.md` for module/layout changes
4. Keep Swagger decorators and DTOs aligned with those docs.

### Update `agent-docs/findings.md` when

- You discover a repo convention not already documented.
- You confirm a durable implementation pattern.
- You make an architectural or tooling decision worth preserving.
- You uncover a gotcha that will likely matter again.

### Update `agent-docs/project-structure.md` when

- You add a new top-level folder or source area.
- You add a new module shape, shared layer, or placement rule.
- The documented structure no longer matches the real repo layout.

### Update `agent-docs/lessons.md` when

- A mistake was made and the correction is generally useful.
- You learn a repeatable lesson worth applying in future tasks.
- A debugging dead end, tooling caveat, or integration trap should be avoided next time.
- The user corrects you in a way that should change future behavior.

## Self-Improvement Loop

- Review `agent-docs/lessons.md` at session start for topics relevant to the task.
- When a mistake happens, write a prevention rule that makes the same error less likely next time.
- When the user corrects behavior, capture that correction in `agent-docs/lessons.md`.
- Ruthlessly refine lessons until the same category of mistake stops recurring.
- Prefer concrete prevention rules over vague reminders.

Keep these updates concise. Prefer short entries, checklists, and examples over long prose.

## Documentation Map

- `agent-docs/project-structure.md`: repo layout, module shape, where to put new code
- `agent-docs/patterns.md`: implementation defaults for NestJS, DTOs, DI, repositories
- `agent-docs/testing.md`: testing strategy and minimum expectations
- `agent-docs/exceptions.md`: exception hierarchy and response rules
- `agent-docs/api.md`: Swagger, DTO, pagination, and endpoint conventions
- `agent-docs/database.md`: schema, migrations, and query guidance
- `agent-docs/environment.md`: env files and required variables
- `agent-docs/findings.md`: durable discoveries, decisions, and repo facts
- `agent-docs/lessons.md`: lessons learned, mistakes, and cautionary notes

## Task Routing

- For endpoint work: read `project-structure.md`, `patterns.md`, `api.md`, `testing.md`.
- For schema or data access work: read `database.md`, `patterns.md`, `testing.md`.
- For error-handling work: read `exceptions.md` and `testing.md`.
- For config or startup work: read `environment.md` and `project-structure.md`.
- For unfamiliar areas: read `findings.md` and search the repo for similar code first.
- For debugging or regressions: review `lessons.md`, inspect logs/errors/tests, then plan the fix.

## Commands

Use `pnpm` scripts from `package.json`:

- `pnpm run start:dev`
- `pnpm run build`
- `pnpm run lint`
- `pnpm run typecheck`
- `pnpm run test`
- `pnpm run test:e2e`
- `pnpm run db:generate`
- `pnpm run db:migrate`
- `pnpm run db:seed`

## Autonomous Bug Fixing

When the user gives a bug report, default to fixing it end-to-end instead of only describing it.

- Reproduce or triangulate the issue with logs, stack traces, failing tests, or runtime errors.
- Point to the concrete evidence that explains the bug.
- Implement the fix and verify the outcome.
- Update or add tests when feasible.
- Check whether the problem is influenced by outdated library usage or stale patterns, and verify against the currently installed version before changing integrations.

## Completion Checklist

Before finishing a task, quickly check:

1. Did I reuse the nearest existing pattern instead of inventing one?
2. Did I update tests if behavior changed?
3. Did I update `findings.md` for any durable discovery or decision?
4. Did I update `project-structure.md` if the structure changed?
5. Did I capture a reusable lesson or mistake in `lessons.md` if one surfaced?
6. Did I update `tasks/todo.md` with the plan, progress, and result?
7. If APIs changed, did I update `docs/api.md` (and `docs/implementation-guide.md` if needed)?

## When Updating Docs

- Update this file only when bootstrap guidance changes.
- Update the task-specific doc closest to the change.
- Keep docs compact, current, and practical.
