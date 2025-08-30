const path = require('path');
const fs = require('fs');
const express = require('express');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const cors = require('cors');
const jwt = require('jsonwebtoken');
let engine;
try { engine = require('../../../src/ams/engine').engine; } catch (e) { engine = null; }

const app = express();
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
const ADMIN_USER = process.env.AMS_USER || 'admin';
const ADMIN_PASS = process.env.AMS_PASS || 'secure123';

app.use(helmet({
  hsts: { maxAge: 15552000, includeSubDomains: true },
  frameguard: { action: 'deny' },
  referrerPolicy: { policy: 'no-referrer' },
  contentSecurityPolicy: { useDefaults: true }
}));
app.use(cors({ origin: true, credentials: false }));
app.use(rateLimit({ windowMs: 10*60*1000, limit: 600, standardHeaders:'draft-7', legacyHeaders:false }));
app.use(express.json({ limit: '200kb' }));

const DATA_DIR = path.join(process.cwd(),'data');
try { if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR,{recursive:true}); } catch(e) { console.warn('DATA_DIR unavailable in this env:', e.message); }

const readJSON = (p, fallback)=>{ try { return JSON.parse(fs.readFileSync(p,'utf8')); } catch { return fallback; } };
const writeJSON = (p, data)=> { try { return fs.writeFileSync(p, JSON.stringify(data,null,2)); } catch(e) { console.warn('writeJSON failed:', e.message); } };

const STREAMS_PATH = path.join(DATA_DIR,'streams.json');
const AI_PATH = path.join(DATA_DIR,'ai-config.json');
try { if (!fs.existsSync(STREAMS_PATH)) writeJSON(STREAMS_PATH, []); } catch(e){/* ignore */}
try { if (!fs.existsSync(AI_PATH)) writeJSON(AI_PATH, {provider:'none',keys:{},features:{}}); } catch(e){/* ignore */}

const authRequired = (req,res,next)=>{
  const h = req.headers.authorization || '';
  const [,token] = h.split(' ');
  try { const payload = jwt.verify(token, JWT_SECRET); req.user=payload; return next(); }
  catch { return res.status(401).json({ ok:false, error:'Unauthorized' }); }
};

// mount modular routes
try {
  const streamsConfigRouter = require('./routes/streamsConfig');
  app.use('/api/streams-config', authRequired, streamsConfigRouter);
} catch (e) {
  console.warn('streams-config router not available yet', e.message);
}

// mount legacy/api routers for auth, income, register etc used by tests
try {
  const apiRouter = require('../api');
  app.use('/', apiRouter);
} catch (e) {
  console.warn('api router not available', e.message);
}

// ai router can be optional — lazy-require to avoid heavy providers during tests
try {
  const maybeLoadAi = () => {
    try {
      const aiRouter = require('../ai');
      app.use('/', aiRouter);
      console.info('AI router mounted');
    } catch (err) {
      console.warn('AI router not available at mount time:', err.message);
    }
  };
  // attempt immediate mount but tolerate failure
  maybeLoadAi();
} catch (e) {
  console.warn('ai mount attempt failed', e.message);
}

// static and simple endpoints (health/auth/ai/admin/ams routes kept minimal for tests)
app.get('/api/health', (_req,res)=> res.json({ ok:true, time:new Date().toISOString() }));
app.post('/api/auth/login', (req,res)=>{
  const { username, password } = req.body || {};
  if (username===ADMIN_USER && password===ADMIN_PASS) {
    const token = jwt.sign({ sub:'admin', role:'admin' }, JWT_SECRET, { expiresIn:'12h' });
    return res.json({ ok:true, token, user:{username:'admin', role:'admin'} });
  }
  return res.status(401).json({ ok:false, error:'Invalid credentials' });
});

// minimal streams endpoints used elsewhere
app.get('/api/streams', authRequired, (_req,res)=>{
  res.json({ ok:true, streams: readJSON(STREAMS_PATH,[]) });
});

module.exports = app;
