async function call(path, opts={}) {
  const r = await fetch(path, { headers:{'content-type':'application/json'}, ...opts });
  return r.json();
}
function show(o){ document.getElementById('out').textContent = JSON.stringify(o,null,2); }

document.getElementById('btn-start').onclick = async () => {
  const cfg = { simulation:true, rebalanceMinutes:2, tickMs:1000, seed:42 };
  show(await call('/api/ams/start', { method:'POST', body: JSON.stringify(cfg) }));
};
document.getElementById('btn-stop').onclick = async () => show(await call('/api/ams/stop', { method:'POST' }));
document.getElementById('btn-reb').onclick = async () => show(await call('/api/ams/rebalance', { method:'POST' }));
document.getElementById('btn-stat').onclick = async () => show(await call('/api/ams/status'));
setInterval(async ()=> {
  try { const s = await call('/api/ams/status'); if (s.ok) show(s); } catch(e){}
}, 2000);
