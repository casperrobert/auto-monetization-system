const cors = require('cors');
// CORS aktivieren
app.use(cors());
const http = require('http');
const fs   = require('fs');
const path = require('path');
const { engine } = require('./src/ams/engine');

/* -------- Security Defaults -------- */
const CSP = "default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self'";
const HSTS = 'max-age=15552000; includeSubDomains';
const RATE = { windowMs: 15*60*1000, max: 300, map: new Map() };

function send(res, code, body, headers={}) {
  res.writeHead(code, {
    'X-Content-Type-Options':'nosniff',
    'X-Frame-Options':'DENY',
    'Referrer-Policy':'no-referrer',
    'Permissions-Policy':'geolocation=(), microphone=(), camera=()',
    'Strict-Transport-Security': HSTS,
    'X-Powered-By':'',
    ...headers,
  });
  res.end(body);
}
function sendJSON(res, code, obj) {
  send(res, code, JSON.stringify(obj), {'content-type':'application/json; charset=utf-8'});
}
function rateLimit(req, res) {
  const ip = req.socket.remoteAddress || 'na';
  const now = Date.now();
  const e = RATE.map.get(ip) || { count:0, start: now };
  if (now - e.start > RATE.windowMs) { e.count=0; e.start=now; }
  e.count++; RATE.map.set(ip, e);
  if (e.count > RATE.max) { sendJSON(res, 429, { ok:false, error:'rate_limited' }); return false; }
  return true;
}
function serveStatic(req, res, filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const type = ext === '.html' ? 'text/html; charset=utf-8'
            : ext === '.css'  ? 'text/css; charset=utf-8'
            : ext === '.js'   ? 'application/javascript; charset=utf-8'
            : 'text/plain; charset=utf-8';
  if (!fs.existsSync(filePath)) return false;
  const data = fs.readFileSync(filePath);
  send(res, 200, data, { 'content-type': type, 'Content-Security-Policy': CSP });
  return true;
}
function readJson(req, limit=200_000) {
  return new Promise((resolve, reject) => {
    let size=0, buf='';
    req.on('data', c=>{ size+=c.length; if(size>limit) reject(new Error('too_large')); buf+=c; });
    req.on('end', ()=> {
      if(!buf) return resolve({});
      try { resolve(JSON.parse(buf)); } catch(e){ reject(e); }
    });
  });
}

/* -------- HTTP Server -------- */
const server = http.createServer(async (req, res) => {
  try {
    if (!rateLimit(req,res)) return;

    const url = new URL(req.url, 'http://localhost');
    const p = url.pathname;

    // Security-Header für statische Seiten
    if (p === '/' || p === '/index.html') {
      const ok = serveStatic(req,res, path.join(process.cwd(),'public','index.html'))
             || serveStatic(req,res, path.join(process.cwd(),'public','dashboard.html'));
      if (!ok) send(res, 200, Buffer.from('<h1>AMS Server</h1><p><a href="/ams.html">AMS Engine</a></p>'),
                   { 'content-type':'text/html; charset=utf-8', 'Content-Security-Policy': CSP });
      return;
    }
    if (p === '/ams.html') {
      const ok = serveStatic(req,res, path.join(process.cwd(),'public','ams.html'));
      if (ok) return;
    }
    if (p.startsWith('/js/')) {
      const ok = serveStatic(req,res, path.join(process.cwd(),'public', p));
      if (ok) return;
    }
    if (p === '/styles.css') {
      const ok = serveStatic(req,res, path.join(process.cwd(),'public','styles.css'));
      if (ok) return;
    }

    // Health
          // Health Check
          app.get("/api/health", (req, res) => {
            res.json({ ok: true, time: new Date().toISOString() });
          });

    // --- AMS API ---
    if (p === '/api/ams/status' && req.method === 'GET') {
      return sendJSON(res, 200, { ok:true, state: engine.snapshot() });
    }
    if (p === '/api/ams/start' && req.method === 'POST') {
      const body = await readJson(req).catch(()=> ({}));
      const out = engine.start(body || {});
      return sendJSON(res, out.ok ? 200 : 400, { ok: out.ok, ...(out.ok?{state:out.state}:{error:out.error}) });
    }
    if (p === '/api/ams/stop' && req.method === 'POST') {
      const out = engine.stop();
      return sendJSON(res, 200, { ok:true, state: out.state });
    }
    if (p === '/api/ams/rebalance' && req.method === 'POST') {
      const out = engine.rebalance();
      return sendJSON(res, out.ok ? 200 : 400, { ok: out.ok, ...(out.ok?{state:out.state}:{error:out.error}) });
    }
    if (p === '/api/ams/config' && req.method === 'GET') {
      return sendJSON(res, 200, { ok:true, cfg: engine.cfg });
    }

    // 404
    return sendJSON(res, 404, { ok:false, error:'not_found' });

  } catch (err) {
    return sendJSON(res, 500, { ok:false, error:'server_error', detail: String(err && err.message || err) });
  }
});

// Body-Parser für JSON
app.use(express.json());
// Static Files aus dem Ordner "public"
app.use(express.static(path.join(__dirname, "public")));

// API-Routen
app.use('/api', require('./backend/api'));
app.use('/api', require('./backend/ai'));

// Server starten
app.listen(PORT, () => {
  console.log(`✅ Server läuft auf Port ${PORT}`);
});
const PORT = Number(process.env.PORT || 3000);
server.listen(PORT, () => {
  console.log(`[AMS] Server ready -> http://localhost:${PORT}`);
});
