const Ajv = require('ajv');
const fs = require('fs');
const path = require('path');

const schema = JSON.parse(fs.readFileSync(path.join(__dirname,'..','src','schemas','streamConfig.schema.json'),'utf8'));
const ajv = new Ajv({ allErrors:true, strict:false });
const validate = ajv.compile(schema);

describe('schema boundary checks', ()=>{
  test('youtube params negative uploadCadence rejected', ()=>{
    const bad = { id:'s1', type:'youtube', enabled:true, params:{ uploadCadence: -1, monetizationRate: 0.1 } };
    expect(validate(bad)).toBe(false);
  });

  test('courses conversionRate >1 rejected', ()=>{
    const bad = { id:'c1', type:'courses', enabled:true, params:{ price:100, conversionRate: 1.5 } };
    expect(validate(bad)).toBe(false);
  });
});
