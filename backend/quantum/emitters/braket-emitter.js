// backend/quantum/emitters/braket-emitter.js
// Minimal Braket-compatible IR generator (JSON) from intermediate circuit-REP.
// This is a minimal and not fully-featured generator; intended for mock/smoke tests
// and for feeding external HTTP gateways that accept a simple JSON circuit.

function toBraketJSON(circ){
  const n = circ.qubits || 0;
  const ops = circ.ops || [];
  const instructions = [];
  for (const op of ops){
    const name = (op.name || '').toUpperCase();
    if (name === 'H') instructions.push({ type: 'h', targets: op.wires });
    else if (name === 'RZ') instructions.push({ type: 'rz', targets: op.wires, params: op.params });
    else if (name === 'CNOT' || name === 'CX') instructions.push({ type: 'cnot', targets: op.wires });
    else if (name === 'MEASURE_ALL') instructions.push({ type: 'measure', targets: op.wires });
    else instructions.push({ type: 'unsupported', op });
  }

  return { type: 'braket-program', qubits: n, instructions };
}

module.exports = { toBraketJSON };
