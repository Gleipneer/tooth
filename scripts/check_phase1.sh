#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(dirname "$0")/.."

cd "$ROOT_DIR/backend"
if [ ! -d ".venv" ]; then
  python3 -m venv .venv
fi

source .venv/bin/activate
python -m pip install -r requirements-dev.txt
pytest

cd "$ROOT_DIR/frontend"
npm install
npm run test -- --run
