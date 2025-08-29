// scripts/live-status.js
const http = require("http");

const PORT = Number(process.env.PORT || 3000);
const HOST = "localhost";
const OK = (b) => (b ? "✅" : "❌");

function req(pathname, method = "GET") {
  return new Promise((res) => {
    const r = http.request({ hostname: HOST, port: PORT, path: pathname, method }, (resp) => {
      let data = "";
      resp.on("data", (d) => (data += d));
      resp.on("end", () =>
        res({ ok: resp.statusCode >= 200 && resp.statusCode < 300, code: resp.statusCode, body: data })
      );
    });
    r.on("error", (e) => res({ ok: false, code: 0, body: e.message }));
    r.end();
  });
}

const safeJson = (s) => { try { return JSON.parse(s); } catch { return null; } };
const countRows = (j) => (Array.isArray(j) ? j.length : Array.isArray(j?.items) ? j.items.length : (j ? 1 : 0));

async function loop() {
  process.stdout.write("\x1Bc"); // clear
  console.log(`📡 LIVE STATUS — ${new Date().toLocaleTimeString()}  (http://${HOST}:${PORT})\n`);

  // Core
  const [health, qh, qe] = await Promise.all([
    req("/api/health"),
    req("/api/quantum/health"),
    req("/api/quantum/execute", "POST"),
  ]);
  const earned = (() => { const j = safeJson(qe.body); return j && j.earned != null ? `earned=${j.earned}` : ""; })();

  console.log(`${OK(health.ok)}  GET  /api/health            → ${health.code}`);
  console.log(`${OK(qh.ok)}  GET  /api/quantum/health     → ${qh.code}`);
  console.log(`${OK(qe.ok)}  POST /api/quantum/execute    → ${qe.code} ${earned}`);

  // Daten-APIs
  const [courses, drops, divs] = await Promise.all([
    req("/api/courses"),
    req("/api/dropshipping"),
    req("/api/dividends"),
  ]);
  const c = countRows(safeJson(courses.body));
  const d = countRows(safeJson(drops.body));
  const v = countRows(safeJson(divs.body));

  console.log("");
  console.log(`${OK(courses.ok)} GET  /api/courses        → ${courses.code}  items=${c}`);
  console.log(`${OK(drops.ok)}   GET  /api/dropshipping   → ${drops.code}    items=${d}`);
  console.log(`${OK(divs.ok)}   GET  /api/dividends      → ${divs.code}     items=${v}`);

  console.log("\n(CTRL+C beendet)");
}

setInterval(loop, 1000);
loop();

// -- Models sicher laden (falls Datei fehlt, gibt's null) --
function safeLoad(p) { try { return require(p); } catch { return null; } }

const models = {
  courses:      safeLoad('./models/courses'),
  dropshipping: safeLoad('./models/dropshipping'),
  dividends:    safeLoad('./models/dividends'),
};

// Einheitliche Normalisierung auf Array
function toArray(mod, fallback = []) {
  if (!mod) return fallback;
  if (Array.isArray(mod)) return mod;
  if (Array.isArray(mod.items)) return mod.items;
  if (typeof mod === 'object') return [mod];
  return fallback;
}

// Daten-Endpunkte
app.get('/api/courses',      (req, res) => res.json(toArray(models.courses)));
app.get('/api/dropshipping', (req, res) => res.json(toArray(models.dropshipping)));
app.get('/api/dividends',    (req, res) => res.json(toArray(models.dividends)));
// models/courses.js
module.exports = [
  { id: 1, title: 'Kurs A', price: 49 },
  { id: 2, title: 'Kurs B', price: 79 },
];


