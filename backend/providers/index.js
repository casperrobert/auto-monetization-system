// backend/providers/index.js
// registry dynamically requires provider modules so missing optional SDKs don't crash
const list = ['./ibm','./dwave','./pennylane','./external_http'];

const providers = {};
for (const p of list) {
  try {
    // require resolves to a class
    const Cls = require(p);
    const key = p.replace('./','');
    providers[key] = Cls;
  } catch (e) {
    // ignore missing optional providers
    // console.warn('provider', p, 'not available:', e.message);
  }
}

function listAvailable() {
  return Object.keys(providers).filter(k => typeof providers[k].available === 'function' && providers[k].available());
}

async function smokeTest() {
  const results = {};
  for (const [key, Cls] of Object.entries(providers)) {
    try {
      const inst = new Cls();
      const prepared = await inst.prepare({ example: true });
      const run = await inst.run(prepared);
      results[key] = { prepared, run };
    } catch (e) {
      results[key] = { error: e.message };
    }
  }
  return results;
}

module.exports = { providers, listAvailable, smokeTest };
