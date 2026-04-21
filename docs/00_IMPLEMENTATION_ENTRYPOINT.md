# Tooth Implementation Entrypoint

Read this file first before any planning or coding run.

## What Tooth is

Tooth is a self-hosted, single-user-first writing system for capturing raw text, managing versioned drafts, working with AI inside a conversation-first workspace, assembling books from text objects, and exporting the result safely.

The product is not a generic note app, not a ghostwriter, and not a multi-user collaboration system in its first build.

## Canonical docs

Use this order:

1. `SOURCE_OF_TRUTH.md`
2. `docs/03_PHASED_MASTER_PLAN.md`
3. `docs/08_FIRST_BUILD_SLICE.md`
4. `docs/07_ACCEPTANCE_GATES.md`
5. `docs/04_COMPOSER_EXECUTION_RULES.md`
6. `AGENTS.md`

## Current repo phase

Current phase: **MVP implementation present** — foundation through book/export and operational scripts, aligned with `docs/03_PHASED_MASTER_PLAN.md` and gates in `docs/07_ACCEPTANCE_GATES.md`.

That means:

- backend, frontend, migrations, and hybrid storage are implemented for the documented slice
- later-phase or deferred items remain listed in `docs/03_PHASED_MASTER_PLAN.md` (multi-user, advanced exports, etc.)

## MVP definition

The Tooth MVP is:

- single-user login
- project and raw text management
- plain text and Markdown import
- immutable raw text storage on filesystem
- draft creation, branching, and diff-aware history
- conversation-first workspace with bounded AI suggestions
- project-scoped full-text and semantic retrieval
- simple book outline plus Markdown export
- Ubuntu deployment with logging, backup, rollback, and cost guardrails

## Next implementation target

Hardening, operational tuning, and any items explicitly deferred in `docs/03_PHASED_MASTER_PLAN.md` — not parallel new architectural fronts.

Current operator runbooks:

- `docs/30_UBUNTU_DEPLOYMENT_AND_OPERATIONS.md`
- `docs/34_RUNTIME_COST_AND_CAPACITY_GUARDRAILS.md`

## What not to touch without a new decision

Items intentionally deferred for the first build remain out of scope:

- EPUB/PDF export
- multi-user collaboration
- archive-wide AI analysis
- features listed under “Intentionally deferred” in `docs/03_PHASED_MASTER_PLAN.md`

## Acceptance gate before moving on

Before moving from the first slice to the next phase, Tooth must prove:

- local auth works
- PostgreSQL + filesystem storage works together
- raw text import persists safely
- a draft can be created from imported text
- the minimal UI can open the project, raw text, and draft
- logs exist for the key actions
- backup and restore have been tested in staging or local simulation
- rollback steps are written and credible

If those proofs do not exist, the next phase is blocked.
