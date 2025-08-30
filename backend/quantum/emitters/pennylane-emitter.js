// backend/quantum/emitters/pennylane-emitter.js
// Produces a minimal JSON representation that a small Python helper could
// convert into a PennyLane tape. This avoids adding heavy Python deps here.

function toPennyLaneJSON(circ){
  const n = circ.qubits || 0;
  const ops = circ.ops || [];
  const seq = [];
  for (const op of ops){
    const name = (op.name || '').toUpperCase();
    if (name === 'H') seq.push({ op: 'Hadamard', wires: op.wires });
    else if (name === 'RZ') seq.push({ op: 'RZ', wires: op.wires, params: op.params });
    else if (name === 'CNOT' || name === 'CX') seq.push({ op: 'CNOT', wires: op.wires });
    else if (name === 'MEASURE_ALL') seq.push({ op: 'MEASURE', wires: op.wires });
    else seq.push({ op: 'UNKNOWN', raw: op });
  }
  return { type: 'pennylane-program', qubits: n, sequence: seq };
}

module.exports = { toPennyLaneJSON };
