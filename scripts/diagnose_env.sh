#!/usr/bin/env bash
set -euo pipefail

OUT=/tmp/ams_env_diag.txt
rm -f "$OUT"
exec > >(tee -a "$OUT") 2>&1

echo "=== AMS Environment Diagnostic ==="
echo "Date: $(date -u)"
echo "CWD: $(pwd)"

echo "--- Basic filesystem check ---"
ls -la . || echo "ls failed"
stat . || echo "stat failed"

echo "--- Project files ---"
if [ -f package.json ]; then
  echo "package.json present"
else
  echo "package.json not found in CWD"
fi

echo "--- Node/NPM ---"
command -v node >/dev/null 2>&1 && node -v || echo "node not found"
command -v npm >/dev/null 2>&1 && npm -v || echo "npm not found"

echo "--- Git ---"
command -v git >/dev/null 2>&1 || echo "git not found"
set +e
git rev-parse --is-inside-work-tree 2>/dev/null
GIT_TREE=$?
set -e
if [ $GIT_TREE -eq 0 ]; then
  echo "Git: inside work tree"
  set +e
  git status -s || echo "git status failed"
  set -e
else
  echo "Git: not inside work tree or git unreachable"
fi

echo "--- Docker ---"
command -v docker >/dev/null 2>&1 && docker -v || echo "docker not found"

echo "--- Python & PennyLane ---"
command -v python3 >/dev/null 2>&1 && python3 --version || echo "python3 not found"
set +e
python3 - <<'PY'
import sys
try:
    import pennylane as pl
    print('PennyLane import: OK, version', pl.__version__)
except Exception as e:
    print('PennyLane import failed:', repr(e))
    sys.exit(2)
PY
PY_EXIT=$?
set -e
if [ $PY_EXIT -ne 0 ]; then
  echo "PennyLane not available or import failed"
fi

echo "--- PL helper file ---"
if [ -f backend/quantum/pl_helper.py ]; then
  echo "pl_helper.py exists"
else
  echo "pl_helper.py missing"
fi

echo "--- ENOPRO detection ---"
# Try a small fs write
TMP_TEST=/tmp/ams_fs_test.txt
set +e
printf "test" > "$TMP_TEST" 2>/dev/null
WRITE_EXIT=$?
set -e
if [ $WRITE_EXIT -ne 0 ]; then
  echo "FS write test FAILED (possible ENOPRO or restricted FS): exit=$WRITE_EXIT"
else
  echo "FS write test OK"
  rm -f "$TMP_TEST" || true
fi

echo "--- Summary file ---"
echo "Diagnostic saved to $OUT"

exit 0
