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

describe('streams-config CRUD', ()=>{
  beforeEach(()=> resetData());

  test('create -> update -> delete flow', async ()=>{
    const login = await request(app).post('/api/auth/login').send({ username:'admin', password:'secure123' });
    const token = login.body.token;

    const good = { id:'aff-1', type:'affiliate', enabled:true, params:{ commission:0.2 } };
    const create = await request(app).post('/api/streams-config').set('Authorization', `Bearer ${token}`).send(good);
    expect(create.status).toBe(201);

    // update with id mismatch -> 400
    const badUpdate = { id:'other', type:'affiliate', enabled:false, params:{ commission:0.3 } };
    const resBad = await request(app).put('/api/streams-config/aff-1').set('Authorization', `Bearer ${token}`).send(badUpdate);
    expect(resBad.status).toBe(400);

    // correct update
    const update = { id:'aff-1', type:'affiliate', enabled:false, params:{ commission:0.3 } };
    const resUp = await request(app).put('/api/streams-config/aff-1').set('Authorization', `Bearer ${token}`).send(update);
    expect(resUp.status).toBe(200);

    // delete
    const del = await request(app).delete('/api/streams-config/aff-1').set('Authorization', `Bearer ${token}`);
    expect(del.status).toBe(200);
  });
});
