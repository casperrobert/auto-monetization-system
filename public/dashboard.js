// ====== Globale State ======
let userAccount = null;

// ====== Backendless-Logging (optional) ======
async function logToBackendless(eventType, dataObj) {
  const appId    = (document.getElementById('backendlessAppIdInput') || {}).value?.trim?.() || '';
  const apiKey   = (document.getElementById('backendlessApiKeyInput') || {}).value?.trim?.() || '';
  const table    = (document.getElementById('backendlessTableInput')  || {}).value?.trim?.() || '';
  if (!appId || !apiKey || !table) return;

  const payload = { event: eventType, ...dataObj, timestamp: new Date().toISOString() };
  try {
    const res = await fetch(`https://api.backendless.com/${appId}/${apiKey}/data/${table}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
    });
    if (!res.ok) console.error('Backendless-Logging fehlgeschlagen:', res.status, res.statusText);
  } catch (e) {
    console.error('Backendless-Logging Netzwerkfehler:', e);
  }
}

// ====== Startup: LocalStorage lesen, MetaMask prüfen ======
window.addEventListener('DOMContentLoaded', async () => {
  // LocalStorage → Felder füllen
  const map = {
    affiliateTag: 'affiliateTagInput',
    backendlessAppId: 'backendlessAppIdInput',
    backendlessApiKey: 'backendlessApiKeyInput',
    backendlessTable: 'backendlessTableInput',
  };
  Object.entries(map).forEach(([k, id]) => {
    const v = localStorage.getItem(k); if (v && document.getElementById(id)) document.getElementById(id).value = v;
  });

  // MetaMask vorhanden?
  const connectBtn = document.getElementById('connectButton');
  if (typeof window.ethereum === 'undefined') {
    if (connectBtn) { connectBtn.disabled = true; connectBtn.innerText = 'MetaMask nicht installiert'; }
    return;
  }

  // Prüfen, ob schon autorisierte Accounts existieren
  try {
    const accounts = await window.ethereum.request({ method: 'eth_accounts' });
    if (accounts.length > 0) {
      userAccount = accounts[0];
      const el = document.getElementById('walletAddressDisplay');
      if (el) el.innerText = 'Verbunden: ' + userAccount;
    }
  } catch (e) { console.warn('Wallet-Check fehlgeschlagen:', e); }
});

// ====== Wallet verbinden ======
document.getElementById('connectButton')?.addEventListener('click', async () => {
  if (typeof window.ethereum === 'undefined') return alert('MetaMask nicht gefunden.');
  try {
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    if (accounts.length > 0) {
      userAccount = accounts[0];
      const label = document.getElementById('walletAddressDisplay');
      if (label) label.innerText = 'Verbunden: ' + userAccount;
      const btn = document.getElementById('connectButton');
      if (btn) { btn.innerText = 'Wallet verbunden'; btn.disabled = true; }
      logToBackendless('wallet_connect', { account: userAccount });
    }
  } catch (e) {
    console.error('Wallet-Verbindungsfehler:', e);
    alert('Wallet-Verbindung abgelehnt oder Fehler aufgetreten.');
  }
});

// ====== ERC20-Balance abfragen ======
document.getElementById('checkBalanceButton')?.addEventListener('click', async () => {
  if (!userAccount) return alert('Bitte zuerst die Wallet verbinden.');
  const tokenAddress = (document.getElementById('tokenAddressInput') || {}).value?.trim?.() || '';
  if (!/^0x[a-fA-F0-9]{40}$/.test(tokenAddress)) return alert('Gültige ERC20-Contract-Adresse eingeben.');

  try {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const erc20Abi = [
      "function balanceOf(address owner) view returns (uint256)",
      "function decimals() view returns (uint8)",
      "function symbol() view returns (string)"
    ];
    const token = new ethers.Contract(tokenAddress, erc20Abi, provider);
    const [bal, dec, sym] = await Promise.all([
      token.balanceOf(userAccount),
      token.decimals(),
      token.symbol().catch(() => '')
    ]);
    const human = ethers.utils.formatUnits(bal, dec);
    const text = `Balance: ${human} ${sym || 'Token'}`;
    const out = document.getElementById('balanceResult'); if (out) out.innerText = text;
    logToBackendless('balance_check', { token: tokenAddress, balance: human, symbol: sym });
  } catch (e) {
    console.error('Balance-Fehler:', e); alert('Balance konnte nicht abgerufen werden.');
  }
});

// ====== CoinGecko-Preis ======
document.getElementById('priceButton')?.addEventListener('click', () => {
  const coinId  = (document.getElementById('coinIdInput') || {}).value?.trim?.().toLowerCase() || '';
  const currency= (document.getElementById('currencyInput') || {}).value?.trim?.().toLowerCase() || '';
  if (!coinId) return alert('Coin ID eingeben (z.B. "bitcoin").');
  if (!currency) return alert('Währung eingeben (z.B. "usd").');

  const url = `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=${currency}`;
  fetch(url).then(r=>r.json()).then(data=>{
    const out = document.getElementById('priceResult');
    if (!data || !data[coinId] || data[coinId][currency] === undefined) {
      if (out) out.innerText = `Kein Preis für "${coinId}" verfügbar.`;
      return;
    }
    const price = data[coinId][currency];
    if (out) out.innerText = `Aktueller Preis von ${coinId} in ${currency.toUpperCase()}: ${price}`;
    logToBackendless('price_fetch', { coin: coinId, currency, price });
  }).catch(e=>{
    console.error('CoinGecko-Fehler:', e);
    const out = document.getElementById('priceResult'); if (out) out.innerText = 'Fehler bei der Preisabfrage.';
  });
});

// ====== Amazon Affiliate-Link ======
document.getElementById('generateLinkButton')?.addEventListener('click', () => {
  const productUrl = (document.getElementById('amazonUrlInput') || {}).value?.trim?.() || '';
  const tag = (document.getElementById('affiliateTagInput') || {}).value?.trim?.() || '';
  if (!productUrl || !tag) return alert('Produkt-URL und Affiliate-Tag eingeben.');
  if (!productUrl.includes('amazon.')) return alert('Gültige Amazon-URL eingeben.');

  let finalUrl;
  try {
    const u = new URL(productUrl); u.searchParams.set('tag', tag); finalUrl = u.toString();
  } catch {
    finalUrl = productUrl.includes('tag=') ? productUrl.replace(/tag=[^&]+/, 'tag=' + tag)
                                           : productUrl + (productUrl.includes('?') ? '&' : '?') + 'tag=' + tag;
  }
  const out = document.getElementById('affiliateLinkOutput');
  if (out) out.innerHTML = `<a href="${finalUrl}" target="_blank" rel="noopener">${finalUrl}</a>`;
  localStorage.setItem('affiliateTag', tag);
  logToBackendless('affiliate_generate', { tag, url: finalUrl });
});

// ====== Einstellungen speichern ======
document.getElementById('saveConfigButton')?.addEventListener('click', () => {
  const get = id => (document.getElementById(id) || {}).value?.trim?.() || '';
  const vals = {
    affiliateTag: get('affiliateTagInput'),
    backendlessAppId: get('backendlessAppIdInput'),
    backendlessApiKey: get('backendlessApiKeyInput'),
    backendlessTable: get('backendlessTableInput'),
  };
  Object.entries(vals).forEach(([k,v]) => { if (v) localStorage.setItem(k, v); });
  alert('Einstellungen gespeichert.');
});

// ====== MetaMask Events ======
if (typeof window.ethereum !== 'undefined') {
  window.ethereum.on('accountsChanged', (accounts) => {
    const label = document.getElementById('walletAddressDisplay');
    if (accounts.length > 0) {
      userAccount = accounts[0];
      if (label) label.innerText = 'Verbunden: ' + userAccount;
      const bal = document.getElementById('balanceResult'); if (bal) bal.innerText = '';
      logToBackendless('wallet_account_changed', { newAccount: userAccount });
    } else {
      userAccount = null;
      if (label) label.innerText = 'Nicht verbunden';
      const btn = document.getElementById('connectButton'); if (btn) { btn.innerText = '🔗 Mit MetaMask verbinden'; btn.disabled = false; }
      const bal = document.getElementById('balanceResult'); if (bal) bal.innerText = '';
      logToBackendless('wallet_account_changed', { disconnected: true });
    }
  });
  window.ethereum.on('chainChanged', (chainId) => console.log('Netzwerk geändert:', chainId));
}

// ====== Backend-Buttons (Health / Quantum) ======
async function callHealth() {
  const res = await fetch('/api/health'); const data = await res.json();
  alert('Server OK: ' + data.ok + '\nZeit: ' + data.time);
}
async function callQuantumHealth() {
  const res = await fetch('/api/quantum/health'); const data = await res.json();
  alert('Quantum OK: ' + data.ok + '\nScheduler: ' + data.scheduler + '\nLastRun: ' + data.lastRun);
}
async function callQuantumExecute() {
  const btn = document.getElementById('btn-exec'); const old = btn ? btn.textContent : '';
  if (btn) { btn.disabled = true; btn.textContent = '…läuft'; }
  try {
    const res = await fetch('/api/quantum/execute', { method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify({ demo:true }) });
    const data = await res.json(); alert('Execute OK: earned=' + data.earned);
  } catch(e){ alert('Fehler: ' + (e.message || e)); }
  finally { if (btn) { btn.disabled = false; btn.textContent = old; } }
}

// Buttons verbinden
window.addEventListener('DOMContentLoaded', () => {
  document.getElementById('btn-health')?.addEventListener('click', callHealth);
  document.getElementById('btn-qhealth')?.addEventListener('click', callQuantumHealth);
  document.getElementById('btn-exec')?.addEventListener('click', callQuantumExecute);

  // zusätzlicher Button (falls vorhanden) um direkt Quantum-Ergebnis im <pre id="out-quantum"> zu zeigen:
  const btnQ = document.getElementById('btn-quantum');
  const outQ = document.getElementById('out-quantum');
  if (btnQ && outQ) {
    btnQ.addEventListener('click', async () => {
      btnQ.disabled = true; const old = btnQ.textContent; btnQ.textContent = 'Läuft…';
      outQ.textContent = '';
      try {
        const r = await fetch('/api/quantum/execute', { method:'POST' });
        const d = await r.json(); outQ.textContent = JSON.stringify(d, null, 2);
      } catch(e){ outQ.textContent = 'Fehler: ' + e; }
      finally { btnQ.disabled = false; btnQ.textContent = old; }
    });
  }
});
// Dashboard-Logik: Event-Handler für die Buttons