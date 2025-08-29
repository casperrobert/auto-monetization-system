#!/bin/bash
set -e

PROJECT="/workspaces/auto-monetization-system"
cd "$PROJECT"

echo "⛔ stoppe evtl. laufende Node-Prozesse…"
pkill -f "node .*server-express.js" 2>/dev/null || true
pkill -f "node .*index.js" 2>/dev/null || true

mkdir -p data public src/ams

# --- Engine (bestehende Minimal-API weiter nutzbar) ---
cat > src/ams/engine.js <<'JS'
let _state = {
  running:false, startedAt:null, lastTick:null, lastRebalance:null,
  equity:100000, cash:100000, pnlDay:0, pnlTotal:0, positions:[]
};
const snapshot = ()=>_state;
const start=(opts={})=>{ if(_state.running) return {ok:true,state:_state};
  _state.running=true; _state.startedAt=new Date().toISOString();
  _state.lastRebalance=_state.startedAt; return {ok:true,state:_state}; };
const stop =()=>({ok:true,state:(_state.running=false,_state)});
const rebalance =()=>({ok:true,state:(_state.lastRebalance=new Date().toISOString(),_state)});
module.exports = { engine: { snapshot, start, stop, rebalance } };
JS

# --- Daten-Stubs ---
cat > data/streams.json <<'JSON'
[
  {"id":"youtube","name":"YouTube","revenue":0,"status":"idle","settings":{}},
  {"id":"affiliate","name":"Affiliate Marketing","revenue":0,"status":"idle","settings":{}},
  {"id":"dropshipping","name":"Dropshipping","revenue":0,"status":"idle","settings":{}},
  {"id":"dividends","name":"Dividenden","revenue":0,"status":"idle","settings":{}},
  {"id":"p2p","name":"P2P Lending","revenue":0,"status":"idle","settings":{}},
  {"id":"reits","name":"REITs","revenue":0,"status":"idle","settings":{}},
  {"id":"courses","name":"Online Kurse","revenue":0,"status":"idle","settings":{}},
  {"id":"apps","name":"Mobile Apps","revenue":0,"status":"idle","settings":{}}
]
JSON

cat > data/ai-config.json <<'JSON'
{"provider":"none","keys":{"openai":"","claude":"","gemini":"","local":""},"features":{"autoTuning":false,"marketAnalysis":false,"risk":"balanced"}}
JSON

# --- Security-First Express-Server mit Auth + API ---
cat > server-express.js <<'JS'
const path = require('path');
const fs = require('fs');
const express = require('express');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { engine } = require('./src/ams/engine');

const app = express();
const PORT = Number(process.env.PORT || 3000);
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
const ADMIN_USER = process.env.AMS_USER || 'admin';
const ADMIN_PASS = process.env.AMS_PASS || 'secure123';

app.use(helmet({
  hsts: { maxAge: 15552000, includeSubDomains: true },
  frameguard: { action: 'deny' },
  referrerPolicy: { policy: 'no-referrer' },
  contentSecurityPolicy: {
    useDefaults: true,
    directives: {
      "default-src": ["'self'"],
      "script-src": ["'self'"],
      "style-src": ["'self'", "'unsafe-inline'"],
      "img-src": ["'self'", "data:"],
      "connect-src": ["'self'"],
    },
  },
}));
app.use(cors({ origin: true, credentials: false }));
app.use(rateLimit({ windowMs: 10*60*1000, limit: 600, standardHeaders:'draft-7', legacyHeaders:false }));
app.use(express.json({ limit: '200kb' }));

const readJSON = (p, fallback)=>{ try { return JSON.parse(fs.readFileSync(p,'utf8')); } catch { return fallback; } };
const writeJSON = (p, data)=> fs.writeFileSync(p, JSON.stringify(data,null,2));

const DATA_DIR = path.join(process.cwd(),'data');
const STREAMS_PATH = path.join(DATA_DIR,'streams.json');
const AI_PATH = path.join(DATA_DIR,'ai-config.json');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR,{recursive:true});
if (!fs.existsSync(STREAMS_PATH)) writeJSON(STREAMS_PATH, []);
if (!fs.existsSync(AI_PATH)) writeJSON(AI_PATH, {provider:"none",keys:{},features:{}});

const authRequired = (req,res,next)=>{
  const h = req.headers.authorization || '';
  const [,token] = h.split(' ');
  try { const payload = jwt.verify(token, JWT_SECRET); req.user=payload; return next(); }
  catch { return res.status(401).json({ ok:false, error:'Unauthorized' }); }
};

// --- Static UI ---
app.use(express.static(path.join(process.cwd(), 'public'), {
  setHeaders: (res) => res.setHeader('X-Content-Type-Options', 'nosniff')
}));

// --- Public endpoints ---
app.get('/api/health', (_req,res)=> res.json({ ok:true, time:new Date().toISOString() }));
app.post('/api/auth/login', (req,res)=>{
  const { username, password } = req.body || {};
  if (username===ADMIN_USER && password===ADMIN_PASS) {
    const token = jwt.sign({ sub:'admin', role:'admin' }, JWT_SECRET, { expiresIn:'12h' });
    return res.json({ ok:true, token, user:{username:'admin', role:'admin'} });
  }
  return res.status(401).json({ ok:false, error:'Invalid credentials' });
});

// --- AMS Engine (geschützt) ---
app.get('/api/ams/status', authRequired, (_req,res)=> res.json({ ok:true, state: engine.snapshot() }));
app.post('/api/ams/start', authRequired, (req,res)=>{
  const out = engine.start(req.body || {});
  if (!out.ok) return res.status(400).json(out);
  res.json({ ok:true, state: out.state });
});
app.post('/api/ams/stop', authRequired, (_req,res)=> res.json({ ok:true, state: engine.stop().state }));
app.post('/api/ams/rebalance', authRequired, (_req,res)=>{
  const out = engine.rebalance(); if(!out.ok) return res.status(400).json(out);
  res.json({ ok:true, state: out.state });
});

// --- Streams CRUD (einfach gehalten) ---
app.get('/api/streams', authRequired, (_req,res)=>{
  res.json({ ok:true, streams: readJSON(STREAMS_PATH,[]) });
});
app.put('/api/streams/:id', authRequired, (req,res)=>{
  const id = req.params.id;
  const body = req.body || {};
  const list = readJSON(STREAMS_PATH,[]);
  const idx = list.findIndex(s=>s.id===id);
  if (idx<0) return res.status(404).json({ ok:false, error:'Not found' });
  list[idx] = { ...list[idx], ...body, id }; // id fixieren
  writeJSON(STREAMS_PATH, list);
  res.json({ ok:true, stream:list[idx] });
});
app.post('/api/streams/recalc', authRequired, (_req,res)=>{
  // simple Demo-"Optimierung": +1% revenue für aktive Streams
  const list = readJSON(STREAMS_PATH,[]);
  list.forEach(s=>{ if(s.status==='active'){ s.revenue = Math.round((s.revenue||0)*1.01*100)/100; } });
  writeJSON(STREAMS_PATH, list);
  res.json({ ok:true, streams:list });
});

// --- KI-Konfiguration ---
app.get('/api/ai/config', authRequired, (_req,res)=>{
  const cfg = readJSON(AI_PATH,{});
  const masked = JSON.parse(JSON.stringify(cfg));
  if (masked.keys) Object.keys(masked.keys).forEach(k=>{
    const v = masked.keys[k]; if (v) masked.keys[k] = v.slice(0,3)+'•••'+v.slice(-2);
  });
  res.json({ ok:true, config: masked });
});
app.put('/api/ai/config', authRequired, (req,res)=>{
  const cfg = readJSON(AI_PATH,{provider:'none',keys:{},features:{}});
  const incoming = req.body || {};
  const merged = {
    provider: incoming.provider || cfg.provider,
    keys: { ...cfg.keys, ...(incoming.keys||{}) },
    features: { ...cfg.features, ...(incoming.features||{}) }
  };
  writeJSON(AI_PATH, merged);
  res.json({ ok:true, saved:true });
});

// --- Admin-Monitor ---
app.get('/api/admin/monitor', authRequired, (_req,res)=>{
  const streams = readJSON(STREAMS_PATH,[]);
  res.json({
    ok:true,
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    streamsCount: streams.length,
    engine: engine.snapshot()
  });
});

// Root -> UI
app.get('/', (_req,res)=> res.sendFile(path.join(process.cwd(),'public','index.html')));

app.listen(PORT, ()=> console.log(`[AMS] Ready -> http://localhost:${PORT}`));
JS

# --- Frontend (ohne Build, sofort nutzbar) ---
cat > public/styles.css <<'CSS'
*{box-sizing:border-box} body{font-family:system-ui,Arial,sans-serif;margin:0;background:#0b1020;color:#e9edf8}
a{color:inherit}
.nav{display:flex;gap:.75rem;align-items:center;background:#0d122a;padding:.8rem 1rem;border-bottom:1px solid #1b2348}
.nav .brand{font-weight:700}
.container{max-width:1100px;margin:1.2rem auto;padding:0 1rem}
.panel{background:#0f1634;border:1px solid #1b2348;border-radius:12px;padding:1rem;margin-bottom:1rem}
.btn{background:#e9edf8;color:#0b1020;border:0;border-radius:10px;padding:.55rem .8rem;cursor:pointer}
.btn.secondary{background:transparent;color:#e9edf8;border:1px solid #3a4691}
.input, select{width:100%;padding:.6rem .7rem;border-radius:10px;border:1px solid #2a3576;background:#0d1430;color:#e9edf8}
.grid{display:grid;gap:1rem}
.grid.cols-2{grid-template-columns:1fr 1fr}
.grid.cols-3{grid-template-columns:repeat(3,1fr)}
.table{width:100%;border-collapse:collapse}
.table th,.table td{padding:.55rem;border-bottom:1px solid #1b2348}
.badge{display:inline-block;padding:.15rem .5rem;border-radius:999px;border:1px solid #3a4691}
.code{background:#0a0f28;border:1px solid #1b2348;border-radius:10px;padding:10px;overflow:auto}
.hidden{display:none}
.center{display:flex;justify-content:center;align-items:center}
CSS

cat > public/index.html <<'HTML'
<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>AMS – Auto-Monetization System</title>
<link rel="stylesheet" href="/styles.css">
<header class="nav">
  <div class="brand">💸 AMS</div>
  <div style="margin-left:auto;display:flex;gap:.5rem">
    <button class="btn secondary" id="nav-dashboard">Dashboard</button>
    <button class="btn secondary" id="nav-ai">KI</button>
    <button class="btn secondary" id="nav-admin">Admin</button>
    <button class="btn" id="logout">Logout</button>
  </div>
</header>
<main class="container">

  <!-- Login -->
  <section class="panel" id="view-login">
    <h2>Login</h2>
    <div class="grid cols-2">
      <div><label>Nutzername</label><input class="input" id="login-user" value="admin"></div>
      <div><label>Passwort</label><input class="input" id="login-pass" type="password" value="secure123"></div>
    </div>
    <div style="margin-top:.8rem;display:flex;gap:.5rem">
      <button class="btn" id="login-btn">Einloggen</button>
      <span id="login-msg" class="badge"></span>
    </div>
  </section>

  <!-- Dashboard -->
  <section class="panel hidden" id="view-dashboard">
    <h2>Dashboard</h2>
    <div style="display:flex;gap:.5rem;flex-wrap:wrap;margin-bottom:.6rem">
      <button class="btn" id="btn-start">Engine Start</button>
      <button class="btn secondary" id="btn-reb">Rebalance</button>
      <button class="btn secondary" id="btn-stop">Stop</button>
      <button class="btn secondary" id="btn-recalc">Optimieren (+1% aktive)</button>
      <button class="btn secondary" id="btn-refresh">Neu laden</button>
    </div>
    <table class="table" id="streams-table">
      <thead><tr><th>Stream</th><th>Status</th><th>Erlös</th><th>Aktion</th></tr></thead>
      <tbody></tbody>
    </table>
    <h3>Engine Status</h3>
    <pre id="engine-out" class="code"></pre>
  </section>

  <!-- KI -->
  <section class="panel hidden" id="view-ai">
    <h2>KI-Konfiguration</h2>
    <div class="grid cols-3">
      <div>
        <label>Provider</label>
        <select id="ai-provider" class="input">
          <option value="none">none</option>
          <option value="openai">OpenAI</option>
          <option value="claude">Claude</option>
          <option value="gemini">Gemini</option>
          <option value="local">Local LLM</option>
        </select>
      </div>
      <div><label>OpenAI Key</label><input id="key-openai" class="input" placeholder="sk-..."></div>
      <div><label>Claude Key</label><input id="key-claude" class="input" placeholder="..."></div>
      <div><label>Gemini Key</label><input id="key-gemini" class="input" placeholder="..."></div>
      <div><label>Local Token</label><input id="key-local" class="input" placeholder="..."></div>
      <div>
        <label>Risiko</label>
        <select id="ai-risk" class="input">
          <option value="conservative">konservativ</option>
          <option value="balanced" selected>ausgewogen</option>
          <option value="aggressive">aggressiv</option>
        </select>
      </div>
    </div>
    <div style="margin-top:.8rem;display:flex;gap:.5rem">
      <label><input type="checkbox" id="feat-tune"> Auto-Tuning</label>
      <label><input type="checkbox" id="feat-market"> Marktanalyse</label>
      <button class="btn" id="ai-save">Speichern</button>
      <span id="ai-msg" class="badge"></span>
    </div>
    <h3 style="margin-top:1rem">Aktuelle Konfiguration</h3>
    <pre id="ai-out" class="code"></pre>
  </section>

  <!-- Admin -->
  <section class="panel hidden" id="view-admin">
    <h2>Admin / Monitoring</h2>
    <pre id="admin-out" class="code"></pre>
  </section>

</main>

<script>
const $ = sel => document.querySelector(sel);
const out = (el,data)=> el.textContent = JSON.stringify(data,null,2);
const token = ()=> localStorage.getItem('ams_token') || '';
const headersAuth = ()=> ({ 'content-type':'application/json', 'authorization':'Bearer '+token() });
const api = (p,opts={}) => fetch(p,{...opts, headers:{ ...(opts.headers||{}), ...headersAuth() }}).then(r=>r.json());

const views = { login:$('#view-login'), dash:$('#view-dashboard'), ai:$('#view-ai'), admin:$('#view-admin') };
function show(k){ Object.values(views).forEach(v=>v.classList.add('hidden')); (k==='login'?views.login:k==='ai'?views.ai:k==='admin'?views.admin:views.dash).classList.remove('hidden'); }

async function renderStreams(){
  const res = await api('/api/streams'); if(!res.ok) return;
  const tb = $('#streams-table tbody'); tb.innerHTML='';
  res.streams.forEach(s=>{
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${s.name}</td>
      <td><span class="badge">${s.status}</span></td>
      <td>${(s.revenue||0).toFixed(2)}</td>
      <td>
        <select data-id="${s.id}" class="input" style="max-width:150px">
          <option value="idle" ${s.status==='idle'?'selected':''}>idle</option>
          <option value="active" ${s.status==='active'?'selected':''}>active</option>
          <option value="paused" ${s.status==='paused'?'selected':''}>paused</option>
        </select>
        <button class="btn secondary" data-save="${s.id}">Speichern</button>
      </td>`;
    tb.appendChild(tr);
  });
  tb.querySelectorAll('button[data-save]').forEach(b=>{
    b.onclick = async (e)=>{
      const id = e.target.getAttribute('data-save');
      const sel = tb.querySelector('select[data-id="'+id+'"]');
      const body = { status: sel.value };
      const r = await api('/api/streams/'+id,{ method:'PUT', body: JSON.stringify(body) });
      if(r.ok) renderStreams();
    };
  });
}

async function renderEngine(){ try {
  const s = await api('/api/ams/status'); if(s.ok) out($('#engine-out'), s);
} catch(_){} }

async function renderAI(){
  const r = await api('/api/ai/config'); if(!r.ok) return;
  out($('#ai-out'), r.config || r);
}

async function renderAdmin(){
  const r = await api('/api/admin/monitor'); if(r.ok) out($('#admin-out'), r);
}

// Nav
$('#nav-dashboard').onclick=()=>{ show('dash'); renderStreams(); renderEngine(); };
$('#nav-ai').onclick=()=>{ show('ai'); renderAI(); };
$('#nav-admin').onclick=()=>{ show('admin'); renderAdmin(); };

// Login
$('#login-btn').onclick = async ()=>{
  const username = $('#login-user').value.trim();
  const password = $('#login-pass').value;
  const res = await fetch('/api/auth/login',{method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify({username,password})}).then(r=>r.json());
  $('#login-msg').textContent = res.ok ? 'angemeldet' : (res.error || 'Fehler');
  if(res.ok){ localStorage.setItem('ams_token', res.token); show('dash'); renderStreams(); renderEngine(); }
};

// Logout
$('#logout').onclick = ()=>{ localStorage.removeItem('ams_token'); show('login'); };

// Buttons
$('#btn-start').onclick = async ()=>{ const r = await api('/api/ams/start',{method:'POST',body:JSON.stringify({simulation:true})}); if(r.ok) renderEngine(); };
$('#btn-reb').onclick   = async ()=>{ const r = await api('/api/ams/rebalance',{method:'POST'}); if(r.ok) renderEngine(); };
$('#btn-stop').onclick  = async ()=>{ const r = await api('/api/ams/stop',{method:'POST'}); if(r.ok) renderEngine(); };
$('#btn-recalc').onclick= async ()=>{ const r = await api('/api/streams/recalc',{method:'POST'}); if(r.ok) renderStreams(); };
$('#btn-refresh').onclick=()=>{ renderStreams(); renderEngine(); };

// KI speichern
$('#ai-save').onclick = async ()=>{
  const payload = {
    provider: $('#ai-provider').value,
    keys: {
      openai: $('#key-openai').value,
      claude: $('#key-claude').value,
      gemini: $('#key-gemini').value,
      local: $('#key-local').value
    },
    features: {
      autoTuning: $('#feat-tune').checked,
      marketAnalysis: $('#feat-market').checked,
      risk: $('#ai-risk').value
    }
  };
  const r = await api('/api/ai/config',{method:'PUT', body: JSON.stringify(payload)});
  $('#ai-msg').textContent = r.ok ? 'gespeichert' : 'Fehler';
  renderAI();
};

// Auto-login falls Token vorhanden
if (localStorage.getItem('ams_token')) { show('dash'); renderStreams(); renderEngine(); }
else { show('login'); }

// leichte Auto-Updates
setInterval(()=>{ if(!views.dash.classList.contains('hidden')) renderEngine(); }, 5000);
</script>
HTML

# --- package.json Scripts & Deps ---
if [ ! -f package.json ]; then npm init -y >/dev/null; fi
node - <<'NODE'
const fs=require('fs');
const p=JSON.parse(fs.readFileSync('package.json','utf8'));
p.scripts=p.scripts||{}; p.scripts.start="node server-express.js";
fs.writeFileSync('package.json', JSON.stringify(p,null,2));
console.log('scripts:',p.scripts);
NODE

echo "📦 installiere Dependencies…"
npm i -S express helmet express-rate-limit cors jsonwebtoken >/dev/null

echo "▶️  starte Server…"
node server-express.js &

sleep 1
echo "== Health ==" && curl -s http://localhost:3000/api/health && echo
echo "👉 Öffne: http://localhost:3000/  (Login: admin / secure123)"
