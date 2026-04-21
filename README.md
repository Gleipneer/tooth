# Tooth

Tooth is the implementation repository for a self-hosted, AI-assisted writing system whose source material arrived primarily as a `Text OS` documentation corpus. In this repo, `Tooth` is the canonical project name. `Text OS` remains a useful historical label for the source material, but planning and implementation use `Tooth`.

## Current state

This repository contains a **working MVP application**: FastAPI backend, Vite/React frontend, PostgreSQL metadata, and filesystem storage for raw texts and drafts. Canonical planning docs live under `docs/`; operational notes for Ubuntu single-node deployment are in `docs/30_UBUNTU_DEPLOYMENT_AND_OPERATIONS.md`.

## Canonical reading order

Read these in order before planning or coding:

1. `docs/00_IMPLEMENTATION_ENTRYPOINT.md`
2. `SOURCE_OF_TRUTH.md`
3. `docs/03_PHASED_MASTER_PLAN.md`
4. `docs/08_FIRST_BUILD_SLICE.md`
5. `docs/04_COMPOSER_EXECUTION_RULES.md`
6. `AGENTS.md`

## What Tooth is

Tooth is a conversation-first writing workspace for a single writer first, deployed on Ubuntu, with:

- immutable raw text capture and import
- local email/password account signup and sign-in
- draft versioning and branching
- editor and chat working in the same surface
- explicit-apply AI suggestions with auditable context
- project-scoped retrieval/search and optional bounded FTS snippets in AI assist
- paste ingest with staging and explicit accept for raw text creation
- book assembly (outline + assignments) and Markdown export
- audit logging, cost guardrails, backup/restore scripts, and acceptance-gate discipline

## What is canonical now

The canonical implementation package in this repo includes:

- `SOURCE_OF_TRUTH.md`
- `AGENTS.md`
- `tasks/todo.md`
- `tasks/lessons.md`
- `docs/00_IMPLEMENTATION_ENTRYPOINT.md` through `docs/09_ENVIRONMENT.md`
- `docs/30_UBUNTU_DEPLOYMENT_AND_OPERATIONS.md` (canonical runtime ops)
- `docs/30_RELEASE_OPERATIONS.md` (compatibility pointer)
- `docs/34_RUNTIME_COST_AND_CAPACITY_GUARDRAILS.md` (runtime guardrails)

The source archives are reference inputs, not the active governance layer.

## Current usage docs

- System capabilities: `docs/37_SYSTEM_CAPABILITIES_AND_USAGE.md`
- Quickstart commands: `docs/38_QUICKSTART_AND_HELPFUL_COMMANDS.md`

## MVP in one sentence

The Tooth MVP is a self-hosted single-user writing system where a writer can ingest Markdown/plain text, organize it into projects, create and branch drafts, use bounded AI assistance with explicit apply, assemble a simple book, search the corpus, and export safely.

## First deployable slice

The first deployable slice is a safe ingestion-to-draft vertical slice:

- local auth
- project creation
- plain text/Markdown import
- immutable raw text persistence
- draft creation from raw text
- minimal workspace to view project, raw text, and draft
- PostgreSQL + filesystem storage on Ubuntu
- backup and rollback proven in staging

## Execution posture

- Do not start implementing broad architecture fronts in parallel.
- Do not bypass acceptance gates because the code appears close.

See `docs/00_IMPLEMENTATION_ENTRYPOINT.md` for the current phase and `docs/07_ACCEPTANCE_GATES.md` for gate definitions.

## Quick dev

- Backend: `scripts/dev_backend.sh` (from repo root; see script for venv and `alembic upgrade head`).
- Frontend: `scripts/dev_frontend.sh`
- Gate-style checks: `scripts/gate6_book_proof.sh`, `scripts/gate7_ops_proof.sh` (backup + optional `TOOTH_API_BASE` health check)
- Operator lifecycle CLI:
  - install: `bash scripts/install_tooth_cli.sh`
  - run: `tooth start`
  - status: `tooth status`