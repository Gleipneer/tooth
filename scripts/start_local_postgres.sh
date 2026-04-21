#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
PG_DIR="$ROOT_DIR/.pg-local"
DATA_DIR="$PG_DIR/data"
BIN_DIR="/usr/lib/postgresql/14/bin"
LOG_FILE="$PG_DIR/postgres.log"

mkdir -p "$PG_DIR"

if [ ! -d "$DATA_DIR/base" ]; then
  "$BIN_DIR/initdb" -D "$DATA_DIR" -U postgres --auth-local trust --auth-host scram-sha-256
  printf "\nlisten_addresses = '127.0.0.1'\nport = 55432\nunix_socket_directories = '%s'\n" "$PG_DIR" >> "$DATA_DIR/postgresql.conf"
fi

if ! "$BIN_DIR/pg_isready" -h 127.0.0.1 -p 55432 >/dev/null 2>&1; then
  "$BIN_DIR/pg_ctl" -D "$DATA_DIR" -l "$LOG_FILE" start
fi

"$BIN_DIR/psql" -h "$PG_DIR" -p 55432 -U postgres -d postgres -tc "SELECT 1 FROM pg_roles WHERE rolname = 'tooth'" | grep -q 1 || \
  "$BIN_DIR/psql" -h "$PG_DIR" -p 55432 -U postgres -d postgres -c "CREATE USER tooth WITH PASSWORD 'tooth';"

"$BIN_DIR/psql" -h "$PG_DIR" -p 55432 -U postgres -d postgres -tc "SELECT 1 FROM pg_database WHERE datname = 'tooth'" | grep -q 1 || \
  "$BIN_DIR/createdb" -h "$PG_DIR" -p 55432 -U postgres -O tooth tooth

echo "Local PostgreSQL ready on 127.0.0.1:55432"
