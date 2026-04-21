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

cd ..
bash scripts/start_local_postgres.sh
cd backend
export DATABASE_URL="${TOOTH_DATABASE_URL:-postgresql+psycopg://tooth:tooth@127.0.0.1:55432/tooth}"

alembic upgrade head
uvicorn app.main:app --reload
