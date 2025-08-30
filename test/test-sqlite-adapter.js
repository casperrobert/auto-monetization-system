const assert = require('assert');
const SqliteAdapter = require('../backend/sqlite-adapter');

(async ()=>{
  const a = new SqliteAdapter();
  // create user
  const u = a.createUser({ username: 'tuser', password: 'pw' });
  assert(u && u.username === 'tuser', 'createUser failed');
  // list users
  const all = a.getAllUsers();
  assert(Array.isArray(all) && all.length >= 1, 'getAllUsers failed');
  // kv
  a.setKV('x', 'y');
  const v = a.getKV('x');
  assert(v === 'y', 'getKV/setKV failed');

  console.log('TEST PASS: sqlite-adapter fallback OK');
})().catch(e=>{ console.error('TEST FAIL:', e); process.exit(2); });
