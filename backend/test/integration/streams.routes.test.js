const request = require('supertest');
const fs = require('fs');
const path = require('path');
const app = require('../../src/app');

const DATA_DIR = path.join(process.cwd(),'data');
const STREAMS_PATH = path.join(DATA_DIR,'streams.json');

function resetData(){
  if(!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR,{recursive:true});
  fs.writeFileSync(STREAMS_PATH, JSON.stringify([],null,2));
}

describe('streams-config integration', ()=>{
  beforeEach(()=> resetData());

  test('login and create stream config (validation + auth)', async ()=>{
    // login
    const login = await request(app).post('/api/auth/login').send({ username:'admin', password:'secure123' });
    expect(login.status).toBe(200);
    const token = login.body.token;
    expect(token).toBeTruthy();

    // invalid payload (missing params for youtube)
    const bad = { id:'yt-1', type:'youtube', enabled:true, params:{} };
    const resBad = await request(app).post('/api/streams-config').set('Authorization', `Bearer ${token}`).send(bad);
    expect(resBad.status).toBe(400);
    expect(resBad.body).toHaveProperty('details');

    // good payload
    const good = { id:'yt-1', type:'youtube', enabled:true, params:{ uploadCadence: 7, monetizationRate: 0.12 } };
    const res = await request(app).post('/api/streams-config').set('Authorization', `Bearer ${token}`).send(good);
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id','yt-1');

    // fetch list
    const list = await request(app).get('/api/streams-config').set('Authorization', `Bearer ${token}`);
    expect(list.status).toBe(200);
    expect(Array.isArray(list.body)).toBe(true);
  });
});
