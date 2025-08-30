// 🔬 CASPER UNIFIED QUANTUM ECOSYSTEM INTEGRATION
const { casperUnifiedSystem } = require('../../casper-unified-quantum-system');

// Casper System State
let casperInitialized = false;
let lastCasperOptimization = null;
let casperSchedulerActive = false;

// 🚀 Casper System Initialisierung
async function initializeCasperSystem() {
  if (casperInitialized) return;
  
  console.log('🔬 Initialisiere Casper Unified Quantum Ecosystem...');
  
  try {
    const status = await casperUnifiedSystem.initializeCasperSystem();
    casperInitialized = true;
    console.log('✅ Casper System vollständig fusioniert:', status);
    return status;
  } catch (error) {
    console.error('❌ Casper System Initialisierung fehlgeschlagen:', error);
    throw error;
  }
}

// 🚀 Casper Unified Optimization ausführen
async function executeCasperOptimization() {
  if (!casperInitialized) {
    await initializeCasperSystem();
  }
  
  try {
    const results = await casperUnifiedSystem.runCasperUnifiedOptimization();
    lastCasperOptimization = results;
    
    console.log('✅ Casper Unified Optimization erfolgreich:', {
      totalCasperIncome: results.casperIncomeResults,
      casperQuantumBoost: (results.totalCasperOptimization * 100).toFixed(1) + '%',
      casperSynergyBonus: results.casperSynergyBonus.toFixed(3),
      casperUnifiedScore: results.casperUnifiedScore
    });
    
    return results;
  } catch (error) {
    console.error('❌ Casper Optimization fehlgeschlagen:', error);
    throw error;
  }
}

// 📊 Casper Dashboard-Daten abrufen
function getCasperDashboardData() {
  if (!casperInitialized) {
    return {
      status: 'INITIALIZING',
      message: 'Casper Unified System wird initialisiert...',
      system: 'CASPER_UNIFIED_QUANTUM_ECOSYSTEM'
    };
  }
  
  return casperUnifiedSystem.getCasperDashboardData();
}

// 🔄 Casper Scheduler starten
function startCasperScheduler() {
  if (casperSchedulerActive) return;
  
  casperSchedulerActive = true;
  console.log('🔄 Starte Casper Unified Quantum Scheduler...');
  
  casperUnifiedSystem.startCasperScheduler();
}

function stopCasperScheduler() {
  if (casperSchedulerActive) {
    casperUnifiedSystem.stopCasperScheduler();
    casperSchedulerActive = false;
    console.log('🛑 Casper Scheduler gestoppt');
  }
}

// 🏥 Casper System-Health
function getCasperHealth() {
  const status = casperUnifiedSystem.getCasperSystemStatus();
  
  return {
    ok: status.initialized,
    system: 'CASPER_UNIFIED_QUANTUM_ECOSYSTEM',
    initialized: status.initialized,
    lastCasperOptimization: status.lastCasperOptimization,
    totalCasperIncome: status.totalCasperIncome,
    activeCasperQPUs: status.activeCasperQPUs,
    casperSecurityLevel: status.casperSecurityLevel,
    casperUnifiedScore: status.casperUnifiedScore,
    casperSynergyBonus: status.casperSynergyBonus,
    casperMetrics: status.casperMetrics,
    uptime: process.uptime()
  };
}

// 🎯 Casper Income-Optimierung API
async function optimizeCasperIncome(incomeData) {
  const results = await executeCasperOptimization();
  
  return {
    casper_quantum_optimized: true,
    amount: Object.values(results.casperIncomeResults).reduce((sum, stream) => sum + parseFloat(stream.newValue), 0),
    casper_optimization_factor: results.totalCasperOptimization,
    casper_qpu_used: results.casperQuantumState.activeQPUs.join(', '),
    casper_synergyBonus: results.casperSynergyBonus,
    casper_unifiedScore: results.casperUnifiedScore,
    casper_signature: results.casperSignature,
    timestamp: results.timestamp,
    system: 'CASPER_UNIFIED_QUANTUM_ECOSYSTEM'
  };
}

// 🔐 Casper Quantum-Signatur generieren
function generateCasperQuantumSignature(data) {
  return casperUnifiedSystem.generateCasperSignature(data);
}

// 🎮 Casper Stream Management
async function manageCasperStreams(action, streamData) {
  console.log(`🎮 Casper Stream Management: ${action}`);
  
  // Jede Stream-Aktion löst Casper Optimization aus
  const results = await executeCasperOptimization();
  
  return {
    action,
    success: true,
    message: `Casper Stream ${action} erfolgreich`,
    casperOptimizationResult: {
      casperUnifiedScore: results.casperUnifiedScore,
      casperSynergyBonus: results.casperSynergyBonus,
      totalCasperOptimization: results.totalCasperOptimization
    },
    system: 'CASPER_UNIFIED_QUANTUM_ECOSYSTEM'
  };
}

// 📈 Casper Analytics abrufen
function getCasperAnalytics() {
  const dashboardData = getCasperDashboardData();
  
  return {
    casperPredictions: dashboardData.analytics?.predictions || {},
    casperHistory: dashboardData.analytics?.optimizationHistory || [],
    casperMetrics: dashboardData.analytics?.casperMetrics || {},
    casperUnified: dashboardData.unified || {},
    system: 'CASPER_UNIFIED_QUANTUM_ECOSYSTEM'
  };
}

// 🛡️ Casper Security Status
function getCasperSecurity() {
  const dashboardData = getCasperDashboardData();
  
  return {
    ...dashboardData.security,
    system: 'CASPER_UNIFIED_QUANTUM_ECOSYSTEM',
    casperEnhanced: true
  };
}

// Legacy-Kompatibilität für bestehende APIs
const executeOnce = executeCasperOptimization;
const startScheduler = startCasperScheduler;
const stopScheduler = stopCasperScheduler;
const health = getCasperHealth;
const optimizeIncome = optimizeCasperIncome;
const getDashboardData = getCasperDashboardData;

module.exports = {
  // Neue Casper Unified API
  initializeCasperSystem,
  executeCasperOptimization,
  getCasperDashboardData,
  startCasperScheduler,
  stopCasperScheduler,
  getCasperHealth,
  optimizeCasperIncome,
  generateCasperQuantumSignature,
  manageCasperStreams,
  getCasperAnalytics,
  getCasperSecurity,
  
  // Legacy-Kompatibilität
  executeOnce,
  startScheduler,
  stopScheduler,
  health,
  optimizeIncome,
  getDashboardData,
  
  // Direkter Zugriff auf das Casper Unified System
  casperUnifiedSystem
};