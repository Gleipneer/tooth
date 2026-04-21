# Canonical Repo Map

This file defines the intended repository shape for Tooth before broad implementation begins.

## Current reality

The repository started with source archives only:

- `economic_system.zip`
- `text_os_gap_complete.zip`

The canonical planning package now lives alongside them.

## Root layout

Use this root structure:

```text
/
  AGENTS.md
  README.md
  SOURCE_OF_TRUTH.md
  docs/
  tasks/
  backend/
  frontend/
  infra/
  scripts/
  tests/
  source_material/
```

## Directory purposes

- `docs/`
  - canonical product, architecture, and execution governance docs
- `tasks/`
  - active execution ledger and lessons
- `backend/`
  - API, workers, migrations, storage abstractions, AI orchestration, retrieval, export, and tests specific to backend concerns
- `frontend/`
  - conversation-first app shell, editor workspace, book workspace, UI tests, and design-system implementation
- `infra/`
  - deployment manifests, systemd units, nginx config templates, environment examples, backup/restore scripts
- `scripts/`
  - repo utilities, migration helpers, smoke checks, local setup, import/export maintenance
- `tests/`
  - cross-cutting integration, end-to-end, and acceptance tests
- `source_material/`
  - optional unzipped archive references if the team decides to retain them in-repo; not a canonical implementation surface

## Canonical doc set

The planning package intentionally compresses the large archive into a smaller execution core:

- `docs/00_IMPLEMENTATION_ENTRYPOINT.md`
- `docs/01_CANONICAL_REPO_MAP.md`
- `docs/02_BUILD_STRATEGY.md`
- `docs/03_PHASED_MASTER_PLAN.md`
- `docs/04_COMPOSER_EXECUTION_RULES.md`
- `docs/05_DECISION_LOG.md`
- `docs/06_OPEN_QUESTIONS.md`
- `docs/07_ACCEPTANCE_GATES.md`
- `docs/08_FIRST_BUILD_SLICE.md`
- `docs/09_ENVIRONMENT.md`

These replace the need to read dozens of source docs before every run.

## Source archive interpretation

### `text_os_gap_complete.zip`

Canonical status: primary source material.

What it contributed:

- product shape
- MVP boundary
- chat/editor/book/search architecture
- Ubuntu deployment posture
- AI cost and runtime guardrails

### `economic_system.zip`

Canonical status: non-matching prototype, not an implementation baseline.

Useful carryovers only:

- explicit approval before AI changes become truth
- operational runbook mentality
- auditability and reproducibility posture

## Normalization rules

- Keep archives as source material, not living docs.
- Do not clone the entire source corpus into the active repo unless there is a concrete need.
- If detailed reference docs are later restored, make them secondary to the canonical planning core.
- New implementation directories should appear only when the first slice starts.

## Staff-engineer-approved execution order

Use this order, without opening multiple fronts:

1. finalize canonical planning package
2. scaffold repo structure and tooling
3. implement storage and auth foundations
4. ship the first vertical slice
5. expand into editor/versioning
6. add bounded AI/chat
7. add retrieval and book engine
8. harden deployment, observability, and cost posture
