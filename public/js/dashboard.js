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
