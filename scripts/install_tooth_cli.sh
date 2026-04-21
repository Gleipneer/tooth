#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="$ROOT/scripts/tooth"
TARGET_DIR="${1:-$HOME/.local/bin}"
TARGET="$TARGET_DIR/tooth"

mkdir -p "$TARGET_DIR"
ln -sf "$SRC" "$TARGET"
chmod +x "$SRC"

echo "Installed: $TARGET -> $SRC"
echo "Ensure $TARGET_DIR is on PATH."
