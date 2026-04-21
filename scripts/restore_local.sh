#!/usr/bin/env bash
set -euo pipefail

if [ $# -ne 1 ]; then
  echo "Usage: $0 <backup-dir>" >&2
  exit 1
fi

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
BACKUP_DIR="$1"
PG_BIN="/usr/lib/postgresql/14/bin"
PG_DIR="$ROOT_DIR/.pg-local"
RESTORE_HOST="${RESTORE_HOST:-127.0.0.1}"
RESTORE_PORT="${RESTORE_PORT:-55432}"
RESTORE_USER="${RESTORE_USER:-tooth}"
RESTORE_PASSWORD="${RESTORE_PASSWORD:-tooth}"
ADMIN_SOCKET_HOST="${ADMIN_SOCKET_HOST:-$PG_DIR}"
ADMIN_USER="${ADMIN_USER:-postgres}"

if [ ! -d "$BACKUP_DIR" ]; then
  echo "Backup directory not found: $BACKUP_DIR" >&2
  exit 1
fi

"$ROOT_DIR/scripts/start_local_postgres.sh"

if [ -f "$BACKUP_DIR/tooth.sql" ]; then
  "$PG_BIN/psql" -h "$ADMIN_SOCKET_HOST" -p "$RESTORE_PORT" -U "$ADMIN_USER" -d postgres -c "DROP DATABASE IF EXISTS tooth_restore;"
  "$PG_BIN/psql" -h "$ADMIN_SOCKET_HOST" -p "$RESTORE_PORT" -U "$ADMIN_USER" -d postgres -c "CREATE DATABASE tooth_restore OWNER tooth;"
  PGPASSWORD="$RESTORE_PASSWORD" "$PG_BIN/psql" -h "$RESTORE_HOST" -p "$RESTORE_PORT" -U "$RESTORE_USER" -d tooth_restore -f "$BACKUP_DIR/tooth.sql"
fi

rm -rf "$ROOT_DIR/data/restore_check"
mkdir -p "$ROOT_DIR/data/restore_check"

if [ -d "$BACKUP_DIR/raw" ]; then
  cp -R "$BACKUP_DIR/raw" "$ROOT_DIR/data/restore_check/raw"
fi

if [ -d "$BACKUP_DIR/drafts" ]; then
  cp -R "$BACKUP_DIR/drafts" "$ROOT_DIR/data/restore_check/drafts"
fi

echo "Restore rehearsal completed using $BACKUP_DIR"
