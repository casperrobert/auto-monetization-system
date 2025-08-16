#!/bin/bash
set -e
DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$DIR/deploy"
docker compose -f docker-compose.tunnel.yml down
echo "Automoney Pro gestoppt."
