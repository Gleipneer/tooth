# First Build Slice

This document defines the first real implementation slice for Tooth. Future Composer runs should build this before touching the wider MVP.

## Objective

Prove that Tooth can safely ingest text, preserve it immutably, create drafts, and expose the workflow through a minimal usable interface on the canonical stack.

## Why this is the first slice

This slice proves the hard foundations:

- auth boundary
- PostgreSQL schema discipline
- filesystem text durability
- import path
- draft lineage
- minimal UI viability
- operational proof for backup and rollback

If this slice fails, later editor/chat/retrieval work will be built on sand.

## Included scope

- local authentication
- project create/list/open
- plain text and Markdown import
- immutable raw text write to filesystem
- raw text metadata in PostgreSQL
- draft creation from a raw text
- minimal draft metadata and body retrieval
- minimal workspace shell with:
  - project list
  - raw text list
  - raw text detail view
  - draft detail view
- structured application logs
- documented backup and rollback path

## Excluded scope

- semantic retrieval
- AI suggestions
- book outline UI
- advanced diff views
- EPUB/PDF export
- archive-wide search
- advanced theming/design-system work

## Backend deliverables

- schema for users, projects, raw texts, drafts
- migration setup
- filesystem storage abstraction for text bodies
- create/list/get endpoints for project, raw text, draft
- import endpoint/job path for plain text and Markdown
- auth/session baseline

## Frontend deliverables

- minimal authenticated shell
- project list/create
- raw text list/detail
- draft creation from raw text
- draft detail view

The UI should be deliberately plain. It exists to validate flow, not finish the product's premium feel.

## Operational deliverables

- environment example for local/dev
- documented data paths
- backup command or script draft
- restore steps
- rollback notes for the first release shape

## Validation checklist

- import a Markdown file
- verify raw text file exists on disk
- verify metadata exists in PostgreSQL
- create draft from raw text
- open draft in UI
- restart services and confirm data still loads
- run backup
- perform a restore in a disposable environment or local simulation

## Non-goals during this slice

- do not choose the final editor engine
- do not wire live AI providers
- do not implement embeddings
- do not build book structures beyond future-safe schema awareness
- do not widen into multi-user or public deployment concerns

## Recommended model split

### Composer 2 should handle

- repo and package scaffolding
- basic schema and route wiring
- simple frontend pages and state wiring
- straightforward validation and smoke tests

### GPT-5.4 should take over when

- file/DB consistency is tricky
- migration strategy needs careful correction
- auth/session behavior becomes non-trivial
- the slice starts bleeding into later-phase architecture
- Composer 2 begins thrashing on contracts or boundaries

## Exit condition

This slice is done only when `docs/07_ACCEPTANCE_GATES.md` Gate 2 is passed.
