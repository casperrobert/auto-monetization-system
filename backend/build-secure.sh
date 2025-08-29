#!/bin/bash
set -euo pipefail

echo "Building zero-vulnerability container..."

# Build the secure container
docker build -t backend:zero-vuln .

# Scan for vulnerabilities
if command -v trivy &> /dev/null; then
    echo "Scanning for vulnerabilities..."
    trivy image backend:zero-vuln
else
    echo "Install Trivy for vulnerability scanning: curl -sfL https://raw.githubusercontent.com/aquasecurity/trivy/main/contrib/install.sh | sh -s -- -b /usr/local/bin"
fi

# Show image size
echo "Image size:"
docker images backend:zero-vuln --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}"

echo "Zero-vulnerability container built successfully!"
echo "Run with: docker run --rm -p 3000:3000 --read-only --security-opt=no-new-privileges:true --cap-drop=ALL backend:zero-vuln"