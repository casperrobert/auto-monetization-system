#!/usr/bin/env bash
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

echo "Running smoke tests from $ROOT_DIR"

echo "1) providers smoke"
node test/test-providers-smoke.js || true

echo "2) translator smoke"
node test/test-quantum-translator.js || true

echo "3) translator->ibm smoke"
node test/test-translator-to-ibm.js || true

echo "All smoke scripts finished (some may have used simulator fallbacks)."

echo "If you want to test PennyLane bridge, ensure you installed requirements:"
echo "  python3 -m venv .venv && . .venv/bin/activate && pip install -r backend/quantum/requirements.txt"
echo "then run: node test/test-pennylane-helper.js"
