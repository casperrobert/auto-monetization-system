set -e

PORT=${PORT:-3000}
URL="http://localhost:${PORT}"

echo "⛔ stoppe evtl. laufende Server & räume Port ${PORT} frei…"
pkill -f "node .*index.js" 2>/dev/null || true
npx --yes kill-port "${PORT}" >/dev/null 2>&1 || true

echo "▶️  starte Server im Hintergrund…"
NODE_OPTIONS="--max-old-space-size=256" node index.js > .server.log 2>&1 &
PID=$!

# warte bis /api/health antwortet (max ~6s)
for i in {1..20}; do
  if curl -s "${URL}/api/health" >/dev/null 2>&1; then break; fi
  sleep 0.3
done

# In Codespaces klickbare URL bauen
if [ "${CODESPACES-}" = "true" ] && [ -n "${CODESPACE_NAME-}" ]; then
  URL="https://${CODESPACE_NAME}-${PORT}.app.github.dev"
fi

echo
echo "✅ Dashboard-Link:"
echo "   ${URL}/dashboard.html"
echo
echo "🔎 Health:"
if ! curl -fsS "${URL}/api/health"; then
  echo
  echo "⚠️  Health nicht erreichbar – Log-Auszug:"
  tail -n 80 .server.log || true
fi

echo
echo "👉 Öffne den Link mit CMD+Klick (Mac) bzw. STRG+Klick (Win/Linux)."
