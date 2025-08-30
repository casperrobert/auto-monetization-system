const { spawnSync } = require('child_process');
const path = require('path');

const helper = path.resolve(__dirname, '../backend/quantum/pl_helper.py');
const payload = JSON.stringify({ circ: { qubits: 1, ops: [{ name: 'H', wires: [0] }, { name: 'MEASURE_ALL', wires: [0] }] }, opts: { shots: 16 } });

const res = spawnSync('python3', [helper], { input: payload, encoding: 'utf8', timeout: 30000 });

console.log('exitCode:', res.status);
console.log('stdout:', res.stdout);
console.log('stderr:', res.stderr);

try {
  const json = JSON.parse(res.stdout || '{}');
  console.log('parsed:', json);
} catch (e) {
  console.log('failed to parse output as JSON');
}

process.exit(res.status === 0 ? 0 : 1);
