/**
 * Test suite for PennyLane Helper Bridge
 * 
 * This file tests the Node.js bridge to the Python pl_helper module.
 * It verifies that the bridge can communicate with the Python script
 * and handle both success and error cases gracefully.
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

class PLHelperBridge {
    constructor() {
        this.pythonPath = 'python3';
        this.scriptPath = path.join(__dirname, '..', 'pl_helper.py');
    }

    /**
     * Execute a Python command and return parsed JSON result
     * @param {string} command - Command to execute  
     * @param {...string} args - Additional arguments
     * @returns {Promise<Object>} Parsed JSON response
     */
    async execute(command, ...args) {
        return new Promise((resolve, reject) => {
            const pythonArgs = [this.scriptPath, command, ...args];
            const python = spawn(this.pythonPath, pythonArgs);

            let stdout = '';
            let stderr = '';

            python.stdout.on('data', (data) => {
                stdout += data.toString();
            });

            python.stderr.on('data', (data) => {
                stderr += data.toString();
            });

            python.on('close', (code) => {
                try {
                    // Try to parse stdout first
                    if (stdout.trim()) {
                        const result = JSON.parse(stdout.trim());
                        resolve(result);
                        return;
                    }

                    // If no stdout, try stderr for error messages
                    if (stderr.trim()) {
                        const lines = stderr.trim().split('\n');
                        const lastLine = lines[lines.length - 1];
                        try {
                            const errorResult = JSON.parse(lastLine);
                            resolve(errorResult);
                            return;
                        } catch (e) {
                            // If stderr isn't JSON, create error object
                            resolve({
                                status: 'error',
                                message: 'Failed to parse Python output',
                                stderr: stderr.trim(),
                                exit_code: code
                            });
                            return;
                        }
                    }

                    // No output at all
                    resolve({
                        status: 'error',
                        message: 'No output from Python script',
                        exit_code: code
                    });

                } catch (error) {
                    reject(new Error(`Failed to parse Python output: ${error.message}`));
                }
            });

            python.on('error', (error) => {
                reject(new Error(`Failed to start Python process: ${error.message}`));
            });
        });
    }

    /**
     * Get the status of the PennyLane helper
     * @returns {Promise<Object>} Status object
     */
    async getStatus() {
        return this.execute('status');
    }

    /**
     * Execute a simple quantum circuit
     * @param {number[]} params - Circuit parameters
     * @returns {Promise<Object>} Circuit execution result
     */
    async runCircuit(params = null) {
        if (params && Array.isArray(params)) {
            return this.execute('circuit', ...params.map(String));
        }
        return this.execute('circuit');
    }

    /**
     * Run quantum optimization
     * @param {number} steps - Number of optimization steps
     * @returns {Promise<Object>} Optimization result
     */
    async runOptimization(steps = 10) {
        return this.execute('optimize', String(steps));
    }
}

// Test helper functions
function assert(condition, message) {
    if (!condition) {
        throw new Error(`Assertion failed: ${message}`);
    }
}

function assertExists(obj, property, message = null) {
    assert(obj.hasOwnProperty(property), message || `Property '${property}' should exist`);
}

function assertType(value, expectedType, message = null) {
    assert(typeof value === expectedType, message || `Expected type '${expectedType}', got '${typeof value}'`);
}

// Test suite
async function runTests() {
    console.log('🧪 Starting PennyLane Helper Bridge Tests...\n');
    
    const bridge = new PLHelperBridge();
    let testsPassed = 0;
    let testsFailed = 0;

    // Helper function to run individual test
    async function runTest(name, testFn) {
        process.stdout.write(`  📋 ${name}... `);
        try {
            await testFn();
            console.log('✅ PASS');
            testsPassed++;
        } catch (error) {
            console.log('❌ FAIL');
            console.log(`     Error: ${error.message}`);
            testsFailed++;
        }
    }

    // Test 1: Python script exists
    await runTest('Python script exists', async () => {
        assert(fs.existsSync(bridge.scriptPath), 'pl_helper.py should exist');
    });

    // Test 2: Status command works
    await runTest('Status command returns valid JSON', async () => {
        const result = await bridge.getStatus();
        assertExists(result, 'pennylane_available');
        assertExists(result, 'timestamp');
        assertType(result.pennylane_available, 'boolean');
    });

    // Test 3: Circuit execution works (with or without PennyLane)
    await runTest('Circuit execution returns valid result', async () => {
        const result = await bridge.runCircuit([0.5, 0.3]);
        assertExists(result, 'status');
        assertExists(result, 'results');
        assertExists(result, 'pennylane_used');
        assertType(result.pennylane_used, 'boolean');
        assert(Array.isArray(result.results), 'Results should be an array');
        assert(result.results.length === 2, 'Should return 2 expectation values');
    });

    // Test 4: Circuit execution with default parameters
    await runTest('Circuit execution with default parameters', async () => {
        const result = await bridge.runCircuit();
        assertExists(result, 'status');
        assertExists(result, 'results');
        assert(result.status === 'success', 'Status should be success');
        assert(Array.isArray(result.results), 'Results should be an array');
    });

    // Test 5: Optimization works
    await runTest('Optimization returns valid result', async () => {
        const result = await bridge.runOptimization(5);
        assertExists(result, 'status');
        assertExists(result, 'steps');
        assertExists(result, 'final_cost');
        assertExists(result, 'cost_history');
        assert(result.status === 'success', 'Status should be success');
        assert(result.steps === 5, 'Should run for 5 steps');
        assert(Array.isArray(result.cost_history), 'Cost history should be an array');
        assert(result.cost_history.length === 5, 'Cost history should have 5 entries');
    });

    // Test 6: Error handling for invalid command
    await runTest('Error handling for invalid command', async () => {
        const result = await bridge.execute('invalid_command');
        assertExists(result, 'status');
        assert(result.status === 'error', 'Should return error status for invalid command');
        assertExists(result, 'message');
    });

    // Test 7: Status includes expected fields
    await runTest('Status includes all expected fields', async () => {
        const result = await bridge.getStatus();
        assertExists(result, 'pennylane_available');
        assertExists(result, 'device_available');
        assertExists(result, 'timestamp');
        
        // Check timestamp format (ISO string)
        const timestamp = new Date(result.timestamp);
        assert(!isNaN(timestamp.getTime()), 'Timestamp should be valid ISO string');
    });

    // Test 8: Circuit result structure validation
    await runTest('Circuit result structure validation', async () => {
        const result = await bridge.runCircuit([0.1, 0.2]);
        assertExists(result, 'circuit_type');
        assertExists(result, 'parameters');
        assertExists(result, 'timestamp');
        
        assert(Array.isArray(result.parameters), 'Parameters should be an array');
        assert(result.parameters.length === 2, 'Should have 2 parameters');
        assert(Math.abs(result.parameters[0] - 0.1) < 0.001, 'First parameter should match input');
        assert(Math.abs(result.parameters[1] - 0.2) < 0.001, 'Second parameter should match input');
    });

    // Test 9: Optimization result structure validation
    await runTest('Optimization result structure validation', async () => {
        const result = await bridge.runOptimization(3);
        assertExists(result, 'optimization_type');
        assertExists(result, 'final_params');
        assertExists(result, 'pennylane_used');
        
        assert(Array.isArray(result.final_params), 'Final params should be an array');
        assert(result.final_params.length === 2, 'Should have 2 final parameters');
        assertType(result.final_cost, 'number', 'Final cost should be a number');
    });

    // Test 10: Bridge error handling for missing Python
    await runTest('Bridge handles missing Python gracefully', async () => {
        const badBridge = new PLHelperBridge();
        badBridge.pythonPath = 'non_existent_python';
        
        try {
            await badBridge.getStatus();
            assert(false, 'Should have thrown an error for missing Python');
        } catch (error) {
            assert(error.message.includes('Failed to start Python process'), 
                   'Should detect missing Python executable');
        }
    });

    // Summary
    console.log('\n📊 Test Results:');
    console.log(`   ✅ Passed: ${testsPassed}`);
    console.log(`   ❌ Failed: ${testsFailed}`);
    console.log(`   📈 Total:  ${testsPassed + testsFailed}`);
    
    if (testsFailed === 0) {
        console.log('\n🎉 All tests passed! The PennyLane bridge is working correctly.');
        return true;
    } else {
        console.log(`\n⚠️  ${testsFailed} test(s) failed. Please check the implementation.`);
        return false;
    }
}

// Export for use in other modules
module.exports = {
    PLHelperBridge,
    runTests
};

// Run tests if this file is executed directly
if (require.main === module) {
    runTests().then(success => {
        process.exit(success ? 0 : 1);
    }).catch(error => {
        console.error('💥 Test suite crashed:', error.message);
        process.exit(1);
    });
}