const WebSocket = require('ws');
const jwt = require('jsonwebtoken');

class WebSocketService {
  constructor(server) {
    this.wss = new WebSocket.Server({ 
      server,
      verifyClient: this.verifyClient.bind(this)
    });
    this.clients = new Map();
    this.setupWebSocket();
  }

  verifyClient(info) {
    const token = new URL(info.req.url, 'http://localhost').searchParams.get('token');
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecret');
      info.req.user = decoded;
      return true;
    } catch {
      return false;
    }
  }

  setupWebSocket() {
    this.wss.on('connection', (ws, req) => {
      const userId = req.user.username;
      this.clients.set(userId, ws);
      
      ws.on('message', (message) => {
        try {
          const data = JSON.parse(message);
          this.handleMessage(userId, data);
        } catch (error) {
          ws.send(JSON.stringify({ error: 'Invalid message format' }));
        }
      });

      ws.on('close', () => {
        this.clients.delete(userId);
      });

      // Send welcome message
      ws.send(JSON.stringify({
        type: 'connection',
        message: 'WebSocket connected',
        timestamp: new Date().toISOString()
      }));
    });
  }

  handleMessage(userId, data) {
    switch (data.type) {
      case 'subscribe':
        this.subscribe(userId, data.channels);
        break;
      case 'ping':
        this.sendToUser(userId, { type: 'pong', timestamp: new Date().toISOString() });
        break;
    }
  }

  subscribe(userId, channels) {
    const ws = this.clients.get(userId);
    if (ws) {
      ws.channels = channels || ['income', 'tax', 'notifications', 'ai'];
      this.sendToUser(userId, {
        type: 'subscribed',
        channels: ws.channels
      });
    }
  }

  broadcast(message) {
    this.clients.forEach((ws, userId) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          ...message,
          timestamp: new Date().toISOString()
        }));
      }
    });
  }

  sendToUser(userId, message) {
    const ws = this.clients.get(userId);
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        ...message,
        timestamp: new Date().toISOString()
      }));
    }
  }

  sendToChannel(channel, message) {
    this.clients.forEach((ws, userId) => {
      if (ws.readyState === WebSocket.OPEN && ws.channels?.includes(channel)) {
        ws.send(JSON.stringify({
          ...message,
          channel,
          timestamp: new Date().toISOString()
        }));
      }
    });
  }

  // Real-time updates
  notifyIncomeUpdate(incomeData) {
    this.sendToChannel('income', {
      type: 'income_update',
      data: incomeData
    });
  }

  notifyTaxUpdate(taxData) {
    this.sendToChannel('tax', {
      type: 'tax_update',
      data: taxData
    });
  }

  notifyAIOptimization(optimization) {
    this.sendToChannel('ai', {
      type: 'ai_optimization',
      data: optimization
    });
  }

  notifyAlert(alert) {
    this.sendToChannel('notifications', {
      type: 'alert',
      data: alert
    });
  }

  getConnectedUsers() {
    return Array.from(this.clients.keys());
  }
}

module.exports = WebSocketService;