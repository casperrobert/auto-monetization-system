// backend/quantum/emitters/qiskit-emitter.js
// Converts the intermediate circuit representation ({ qubits, ops }) into
// a minimal OpenQASM v2 string suitable for submission to IBM backends or
// for inspection. This is intentionally simple and avoids heavy SDK deps.

function fmtFloat(x){
  if (typeof x !== 'number') return String(x);
  return Number(x).toFixed(12).replace(/(?:\.0+|(?<=\.[0-9]*?)0+)$/, '');
}

function toQASM(circ){
  const n = circ.qubits || 0;
  const ops = circ.ops || [];
  const lines = ["OPENQASM 2.0;", "include \"qelib1.inc\";", `qreg q[${n}];`, `creg c[${n}];`];

  for (const op of ops){
    const name = (op.name || '').toUpperCase();
    if (name === 'H') {
      for (const q of op.wires) lines.push(`h q[${q}];`);
    } else if (name === 'RZ') {
      const angle = (op.params && op.params.angle) || 0;
      // QASM RZ is rz(angle) with angle in radians
      lines.push(`rz(${fmtFloat(angle)}) q[${op.wires[0]}];`);
    } else if (name === 'CNOT' || name === 'CX') {
      lines.push(`cx q[${op.wires[0]}],q[${op.wires[1]}];`);
    } else if (name === 'MEASURE_ALL' || name === 'MEASURE'){
      for (const q of op.wires) lines.push(`measure q[${q}] -> c[${q}];`);
    } else {
      // unknown op -> comment
      lines.push(`// unsupported op ${name} ${JSON.stringify(op)}`);
    }
  }

  return lines.join('\n');
}

module.exports = { toQASM };
