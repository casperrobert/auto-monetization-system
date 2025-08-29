const request = require('supertest');
const express = require('express');
const api = require('./api');

const app = express();
app.use(express.json());
app.use('/api', api);

// Testdaten
const testUser = { username: 'testuser', password: 'testpass' };
let token = '';

describe('API Tests', () => {
  it('should register a new user', async () => {
    const res = await request(app).post('/api/register').send(testUser);
    expect(res.statusCode).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  it('should login and return JWT', async () => {
    const res = await request(app).post('/api/login').send(testUser);
    expect(res.statusCode).toBe(200);
    expect(res.body.token).toBeDefined();
    token = res.body.token;
  });

  it('should add and get income log', async () => {
    const addRes = await request(app)
      .post('/api/income')
      .set('Authorization', `Bearer ${token}`)
      .send({ amount: 10, source: 'Test' });
    expect(addRes.statusCode).toBe(200);
    expect(addRes.body.ok).toBe(true);

    const getRes = await request(app)
      .get('/api/income')
      .set('Authorization', `Bearer ${token}`);
    expect(getRes.statusCode).toBe(200);
    expect(Array.isArray(getRes.body)).toBe(true);
    expect(getRes.body[0].amount).toBe(10);
  });
});
