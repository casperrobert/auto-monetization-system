(async function () {
  const $ = (s) => document.querySelector(s);
  const out = $('#out');
  const health = $('#health');
  const btnExec = $('#btn-exec');
  const btnHealth = $('#btn-health');

  btnExec?.addEventListener('click', async () => {
    const old = btnExec.textContent; btnExec.disabled = true; btnExec.textContent = 'Läuft…';
    try {
      const res = await fetch('/api/quantum/execute', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ demo: true }) });
      out.textContent = JSON.stringify(await res.json(), null, 2);
    } catch (e) { out.textContent = 'Fehler: ' + e; }
    finally { btnExec.disabled = false; btnExec.textContent = old; }
  });

  btnHealth?.addEventListener('click', async () => {
    try {
      const res = await fetch('/api/quantum/health');
      health.textContent = JSON.stringify(await res.json(), null, 2);
    } catch (e) { health.textContent = 'Fehler: ' + e; }
  });
})();
