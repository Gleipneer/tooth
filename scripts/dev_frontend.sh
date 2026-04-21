#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/../frontend"

if [ ! -f ".env" ] && [ -f ".env.example" ]; then
  cp .env.example .env
fi

npm install
npm run dev
