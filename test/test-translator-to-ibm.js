const { quboToCircuit } = require('../backend/quantum/translator');
const IBMProvider = require('../backend/providers/ibm');

(async ()=>{
  const qubo = { '0,0': -1, '1,1': -1, '0,1': 0.5 };
  const circ = quboToCircuit(qubo, { scale: 0.8 });
  console.log('Circuit JSON:', JSON.stringify(circ, null, 2));

  const prov = new IBMProvider();
  const prepared = await prov.prepare({ circuit: circ });
  console.log('Prepared:', Object.keys(prepared));
  const run = await prov.run(prepared);
  console.log('Run result:', JSON.stringify(run, null, 2));
})();
