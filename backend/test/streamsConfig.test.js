const fs = require('fs');
const path = require('path');
const storage = require('../src/storage/streamsConfig');

const DATA = path.join(process.cwd(),'data','streams-config.json');

describe('streamsConfig storage', ()=>{
  beforeAll(()=>{
    if (fs.existsSync(DATA)) fs.renameSync(DATA, DATA+'.bak');
  });
  afterAll(()=>{
    if (fs.existsSync(DATA+'.bak')) { fs.unlinkSync(DATA); fs.renameSync(DATA+'.bak', DATA); }
  });

  test('save and getById', ()=>{
    const cfg = { id:'test-stream', type:'youtube', enabled:true, params:{foo:1} };
    storage.save(cfg);
    const got = storage.getById('test-stream');
    expect(got).toBeTruthy();
    expect(got.id).toBe('test-stream');
  });

  test('remove', ()=>{
    storage.remove('test-stream');
    const got = storage.getById('test-stream');
    expect(got).toBeUndefined();
  });
});
