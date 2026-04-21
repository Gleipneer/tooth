#!/usr/bin/env bash
# Gate 6 — book outline + deterministic Markdown export (automated proof).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT/backend"
if [ -d .venv ]; then
  # shellcheck disable=SC1091
  source .venv/bin/activate
fi
ruff check app tests
pytest -q
