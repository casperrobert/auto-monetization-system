const path = require('path');
const Ajv = require('ajv');
const fs = require('fs');

const cache = new Map();

function loadSchema(schemaPath){
  const abs = path.isAbsolute(schemaPath)? schemaPath : path.join(process.cwd(),'backend','src','schemas', schemaPath);
  if(cache.has(abs)) return cache.get(abs);
  const raw = fs.readFileSync(abs,'utf8');
  const schema = JSON.parse(raw);
  const ajv = new Ajv({ allErrors: true, strict:false });
  const validate = ajv.compile(schema);
  cache.set(abs, validate);
  return validate;
}

function validateSchema(schemaFile){
  return (req,res,next)=>{
    try{
      const validate = loadSchema(schemaFile);
      const ok = validate(req.body);
      if(!ok){
        const details = (validate.errors||[]).map(e=> ({ field: e.instancePath || e.dataPath, message: e.message }));
        return res.status(400).json({ error:'validation failed', details });
      }
      next();
    } catch(err){
      console.error('schema validate error', err);
      return res.status(500).json({ error:'schema load error' });
    }
  };
}

module.exports = validateSchema;
