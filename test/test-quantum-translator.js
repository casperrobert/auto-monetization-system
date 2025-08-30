const { quboToIsing, quboToCircuit, mitigationPresets, applyMitigations, performZNE } = require('../backend/quantum/translator');

(async ()=>{
  const qubo = {
    '0,0': -1, '1,1': -1, '2,2': -1,
    '0,1': 0.5, '1,2': -0.7
  };
  console.log('Input QUBO:', qubo);
  const ising = quboToIsing(qubo);
  console.log('Ising:', JSON.stringify(ising, null, 2));
  const circ = quboToCircuit(qubo, { scale: 0.5 });
  console.log('Circuit:', JSON.stringify(circ, null, 2));

  // Simulate a provider result stub
  const providerResult = { samples: [[0,1,0]], score: 0.42, counts: { '010': 42 } };
  const mitigated = applyMitigations(providerResult, { zne: mitigationPresets.zne, measurement: mitigationPresets.measurement });
  console.log('Mitigated result:', JSON.stringify(mitigated, null, 2));

  // Test ZNE flow with fake run function
  const fakeRun = async ({ circuit }) => {
    // return score that increases with noise scale
    const scale = (circuit && circuit.meta && circuit.meta.zneScale) || 1;
    return { score: 1.0 / scale, samples: [[0,1,0]] };
  };
  const zne = await performZNE(fakeRun, circ, [1,2,3]);
  console.log('ZNE extrapolated score:', zne.extrapolated, 'raw:', JSON.stringify(zne.raw, null, 2));
})();
