#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
DATA_DIR="$ROOT_DIR/.pg-local/data"

if [ -d "$DATA_DIR" ]; then
  /usr/lib/postgresql/14/bin/pg_ctl -D "$DATA_DIR" stop
else
  echo "No local PostgreSQL cluster found at $DATA_DIR"
fi
