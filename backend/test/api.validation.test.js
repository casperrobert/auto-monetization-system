const request = require('supertest');
const app = require('../src/app');

describe('api.js and ai.js validation', ()=>{
  test('register rejects short password', async ()=>{
    const res = await request(app).post('/register').send({ username:'u', password:'123' });
    expect(res.status).toBe(400);
  });

  test('login rejects empty body', async ()=>{
    const res = await request(app).post('/login').send({});
    expect(res.status).toBe(400);
  });

  test('income post rejects missing amount', async ()=>{
    const res = await request(app).post('/income').send({});
    expect(res.status).toBe(400);
  });

  test('ai proxy rejects missing fields', async ()=>{
    const res = await request(app).post('/ai').send({ provider:'openai' });
    expect(res.status).toBe(400);
  });
});
