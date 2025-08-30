const path = require('path');
let Ajv;
try {
  Ajv = require('ajv');
} catch (e) {
  // Ajv not installed in this environment (ENOPRO or CI-limited). We'll
  // provide a fallback validateSchema that returns 503 so the app can be
  // imported and tests can stub or opt-in to install Ajv.
  Ajv = null;
}
const fs = require('fs');

const cache = new Map();

function loadSchema(schemaPath){
  const abs = path.isAbsolute(schemaPath)? schemaPath : path.join(process.cwd(),'backend','src','schemas', schemaPath);
  if(cache.has(abs)) return cache.get(abs);
  const raw = fs.readFileSync(abs,'utf8');
  const schema = JSON.parse(raw);
  if(!Ajv) throw new Error('AjvNotInstalled');
  const ajv = new Ajv({ allErrors: true, strict:false });
  const validate = ajv.compile(schema);
  cache.set(abs, validate);
  return validate;
}

function validateSchema(schemaFile){
  // If Ajv isn't available, return a middleware that refuses requests with
  // 503 so callers know validation isn't available in this environment.
  if(!Ajv){
    return (req,res)=>{
      res.status(503).json({ error: 'validation unavailable: missing dependency ajv' });
    };
  }

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
      console.error('schema validate error', err && err.message);
      return res.status(500).json({ error:'schema load error' });
    }
  };
}

module.exports = validateSchema;
