const path = require('path');
const fs = require('fs');
const express = require('express');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { engine } = require('../../../src/ams/engine');

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
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR,{recursive:true});

const readJSON = (p, fallback)=>{ try { return JSON.parse(fs.readFileSync(p,'utf8')); } catch { return fallback; } };
const writeJSON = (p, data)=> fs.writeFileSync(p, JSON.stringify(data,null,2));

const STREAMS_PATH = path.join(DATA_DIR,'streams.json');
const AI_PATH = path.join(DATA_DIR,'ai-config.json');
if (!fs.existsSync(STREAMS_PATH)) writeJSON(STREAMS_PATH, []);
if (!fs.existsSync(AI_PATH)) writeJSON(AI_PATH, {provider:'none',keys:{},features:{}});

const authRequired = (req,res,next)=>{
  const h = req.headers.authorization || '';
  const [,token] = h.split(' ');
  try { const payload = jwt.verify(token, JWT_SECRET); req.user=payload; return next(); }
  catch { return res.status(401).json({ ok:false, error:'Unauthorized' }); }
};

// mount modular routes
try {
  const streamsConfigRouter = require('../routes/streamsConfig');
  app.use('/api/streams-config', authRequired, streamsConfigRouter);
} catch (e) {
  console.warn('streams-config router not available yet', e.message);
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
