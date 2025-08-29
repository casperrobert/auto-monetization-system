const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const AIService = require('./ai-service');
const AuthService = require('./auth');
const IncomeService = require('./income-service');
const AdminService = require('./admin-service');
const StreamConfigService = require('./stream-config');

const app = express();
const PORT = process.env.PORT || 3002;
const aiService = new AIService();
const authService = new AuthService();
const incomeService = new IncomeService();
const adminService = new AdminService();
const streamService = new StreamConfigService();
const validateSchema = require('./src/middleware/validateSchema');

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

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy', timestamp: new Date().toISOString() });
});

app.get('/', (req, res) => {
  res.json({ message: 'Secure Backend Running', version: '1.0.0' });
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

// Admin Endpoints (Admin only)
const adminAuth = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

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
  adminService.incrementErrors();
  adminService.log('ERROR', err.message);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Secure server running on port ${PORT}`);
});