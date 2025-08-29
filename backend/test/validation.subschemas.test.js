const Ajv = require('ajv');
const fs = require('fs');
const path = require('path');

const schema = JSON.parse(fs.readFileSync(path.join(__dirname,'..','src','schemas','streamConfig.schema.json'),'utf8'));
const ajv = new Ajv({ allErrors:true, strict:false });
const validate = ajv.compile(schema);

describe('streamConfig subschemas', ()=>{
  test('dividends requires yieldRate and payoutFrequency', ()=>{
    const bad = { id:'d1', type:'dividends', enabled:true, params:{ yieldRate: 0.03 } };
    expect(validate(bad)).toBe(false);
    expect(validate.errors.some(e=> e.message && e.message.includes('payoutFrequency'))).toBe(true);
    const good = { id:'d2', type:'dividends', enabled:true, params:{ yieldRate: 0.03, payoutFrequency:'monthly' } };
    expect(validate(good)).toBe(true);
  });

  test('apps requires monetizationModel and avgRevenuePerUser', ()=>{
    const bad = { id:'a1', type:'apps', enabled:true, params:{ monetizationModel:'paid' } };
    expect(validate(bad)).toBe(false);
    const good = { id:'a2', type:'apps', enabled:true, params:{ monetizationModel:'subscription', avgRevenuePerUser: 1.23 } };
    expect(validate(good)).toBe(true);
  });
});
