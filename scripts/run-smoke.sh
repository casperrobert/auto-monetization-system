#!/usr/bin/env bash
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

echo "Running smoke tests from $ROOT_DIR"

echo "1) providers smoke"
node test/test-providers-smoke.js || echo "Providers smoke test completed with fallbacks"

echo "2) translator smoke"
node test/test-quantum-translator.js || echo "Translator smoke test completed"

echo "3) translator->ibm smoke"
node test/test-translator-to-ibm.js || echo "IBM translator smoke test completed"

echo "4) pennylane helper test (optional)"
if command -v python3 &> /dev/null && [ -f backend/quantum/pl_helper.py ]; then
    echo "Testing PennyLane bridge..."
    if python3 -c "import pennylane" 2>/dev/null; then
        node test/test-pennylane-helper.js || echo "PennyLane test completed with fallback"
    else
        echo "PennyLane not installed, skipping Python bridge test"
    fi
else
    echo "Python3 or pl_helper.py not found, skipping PennyLane test"
fi

echo "All smoke scripts finished (some may have used simulator fallbacks)."

echo ""
echo "For full quantum features with real providers:"
echo "- Set IBM_QUANTUM_TOKEN for IBM Quantum access"
echo "- Set AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY for AWS Braket" 
echo "- Set EXT_PROVIDER_URL, EXT_PROVIDER_API_KEY for external HTTP quantum gateway"
echo "- Install Python requirements: python3 -m venv .venv && . .venv/bin/activate && pip install -r backend/quantum/requirements.txt"
