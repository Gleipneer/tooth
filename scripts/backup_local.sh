#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
STAMP="$(date +%Y%m%d_%H%M%S)"
BACKUP_DIR="$ROOT_DIR/data/backups/$STAMP"
DATABASE_URL="${DATABASE_URL:-postgresql://tooth:tooth@127.0.0.1:55432/tooth}"

mkdir -p "$BACKUP_DIR"

if command -v pg_dump >/dev/null 2>&1; then
  pg_dump "$DATABASE_URL" > "$BACKUP_DIR/tooth.sql"
else
  echo "pg_dump not found; skipping database dump" >&2
fi

if [ -d "$ROOT_DIR/data/raw" ]; then
  cp -R "$ROOT_DIR/data/raw" "$BACKUP_DIR/raw"
fi

if [ -d "$ROOT_DIR/data/drafts" ]; then
  cp -R "$ROOT_DIR/data/drafts" "$BACKUP_DIR/drafts"
fi

echo "Backup written to $BACKUP_DIR"
