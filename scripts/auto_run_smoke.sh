#!/usr/bin/env bash
set -euo pipefail

# auto_run_smoke.sh
# Finds the auto-monetization-system project directory under /workspaces and runs the smoke helper

CANDIDATE="/workspaces/auto-monetization-system"
if [ -d "$CANDIDATE" ]; then
  REPO="$CANDIDATE"
else
  # Fallback: search for a package.json with the repo name
  REPO=""
  while IFS= read -r -d $'\0' file; do
    if grep -q '"name"\s*:\s*"auto-monetization-system"' "$file" 2>/dev/null; then
      REPO=$(dirname "$file")
      break
    fi
  done < <(find /workspaces -maxdepth 4 -type f -name package.json -print0 2>/dev/null)
fi

if [ -z "$REPO" ]; then
  echo "Project directory not found under /workspaces. Please run from your project root or pass the path as the first argument."
  echo "Usage: $0 [path-to-repo]"
  exit 3
fi

echo "Found repo at: $REPO"
cd "$REPO"

echo "Running: ./scripts/run_local_smoke.sh $*"
./scripts/run_local_smoke.sh "$@"

exit 0
