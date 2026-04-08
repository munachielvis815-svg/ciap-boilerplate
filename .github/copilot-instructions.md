# Copilot Instructions

Use these instructions when coding in this repository. They complement `AGENTS.md` and should reinforce the same behavior, not compete with it.

## Primary Behavior

- Start by searching the repo for similar code and existing patterns.
- Plan first by default for non-trivial tasks.
- Make the smallest safe change that solves the task.
- Preserve the controller -> service -> repository split.
- Prefer strict types, explicit return types, DTO-based boundaries, and path aliases.
- Avoid unnecessary refactors and avoid introducing new abstractions without a clear need.
- If reality diverges from the plan, stop and re-plan immediately.

## Project Context

- Framework: NestJS 11
- Language: TypeScript strict mode
- ORM: Drizzle ORM with PostgreSQL
- Package manager: `pnpm`
- Swagger: configured in `src/swagger.ts`
- Bootstrap: configured in `src/main.ts`

## Search Before You Build

Before adding new code:

1. Search for similar modules, repositories, DTOs, filters, exceptions, tests, and scripts.
2. Prefer extending existing patterns over creating new ones.
3. Check `tsconfig.json`, `package.json`, `src/main.ts`, and nearby modules before assuming behavior.
4. If using a library or feature you do not fully know, verify against official docs and the installed version.

## Task Management

Use `tasks/todo.md` to manage substantial work.

1. Write a short plan first.
2. Verify the plan against the codebase.
3. Track progress as steps complete.
4. Explain the changes and document final results in `tasks/todo.md`.
5. If the plan breaks, re-plan immediately instead of forcing the old approach.

## Implementation Rules

- Controllers own routing, params, query parsing, and Swagger decorators.
- Services own business logic and orchestration.
- Repositories own Drizzle queries.
- Request DTOs validate input.
- Response DTOs expose only public fields.
- Expected failures should use typed HTTP or domain exceptions.
- Independent async work should usually use `Promise.all`.

## TypeScript And Tooling

- Do not introduce `any` unless there is a compelling reason and it is clearly isolated.
- Use `import type` where appropriate for decorated TypeScript codepaths.
- Check actual package APIs before using them.
- Prefer existing `pnpm` scripts over ad hoc command sequences.
- When debugging, use logs, stack traces, and failing tests as the primary evidence.
- Check whether relevant integrations or patterns are outdated before fixing library-related bugs.

## Knowledge Maintenance

Agents are expected to keep repo knowledge synchronized as they work.

### Update `agent-docs/findings.md`

Do this after repo searches or implementation work when you discover:

- a durable repo convention
- a new architectural decision
- a tooling caveat
- a dependency or framework gotcha
- a confirmed pattern future agents should reuse

### Update `agent-docs/project-structure.md`

Do this when:

- new folders or modules are added
- the effective shape of the repo changes
- placement rules need clarification

### Update `agent-docs/lessons.md`

Do this when:

- a mistake was made and corrected
- a debugging lesson is worth preserving
- a repeated trap or anti-pattern should be called out
- a tool usage lesson would save time next time
- the user corrects the agent in a reusable way

Keep these updates short and useful. Prefer compact entries over long tutorials.

## Self-Improvement Loop

- Review `agent-docs/lessons.md` at session start when the task touches a relevant topic.
- Turn mistakes into prevention rules, not just retrospective notes.
- Record user corrections in `agent-docs/lessons.md`.
- Keep iterating on lessons until repeated mistakes in the same category drop off.

## Documentation Discipline

- Do not let docs drift far behind code.
- Do not over-delete useful context; compact instead of erasing important detail.
- Prefer short summaries, rules, and examples over long narrative sections.
- If a doc is wrong, fix it as part of the task when practical.

## File Placement Defaults

- Feature code: `src/modules/<feature>/`
- Shared exceptions and filters: `src/common/`
- Schema and migrations: `src/database/drizzle/`
- Seeds: `src/database/seeds/`
- E2E tests: `test/`
- Repo knowledge docs: `agent-docs/`
- Task planning and results: `tasks/todo.md`

## Testing Expectations

- Add or update unit tests when logic changes.
- Add e2e coverage for critical endpoint behavior when needed.
- Keep tests close to the changed behavior.

## Autonomous Bug Fixing

When the user reports a bug, fix it by default.

- Reproduce or triangulate the failure with logs, errors, or tests.
- Explain the concrete evidence that identified the cause.
- Implement the fix and verify the result.
- Update tests when practical.

## Quick Finish Checklist

1. Did I search for an existing pattern first?
2. Did I keep the change scoped?
3. Did I update tests if needed?
4. Did I capture durable findings?
5. Did I update structure docs if the layout changed?
6. Did I record lessons or mistakes worth reusing?
7. Did I update `tasks/todo.md` with plan, progress, and results?
