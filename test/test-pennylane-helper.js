const PennyLaneProvider = require('../backend/providers/pennylane');
const { spawnSync } = require('child_process');

(async ()=>{
  process.env.PL_HELPER = require('path').resolve(__dirname, '../backend/quantum/pl_helper.py');
  const prov = new PennyLaneProvider();
  const prepared = await prov.prepare({ circuit: { qubits: 2, ops: [ { name: 'H', wires:[0] }, { name: 'H', wires:[1] }, { name: 'MEASURE_ALL', wires:[0,1] } ] } });
  const res = await prov.run(prepared, { shots: 16 });
  console.log('PennyLane helper run result:', res);
})();
