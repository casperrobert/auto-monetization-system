#!/bin/bash
# Sicherer Start des Containers mit JWT_SECRET

IMAGE_NAME="ams-backend"
CONTAINER_NAME="ams-backend-secure"
JWT_SECRET="your_secret_here"

# Container starten
docker run -d --name $CONTAINER_NAME -e JWT_SECRET=$JWT_SECRET -p 3000:3000 $IMAGE_NAME

echo "Sicherer Container gestartet mit JWT_SECRET"
#!/bin/bash
set -euo pipefail

# Maximale Container-Sicherheit
docker run -d \
  --name secure-backend \
  --security-opt=no-new-privileges:true \
  --security-opt=seccomp=security-policy.json \
  --cap-drop=ALL \
  --cap-add=NET_BIND_SERVICE \
  --read-only \
  --tmpfs /tmp:noexec,nosuid,size=100m \
  --tmpfs /var/run:noexec,nosuid,size=50m \
  --memory=512m \
  --cpus=0.5 \
  --pids-limit=100 \
  --ulimit nofile=1024:2048 \
  --ulimit nproc=50:100 \
  --network=none \
  --user=65532:65532 \
  --restart=unless-stopped \
  --env NODE_ENV=production \
  --env JWT_SECRET="${JWT_SECRET}" \
  --health-cmd="node healthcheck.js" \
  --health-interval=30s \
  --health-timeout=3s \
  --health-retries=3 \
  backend:secure

echo "Sicherer Container gestartet mit maximaler Härtung"