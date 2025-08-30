class NotificationService {
  constructor() {
    this.notifications = [];
    this.subscribers = new Map();
  }

  subscribe(userId, callback) {
    if (!this.subscribers.has(userId)) {
      this.subscribers.set(userId, []);
    }
    this.subscribers.get(userId).push(callback);
  }

  notify(userId, notification) {
    const subscribers = this.subscribers.get(userId) || [];
    subscribers.forEach(callback => {
      try {
        callback(notification);
      } catch (error) {
        console.error('Notification callback error:', error);
      }
    });
    
    this.notifications.push({
      ...notification,
      userId,
      timestamp: new Date().toISOString(),
      read: false
    });
  }

  notifyTaxThreshold(amount, threshold) {
    this.notify('admin', {
      type: 'TAX_THRESHOLD',
      severity: 'HIGH',
      title: 'Steuer-Schwellenwert erreicht',
      message: `Steuerreserven von €${amount} erreichen Übertragungsschwelle von €${threshold}`,
      action: 'Automatische Überweisung wird eingeleitet'
    });
  }

  notifyComplianceViolation(violations) {
    this.notify('admin', {
      type: 'COMPLIANCE_VIOLATION',
      severity: 'CRITICAL',
      title: 'Compliance-Verletzung erkannt',
      message: `${violations.length} Verletzung(en) der Steuervorschriften`,
      violations
    });
  }

  notifyTaxTransfer(transfer) {
    this.notify('admin', {
      type: 'TAX_TRANSFER',
      severity: 'INFO',
      title: 'Steuerüberweisung ausgeführt',
      message: `€${transfer.amount} an Finanzamt überwiesen`,
      transferId: transfer.id
    });
  }

  notifyUnauthorizedAccess(endpoint, ip) {
    this.notify('admin', {
      type: 'SECURITY_ALERT',
      severity: 'CRITICAL',
      title: 'Unbefugter Zugriff erkannt',
      message: `Versuchter Zugriff auf ${endpoint} von IP ${ip}`,
      requiresAction: true
    });
  }

  getNotifications(userId, unreadOnly = false) {
    return this.notifications
      .filter(n => n.userId === userId && (!unreadOnly || !n.read))
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }

  markAsRead(notificationId) {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification) {
      notification.read = true;
    }
  }
}

module.exports = NotificationService;