#!/bin/bash
set -e
echo "=== Automoney Pro (macOS) startet ==="
echo "Voraussetzung: Docker Desktop muss laufen."
DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$DIR/deploy"
docker compose -f docker-compose.tunnel.yml up -d redis backend frontend
open "http://localhost:3000" || true
echo "Fertig. Zum Beenden Doppelklick auf 'Stop_macOS.command'."
