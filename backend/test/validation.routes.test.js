const request = require('supertest');
const app = require('../src/app');

describe('route-level validation', ()=>{
  test('income PUT rejects missing incomeItems', async ()=>{
    const res = await request(app).put('/api/income').send({});
    expect(res.status).toBe(400);
  });

  test('ai configure rejects missing provider', async ()=>{
    const res = await request(app).post('/api/ai/configure').send({ config:{} });
    expect(res.status).toBe(400);
  });
});
