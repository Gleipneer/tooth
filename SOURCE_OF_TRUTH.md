# Source of Truth

This repository contains both source material and canonical planning artifacts. They are not equal.

The root rule is simple: future planning and implementation must follow the canonical repo docs in this repository, not whichever statement happened to exist in one of the source archives.

## Canonical naming

- Project name: `Tooth`
- Historical source label: `Text OS`
- If a document says `Text OS`, interpret it as source material for Tooth unless this repo explicitly preserves the term for historical context.

## Precedence order

When documents conflict, use this order:

1. `docs/05_DECISION_LOG.md`
2. `docs/00_IMPLEMENTATION_ENTRYPOINT.md`
3. `docs/03_PHASED_MASTER_PLAN.md`
4. `docs/07_ACCEPTANCE_GATES.md`
5. `docs/08_FIRST_BUILD_SLICE.md`
6. `docs/02_BUILD_STRATEGY.md`
7. `docs/04_COMPOSER_EXECUTION_RULES.md`
8. `AGENTS.md`
9. `tasks/todo.md`
10. Source archives and their extracted contents

If a conflict appears between canonical docs, record the resolution in `docs/05_DECISION_LOG.md` before proceeding.

## Source archive status

The inspected source archives are:

- `text_os_gap_complete.zip`
- `economic_system.zip`

Canonical interpretation after review:

- `text_os_gap_complete.zip` is the primary source for product intent, architecture, and scope.
- `economic_system.zip` is a non-matching prototype from another domain. It is not authoritative for Tooth feature scope or architecture.
- Concepts from `economic_system.zip` may only be reused if they do not conflict with Tooth's product boundaries and are explicitly carried into the canonical docs.

## Locked product truths

The following are frozen unless a documented decision changes them:

- Tooth is a writing system, not a generic productivity app.
- The MVP is single-user first.
- Raw text is immutable.
- AI suggestions require explicit apply.
- Context assembly must be inspectable and deterministic.
- Ubuntu self-hosting is the canonical deployment target.
- Canonical text content lives in the filesystem; metadata and relations live in PostgreSQL.
- Heavy AI and ingest/export work must be backgrounded.

## What must be decided before code starts

The following are frozen before implementation work begins:

- repo naming and doc precedence
- MVP boundary
- first deployable slice
- single-user posture
- storage model
- deployment target
- phase gates
- rollback posture
- cost-governance baseline

## What may remain open while coding starts

These may remain open if implementation respects the canonical boundaries:

- editor framework choice
- queue framework choice
- exact export rendering stack
- exact embedding model
- final visual design token system

Open items belong in `docs/06_OPEN_QUESTIONS.md`, not in ad hoc chat memory.

## Operations runbooks

For runtime operations on Ubuntu, use:

- `docs/30_UBUNTU_DEPLOYMENT_AND_OPERATIONS.md`
- `docs/34_RUNTIME_COST_AND_CAPACITY_GUARDRAILS.md`

## Update discipline

- Do not silently update scope by implementing around the docs.
- Do not treat older source files as equal authority.
- Do not add placeholders that defer real decisions without stating the risk.
- If implementation evidence proves a canonical decision wrong, stop and log the change before expanding the codebase.
