// 🔬 UNIFIED QUANTUM AUTO-MONETIZATION SERVER
const express = require('express');
const cors = require('cors');
const path = require('path');
const { 
  initializeUnifiedSystem, 
  executeUnifiedOptimization, 
  getDashboardData, 
  startUnifiedScheduler, 
  getUnifiedHealth,
  optimizeIncome 
} = require('./quantum-integration');

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// 🚀 System beim Start initialisieren
let systemReady = false;

async function bootUnifiedSystem() {
  try {
    console.log('🔬 Booting Unified Quantum Ecosystem...');
    await initializeUnifiedSystem();
    startUnifiedScheduler();
    systemReady = true;
    console.log('✅ Unified System vollständig online');
  } catch (error) {
    console.error('❌ System Boot fehlgeschlagen:', error);
  }
}

// System beim Start booten
bootUnifiedSystem();

// 🌐 API Routes - Alle Systeme verschmolzen

// 📊 Dashboard-Daten (Unified)
app.get('/api/dashboard', (req, res) => {
  try {
    const data = getDashboardData();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 🔬 Quantum Status (Unified)
app.get('/api/quantum/status', (req, res) => {
  try {
    const health = getUnifiedHealth();
    res.json(health);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 🚀 Quantum Optimization (Unified)
app.post('/api/quantum/optimize', async (req, res) => {
  try {
    const result = await optimizeIncome(req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 💰 Income Data (Unified)
app.get('/api/income', (req, res) => {
  try {
    const dashboardData = getDashboardData();
    res.json({
      total: dashboardData.income?.total || 0,
      streams: dashboardData.income?.streams || {},
      lastUpdate: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 📈 Analytics (Unified)
app.get('/api/analytics', (req, res) => {
  try {
    const dashboardData = getDashboardData();
    res.json({
      predictions: dashboardData.analytics?.predictions || {},
      history: dashboardData.analytics?.optimizationHistory || [],
      unified: dashboardData.unified || {}
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 🛡️ Security Status (Unified)
app.get('/api/security', (req, res) => {
  try {
    const dashboardData = getDashboardData();
    res.json(dashboardData.security || {});
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 🎮 Stream Management (Unified)
app.post('/api/streams/:action', async (req, res) => {
  const { action } = req.params;
  
  try {
    // Alle Stream-Aktionen lösen Unified Optimization aus
    const result = await executeUnifiedOptimization();
    
    res.json({
      action,
      success: true,
      message: `Stream ${action} erfolgreich`,
      optimizationResult: {
        unifiedScore: result.unifiedScore,
        synergyBonus: result.synergyBonus,
        totalOptimization: result.totalOptimization
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 🏥 Health Check (Unified)
app.get('/api/health', (req, res) => {
  const health = getUnifiedHealth();
  res.json(health);
});

// 🔄 Manual Optimization Trigger
app.post('/api/optimize', async (req, res) => {
  try {
    const result = await executeUnifiedOptimization();
    res.json({
      success: true,
      result,
      message: 'Unified Optimization erfolgreich ausgeführt'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 📊 Real-time System Stats
app.get('/api/stats', (req, res) => {
  try {
    const dashboardData = getDashboardData();
    const health = getUnifiedHealth();
    
    res.json({
      system: 'UNIFIED_QUANTUM_ECOSYSTEM',
      status: systemReady ? 'ONLINE' : 'BOOTING',
      quantum: dashboardData.quantum || {},
      income: dashboardData.income || {},
      security: dashboardData.security || {},
      unified: dashboardData.unified || {},
      health: health,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 🌐 Frontend Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/dashboard-complete.html'));
});

app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/dashboard-complete.html'));
});

// 🚀 Server starten
app.listen(PORT, () => {
  console.log(`🔬 Unified Quantum Auto-Monetization Server läuft auf Port ${PORT}`);
  console.log(`🌐 Dashboard: http://localhost:${PORT}`);
  console.log(`📊 API: http://localhost:${PORT}/api/stats`);
});

// Graceful Shutdown
process.on('SIGTERM', () => {
  console.log('🛑 Unified System wird heruntergefahren...');
  process.exit(0);
});

module.exports = app;