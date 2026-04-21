#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/../backend"

if [ ! -d ".venv" ]; then
  python3 -m venv .venv
fi

source .venv/bin/activate
python -m pip install --upgrade pip
python -m pip install -r requirements-dev.txt

if [ ! -f ".env" ] && [ -f ".env.example" ]; then
  cp .env.example .env
fi

alembic upgrade head
uvicorn app.main:app --reload
