# Decision Log

This file records canonical decisions made during source-archive normalization and planning.

## Active decisions

| ID | Decision | Status | Rationale | Source basis |
| --- | --- | --- | --- | --- |
| D-001 | Use `Tooth` as the canonical project/repo name. | accepted | The repo needs one durable identity. The source archive uses `Text OS`, but implementation should not inherit naming ambiguity. | `text_os_gap_complete.zip` plus repo task requirements |
| D-002 | Treat `text_os_gap_complete.zip` as the primary source corpus. | accepted | It contains the full product and architecture package for the writing system. | source archive inspection |
| D-003 | Treat `economic_system.zip` as non-canonical source material. | accepted | It is a different product domain. It can inform governance style, not Tooth scope or architecture. | source archive inspection |
| D-004 | Freeze single-user-first as the Tooth MVP posture. | accepted | The source docs consistently favor single-user-first to reduce complexity and protect the first build. | source corpus |
| D-005 | Freeze hybrid storage: filesystem for text bodies, PostgreSQL for metadata/relations, `pgvector` for embeddings. | accepted | This is the strongest recurring architectural choice in the source corpus and best matches portability plus query needs. | source corpus |
| D-006 | Freeze Ubuntu single-node self-hosting as the canonical MVP deployment target. | accepted | Deployment, rollback, and operations are specified clearly enough to proceed. | source corpus |
| D-007 | The first deployable slice is pre-AI and pre-book-engine. | accepted | The first slice must prove storage, import, drafts, UI, and ops before advanced features. | canonical planning synthesis |
| D-008 | AI may propose but never silently mutate canonical text. | accepted | This is central to user trust and appears in both source corpora. | both archives |
| D-009 | Heavy AI, ingest, export, and embedding work must be backgrounded. | accepted | Prevents UI blockage and operational instability on the single-host MVP. | source corpus |
| D-010 | Do not start multiple architectural fronts at once. | accepted | Parallel fronts would destabilize the first build and obscure gate failures. | repo governance requirement |
| D-011 | Phase 4 provider env contract uses OpenAI SDK env names. | accepted | The repo had no prior provider wiring; adopting `OPENAI_API_KEY`, `OPENAI_BASE_URL`, and optional `OPENAI_DEFAULT_MODEL` keeps Tooth aligned with the standard OpenAI Python client and avoids invented prefixes. | Phase 4 prep, `backend/app/config.py` |
| D-012 | Phase 5 semantic search stores embeddings as JSON float arrays in PostgreSQL and ranks in application code (bounded scan), not `pgvector`, for the current MVP slice. | accepted | D-005 named pgvector as the longer-term shape; the first Gate 5 implementation prioritizes portability and zero extra DB extensions on small deployments. Revisit when evidence size or latency requires server-side vector indexes. | Phase 5 implementation, `backend/app/retrieval/search.py` |
| D-013 | Phase 6 books use relational outline nodes and explicit raw-text assignments; Markdown export walks that outline and reads file bodies read-only. | accepted | Keeps canonical raw text immutable, preserves assignment integrity, and makes export deterministic from stored objects. | `backend/app/book_export.py`, `backend/app/models.py` |

## Conflict resolutions from source review

### C-001 - Project identity conflict

- Conflict:
  - Source archive describes `Text OS`
  - Repo task requires `Tooth`
- Resolution:
  - `Tooth` is canonical
  - `Text OS` is historical source terminology only

### C-002 - Archive mismatch conflict

- Conflict:
  - `economic_system.zip` is a household-finance backend, not a writing system
- Resolution:
  - Do not merge its product scope
  - Retain only reusable governance patterns such as explicit AI approval and operational runbook rigor

### C-003 - MVP gate ambiguity

- Conflict:
  - The source corpus puts semantic search inside MVP
  - A safe first vertical slice should not begin there
- Resolution:
  - Keep semantic search inside overall MVP
  - Exclude it from the first deployable slice

### C-004 - Roadmap overlap

- Conflict:
  - Source material overlaps roadmap, build order, and risk docs
- Resolution:
  - Canonical planning package compresses those into one phased plan, one gate doc, one decision log, and one open-questions doc

## Deferred decisions

These are intentionally not accepted yet:

- editor framework selection
- queue framework selection
- export renderer selection
- embedding model selection
- final visual design system

They remain open because they need implementation evidence, not because they were forgotten.

## Change rule

Any future decision that changes scope, storage, deployment, AI trust boundaries, or acceptance gates must be recorded here before broader implementation proceeds.
