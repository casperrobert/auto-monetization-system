// === in index.js einfügen ===
app.get('/api/debug/config', async (req, res) => {
  const safe = (v, mask = true) =>
    v ? (mask ? '(hidden)' : v) : undefined;

  let quantumStatus = { available: false };
  try {
    if (quantum?.health) {
      const h = await quantum.health();
      quantumStatus = { available: true, ...h };
    }
  } catch (e) {
    quantumStatus = { available: !!quantum, error: String(e?.message || e) };
  }

  res.json({
    app: {
      name: require('./package.json').name,
      version: require('./package.json').version,
      pid: process.pid,
      uptimeSec: Math.round(process.uptime()),
      node: process.version,
      cwd: process.cwd()
    },
    env: {
      PORT: process.env.PORT,
      MOCK_MODE: process.env.MOCK_MODE,
      USE_QUANTUM: process.env.USE_QUANTUM,
      KAFKA_BROKERS: process.env.KAFKA_BROKERS,
      KAFKA_SSL: process.env.KAFKA_SSL,
      BACKENDLESS_APP_ID: process.env.BACKENDLESS_APP_ID,
      BACKENDLESS_API_KEY: safe(process.env.BACKENDLESS_API_KEY),
      BACKENDLESS_TABLE: process.env.BACKENDLESS_TABLE,
      QUANTUM_ENCRYPTION_KEY: safe(process.env.QUANTUM_ENCRYPTION_KEY)
    },
    quantum: quantumStatus,
    endpoints: {
      health: '/api/health',
      quantumHealth: '/api/quantum/health',
      quantumExecute: '/api/quantum/execute'
    },
    files: {
      index: require('fs').existsSync('./index.js'),
      quantum: require('fs').existsSync('./src/quantum/quantum.js'),
      dashboardHtml: require('fs').existsSync('./public/dashboard.html'),
      dashboardJs: require('fs').existsSync('./public/js/dashboard.js')
    }
  });
});

// === in index.js einfügen ===
app.get('/api/debug/quantum', async (req, res) => {