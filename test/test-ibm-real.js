const IBMProvider = require('../backend/providers/ibm');

(async ()=>{
  if (!process.env.IBM_QUANTUM_TOKEN) {
    console.log('IBM_QUANTUM_TOKEN not set — skipping real IBM test');
    return;
  }
  let runtimeAvailable = true;
  try { require('qiskit-ibm-runtime'); } catch(e) { runtimeAvailable = false; }
  if (!runtimeAvailable) { console.log('qiskit-ibm-runtime not installed — skipping'); return; }

  const prov = new IBMProvider();
  const qubo = { '0,0': -1, '1,1': -1, '0,1': 0.5 };
  const prepared = await prov.prepare({ qubo });
  try {
    const res = await prov.run(prepared, { backend: 'ibmq_qasm_simulator', shots: 256, timeoutMs: 120000 });
    console.log('IBM real run result:', JSON.stringify(res, null, 2));
  } catch (e) {
    console.error('IBM real run error:', e.message);
  }
})();
