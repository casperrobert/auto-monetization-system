window.dashboardInit = async function () {
  document.addEventListener('DOMContentLoaded', () => {
    console.log('dashboard.js minimal loaded');

    const byId = (id) => document.getElementById(id);

    byId('btn-health')?.addEventListener('click', async () => {
      const r = await fetch('/api/health');
      alert(JSON.stringify(await r.json(), null, 2));
    });

    byId('btn-qhealth')?.addEventListener('click', async () => {
      const r = await fetch('/api/quantum/health');
      alert(JSON.stringify(await r.json(), null, 2));
    });

    byId('btn-exec')?.addEventListener('click', async () => {
      const r = await fetch('/api/quantum/execute', { method: 'POST' });
      alert(JSON.stringify(await r.json(), null, 2));
    });
  });
};

// public/dashboard.js
window.dashboardInit = function () {
  const $ = (id) => document.getElementById(id);
  const setText = (id, t) => { const el = $(id); if (el) el.textContent = t; };

  async function fetchJSON(url, opt = {}) {
    const r = await fetch(url, opt);
    if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
    return r.json();
  }

  function renderTable(tableId, rows) {
    const table = $(tableId); if (!table) return;
    table.innerHTML = "";
    const data = Array.isArray(rows) ? rows : (Array.isArray(rows?.items) ? rows.items : (rows ? [rows] : []));
    if (!data.length) { table.innerHTML = "<tbody><tr><td>Keine Daten</td></tr></tbody>"; return; }

    const cols = Array.from(data.reduce((s, r) => { Object.keys(r||{}).forEach(k => s.add(k)); return s; }, new Set()));
    const thead = document.createElement("thead");
    const trh = document.createElement("tr");
    cols.forEach(c => { const th = document.createElement("th"); th.textContent = c; trh.appendChild(th); });
    thead.appendChild(trh);

    const tbody = document.createElement("tbody");
    data.forEach(r => {
      const tr = document.createElement("tr");
      cols.forEach(c => {
        const td = document.createElement("td");
        let v = r?.[c]; if (v && typeof v === "object") v = JSON.stringify(v);
        td.textContent = v ?? ""; tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });

    table.appendChild(thead); table.appendChild(tbody);
  }

  async function loadAndRender(path, tableId) {
    setText("status", `Lade ${path} …`);
    try {
      const data = await fetchJSON(path);
      renderTable(tableId, data);
      setText("status", `OK: ${path}`);
    } catch (e) {
      console.error(e);
      setText("status", `Fehler bei ${path}: ${e.message || e}`);
    }
  }

  // Buttons
  $("btn-health")?.addEventListener("click", async () => {
    try { const d = await fetchJSON("/api/health"); alert("Server OK: " + d.ok + "\nZeit: " + d.time); }
    catch(e){ alert("Health-Fehler: " + (e.message||e)); }
  });

  $("btn-qhealth")?.addEventListener("click", async () => {
    try { const d = await fetchJSON("/api/quantum/health"); alert("Quantum OK: " + d.ok + "\nScheduler: " + d.scheduler + "\nLastRun: " + d.lastRun); }
    catch(e){ alert("Quantum-Fehler: " + (e.message||e)); }
  });

  $("btn-exec")?.addEventListener("click", async () => {
    const btn = $("btn-exec"); const old = btn?.textContent;
    if (btn) { btn.disabled = true; btn.textContent = "…läuft"; }
    try {
      const d = await fetchJSON("/api/quantum/execute", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ demo: true }) });
      alert("Execute OK: earned=" + d.earned);
    } catch (e) {
      alert("Execute-Fehler: " + (e.message || e));
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = old; }
    }
  });

  $("btn-load-all")?.addEventListener("click", async () => {
    await Promise.all([
      loadAndRender("/api/courses", "tbl-courses"),
      loadAndRender("/api/dropshipping", "tbl-dropshipping"),
      loadAndRender("/api/dividends", "tbl-dividends"),
    ]);
  });
};

async function callAPI(url, options = {}) {
  const res = await fetch(url, options);
  return res.json();
}

document.getElementById("btn-exec").addEventListener("click", async () => {
  const out = document.getElementById("out");
  out.textContent = "⏳ starte…";
  try {
    const data = await callAPI("/api/quantum/execute", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ demo: true })
    });
    out.textContent = JSON.stringify(data, null, 2);
  } catch (err) {
    out.textContent = "❌ Fehler: " + err.message;
  }
});

document.getElementById("btn-health").addEventListener("click", async () => {
  const out = document.getElementById("health");
  out.textContent = "⏳ prüfe…";
  try {
    const data = await callAPI("/api/quantum/health");
    out.textContent = JSON.stringify(data, null, 2);
  } catch (err) {
    out.textContent = "❌ Fehler: " + err.message;
  }
});

let chart; // global

function initChart() {
  const ctx = document.getElementById('earningsChart').getContext('2d');
  chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: [], // Zeitstempel
      datasets: [{
        label: 'Einnahmen (EUR)',
        data: [],
        fill: false,
        borderColor: '#007bff',
        tension: 0.1
      }]
    },
    options: {
      responsive: true,
      scales: {
        x: { title: { display: true, text: 'Zeit' } },
        y: { title: { display: true, text: 'EUR' } }
      }
    }
  });
}

function updateChart(value) {
  if (!chart) return;
  const now = new Date().toLocaleTimeString();
  chart.data.labels.push(now);
  chart.data.datasets[0].data.push(value);
  if (chart.data.labels.length > 20) {
    chart.data.labels.shift();
    chart.data.datasets[0].data.shift();
  }
  chart.update();
}

async function callAPI(url, options = {}) {
  const res = await fetch(url, options);
  return res.json();
}

document.getElementById("btn-exec").addEventListener("click", async () => {
  const out = document.getElementById("out");
  out.textContent = "⏳ starte…";
  try {
    const data = await callAPI("/api/quantum/execute", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ demo: true })
    });
    out.textContent = JSON.stringify(data, null, 2);
    if (data.earned) updateChart(data.earned);
  } catch (err) {
    out.textContent = "❌ Fehler: " + err.message;
  }
});

document.getElementById("btn-health").addEventListener("click", async () => {
  const out = document.getElementById("health");
  out.textContent = "⏳ prüfe…";
  try {
    const data = await callAPI("/api/quantum/health");
    out.textContent = JSON.stringify(data, null, 2);
  } catch (err) {
    out.textContent = "❌ Fehler: " + err.message;
  }
});

window.addEventListener("DOMContentLoaded", initChart);


let chart; // global

function initChart() {
  const ctx = document.getElementById('earningsChart').getContext('2d');
  chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: [], // Zeitstempel
      datasets: [{
        label: 'Einnahmen (EUR)',
        data: [],
        fill: false,
        borderColor: '#007bff',
        tension: 0.1
      }]
    },
    options: {
      responsive: true,
      animation: false,
      scales: {
        x: { title: { display: true, text: 'Zeit' } },
        y: { title: { display: true, text: 'EUR' } }
      }
    }
  });
}

function updateChart(value) {
  if (!chart) return;
  const now = new Date().toLocaleTimeString();
  chart.data.labels.push(now);
  chart.data.datasets[0].data.push(value);
  if (chart.data.labels.length > 20) {
    chart.data.labels.shift();
    chart.data.datasets[0].data.shift();
  }
  chart.update();
}

async function callAPI(url, options = {}) {
  const res = await fetch(url, options);
  return res.json();
}

// --- Buttons ---
document.getElementById("btn-exec").addEventListener("click", async () => {
  const out = document.getElementById("out");
  out.textContent = "⏳ starte…";
  try {
    const data = await callAPI("/api/quantum/execute", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ demo: true })
    });
    out.textContent = JSON.stringify(data, null, 2);
    if (data.earned) updateChart(data.earned);
  } catch (err) {
    out.textContent = "❌ Fehler: " + err.message;
  }
});

document.getElementById("btn-health").addEventListener("click", async () => {
  const out = document.getElementById("health");
  out.textContent = "⏳ prüfe…";
  try {
    const data = await callAPI("/api/quantum/health");
    out.textContent = JSON.stringify(data, null, 2);
  } catch (err) {
    out.textContent = "❌ Fehler: " + err.message;
  }
});

// --- Automatischer Abruf alle 10 Sekunden ---
async function autoFetch() {
  try {
    const data = await callAPI("/api/quantum/execute", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ demo: true })
    });
    if (data.earned) updateChart(data.earned);
  } catch (err) {
    console.error("AutoFetch Fehler:", err.message);
  }
}

window.addEventListener("DOMContentLoaded", () => {
  initChart();
  setInterval(autoFetch, 10000); // alle 10 Sekunden
});

let chart;       // Einzelwerte
let totalChart;  // Gesamtsumme
let totalEarned = 0;

// --- Chart 1: Einzelwerte ---
function initChart() {
  const ctx = document.getElementById('earningsChart').getContext('2d');
  chart = new Chart(ctx, {
    type: 'line',
    data: { labels: [], datasets: [{
      label: 'Einnahmen (EUR)',
      data: [],
      borderColor: '#007bff',
      fill: false,
      tension: 0.1
    }]},
    options: { responsive: true, animation: false }
  });
}

// --- Chart 2: Gesamtsumme ---
function initTotalChart() {
  const ctx = document.getElementById('totalChart').getContext('2d');
  totalChart = new Chart(ctx, {
    type: 'line',
    data: { labels: [], datasets: [{
      label: 'Gesamt (EUR)',
      data: [],
      borderColor: '#28a745',
      fill: true,
      backgroundColor: 'rgba(40,167,69,0.1)',
      tension: 0.1
    }]},
    options: { responsive: true, animation: false }
  });
}

function updateCharts(value) {
  const now = new Date().toLocaleTimeString();

  // Einzelwerte
  chart.data.labels.push(now);
  chart.data.datasets[0].data.push(value);
  if (chart.data.labels.length > 20) {
    chart.data.labels.shift();
    chart.data.datasets[0].data.shift();
  }
  chart.update();

  // Gesamtsumme
  totalEarned += value;
  totalChart.data.labels.push(now);
  totalChart.data.datasets[0].data.push(totalEarned);
  if (totalChart.data.labels.length > 20) {
    totalChart.data.labels.shift();
    totalChart.data.datasets[0].data.shift();
  }
  totalChart.update();
}

// --- API & Auto-Fetch bleibt gleich ---
async function callAPI(url, options = {}) {
  const res = await fetch(url, options);
  return res.json();
}

async function autoFetch() {
  try {
    const data = await callAPI("/api/quantum/execute", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ demo: true })
    });
    if (data.earned) updateCharts(data.earned);
  } catch (err) {
    console.error("AutoFetch Fehler:", err.message);
  }
}

window.addEventListener("DOMContentLoaded", () => {
  initChart();
  initTotalChart();
  setInterval(autoFetch, 10000);
});

let chart;
let totalChart;
let totalEarned = 0;
let lastEntries = [];

// ... (initChart und initTotalChart bleiben wie zuvor)

function updateCharts(value) {
  const now = new Date().toLocaleTimeString();

  // Einzelwerte-Chart
  chart.data.labels.push(now);
  chart.data.datasets[0].data.push(value);
  if (chart.data.labels.length > 20) {
    chart.data.labels.shift();
    chart.data.datasets[0].data.shift();
  }
  chart.update();

  // Gesamtsumme
  totalEarned += value;
  totalChart.data.labels.push(now);
  totalChart.data.datasets[0].data.push(totalEarned);
  if (totalChart.data.labels.length > 20) {
    totalChart.data.labels.shift();
    totalChart.data.datasets[0].data.shift();
  }
  totalChart.update();

  // Tabelle aktualisieren
  updateTable(now, value, totalEarned);
}

function updateTable(time, value, total) {
  const tbody = document.querySelector("#earningsTable tbody");

  // Neuen Eintrag speichern
  lastEntries.unshift({ time, value, total });
  if (lastEntries.length > 10) lastEntries.pop();

  // Tabelle neu rendern
  tbody.innerHTML = lastEntries.map(e => `
    <tr>
      <td>${e.time}</td>
      <td>${e.value.toFixed(2)}</td>
      <td>${e.total.toFixed(2)}</td>
    </tr>
  `).join("");
}

