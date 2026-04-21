# Runtime cost and capacity guardrails

This document captures the active runtime guardrails for Tooth MVP operation.

## AI routing and bounded execution

Tooth uses cheap-first routing with optional escalation:

- cheap path model: `OPENAI_CHEAP_MODEL`
- expensive path model: `OPENAI_EXPENSIVE_MODEL` (or `OPENAI_DEFAULT_MODEL` fallback)
- bounded cheap rounds: `AI_MAX_CHEAP_ROUNDS`

Context is bounded per request:

- `AI_MAX_CONTEXT_CHARS`
- `AI_MAX_USER_MESSAGE_CHARS`

Optional retrieval snippets are bounded:

- `AI_RETRIEVAL_MAX_HITS`
- `AI_RETRIEVAL_EXCERPT_CHARS`

## Search and ingestion guardrails

- `SEARCH_MAX_RESULTS`
- `SEMANTIC_SCAN_MAX_RAW_TEXTS`
- `EMBEDDING_MAX_CHARS`
- `PASTE_MAX_CHARS`

All retrieval and ingest behavior remains project-scoped and explicit-apply for writes to canonical text objects.

## Provider compatibility guardrail

The OpenAI client supports provider variants that reject `max_tokens` by retrying with `max_completion_tokens`. This behavior must not regress because it is part of real-world runtime reliability.

## Capacity posture

- Keep heavy operations bounded and inspectable.
- Do not dump unbounded corpus context into expensive model calls.
- Keep the operator loop simple: visible health, explicit status, recoverable restart.

## Operational checks

Before declaring runtime green:

1. `tooth status` shows live backend/frontend/operator health.
2. API health endpoint responds.
3. Core test/build checks pass:
   - backend: `ruff`, `pytest`
   - frontend: `npm test`, `npm run build`
4. If AI runtime is required for the run, verify `OPENAI_API_KEY` presence without printing value.

## Never-allow list

- Never expose secret values in logs, docs, or CLI output.
- Never silently auto-apply AI output to canonical text.
- Never mark healthy if live probes fail.
- Never bypass bounded context rules to “get better answers.”
