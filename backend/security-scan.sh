#!/bin/bash
# Security-Scan für das Backend-Image

IMAGE_NAME="ams-backend"

# Trivy muss installiert sein: https://aquasecurity.github.io/trivy/
trivy image $IMAGE_NAME

echo "Security-Scan abgeschlossen. Siehe oben für Ergebnisse."
#!/bin/bash
set -euo pipefail

echo "=== Container Security Scan ==="

# Trivy Vulnerability Scan
if command -v trivy &> /dev/null; then
    echo "Scanning for vulnerabilities..."
    trivy image backend:secure
else
    echo "Trivy not installed. Install with: curl -sfL https://raw.githubusercontent.com/aquasecurity/trivy/main/contrib/install.sh | sh -s -- -b /usr/local/bin"
fi

# Docker Bench Security
if [ -f docker-bench-security.sh ]; then
    echo "Running Docker Bench Security..."
    ./docker-bench-security.sh
else
    echo "Download Docker Bench: git clone https://github.com/docker/docker-bench-security.git"
fi

# Container Runtime Security Check
echo "=== Runtime Security Status ==="
docker inspect secure-backend --format='{{json .HostConfig.SecurityOpt}}' | jq .
docker inspect secure-backend --format='{{json .HostConfig.CapDrop}}' | jq .
docker inspect secure-backend --format='{{json .HostConfig.ReadonlyRootfs}}'

echo "Security scan completed."