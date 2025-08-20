#!/usr/bin/env bash
set -euo pipefail

BASE="http://localhost:3000"

pp() {
  if command -v jq >/dev/null 2>&1; then jq; else cat; fi
}

echo "=== Server Health ==="
curl -s "${BASE}/api/health" | pp
echo

echo "=== Quantum Health ==="
curl -s "${BASE}/api/quantum/health" | pp
echo

echo "=== Quantum Execute (Demo) ==="
curl -s -X POST "${BASE}/api/quantum/execute" \
  -H 'content-type: application/json' \
  -d '{"demo":true}' | pp
echo
