const request = require('supertest');
const fs = require('fs');
const path = require('path');
const app = require('../src/app');

const DATA_DIR = path.join(process.cwd(),'data');
const FILE = path.join(DATA_DIR,'streams-config.json');

function reset(){
  if(!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR,{recursive:true});
  fs.writeFileSync(FILE, JSON.stringify([],null,2));
}

describe('concurrent stream-config creates', ()=>{
  beforeEach(()=> reset());

  test('parallel creates do not crash and most succeed', async ()=>{
    const login = await request(app).post('/api/auth/login').send({ username:'admin', password:'secure123' });
    expect(login.status).toBe(200);
    const token = login.body.token;

    const count = 20;
    const tasks = [];
    for(let i=0;i<count;i++){
      const payload = { id: `concurrent-${i}`, type: 'affiliate', enabled:true, params:{ commission: 0.1 + i*0.001 } };
      tasks.push(request(app).post('/api/streams-config').set('Authorization', `Bearer ${token}`).send(payload));
    }

    const results = await Promise.all(tasks);
    const successes = results.filter(r=> r.status === 201).length;
    expect(successes).toBeGreaterThanOrEqual(Math.floor(count*0.8)); // allow some variance

    const list = JSON.parse(fs.readFileSync(FILE,'utf8'));
    expect(list.length).toBeGreaterThanOrEqual(successes);
  }, 20000);
});
