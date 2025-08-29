set -euo pipefail

echo "🔧 Sanfte Reparatur startet…"
# weniger Lärm / weniger Last
npm set fund false >/dev/null 2>&1 || true
npm set audit false >/dev/null 2>&1 || true
npm set progress false >/dev/null 2>&1 || true

echo "⛔ alte Node-Prozesse stoppen & Port 3000 freimachen"
pkill -f "node .*index.js" 2>/dev/null || true
pkill -f "nodemon" 2>/dev/null || true
# kill-port nur nutzen, wenn vorhanden – sonst überspringen
npx --yes kill-port 3000 >/dev/null 2>&1 || true

echo "📁 Struktur sicherstellen"
mkdir -p src/quantum public/js public/assets models

# .env nur anlegen, wenn fehlt
[ -f .env ] || cat > .env <<'ENV'
PORT=3000
MOCK_MODE=true
USE_QUANTUM=true
QUANTUM_ENCRYPTION_KEY=dev-secret-key
ENV

# minimaler Quantum-Stub – nur falls fehlt
[ -f src/quantum/quantum.js ] || cat > src/quantum/quantum.js <<'JS'
const { CronJob } = require('cron');
let lastRun = null, job=null;
function health(){ return { ok:true, scheduler:!!job, lastRun }; }
async function executeOnce(input={}){ const earned=Number((Math.random()*0.01+0.001).toFixed(4)); lastRun=new Date().toISOString(); return { ok:true, mocked:true, earned, input, ts:lastRun }; }
function startScheduler(){ if(job) return; job = new CronJob('*/10 * * * * *', async()=>{ try{ await executeOnce({auto:true}); }catch{} }); job.start(); }
module.exports = { health, executeOnce, startScheduler };
JS

# robuste index.js – überschreibt kaputte Version
cat > index.js <<'JS'
require('dotenv').config();
const express = require('express');
const path = require('path');

const app = express();
const PORT = Number(process.env.PORT || 3000);
const MOCK = String(process.env.MOCK_MODE || 'true') === 'true';

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

let quantum=null;
try {
  quantum = require('./src/quantum/quantum');
  if (!MOCK) quantum.startScheduler?.();
} catch (e) {
  console.warn('Quantum-Backend nicht geladen:', e?.message || e);
}

app.get('/api/health', (_req,res)=> res.json({ ok:true, time:new Date().toISOString(), mock:MOCK }));
app.get('/api/quantum/health', (_req,res)=> quantum ? res.json(quantum.health()) : res.json({ ok:false, reason:'module missing' }));
app.post('/api/quantum/execute', async (req,res)=>{
  try{
    if(!quantum) return res.status(503).json({ ok:false, reason:'quantum unavailable' });
    res.json(await quantum.executeOnce(req.body||{}));
  }catch(e){ res.status(500).json({ ok:false, error:String(e?.message||e) }); }
});

app.listen(PORT, ()=> {
  console.log('✅ Server läuft auf Port', PORT);
  console.log('→ Dashboard: http://localhost:'+PORT+'/dashboard.html');
});
JS

# kleine Dashboard-Dateien – nur falls fehlen
[ -f public/index.html ] || cat > public/index.html <<'HTML'
<!doctype html><meta charset="utf-8"><title>CASPER SYSTEM 24</title>
<p><a href="/dashboard.html">Zum Realtime Dashboard</a></p>
HTML

cat > public/dashboard.html <<'HTML'
<!doctype html><html lang="de"><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><title>Dashboard</title>
<link rel="stylesheet" href="/styles.css">
<body class="site"><main class="container">
  <h2>Realtime Dashboard</h2>
  <section class="panel">
    <button id="btn-exec" class="btn">Strategie einmal ausführen</button>
    <pre id="out" class="code"></pre>
  </section>
  <section class="panel">
    <button id="btn-health" class="btn">Quantum-Health</button>
    <pre id="health" class="code"></pre>
  </section>
</main>
<script src="/js/dashboard.js"></script>
</body></html>
HTML

cat > public/styles.css <<'CSS'
body{font-family:system-ui,Arial,sans-serif;margin:0;padding:16px}
.container{max-width:900px;margin:0 auto}
.panel{border:1px solid #eee;border-radius:8px;padding:12px;margin:12px 0}
.btn{padding:8px 12px;border:1px solid #ddd;border-radius:8px;background:#f7f7f7}
.code{background:#111;color:#0f0;padding:10px;border-radius:6px;min-height:48px;overflow:auto}
CSS

cat > public/js/dashboard.js <<'JS'
(async function(){
  const execBtn=document.getElementById('btn-exec');
  const healthBtn=document.getElementById('btn-health');
  const out=document.getElementById('out');
  const health=document.getElementById('health');

  execBtn?.addEventListener('click', async ()=>{
    execBtn.disabled=true; const old=execBtn.textContent; execBtn.textContent='Läuft…';
    out.textContent='';
    try{
      const r=await fetch('/api/quantum/execute',{method:'POST',headers:{'content-type':'application/json'},body:'{}'});
      out.textContent=JSON.stringify(await r.json(),null,2);
    }catch(e){ out.textContent='Fehler: '+e; } finally{ execBtn.disabled=false; execBtn.textContent=old; }
  });

  healthBtn?.addEventListener('click', async ()=>{
    healthBtn.disabled=true; const old=healthBtn.textContent; healthBtn.textContent='Prüfe…';
    health.textContent='';
    try{
      const r=await fetch('/api/quantum/health'); health.textContent=JSON.stringify(await r.json(),null,2);
    }catch(e){ health.textContent='Fehler: '+e; } finally{ healthBtn.disabled=false; healthBtn.textContent=old; }
  });
})();
JS

# Modelle als super-leichte Stubs – nur wenn fehlen
mk(){ n=$1; r=$2; i=$3; f="models/$n.js"; [ -f "$f" ] && return; cat > "$f" <<JS
module.exports.simulate = async (p) => {
  const daily = Number((Math.random()*120+30).toFixed(2));
  return { source:"$n", daily, monthly:Number((daily*30).toFixed(2)), yearly:Number((daily*365).toFixed(2)), risk:"$r", invest:"$i" };
};
JS
}
mk courses      mittel "Zeit/Produktion"
mk dropshipping mittel "Marketing"
mk youtube      mittel "Content/Marketing"
mk apps         hoch   "Entwicklung"
mk affiliate    mittel "Content/SEO"
mk reits        niedrig "Kapital"
mk dividends    mittel "Kapital"
mk p2p          hoch   "Kapital/Risiko"

# overview.js erzeugen
cat > overview.js <<'JS'
const Table = require('cli-table3'); const chalk=require('chalk');
const sources=[ 'courses','dropshipping','youtube','apps','affiliate','reits','dividends','p2p' ].map(n=>require('./models/'+n));
(async()=>{
  const params={ targetDaily:500, startCapital:20000, monthlyMarketing:2000 };
  const res=[]; for(const s of sources) res.push(await s.simulate(params));
  const t=new Table({ head:['Quelle','€/Tag','€/Monat','€/Jahr','Risiko','Investition'], colAligns:['left','right','right','right','left','left'] });
  let d=0,m=0,y=0; for(const r of res){ t.push([r.source,r.daily.toFixed(2),r.monthly.toFixed(2),r.yearly.toFixed(2),r.risk,r.invest]); d+=r.daily;m+=r.monthly;y+=r.yearly; }
  console.log(chalk.bold('\n�� Einnahmequellen – Überblick\n')); console.log(t.toString());
  console.log('\n'+chalk.bold('Summen:')); console.log(`➡️  Pro Tag:    ${chalk.green(d.toFixed(2)+' €')}`); console.log(`➡️  Pro Monat:  ${chalk.green(m.toFixed(2)+' €')}`); console.log(`➡️  Pro Jahr:   ${chalk.green(y.toFixed(2)+' €')}\n`);
})();
JS

# package.json-Skripte ergänzen (ohne große Änderungen)
node - <<'NODE'
const fs=require('fs'); const p=JSON.parse(fs.readFileSync('package.json','utf8'));
p.scripts=p.scripts||{}; p.scripts.dev="node index.js"; p.scripts.start="node index.js"; p.scripts.overview="node overview.js";
fs.writeFileSync('package.json', JSON.stringify(p,null,2)); console.log("📜 Scripts:", Object.keys(p.scripts).join(', '));
NODE

# Nur installieren, wenn node_modules fehlt (spart Last/Abstürze)
if [ ! -d node_modules ]; then
  echo "📦 Installiere Dependencies (einmalig, klein gehalten)…"
  NODE_OPTIONS="--max-old-space-size=256" npm install --omit=optional --silent
  NODE_OPTIONS="--max-old-space-size=256" npm install --omit=optional --silent express dotenv cli-table3 chalk cron
fi

echo "✅ Sanfte Reparatur beendet."
