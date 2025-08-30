const webpush = require('web-push');

class PushNotificationService {
  constructor() {
    this.subscriptions = new Map();
    this.setupWebPush();
  }

  setupWebPush() {
    webpush.setVapidDetails(
      'mailto:admin@ams.local',
      process.env.VAPID_PUBLIC_KEY || this.generateVapidKeys().publicKey,
      process.env.VAPID_PRIVATE_KEY || this.generateVapidKeys().privateKey
    );
  }

  generateVapidKeys() {
    // In production, generate these once and store as environment variables
    return {
      publicKey: 'BEl62iUYgUivxIkv69yViEuiBIa40HI0DLLuxN4O5DdR5SdgSKyKzqF7LeRTdl9TcYxjPmck9rqVSVayjOBSBpE',
      privateKey: 'UxbHNRAykSmLAf3qUYQMsWyQNVOotnK544KSK2wKidU'
    };
  }

  subscribe(userId, subscription) {
    this.subscriptions.set(userId, subscription);
    return { success: true, message: 'Subscription saved' };
  }

  unsubscribe(userId) {
    this.subscriptions.delete(userId);
    return { success: true, message: 'Subscription removed' };
  }

  async sendNotification(userId, notification) {
    const subscription = this.subscriptions.get(userId);
    if (!subscription) {
      throw new Error('No subscription found for user');
    }

    const payload = JSON.stringify({
      title: notification.title,
      body: notification.message,
      icon: '/icon-192x192.png',
      badge: '/badge-72x72.png',
      data: {
        url: notification.url || '/',
        timestamp: new Date().toISOString(),
        ...notification.data
      },
      actions: notification.actions || []
    });

    try {
      await webpush.sendNotification(subscription, payload);
      return { success: true };
    } catch (error) {
      console.error('Push notification failed:', error);
      // Remove invalid subscription
      if (error.statusCode === 410) {
        this.subscriptions.delete(userId);
      }
      throw error;
    }
  }

  async broadcast(notification) {
    const results = [];
    
    for (const [userId, subscription] of this.subscriptions) {
      try {
        await this.sendNotification(userId, notification);
        results.push({ userId, success: true });
      } catch (error) {
        results.push({ userId, success: false, error: error.message });
      }
    }
    
    return results;
  }

  // Predefined notification types
  async notifyTaxThreshold(userId, amount) {
    return this.sendNotification(userId, {
      title: '🚨 Steuer-Schwellenwert erreicht',
      message: `Steuerreserven von €${amount} werden automatisch überwiesen`,
      url: '/tax',
      data: { type: 'tax_threshold', amount }
    });
  }

  async notifyIncomeUpdate(userId, stream, newValue) {
    return this.sendNotification(userId, {
      title: '💰 Einkommen aktualisiert',
      message: `${stream}: €${newValue}`,
      url: '/',
      data: { type: 'income_update', stream, value: newValue }
    });
  }

  async notifyAIOptimization(userId, optimization) {
    return this.sendNotification(userId, {
      title: '🤖 KI-Optimierung verfügbar',
      message: `Potentielle Steigerung: €${optimization.expectedImpact}`,
      url: '/ai',
      data: { type: 'ai_optimization', optimization }
    });
  }

  async notifyComplianceAlert(userId, violation) {
    return this.sendNotification(userId, {
      title: '⚠️ Compliance-Warnung',
      message: violation.message,
      url: '/compliance',
      data: { type: 'compliance_alert', violation }
    });
  }

  getVapidPublicKey() {
    return process.env.VAPID_PUBLIC_KEY || this.generateVapidKeys().publicKey;
  }

  getSubscriptionCount() {
    return this.subscriptions.size;
  }

  getSubscriptions() {
    return Array.from(this.subscriptions.keys());
  }
}

module.exports = PushNotificationService;