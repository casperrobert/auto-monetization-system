const { smokeTest, listAvailable } = require('../backend/providers');

(async ()=>{
  console.log('Available providers:', listAvailable());
  const res = await smokeTest();
  console.log('Smoke results:', JSON.stringify(res, null, 2));
})();
