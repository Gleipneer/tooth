#!/usr/bin/env bash
# Gate 7 — backup script runs; optional live health check.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
export DATABASE_URL="${DATABASE_URL:-postgresql://tooth:tooth@127.0.0.1:55432/tooth}"
# Run backup (may skip pg_dump if not installed; still copies data dirs when present).
bash scripts/backup_local.sh

if [ -n "${TOOTH_API_BASE:-}" ]; then
  curl -fsS "${TOOTH_API_BASE%/}/api/v1/healthz" | head -c 500
  echo
fi
