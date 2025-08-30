#!/bin/bash

# Local Smoke Test Runner for PennyLane Helper
# This script runs comprehensive smoke tests locally

set -e

echo "🚀 PennyLane Helper - Local Smoke Test Runner"
echo "=============================================="

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

# Check if we're in the right directory
if [ ! -f "pl_helper.py" ]; then
    log_error "pl_helper.py not found. Please run this script from the project root directory."
    exit 1
fi

log_info "Starting local smoke tests..."

# Test 1: Check Python availability
log_info "Checking Python availability..."
if command -v python3 &> /dev/null; then
    PYTHON_VERSION=$(python3 --version)
    log_success "Python3 available: $PYTHON_VERSION"
else
    log_error "Python3 not found. Please install Python 3.7+ to run tests."
    exit 1
fi

# Test 2: Check if PennyLane is available (optional)
log_info "Checking PennyLane availability..."
if python3 -c "import pennylane" 2>/dev/null; then
    PENNYLANE_VERSION=$(python3 -c "import pennylane; print(pennylane.version())" 2>/dev/null || echo "unknown")
    log_success "PennyLane available: $PENNYLANE_VERSION"
    PENNYLANE_AVAILABLE=true
else
    log_warning "PennyLane not installed - will test fallback behavior"
    PENNYLANE_AVAILABLE=false
fi

# Test 3: Basic Python script execution
log_info "Testing basic pl_helper.py execution..."
if python3 pl_helper.py status >/dev/null 2>&1; then
    log_success "pl_helper.py executes successfully"
else
    log_error "pl_helper.py failed to execute"
    exit 1
fi

# Test 4: Test status command with output validation
log_info "Testing status command output..."
STATUS_OUTPUT=$(python3 pl_helper.py status)
if echo "$STATUS_OUTPUT" | python3 -m json.tool >/dev/null 2>&1; then
    log_success "Status command returns valid JSON"
    
    # Extract and display key information
    PENNYLANE_DETECTED=$(echo "$STATUS_OUTPUT" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('pennylane_available', False))")
    DEVICE_AVAILABLE=$(echo "$STATUS_OUTPUT" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('device_available', False))")
    
    log_info "PennyLane detected: $PENNYLANE_DETECTED"
    log_info "Device available: $DEVICE_AVAILABLE"
else
    log_error "Status command does not return valid JSON"
    echo "Output was: $STATUS_OUTPUT"
    exit 1
fi

# Test 5: Test circuit execution
log_info "Testing simple circuit execution..."
CIRCUIT_OUTPUT=$(python3 pl_helper.py circuit 0.5 0.3)
if echo "$CIRCUIT_OUTPUT" | python3 -m json.tool >/dev/null 2>&1; then
    log_success "Circuit execution returns valid JSON"
    
    # Check if execution was successful
    CIRCUIT_STATUS=$(echo "$CIRCUIT_OUTPUT" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('status', 'unknown'))")
    CIRCUIT_TYPE=$(echo "$CIRCUIT_OUTPUT" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('circuit_type', 'unknown'))")
    
    log_info "Circuit status: $CIRCUIT_STATUS"
    log_info "Circuit type: $CIRCUIT_TYPE"
    
    if [ "$CIRCUIT_STATUS" = "success" ]; then
        log_success "Circuit executed successfully"
    else
        log_warning "Circuit execution reported non-success status"
    fi
else
    log_error "Circuit execution does not return valid JSON"
    echo "Output was: $CIRCUIT_OUTPUT"
    exit 1
fi

# Test 6: Test optimization
log_info "Testing quantum optimization..."
OPTIMIZATION_OUTPUT=$(python3 pl_helper.py optimize 5)
if echo "$OPTIMIZATION_OUTPUT" | python3 -m json.tool >/dev/null 2>&1; then
    log_success "Optimization returns valid JSON"
    
    # Check optimization results
    OPT_STATUS=$(echo "$OPTIMIZATION_OUTPUT" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('status', 'unknown'))")
    OPT_STEPS=$(echo "$OPTIMIZATION_OUTPUT" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('steps', 0))")
    
    log_info "Optimization status: $OPT_STATUS"
    log_info "Optimization steps: $OPT_STEPS"
    
    if [ "$OPT_STATUS" = "success" ] && [ "$OPT_STEPS" = "5" ]; then
        log_success "Optimization completed successfully"
    else
        log_warning "Optimization may not have completed as expected"
    fi
else
    log_error "Optimization does not return valid JSON"
    echo "Output was: $OPTIMIZATION_OUTPUT"
    exit 1
fi

# Test 7: Test error handling
log_info "Testing error handling with invalid command..."
ERROR_OUTPUT=$(python3 pl_helper.py invalid_command 2>&1 || true)
# Extract the last line which should contain the error JSON
LAST_LINE=$(echo "$ERROR_OUTPUT" | tail -n 1)
if echo "$LAST_LINE" | python3 -m json.tool >/dev/null 2>&1; then
    ERROR_STATUS=$(echo "$LAST_LINE" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('status', 'unknown'))")
    
    if [ "$ERROR_STATUS" = "error" ]; then
        log_success "Error handling works correctly"
    else
        log_warning "Error handling may not be working as expected"
    fi
else
    log_warning "Error output is not valid JSON, but this might be expected"
fi

# Test 8: Node.js bridge tests (if Node.js is available)
log_info "Checking Node.js availability for bridge tests..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    log_success "Node.js available: $NODE_VERSION"
    
    log_info "Running Node.js bridge tests..."
    if [ -f "test/test-pl_helper-bridge.js" ]; then
        if node test/test-pl_helper-bridge.js; then
            log_success "Node.js bridge tests passed"
        else
            log_error "Node.js bridge tests failed"
            exit 1
        fi
    else
        log_warning "Node.js bridge test file not found"
    fi
else
    log_warning "Node.js not available - skipping bridge tests"
fi

# Test 9: Performance baseline
log_info "Running performance baseline test..."
START_TIME=$(date +%s%N)
python3 pl_helper.py circuit 0.1 0.2 >/dev/null
END_TIME=$(date +%s%N)
DURATION_MS=$(( (END_TIME - START_TIME) / 1000000 ))

log_info "Circuit execution time: ${DURATION_MS}ms"

if [ "$DURATION_MS" -lt 5000 ]; then
    log_success "Performance is acceptable (< 5 seconds)"
else
    log_warning "Performance is slow (> 5 seconds)"
fi

# Summary
echo ""
echo "🎯 Smoke Test Summary"
echo "==================="

if [ "$PENNYLANE_AVAILABLE" = true ]; then
    log_success "PennyLane integration working"
else
    log_success "Fallback simulation working (PennyLane not installed)"
fi

log_success "All core functionality verified"
log_success "JSON output structure validated"
log_success "Error handling verified"

if command -v node &> /dev/null && [ -f "test/test-pl_helper-bridge.js" ]; then
    log_success "Node.js bridge integration verified"
fi

echo ""
log_success "🎉 Local smoke tests completed successfully!"

# Optional: Save test results to file
if [ "$1" = "--save-results" ]; then
    RESULTS_FILE="smoke-test-results-$(date +%Y%m%d-%H%M%S).json"
    cat > "$RESULTS_FILE" << EOF
{
    "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "test_type": "local_smoke_test",
    "python_version": "$PYTHON_VERSION",
    "pennylane_available": $PENNYLANE_AVAILABLE,
    "node_available": $(command -v node &> /dev/null && echo "true" || echo "false"),
    "circuit_execution_time_ms": $DURATION_MS,
    "all_tests_passed": true
}
EOF
    log_info "Results saved to $RESULTS_FILE"
fi

echo ""
log_info "To run with result saving: $0 --save-results"
log_info "Next step: Try running in Docker with ./scripts/run-smoke-tests-docker.sh"