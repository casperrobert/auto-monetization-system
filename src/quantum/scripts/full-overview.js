#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const net = require('net');
const chalk = require('chalk');
const Table = require('cli-table3');

const CWD = process.cwd();
const PORT = 3000;

const list = (dir, filter=()=>true) => {
  const p = path.join(CWD, dir);
  return fs.existsSync(p) ? fs.readdirSync(p).filter(filter).map(f => path.join(dir, f)) : [];
};
const read = (file) => { try { return fs.readFileSync(path.join(CWD, file), 'utf8'); } catch { return ''; } };
const pretty = (o, n=400) => { const s = typeof o==='string'?o:JSON.stringify(o,null,2); return s.length>n?s.slice(0,n)+'\n…(gekürzt)…':s; };

function portCheck(port, host='127.0.0.1', timeout=1500){
  return new Promise(res=>{
    const s = new net.Socket(); let done=false;
    const fin=(ok,msg)=>{ if(done) return; done=true; s.destroy(); res({ok,msg}); };
    s.setTimeout(timeout);
    s.once('connect',()=>fin(true,`Port ${port} offen`));
    s.once('timeout',()=>fin(false,'Timeout'));
    s.once('error',e=>fin(false,e.code||e.message));
    s.connect(port,host);
  });
}
async function hit(url, options={}){
  const t0=Date.now();
  try{
    const r = await fetch(url, { method:'GET', ...options });
    const ms = Date.now()-t0;
    const text = await r.text();
    let json=null; try{ json=JSON.parse(text);}catch{}
    return { ok:r.ok, status:`${r.status} ${r.statusText}`, ms, json, raw:text };
  }catch(e){ return { ok:false, status:e.message||String(e), ms:Date.now()-t0, json:null, raw:'' }; }
}

(async function main(){
  console.log(chalk.bold.cyan('\n=== FULL PROGRAM OVERVIEW ==='));

  // Models
  const models = list('models', f=>f.endsWith('.js'));
  const tModels = new Table({ head:['Model','Pfad','Status'], colWidths:[20,50,18] });
  models.forEach(f=>{
    const name = path.basename(f,'.js');
    try{ require(path.join(CWD,f)); tModels.push([name,f,chalk.green('OK')]); }
    catch{ tModels.push([name,f,chalk.red('Fehler')]); }
  });
  console.log(chalk.bold('\n📦 Models')); console.log(tModels.toString());

  // Public
  const pub = list('public');
  const tPub = new Table({ head:['Datei'], colWidths:[70] });
  pub.forEach(f=>tPub.push([f]));
  console.log(chalk.bold('\n🖼 Public Files')); console.log(tPub.toString());

  // Endpoints (index.js parsen)
  const src = read('index.js');
  const eps = [];
  const re = /\b(app|router)\s*\.\s*(get|post|put|delete|patch|options|head|all)\s*\(\s*(['"`])([^'"`]+)\3/g;
  let m; while((m=re.exec(src))) eps.push({method:m[2].toUpperCase(), path:m[4]});
  const tApi = new Table({ head:['Methode','Pfad'], colWidths:[10,58] });
  eps.forEach(e=>tApi.push([e.method,e.path]));
  console.log(chalk.bold('\n🌐 Express-Endpunkte (aus index.js)'));
  console.log(eps.length? tApi.toString(): chalk.gray('Keine erkannt.'));

  // Netzwerk/Health
  console.log(chalk.bold('\n🔌 Netzwerk & Health'));
  const p = await portCheck(PORT);
  console.log(p.ok?chalk.green(`✔ ${p.msg}`):chalk.red(`✖ Port ${PORT} nicht erreichbar (${p.msg})`));

  const base = `http://localhost:${PORT}`;
  const h  = await hit(`${base}/api/health`);
  console.log((h.ok?chalk.green('✔'):chalk.red('✖'))+` /api/health → ${h.status} (${h.ms}ms)`); if(h.json) console.log(chalk.gray(pretty(h.json)));
  const qh = await hit(`${base}/api/quantum/health`);
  console.log((qh.ok?chalk.green('✔'):chalk.red('✖'))+` /api/quantum/health → ${qh.status} (${qh.ms}ms)`); if(qh.json) console.log(chalk.gray(pretty(qh.json)));
  const qe = await hit(`${base}/api/quantum/execute`, { method:'POST' });
  const earned = qe?.json?.earned; 
  console.log((qe.ok?chalk.green('✔'):chalk.red('✖'))+` /api/quantum/execute → ${qe.status} (${qe.ms}ms)` + (earned!=null?chalk.cyan(` | earned: ${earned}`):'')); 
  if(qe.json) console.log(chalk.gray(pretty(qe.json)));

  console.log(chalk.bold.green('\nFertig ✅\n'));
})();

