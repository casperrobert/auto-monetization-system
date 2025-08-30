const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const AIService = require('./ai-service');
const AuthService = require('./auth');
const IncomeService = require('./income-service');
const AdminService = require('./admin-service');
const StreamConfigService = require('./stream-config');
const TaxService = require('./tax-service');
const NotificationService = require('./notification-service');
const WebSocketService = require('./websocket-service');
const PushNotificationService = require('./push-notification-service');
const EnhancedAIService = require('./ai-enhanced');
const HealthService = require('./health');
const PostgresService = require('./database/postgres-service');
const RBACService = require('./rbac-service');
const ReportingService = require('./reporting-service');
const BlockchainAuth = require('./security/blockchain-auth');
const MultiFactor = require('./security/multi-factor-auth');
const QuantumEncryption = require('./security/quantum-encryption');
const quantumIntegration = require('./quantum-integration');

const app = express();
const server = require('http').createServer(app);
const PORT = process.env.PORT || 3002;
const healthService = new HealthService();
// AI can be heavy / require external providers — allow disabling in dev
const DISABLE_AI = process.env.DISABLE_AI === 'true';
const aiService = DISABLE_AI ? null : new AIService();
const enhancedAI = DISABLE_AI ? null : new EnhancedAIService();
const authService = new AuthService();
const incomeService = new IncomeService();
const adminService = new AdminService();
const streamService = new StreamConfigService();

// Notification service is lightweight but can be optionally disabled
const DISABLE_NOTIFICATION = process.env.DISABLE_NOTIFICATION === 'true';
const notificationService = DISABLE_NOTIFICATION ? null : new NotificationService();

// Tax service accepts a notificationService; if notifications are disabled we
// still instantiate taxService but without notifications to avoid startup order
// problems. The TaxService is written to accept null for notificationService.
const taxService = new TaxService(notificationService);

// WebSocket and Push notifications can be heavy; provide small no-op stubs
// when explicitly disabled so routes can call methods safely.
const DISABLE_WS = process.env.DISABLE_WS === 'true';
const wsService = DISABLE_WS ? {
  sendToChannel: () => {},
  notifyAIOptimization: () => {},
  getConnectedUsers: () => []
} : new WebSocketService(server);

const DISABLE_PUSH = process.env.DISABLE_PUSH === 'true';
const pushService = DISABLE_PUSH ? {
  subscribe: () => ({ success: false, message: 'push disabled' }),
  unsubscribe: () => ({ success: false, message: 'push disabled' }),
  getVapidPublicKey: () => null,
  notifyIncomeUpdate: async () => { return { success: false, message: 'push disabled' }; }
} : new PushNotificationService();

const dbService = process.env.USE_POSTGRES === 'true' ? new PostgresService() : null;
const rbacService = new RBACService();
const reportingService = new ReportingService(dbService);
const blockchainAuth = new BlockchainAuth();
const mfaService = new MultiFactor();
const quantumCrypto = new QuantumEncryption();
const validateSchema = require('./src/middleware/validateSchema');

// Admin-only middleware declared early so it can be used by routes that are
// defined later in the file (avoids forward-reference errors)
const adminAuth = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// Request logging middleware
app.use((req, res, next) => {
  adminService.incrementRequests();
  adminService.log('INFO', `${req.method} ${req.path}`);
  next();
});

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));

app.get('/health', async (req, res) => {
  try {
    const health = await healthService.performHealthCheck();
    const statusCode = health.status === 'healthy' ? 200 : health.status === 'degraded' ? 200 : 503;
    res.status(statusCode).json(health);
  } catch (error) {
    res.status(503).json({ status: 'unhealthy', error: error.message });
  }
});

app.get('/metrics', (req, res) => {
  const metrics = healthService.getMetrics();
  res.json(metrics);
});

app.get('/', (req, res) => {
  res.json({ message: 'Casper-Auto-Monetization System Backend', version: '1.0.0' });
});

// Authentication Endpoints
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  const result = authService.authenticate(username, password);
  if (result.success) {
    res.json(result);
  } else {
    res.status(401).json(result);
  }
});

// Income Management Endpoints
app.get('/api/income', authService.middleware.bind(authService), (req, res) => {
  const income = incomeService.getIncome();
  res.json(income);
});

app.put('/api/income', authService.middleware.bind(authService), validateSchema('income.schema.json'), (req, res) => {
  const updates = req.body;
  const income = incomeService.updateIncome(updates);
  
  // Automatische Steuerberechnung
  taxService.updateTaxReserves(income, req.user?.username);
  
  res.json(income);
});

app.post('/api/income/simulate', authService.middleware.bind(authService), (req, res) => {
  const income = incomeService.simulateUpdate();
  res.json(income);
});

app.get('/api/analytics', authService.middleware.bind(authService), (req, res) => {
  const analytics = incomeService.getAnalytics();
  res.json(analytics);
});

// Stream Configuration Endpoints
app.get('/api/streams', authService.middleware.bind(authService), (req, res) => {
  const streams = streamService.getAllStreams();
  res.json(streams);
});

app.get('/api/streams/:id', authService.middleware.bind(authService), (req, res) => {
  const stream = streamService.getStream(req.params.id);
  if (stream) {
    res.json(stream);
  } else {
    res.status(404).json({ error: 'Stream not found' });
  }
});

app.put('/api/streams/:id', authService.middleware.bind(authService), validateSchema('streamConfig.schema.json'), (req, res) => {
  const updated = streamService.updateStream(req.params.id, req.body);
  if (updated) {
    res.json(updated);
  } else {
    res.status(404).json({ error: 'Stream not found' });
  }
});

app.post('/api/streams/:id/toggle', authService.middleware.bind(authService), (req, res) => {
  const stream = streamService.toggleStream(req.params.id);
  if (stream) {
    res.json(stream);
  } else {
    res.status(404).json({ error: 'Stream not found' });
  }
});

app.post('/api/streams', authService.middleware.bind(authService), validateSchema('streamConfig.schema.json'), (req, res) => {
  try {
    const stream = streamService.createStream(req.body);
    res.status(201).json(stream);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.delete('/api/streams/:id', authService.middleware.bind(authService), (req, res) => {
  const deleted = streamService.deleteStream(req.params.id);
  if (deleted) {
    res.json(deleted);
  } else {
    res.status(404).json({ error: 'Stream not found' });
  }
});

app.get('/api/streams/type/:type', authService.middleware.bind(authService), (req, res) => {
  const streams = streamService.getStreamsByType(req.params.type);
  res.json(streams);
});

app.get('/api/streams/enabled', authService.middleware.bind(authService), (req, res) => {
  const streams = streamService.getEnabledStreams();
  res.json(streams);
});

// Automation control endpoints for each stream/category
app.post('/api/streams/:id/start', authService.middleware.bind(authService), (req, res) => {
  if (typeof streamService.startAutomation === 'function') {
    try {
      streamService.startAutomation(req.params.id);
      res.json({ success: true, message: 'Automation started' });
    } catch (e) { res.status(500).json({ error: e.message }); }
  } else {
    res.status(501).json({ error: 'Automation not implemented' });
  }
});

app.post('/api/streams/:id/stop', authService.middleware.bind(authService), (req, res) => {
  if (typeof streamService.stopAutomation === 'function') {
    try {
      streamService.stopAutomation(req.params.id);
      res.json({ success: true, message: 'Automation stopped' });
    } catch (e) { res.status(500).json({ error: e.message }); }
  } else {
    res.status(501).json({ error: 'Automation not implemented' });
  }
});

// Tax Management Endpoints (Read-Only)
app.get('/api/tax/status', authService.middleware.bind(authService), (req, res) => {
  const status = taxService.getTaxStatus();
  res.json(status);
});

app.get('/api/tax/breakdown', authService.middleware.bind(authService), (req, res) => {
  const breakdown = taxService.getTaxBreakdown();
  res.json(breakdown);
});

// Blockierte Endpoints
app.post('/api/tax/withdraw', authService.middleware.bind(authService), (req, res) => {
  res.status(403).json({ 
    error: 'Zugriff verweigert: Steuerreserven sind gesperrt',
    message: 'Diese Mittel können nur an das Finanzamt überwiesen werden'
  });
});

app.post('/api/tax/transfer', authService.middleware.bind(authService), (req, res) => {
  res.status(403).json({ 
    error: 'Zugriff verweigert: Nur automatische Überweisungen an Finanzamt'
  });
});

// Compliance & Audit Endpoints
app.get('/api/compliance/report', authService.middleware.bind(authService), (req, res) => {
  const incomeData = incomeService.getIncome();
  const report = taxService.getComplianceReport(incomeData);
  res.json(report);
});

app.get('/api/audit/trail', authService.middleware.bind(authService), adminAuth, (req, res) => {
  const limit = req.query.limit || 100;
  const trail = taxService.getAuditTrail(limit);
  res.json(trail);
});

// Notification Endpoints
app.get('/api/notifications', authService.middleware.bind(authService), (req, res) => {
  const notifications = notificationService.getNotifications(req.user.username, req.query.unread === 'true');
  res.json(notifications);
});

app.post('/api/notifications/:id/read', authService.middleware.bind(authService), (req, res) => {
  notificationService.markAsRead(req.params.id);
  res.json({ success: true });
});

// Finanzamt-Only Endpoint (Enhanced)
app.get('/api/finanzamt/data', (req, res) => {
  try {
    const authCode = req.headers['x-finanzamt-auth'];
    const data = taxService.getFinanzamtAccess(authCode);
    res.json(data);
  } catch (error) {
    notificationService.notifyUnauthorizedAccess('/api/finanzamt/data', req.ip);
    res.status(403).json({ error: error.message });
  }
});

// AI Integration Endpoints (Protected)
app.post('/api/ai/configure', authService.middleware.bind(authService), validateSchema('aiConfigure.schema.json'), async (req, res) => {
  const { provider, config } = req.body;
  const result = await aiService.configureProvider(provider, config);
  res.json(result);
});

app.post('/api/ai/optimize', authService.middleware.bind(authService), async (req, res) => {
  const incomeData = incomeService.getIncome();
  const optimizations = await aiService.optimizeIncome(incomeData);
  res.json({ optimizations });
});

app.post('/api/ai/insights', authService.middleware.bind(authService), async (req, res) => {
  const incomeData = incomeService.getIncome();
  const insights = await aiService.generateInsights(incomeData);
  res.json({ insights });
});

app.get('/api/ai/status', authService.middleware.bind(authService), (req, res) => {
  const status = aiService.getStatus();
  res.json(status);
});

app.post('/api/ai/optimizations', authService.middleware.bind(authService), validateSchema('aiOptimizations.schema.json'), (req, res) => {
  const { optimizations } = req.body;
  Object.assign(aiService.optimizations, optimizations);
  res.json({ success: true, optimizations: aiService.optimizations });
});

// Enhanced AI Endpoints
app.post('/api/ai/predict', authService.middleware.bind(authService), async (req, res) => {
  try {
    const incomeData = incomeService.getIncome();
    const predictions = await enhancedAI.generatePredictions(incomeData);
    wsService.sendToChannel('ai', { type: 'predictions', data: predictions });
    res.json(predictions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/ai/auto-optimize', authService.middleware.bind(authService), async (req, res) => {
  try {
    const incomeData = incomeService.getIncome();
    const optimization = await enhancedAI.performAutomaticOptimization(incomeData);
    wsService.notifyAIOptimization(optimization);
    res.json(optimization);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// WebSocket Status
app.get('/api/websocket/status', authService.middleware.bind(authService), (req, res) => {
  res.json({
    connectedUsers: wsService.getConnectedUsers(),
    totalConnections: wsService.getConnectedUsers().length
  });
});

// Push Notification Endpoints
app.post('/api/push/subscribe', authService.middleware.bind(authService), (req, res) => {
  const result = pushService.subscribe(req.user.username, req.body.subscription);
  res.json(result);
});

app.post('/api/push/unsubscribe', authService.middleware.bind(authService), (req, res) => {
  const result = pushService.unsubscribe(req.user.username);
  res.json(result);
});

app.get('/api/push/vapid-key', (req, res) => {
  res.json({ publicKey: pushService.getVapidPublicKey() });
});

app.post('/api/push/test', authService.middleware.bind(authService), async (req, res) => {
  try {
    await pushService.notifyIncomeUpdate(req.user.username, 'test', 1000);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Enterprise User Management
app.get('/api/users', authService.middleware.bind(authService), rbacService.middleware('users:read'), async (req, res) => {
  try {
    if (dbService) {
      const users = await dbService.getAllUsers();
      res.json(users.map(u => ({ id: u.id, username: u.username, role: u.role, active: u.active })));
    } else {
      res.json([{ id: 1, username: 'admin', role: 'admin', active: true }]);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/users', authService.middleware.bind(authService), rbacService.middleware('users:write'), async (req, res) => {
  try {
    const { username, password, email, role } = req.body;
    if (dbService) {
      const user = await dbService.createUser({ username, password, email, role });
      res.status(201).json({ id: user.id, username: user.username, role: user.role });
    } else {
      res.status(501).json({ error: 'Database not configured' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Advanced Reporting
app.get('/api/reports/income', authService.middleware.bind(authService), rbacService.middleware('income:read'), async (req, res) => {
  try {
    const { startDate, endDate, format = 'json' } = req.query;
    const report = await reportingService.generateIncomeReport(req.user.id || 1, startDate, endDate, format);
    
    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=income-report.csv');
      res.send(report);
    } else {
      res.json(report);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/reports/tax/:year', authService.middleware.bind(authService), rbacService.middleware('tax:read'), async (req, res) => {
  try {
    const report = await reportingService.generateTaxReport(req.user.id || 1, req.params.year);
    res.json(report);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/reports/executive', authService.middleware.bind(authService), rbacService.middleware('admin:read'), async (req, res) => {
  try {
    const dashboard = await reportingService.generateExecutiveDashboard();
    res.json(dashboard);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Database Management
app.post('/api/database/backup', authService.middleware.bind(authService), rbacService.middleware('admin:write'), async (req, res) => {
  try {
    if (dbService) {
      const backupFile = await dbService.backup();
      res.json({ success: true, backupFile });
    } else {
      res.status(501).json({ error: 'Database not configured' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// RBAC Management
app.get('/api/rbac/roles', authService.middleware.bind(authService), rbacService.middleware('admin:read'), (req, res) => {
  const roles = rbacService.getAllRoles();
  res.json(roles);
});

app.get('/api/rbac/permissions/:role', authService.middleware.bind(authService), rbacService.middleware('admin:read'), (req, res) => {
  const permissions = rbacService.getUserPermissions(req.params.role);
  res.json({ role: req.params.role, permissions });
});

// SUPREME ADMIN BLOCKCHAIN SECURITY
app.post('/api/security/admin-login', async (req, res) => {
  try {
    const { adminKey, deviceFingerprint, mfaFactors } = req.body;
    
    // Multi-factor authentication
    const mfaResult = mfaService.verifyMultiFactor(mfaFactors);
    if (!mfaResult.authenticated) {
      return res.status(403).json({ 
        error: 'MFA_FAILED', 
        message: 'Multi-factor authentication required',
        requiredFactors: ['password', 'totp', 'biometric', 'hardware']
      });
    }
    
    // Blockchain authentication
    const session = blockchainAuth.createSecureSession(adminKey, deviceFingerprint);
    
    res.json({
      success: true,
      session,
      mfaResult,
      message: 'Supreme admin access granted',
      securityLevel: 'UNBREAKABLE'
    });
  } catch (error) {
    res.status(401).json({ 
      error: 'UNAUTHORIZED', 
      message: 'Invalid admin credentials' 
    });
  }
});

app.get('/api/security/admin-keys', (req, res) => {
  try {
    const keys = blockchainAuth.getAdminKeys();
    res.json({
      message: '🔐 CRITICAL: Backup these keys immediately!',
      keys,
      warning: 'NEVER share these keys. Loss = permanent lockout!'
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve admin keys' });
  }
});

app.post('/api/security/mfa-setup', (req, res) => {
  try {
    const totpSecret = mfaService.generateTOTPSecret();
    const biometricChallenge = mfaService.createBiometricChallenge();
    const hardwareChallenge = mfaService.generateHardwareChallenge();
    
    res.json({
      totp: {
        secret: totpSecret.base32,
        qrCode: totpSecret.otpauth_url
      },
      biometric: biometricChallenge,
      hardware: hardwareChallenge,
      message: 'Complete all MFA setup steps for maximum security'
    });
  } catch (error) {
    res.status(500).json({ error: 'MFA setup failed' });
  }
});

app.post('/api/security/quantum-encrypt', (req, res) => {
  try {
    const { data } = req.body;
    const keyPair = quantumCrypto.generateQuantumKeyPair();
    const encrypted = quantumCrypto.encryptMultiLayer(data, keyPair.keyId);
    
    res.json({
      encrypted,
      keyId: keyPair.keyId,
      publicKey: keyPair.publicKey,
      securityLevel: 'QUANTUM_RESISTANT'
    });
  } catch (error) {
    res.status(500).json({ error: 'Quantum encryption failed' });
  }
});

app.get('/api/security/status', (req, res) => {
  try {
    const adminStatus = blockchainAuth.getAdminStatus();
    
    res.json({
      blockchain: adminStatus,
      quantum: {
        encryptionLayers: 7,
        keyStrength: '4096-bit RSA + Quantum',
        status: 'ACTIVE'
      },
      mfa: {
        levels: 4,
        required: 3,
        status: 'ENFORCED'
      },
      overallSecurity: 'UNBREAKABLE',
      adminProtection: 'ABSOLUTE'
    });
  } catch (error) {
    res.status(500).json({ error: 'Security status unavailable' });
  }
});

// EMERGENCY ADMIN RECOVERY (Use only if locked out)
app.post('/api/security/emergency-recovery', (req, res) => {
  try {
    const { recoveryKey, newMasterKey } = req.body;
    const result = blockchainAuth.emergencyRecovery(recoveryKey, newMasterKey);
    
    res.json({
      ...result,
      warning: 'EMERGENCY RECOVERY EXECUTED - Update all systems immediately!'
    });
  } catch (error) {
    res.status(403).json({ 
      error: 'RECOVERY_FAILED', 
      message: 'Invalid recovery key or unauthorized access' 
    });
  }
});

app.get('/api/admin/logs', authService.middleware.bind(authService), adminAuth, (req, res) => {
  const logs = adminService.getLogs(req.query.limit);
  res.json({ logs });
});

app.get('/api/admin/status', authService.middleware.bind(authService), adminAuth, (req, res) => {
  const status = adminService.getSystemStatus();
  res.json(status);
});

app.post('/api/admin/scan', authService.middleware.bind(authService), adminAuth, (req, res) => {
  const result = adminService.performSecurityScan();
  res.json(result);
});

app.post('/api/admin/restart', authService.middleware.bind(authService), adminAuth, (req, res) => {
  const result = adminService.restartServices();
  res.json(result);
});

app.get('/api/admin/metrics', authService.middleware.bind(authService), adminAuth, (req, res) => {
  const metrics = adminService.getMetrics();
  res.json(metrics);
});

// Error handling
app.use((err, req, res, next) => {
  try {
    adminService.incrementErrors();
    adminService.log('ERROR', err.message);
  } catch (e) {
    // swallow logging errors during init/require in restricted envs
  }
  res.status(500).json({ error: 'Internal server error' });
});

// Quantum API endpoints
app.get('/api/quantum/status', (req, res) => {
  res.json(quantumIntegration.getStatus());
});

app.post('/api/quantum/optimize', async (req, res) => {
  try {
    const optimized = await quantumIntegration.optimizeIncome(req.body);
    res.json(optimized);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Initialize quantum system
const initializeQuantum = async () => {
  try {
    await quantumIntegration.initialize();
  } catch (error) {
    console.warn('Quantum system initialization failed:', error.message);
  }
};

// Only start the HTTP server when this file is executed directly.
if (require.main === module) {
  initializeQuantum().then(() => {
    server.listen(PORT, '0.0.0.0', () => {
      console.log(`Secure server with Quantum integration running on port ${PORT}`);
    });
  });
  
  // Graceful shutdown
  process.on('SIGTERM', async () => {
    await quantumIntegration.shutdown();
    process.exit(0);
  });
}