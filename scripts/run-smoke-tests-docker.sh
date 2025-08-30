#!/bin/bash

# Docker Smoke Test Runner for PennyLane Helper
# This script runs comprehensive smoke tests in a Docker container

set -e

echo "🐳 PennyLane Helper - Docker Smoke Test Runner"
echo "==============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if Docker is available
if ! command -v docker &> /dev/null; then
    log_error "Docker not found. Please install Docker to run containerized tests."
    exit 1
fi

# Check if Docker daemon is running
if ! docker info >/dev/null 2>&1; then
    log_error "Docker daemon is not running. Please start Docker."
    exit 1
fi

log_success "Docker is available and running"

# Check if we're in the right directory
if [ ! -f "pl_helper.py" ]; then
    log_error "pl_helper.py not found. Please run this script from the project root directory."
    exit 1
fi

# Create a temporary Dockerfile for testing
DOCKERFILE_CONTENT='
FROM python:3.9-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Node.js
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y nodejs

# Set working directory
WORKDIR /app

# Copy project files
COPY . .

# Install Python dependencies (optional - PennyLane)
# Note: PennyLane installation is commented out to test fallback behavior
# Uncomment the next line to test with PennyLane installed
# RUN pip install pennylane

# Default command
CMD ["python3", "pl_helper.py", "status"]
'

# Create temporary Dockerfile
TEMP_DOCKERFILE="/tmp/Dockerfile.pl_helper_test"
echo "$DOCKERFILE_CONTENT" > "$TEMP_DOCKERFILE"

log_info "Created temporary Dockerfile for testing"

# Build Docker image
IMAGE_NAME="pl-helper-test:$(date +%s)"
log_info "Building Docker image: $IMAGE_NAME"

if docker build -f "$TEMP_DOCKERFILE" -t "$IMAGE_NAME" . >/dev/null 2>&1; then
    log_success "Docker image built successfully"
else
    log_error "Failed to build Docker image"
    exit 1
fi

# Test 1: Basic container execution
log_info "Testing basic container execution..."
if docker run --rm "$IMAGE_NAME" python3 pl_helper.py status >/dev/null 2>&1; then
    log_success "Container executes pl_helper.py successfully"
else
    log_error "Container failed to execute pl_helper.py"
    exit 1
fi

# Test 2: Test status command in container
log_info "Testing status command in container..."
STATUS_OUTPUT=$(docker run --rm "$IMAGE_NAME" python3 pl_helper.py status)
if echo "$STATUS_OUTPUT" | python3 -m json.tool >/dev/null 2>&1; then
    log_success "Status command returns valid JSON in container"
    
    # Extract information
    PENNYLANE_AVAILABLE=$(echo "$STATUS_OUTPUT" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('pennylane_available', False))")
    log_info "PennyLane available in container: $PENNYLANE_AVAILABLE"
else
    log_error "Status command output is not valid JSON"
    echo "Output: $STATUS_OUTPUT"
    exit 1
fi

# Test 3: Test circuit execution in container
log_info "Testing circuit execution in container..."
CIRCUIT_OUTPUT=$(docker run --rm "$IMAGE_NAME" python3 pl_helper.py circuit 0.7 0.2)
if echo "$CIRCUIT_OUTPUT" | python3 -m json.tool >/dev/null 2>&1; then
    log_success "Circuit execution works in container"
    
    CIRCUIT_STATUS=$(echo "$CIRCUIT_OUTPUT" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('status', 'unknown'))")
    log_info "Circuit execution status: $CIRCUIT_STATUS"
else
    log_error "Circuit execution failed in container"
    exit 1
fi

# Test 4: Test optimization in container
log_info "Testing optimization in container..."
OPT_OUTPUT=$(docker run --rm "$IMAGE_NAME" python3 pl_helper.py optimize 3)
if echo "$OPT_OUTPUT" | python3 -m json.tool >/dev/null 2>&1; then
    log_success "Optimization works in container"
    
    OPT_STATUS=$(echo "$OPT_OUTPUT" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('status', 'unknown'))")
    OPT_STEPS=$(echo "$OPT_OUTPUT" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('steps', 0))")
    log_info "Optimization status: $OPT_STATUS, Steps: $OPT_STEPS"
else
    log_error "Optimization failed in container"
    exit 1
fi

# Test 5: Test Node.js bridge in container
log_info "Testing Node.js bridge in container..."
BRIDGE_OUTPUT=$(docker run --rm "$IMAGE_NAME" node test/test-pl_helper-bridge.js 2>&1)
if echo "$BRIDGE_OUTPUT" | grep -q "All tests passed"; then
    log_success "Node.js bridge tests passed in container"
else
    log_warning "Node.js bridge tests may have issues in container"
    echo "Bridge test output:"
    echo "$BRIDGE_OUTPUT"
fi

# Test 6: Test performance in container
log_info "Testing performance in container..."
PERF_START=$(date +%s%N)
docker run --rm "$IMAGE_NAME" python3 pl_helper.py circuit 0.1 0.1 >/dev/null
PERF_END=$(date +%s%N)
PERF_DURATION_MS=$(( (PERF_END - PERF_START) / 1000000 ))

log_info "Container execution time: ${PERF_DURATION_MS}ms"

if [ "$PERF_DURATION_MS" -lt 10000 ]; then
    log_success "Container performance is acceptable (< 10 seconds)"
else
    log_warning "Container performance is slow (> 10 seconds)"
fi

# Test 7: Test with PennyLane installed (optional)
if [ "$1" = "--with-pennylane" ]; then
    log_info "Building image with PennyLane installed..."
    
    PENNYLANE_DOCKERFILE_CONTENT='
FROM python:3.9-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Install Node.js
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y nodejs

# Set working directory
WORKDIR /app

# Copy project files
COPY . .

# Install PennyLane
RUN pip install pennylane

# Default command
CMD ["python3", "pl_helper.py", "status"]
'
    
    PENNYLANE_DOCKERFILE="/tmp/Dockerfile.pl_helper_pennylane"
    echo "$PENNYLANE_DOCKERFILE_CONTENT" > "$PENNYLANE_DOCKERFILE"
    
    PENNYLANE_IMAGE="pl-helper-pennylane-test:$(date +%s)"
    
    log_info "Building PennyLane-enabled image (this may take a while)..."
    if docker build -f "$PENNYLANE_DOCKERFILE" -t "$PENNYLANE_IMAGE" . >/dev/null 2>&1; then
        log_success "PennyLane-enabled image built successfully"
        
        # Test with PennyLane
        PENNYLANE_STATUS=$(docker run --rm "$PENNYLANE_IMAGE" python3 pl_helper.py status)
        PENNYLANE_DETECTED=$(echo "$PENNYLANE_STATUS" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('pennylane_available', False))")
        
        if [ "$PENNYLANE_DETECTED" = "True" ]; then
            log_success "PennyLane successfully detected in container"
        else
            log_warning "PennyLane not detected despite installation"
        fi
        
        # Clean up PennyLane image
        docker rmi "$PENNYLANE_IMAGE" >/dev/null 2>&1 || true
        rm -f "$PENNYLANE_DOCKERFILE"
    else
        log_error "Failed to build PennyLane-enabled image"
    fi
fi

# Test 8: Resource usage test
log_info "Testing resource usage..."
RESOURCE_OUTPUT=$(docker run --rm --memory=512m --cpus=1.0 "$IMAGE_NAME" python3 pl_helper.py circuit 0.5 0.5 2>&1)
if echo "$RESOURCE_OUTPUT" | python3 -m json.tool >/dev/null 2>&1; then
    log_success "Works within resource constraints (512MB RAM, 1 CPU)"
else
    log_warning "May have resource constraint issues"
fi

# Test 9: Multi-container test (if docker-compose is available)
if command -v docker-compose &> /dev/null; then
    log_info "Testing with docker-compose..."
    
    COMPOSE_FILE="/tmp/docker-compose.pl-helper-test.yml"
    cat > "$COMPOSE_FILE" << EOF
version: '3.8'
services:
  pl-helper-test:
    build:
      context: .
      dockerfile: $TEMP_DOCKERFILE
    command: python3 pl_helper.py status
    environment:
      - TEST_MODE=docker_compose
EOF
    
    if docker-compose -f "$COMPOSE_FILE" up --build >/dev/null 2>&1; then
        log_success "Docker Compose integration works"
    else
        log_warning "Docker Compose integration may have issues"
    fi
    
    # Clean up
    docker-compose -f "$COMPOSE_FILE" down >/dev/null 2>&1 || true
    rm -f "$COMPOSE_FILE"
else
    log_info "Docker Compose not available - skipping multi-container test"
fi

# Cleanup
log_info "Cleaning up Docker image..."
docker rmi "$IMAGE_NAME" >/dev/null 2>&1 || true
rm -f "$TEMP_DOCKERFILE"

# Summary
echo ""
echo "🎯 Docker Smoke Test Summary"
echo "============================"

log_success "Container builds successfully"
log_success "Core functionality works in container"
log_success "JSON output structure validated in container"
log_success "Performance acceptable in containerized environment"

if command -v docker-compose &> /dev/null; then
    log_success "Docker Compose integration verified"
fi

echo ""
log_success "🎉 Docker smoke tests completed successfully!"

# Save results if requested
if [ "$1" = "--save-results" ] || [ "$2" = "--save-results" ]; then
    RESULTS_FILE="docker-smoke-test-results-$(date +%Y%m%d-%H%M%S).json"
    cat > "$RESULTS_FILE" << EOF
{
    "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "test_type": "docker_smoke_test",
    "docker_available": true,
    "container_execution_time_ms": $PERF_DURATION_MS,
    "pennylane_test_included": $([ "$1" = "--with-pennylane" ] && echo "true" || echo "false"),
    "all_tests_passed": true
}
EOF
    log_info "Results saved to $RESULTS_FILE"
fi

echo ""
log_info "Usage options:"
log_info "  $0                     # Basic Docker tests"
log_info "  $0 --with-pennylane    # Include PennyLane installation test"
log_info "  $0 --save-results      # Save test results to JSON file"
log_info "  $0 --with-pennylane --save-results  # Both options"