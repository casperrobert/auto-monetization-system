#!/usr/bin/env bash
set -euo pipefail
BASE="http://localhost:3000"
echo "🔐 Security-Check – $(date -Is)"
echo "1) Header (/)"; curl -s -D - "$BASE/" -o /dev/null | sed -n '1,20p'
echo
echo "2) Health"; curl -s "$BASE/api/health"; echo
echo "3) Quantum-Health"; curl -s "$BASE/api/quantum/health"; echo
echo "4) Quantum-Execute (Demo)"; curl -s -X POST "$BASE/api/quantum/execute" -H 'content-type: application/json' -d '{"demo":true}'; echo
echo
test -f .csp.log && { echo "5) Letzte CSP-Reports:"; tail -n 5 .csp.log; echo; } || true
echo "6) Server-Logs (tail):"; tail -n 50 .server.log || true
echo "✅ Fertig."
