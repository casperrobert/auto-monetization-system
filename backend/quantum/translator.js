// backend/quantum/translator.js
// Simple QUBO -> Ising and QUBO -> Circuit translator with mitigation-presets (stubs
// suitable for integration tests and as a starting point for provider-specific
// circuit generation).

function normalizeQubo(qubo){
  // Accept either square matrix (array of arrays) or object map { 'i,j': value }
  if (Array.isArray(qubo)) return qubo;
  // object map -> matrix
  const coords = Object.keys(qubo).map(k => k.split(',').map(Number));
  const maxIdx = Math.max(...coords.flat()) + 1;
  const M = Array.from({ length: maxIdx }, ()=>Array(maxIdx).fill(0));
  for (const [k,v] of Object.entries(qubo)){
    const [i,j] = k.split(',').map(Number);
    M[i][j] = v;
  }
  return M;
}

function quboToIsing(qubo){
  const Q = normalizeQubo(qubo);
  const n = Q.length;
  const h = new Array(n).fill(0);
  const J = Array.from({ length: n }, ()=>new Array(n).fill(0));

  for (let i=0;i<n;i++){
    let sumOff = 0;
    for (let j=0;j<n;j++){
      if (i===j) continue;
      // symmetrize
      const qij = (Q[i][j] || 0) + (Q[j] && Q[j][i] || 0);
      sumOff += qij;
      J[i][j] = 0.25 * qij;
    }
    h[i] = 0.5 * (Q[i][i] || 0) + 0.25 * sumOff;
  }
  return { h, J };
}

function quboToCircuit(qubo, opts={ scale: 1.0 }){
  // Produce a simple parameterized circuit representation as JSON.
  // This is not a backend-specific gate list but a portable intermediate
  // representation: { qubits: N, ops: [ { name, wires, params } ] }
  const Q = normalizeQubo(qubo);
  const n = Q.length;
  const { h, J } = quboToIsing(Q);
  const ops = [];

  // Prepare with Hadamards
  for (let i=0;i<n;i++) ops.push({ name: 'H', wires: [i] });

  // Local Z-rotations encoding linear biases
  for (let i=0;i<n;i++){
    const angle = (h[i] || 0) * Math.PI * 2 * opts.scale;
    ops.push({ name: 'RZ', wires: [i], params: { angle } });
  }

  // Two-qubit entangling rotations encoding couplers
  for (let i=0;i<n;i++){
    for (let j=i+1;j<n;j++){
      const val = J[i][j] || 0;
      if (Math.abs(val) < 1e-12) continue;
      // encode as CNOT + RZ + CNOT pattern (placeholder)
      ops.push({ name: 'CNOT', wires: [i,j] });
      ops.push({ name: 'RZ', wires: [j], params: { angle: val * Math.PI * 2 * opts.scale } });
      ops.push({ name: 'CNOT', wires: [i,j] });
    }
  }

  // Final measurement
  ops.push({ name: 'MEASURE_ALL', wires: Array.from({ length: n }, (_,i)=>i) });

  return { qubits: n, ops, meta: { scale: opts.scale } };
}

// Mitigation presets (stubs): zero-noise-extrapolation (ZNE), post-selection,
// simple measurement mitigation.
const mitigationPresets = {
  zne: { name: 'zne', scaleFactors: [1, 2, 3], method: 'linear-extrapolation' },
  postselection: { name: 'postselection', rules: [] },
  measurement: { name: 'measurement', method: 'simple-counts-scaling' }
};

function applyMitigations(result, presets={}){
  // result: { samples: [[bits]], score: number, counts: {...} }
  // This is a best-effort stub for tests and for wiring into providers.
  const out = Object.assign({}, result);
  if (presets.zne){
    // simple heuristic: if numeric score present, boost slightly to emulate extrapolation
    if (typeof out.score === 'number') out.score = out.score * 1.05; // small improvement
  }
  if (presets.postselection && Array.isArray(out.samples)){
    // drop samples that don't satisfy trivial parity rule if rules present
    if (presets.postselection.rules.length > 0){
      out.samples = out.samples.filter(s => presets.postselection.rules.every(r => r(s)));
    }
  }
  if (presets.measurement && out.counts){
    // normalize counts into probabilities
    const total = Object.values(out.counts).reduce((a,b)=>a+(b||0),0) || 1;
    out.probs = {}; for (const k of Object.keys(out.counts)) out.probs[k] = out.counts[k]/total;
  }
  out.mitigationsApplied = Object.keys(presets);
  return out;
}

// Zero-Noise Extrapolation helpers
function expandCircuitForZNE(circ, scaleFactor){
  // naive expansion: scale rotation angles by scaleFactor
  if (!circ || !circ.ops) return circ;
  const clone = JSON.parse(JSON.stringify(circ));
  clone.ops = clone.ops.map(op => {
    if (op.name === 'RZ' && op.params && typeof op.params.angle === 'number'){
      return { ...op, params: { angle: op.params.angle * scaleFactor } };
    }
    return op;
  });
  clone.meta = { ...(clone.meta||{}), zneScale: scaleFactor };
  return clone;
}

async function performZNE(runFunc, circ, scaleFactors){
  // runFunc: async (circuit, opts) => result{ score, samples, counts }
  const results = [];
  for (const s of scaleFactors){
    const expanded = expandCircuitForZNE(circ, s);
    const res = await runFunc({ circuit: expanded });
    results.push({ scale: s, result: res });
  }
  // extract numeric scores for linear extrapolation
  const xs = results.map(r=>r.scale);
  const ys = results.map(r=> (r.result && typeof r.result.score === 'number') ? r.result.score : 0 );
  // linear fit y = a + b*x -> extrapolate to x=0 (zero noise)
  const n = xs.length;
  let sumx=0,sumy=0,sumxx=0,sumxy=0;
  for (let i=0;i<n;i++){ sumx+=xs[i]; sumy+=ys[i]; sumxx+=xs[i]*xs[i]; sumxy+=xs[i]*ys[i]; }
  const denom = (n*sumxx - sumx*sumx) || 1;
  const b = (n*sumxy - sumx*sumy)/denom;
  const a = (sumy - b*sumx)/n;
  const extrapolated = a; // at x=0
  return { extrapolated, raw: results };
}

module.exports = { quboToIsing, quboToCircuit, mitigationPresets, applyMitigations, expandCircuitForZNE, performZNE };
