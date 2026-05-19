# Root Agent Instructions

Use this file as the startup instruction set for the whole repository. Read it first at session start. Deeper `AGENTS.md` files add local rules for their own directories and take precedence there. User instructions override both.

## Startup Routine

Run this checklist before substantial work:

1. Enter plan mode by default for non-trivial tasks.
2. Read this file, then read the root [README.md](README.md).
3. Read the nearest package docs before editing:
   - `frontend/AGENTS.md`
   - `frontend/README.md`
   - `ML/README.md`
   - `ML/ML_INTEGRATION_GUIDE.md` for cross-stack data flow work
   - `backend/AGENTS.md` and `backend/README.md` for reference only
4. Scan the repo for the existing pattern before proposing a new one.
5. If the task spans frontend and ML, inspect the current API boundary before editing.

## Hard Repo Boundaries

- Do not expliitly make changes inside `backend/`.
- The backend is maintained from an external repo: `https://github.com/sammythadev/ciap-boilerplate`.
- If a requested fix truly requires backend changes, stop and notify the user for continuation of editing `backend/`.
- Backend docs may still be useful for understanding API contracts, auth flow, env vars, and sync expectations.
- Keep changes simple and scoped. Small, clear fixes beat clever rewrites.

## Default Work Loop

Follow this loop unless the user explicitly asks for something else:

1. Inspect
2. Plan
3. Search for an existing pattern
4. Make the smallest safe change
5. Verify
6. Report the result and any remaining risk

Re-plan immediately if new errors, contradictory code, or failing checks invalidate the current approach.

## Frontend And ML Integration Facts

These are current repo facts and should be re-checked before changing integration code:

- Frontend API requests are centralized in `frontend/lib/api/client.ts` and `frontend/lib/api/hooks.ts`.
- Frontend uses Axios plus TanStack Query hooks, with cookie-based auth and no manual bearer token pattern.
- Frontend dev traffic goes through `/api-proxy`, defined in `frontend/next.config.ts`.
- The proxy currently rewrites `/api-proxy/:path*` to `http://localhost:3000/:path*`.
- ML exposes a FastAPI server in `ML/ml_api_server.py`, defaulting to `http://localhost:8001`.
- ML endpoints currently documented and implemented are:
  - `POST /score/creator`
  - `POST /recommend/creators`
  - `POST /analyze/sentiment`
- Prefer this sync path unless the repo clearly changes: frontend -> backend API/proxy -> ML service.
- Do not add direct frontend-to-ML calls unless the user asks for it or the repo already establishes that pattern.

## Frontend Rules

- Follow the existing frontend code pattern before introducing new structure.
- Prefer extending `frontend/lib/api/hooks.ts` and the shared Axios client over ad hoc fetch logic.
- Preserve the current auth model: cookies, proxy routing, and existing interceptors.
- Do not introduce outdated Next.js, React, Tailwind, or TanStack Query patterns.
- Read framework-local guidance before changing unfamiliar frontend behavior.

## ML Rules

- Keep ML changes focused and compatible with the current FastAPI entry points and docs.
- Preserve request and response shapes unless the user explicitly requests a contract change.
- If ML work would require backend contract changes, notify the user instead of patching backend locally.

## Anti-Hallucination Rules

- Do not invent endpoints, env vars, scripts, package choices, data contracts, or folder conventions.
- Verify every non-obvious assumption in code or docs before acting on it.
- If something is missing, say it is missing. Do not imply it exists.
- Distinguish observed repo facts from recommendations.
- When docs and code disagree, trust code first and call out the mismatch.

## Token Discipline

- Keep user-facing responses brief and direct.
- Read only the docs and files relevant to the task.
- Prefer targeted `rg` searches over broad file dumps.
- Reuse repo wording and structures instead of restating the same context.
- Avoid long speculative explanations. Report facts, decisions, and blockers.

## Quality Bar

- Prefer small patches over wide refactors.
- Avoid clever fixes unless they are necessary and easy to justify.
- Reuse existing utilities, hooks, components, and patterns before adding new ones.
- Do not add packages or abstractions when current repo tools already solve the problem.
- Surface existing issues early when they materially affect the task.

## Verification

- Run the smallest useful verification for the area you changed.
- Prefer existing lint, typecheck, and targeted test commands when available.
- If verification cannot be run, say so clearly.
- Do not claim something works unless it was verified or the limitation was stated.

## Response Rules

- Reduce verbosity.
- Notify the user about existing issues you discover that matter to the task.
- Call out backend-related blockers explicitly.
- Include concrete file paths when referencing evidence.
- Keep final summaries short: what changed, what was verified, and what still needs attention.
