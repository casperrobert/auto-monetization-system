const Ajv = require('ajv');
const schema = require('../src/schemas/streamConfig.schema.json');

describe('streamConfig schema', ()=>{
  test('youtube requires uploadCadence and monetizationRate', ()=>{
    const ajv = new Ajv();
    const validate = ajv.compile(schema);
    const obj = { id:'yt-1', type:'youtube', enabled:true, params: { uploadCadence: 3 } };
    const ok = validate(obj);
    expect(ok).toBe(false);
    expect(validate.errors && validate.errors.length>0).toBeTruthy();
  });
});
