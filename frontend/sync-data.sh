#!/usr/bin/env bash
# Sync the project-level `data/` into `frontend/data/` so the static
# site can fetch JSON via relative paths (`./data/...`).
#
# Run from the project root:
#   bash frontend/sync-data.sh
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

SRC="$PROJECT_ROOT/data"
DST="$SCRIPT_DIR/data"

if [[ ! -d "$SRC" ]]; then
  echo "Source data folder not found: $SRC" >&2
  exit 1
fi

mkdir -p "$DST"
rm -rf "$DST"/*
cp -R "$SRC"/. "$DST"/

echo "Synced $SRC -> $DST"
