(function(){
  const $=s=>document.querySelector(s);
  const y=document.getElementById('year'); if(y) y.textContent=new Date().getFullYear();

  // Config lokal speichern
  const lsKey='casper24_cfg';
  const cfg = JSON.parse(localStorage.getItem(lsKey) || '{"affTag":"","appId":"","apiKey":"","table":"Transactions"}');
  const set=()=>localStorage.setItem(lsKey, JSON.stringify(cfg));
  const val=(id)=>{const el=$(id); return el?el.value.trim():""};

  const aff=$('#cfg-aff'), app=$('#cfg-app'), key=$('#cfg-key'), tab=$('#cfg-table');
  if(aff) aff.value=cfg.affTag; if(app) app.value=cfg.appId; if(key) key.value=cfg.apiKey; if(tab) tab.value=cfg.table||'Transactions';
  $('#save-cfg')?.addEventListener('click',()=>{ cfg.affTag=aff.value.trim(); cfg.appId=app.value.trim(); cfg.apiKey=key.value.trim(); cfg.table=tab.value.trim()||'Transactions'; set(); alert('Gespeichert.'); });
  $('#clear-cfg')?.addEventListener('click',()=>{ localStorage.removeItem(lsKey); location.reload(); });

  // Wallet
  let web3;
  const out = (m)=>{ const el=$('#tx-out'); if(el) el.textContent=(el.textContent+'\n'+m).trim(); };
  $('#btn-connect')?.addEventListener('click', async()=>{
    try{
      if(!window.ethereum){ alert('MetaMask nicht gefunden'); return; }
      await window.ethereum.request({method:'eth_requestAccounts'});
      web3 = new Web3(window.ethereum);
      const [acc] = await web3.eth.getAccounts();
      $('#wallet-info').textContent = 'Verbunden: '+acc;
    }catch(e){ out('Wallet-Fehler: '+e.message); }
  });
  $('#btn-send')?.addEventListener('click', async()=>{
    try{
      if(!web3){ alert('Erst Wallet verbinden'); return; }
      const to = val('#send-to'); const eth = parseFloat(val('#send-amount'));
      if(!/^0x[a-fA-F0-9]{40}$/.test(to)) return alert('Zieladresse prüfen');
      if(!(eth>0)) return alert('Betrag eingeben');
      const [from] = await web3.eth.getAccounts();
      const value = web3.utils.toWei(String(eth),'ether');
      const tx = await web3.eth.sendTransaction({from,to,value});
      out('TX: '+tx.transactionHash);
    }catch(e){ out('Senden fehlgeschlagen: '+e.message); }
  });

  // Preise (CoinGecko)
  let currentPrices = {};
  const loadPrices = async ()=>{
    try{
      const ids='bitcoin,ethereum,solana';
      const r = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`);
      if(!r.ok) throw new Error('API '+r.status);
      const d = await r.json();
      currentPrices = {
        'BTC': d.bitcoin?.usd || 0,
        'ETH': d.ethereum?.usd || 0,
        'SOL': d.solana?.usd || 0
      };
      const tb = document.querySelector('#price-table tbody'); if(!tb) return;
      tb.innerHTML='';
      [['Bitcoin','bitcoin','BTC'],['Ethereum','ethereum','ETH'],['Solana','solana','SOL']].forEach(([n,k,symbol])=>{
        const p=d[k]; const tr=document.createElement('tr');
        tr.innerHTML = `<td>${n}</td><td>$${p.usd.toLocaleString('en-US',{maximumFractionDigits:2})}</td><td>${(p.usd_24h_change||0).toFixed(2)}%</td>`;
        tb.appendChild(tr);
      });
      $('#price-ts').textContent='Aktualisiert: '+new Date().toLocaleTimeString();
      // Update P&L calculations when prices change
      if(window.PLHelper) window.PLHelper.updatePLCalculations();
    }catch{ $('#price-ts').textContent='Preisfeed nicht erreichbar'; }
  };
  $('#btn-prices')?.addEventListener('click', loadPrices);
  loadPrices();

  // Make currentPrices available globally for P&L calculations
  window.getCurrentPrices = () => currentPrices;

  // Affiliate-Link
  $('#btn-build')?.addEventListener('click', ()=>{
    const url = val('#aff-url');
    if(!url) return alert('URL einfügen');
    if(!cfg.affTag) return alert('Affiliate-Tag in den Einstellungen speichern');
    try{
      const u=new URL(url);
      if(!u.hostname.includes('amazon.')) return alert('Keine Amazon-URL');
      u.searchParams.set('tag', cfg.affTag);
      $('#aff-out').value = u.toString();
    }catch{ alert('Ungültige URL'); }
  });

  // Einnahmen-Log lokal
  const logKey='casper24_logs';
  const read=()=>JSON.parse(localStorage.getItem(logKey)||'[]');
  const write=(r)=>localStorage.setItem(logKey,JSON.stringify(r));
  const render=()=>{ const rows=read(); const tb=document.querySelector('#log-table tbody'); if(!tb) return; tb.innerHTML=''; rows.forEach(r=>{ const tr=document.createElement('tr'); tr.innerHTML=`<td>${new Date(r.ts).toLocaleString()}</td><td>${r.source}</td><td>$${Number(r.amount).toFixed(2)}</td>`; tb.appendChild(tr); }); };
  $('#btn-log')?.addEventListener('click', ()=>{
    const a=parseFloat(val('#log-amount')); const s=val('#log-source')||'Manuell';
    if(!(a>0)) return alert('Betrag eingeben');
    const rows=read(); rows.unshift({ts:Date.now(),source:s,amount:a}); write(rows); render();
    $('#log-amount').value=''; $('#log-source').value='';
  });
  render();
})();