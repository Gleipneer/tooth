# Tooth Lessons

This file stores reusable lessons for future Composer and Cursor runs.

## Reusable mistakes and patterns

- Mistake: starting with the most exciting subsystem instead of the most load-bearing one.
  - Prevention rule: build the first vertical slice before AI, retrieval, or book complexity.

- Mistake: treating source archives as equal authority after canonicalization.
  - Prevention rule: obey `SOURCE_OF_TRUTH.md` precedence and record conflicts in the decision log.

- Mistake: allowing a cheap model to keep iterating on an architectural problem after repeated corrections.
  - Prevention rule: escalate to GPT-5.4 once the work becomes architecture-sensitive or starts thrashing.

## Prevention rules

- Never widen scope silently.
- Never mutate canonical raw text.
- Never bypass acceptance gates because the code appears close.
- Never open multiple architectural fronts at once.
- Never leave a real unresolved issue as a vague placeholder.

## Architecture-specific lessons

- Hybrid storage is a trust feature, not just an implementation detail.
- Explicit apply is a product invariant, not a UI preference.
- Retrieval quality is architecture, not garnish; poor retrieval will quietly degrade AI trust.
- Ubuntu deployment decisions should be treated as product reality early, not postponed to the end.
- FastAPI dependency injection patterns are valid even when generic lint rules complain; adjust lint configuration rather than warping the framework usage.

## Operational lessons

- Gate scripts should call the same `ruff`/`pytest`/`npm` commands as CI so “gate passed” cannot drift from “tests passed.”
- Example env files must never contain real API keys or production secrets; placeholders only, or empty values with a comment to fill locally.
- Some OpenAI model endpoints reject `max_tokens` and require `max_completion_tokens`; the client should retry on that error instead of failing the whole assist flow.
- Ingest and search must stay project-scoped in SQL; never concatenate project A’s vectors with project B’s in ranking loops.
- Staging tables for paste ingest should carry the full structured payload for audit; accept paths should only execute whitelisted `create_*` kinds.
- Backup without restore proof is not a backup strategy.
- Rollback must be simple enough to perform under stress.
- Heavy jobs should be isolated early so the API path remains responsive.
- Avoid introducing infra that the first slice does not need.
- When using `pwdlib`'s recommended password hashing baseline, pin `argon2-cffi` explicitly so the auth layer does not fail at import time.
- Host runtime constraints matter: choose a frontend toolchain that matches the installed Node version instead of silently assuming the latest Vite line will run.
- Restore helpers must handle the normal local-ops case: if the repo PostgreSQL cluster is already running, do not try to start a second server, and use an admin-capable local connection for restore database creation.
- CLI wrappers installed via symlink should resolve their real path (`readlink -f`) before locating repo-relative libraries.
- Startup status checks should prefer live probes and tolerate short warm-up windows before declaring degraded service.
- `healthz` can be green while auth is broken if database access is failing; auth/bootstrap checks must be validated explicitly.
- Local startup scripts must align with the actual local PostgreSQL port/credentials to avoid login `500` regressions.
- Bootstrap-user seeding is useful as fallback, but MVP usability requires a real user-driven signup path.
- Auth UX must surface expected failures (duplicate email, invalid credentials) as user-readable errors, not generic failures.
- Runtime/operator truth must expose backend URL and frontend API target explicitly; never rely on an implicit `:8000` assumption when fallback ports are active.
- Frontend execution should not begin with visual polish: lock route map, shell shape, and state/query boundaries first or the UI layer will thrash.
- Canonical planning references must exist as real files; if a required contract doc (for example `docs/17_*` or `docs/18_*`) is missing, treat it as a governance risk and document code-derived truth explicitly before implementation.

## Prompt-quality lessons

- The best execution prompts name the active phase, excluded scope, required docs, and stop conditions.
- A good prompt states what not to touch yet.
- If a prompt does not specify the gate being targeted, it is too loose for this repo.

## Future user corrections

Add future user corrections here in this format:

- Correction:
- Why it mattered:
- Prevention rule:
- Affected phase or subsystem:
