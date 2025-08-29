const request = require('supertest');
const app = require('../src/app');

describe('payload size boundary', ()=>{
  test('rejects overly large params payload', async ()=>{
    const login = await request(app).post('/api/auth/login').send({ username:'admin', password:'secure123' });
    const token = login.body.token;
    // build large params string
    const big = 'x'.repeat(300*1024); // 300 KB
    const payload = { id:'big-1', type:'apps', enabled:true, params:{ big } };
    const res = await request(app).post('/api/streams-config').set('Authorization', `Bearer ${token}`).send(payload);
    // app.json body limit is 200kb in some app instances; expect either 413 or 400
    expect([400,413,422].includes(res.status)).toBe(true);
  });
});
