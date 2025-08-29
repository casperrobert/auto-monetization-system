#!/bin/bash
set -euo pipefail

echo "🔎 CASPER SYSTEM 24 – Systemcheck"
echo "📂 Projekt   : $(basename "$PWD")"
echo "🕒 Zeit      : $(date -Is)"
echo

echo "🧾 .env-Datei:"
grep -E '^(PORT|MOCK_MODE|USE_QUANTUM)=' .env || echo "(keine .env gefunden)"
echo

echo "🧰 Versionen:"
node -v
npm -v
echo

echo "📦 package.json (Scripts):"
jq '.scripts' package.json || echo "(keine gefunden)"
echo

echo "📁 Dateien:"
ls -1 src/ public/ models/ 2>/dev/null || echo "(Ordner leer oder fehlt)"
echo

echo "🔌 Ports (laufend):"
ss -tulnp | grep 3000 || echo "(Port 3000 nicht aktiv)"
echo

echo "🌐 API-Test:"
curl -s http://localhost:3000/api/health || echo "(kein Server aktiv)"
