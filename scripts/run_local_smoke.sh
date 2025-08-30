#!/usr/bin/env bash
set -euo pipefail

# run_local_smoke.sh
# Usage: ./scripts/run_local_smoke.sh [--docker]
# - without args: runs `npm ci` and `npm run smoke:all` locally
# - with --docker: builds the smoke Docker image and runs smoke tests inside container

DOCKER_MODE=0
if [ "${1:-}" = "--docker" ]; then
  DOCKER_MODE=1
fi

echo "Running local smoke test script (Docker mode: ${DOCKER_MODE})"

# Basic environment checks
command -v node >/dev/null 2>&1 || { echo "node not found in PATH"; exit 2; }
command -v npm >/dev/null 2>&1 || { echo "npm not found in PATH"; exit 2; }

# Detect Codespaces-like FS restriction early
set +e
git status -s >/dev/null 2>&1
GIT_STATUS_EXIT=$?
set -e
if [ "$GIT_STATUS_EXIT" -ne 0 ]; then
  echo "Warning: git status failed. If you see ENOPRO (no filesystem provider) this environment is restricted. Run this script locally on your machine or in CI."
fi

# Install packages
echo "Installing Node dependencies (npm ci)..."
npm ci --prefer-offline --no-audit --no-fund || npm i --no-audit --no-fund

# Run smoke tests locally
echo "Running smoke tests: npm run smoke:all"
npm run smoke:all || {
  echo "Smoke tests failed. Inspect logs above. If native SDKs are required, try with --docker.";
}

if [ "$DOCKER_MODE" -eq 1 ]; then
  command -v docker >/dev/null 2>&1 || { echo "docker not found in PATH"; exit 3; }
  echo "Building Docker smoke image..."
  docker build -t ams-smoke:latest . || echo "Docker build failed (best-effort)"
  echo "Running smoke tests inside Docker container (best-effort)..."
  docker run --rm -e IBM_QUANTUM_TOKEN="${IBM_QUANTUM_TOKEN:-}" -e PL_HELPER="/app/backend/quantum/pl_helper.py" ams-smoke:latest /bin/sh -c "npm run smoke:all || true"
fi

echo "Done. If you need help interpreting test output, paste the logs here and I'll analyze them." 
