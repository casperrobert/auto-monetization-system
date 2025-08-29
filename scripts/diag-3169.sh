#!/usr/bin/env bash
PORT=${PORT:-3169}
echo "Pinge http://localhost:$PORT ..."
for i in {1..20}; do
  code=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:$PORT/api/health || true)
  if [ "$code" = "200" ]; then
    echo "✅ Server OK (/:$PORT)"
    curl -s http://localhost:$PORT/api/health; echo
    curl -s http://localhost:$PORT/api/quantum/health; echo
    curl -s -X POST http://localhost:$PORT/api/quantum/execute; echo
    curl -s http://localhost:$PORT/api/courses; echo
    exit 0
  fi
  sleep 1
done
echo "❌ Keine Antwort auf Port $PORT"
exit 1
