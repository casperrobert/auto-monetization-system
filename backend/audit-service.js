const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const AUDIT_FILE = path.join(__dirname, 'audit-log.json');

class AuditService {
  constructor() {
    this.auditLog = this.loadAuditLog();
  }

  loadAuditLog() {
    try {
      const data = fs.readFileSync(AUDIT_FILE, 'utf8');
      return JSON.parse(data);
    } catch {
      return { entries: [], integrity: this.generateIntegrityHash([]) };
    }
  }

  generateIntegrityHash(entries) {
    return crypto.createHash('sha256').update(JSON.stringify(entries)).digest('hex');
  }

  saveAuditLog() {
    this.auditLog.integrity = this.generateIntegrityHash(this.auditLog.entries);
    fs.writeFileSync(AUDIT_FILE, JSON.stringify(this.auditLog, null, 2));
  }

  logTaxEvent(event, data, userId = 'system') {
    const entry = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      type: 'TAX_EVENT',
      event,
      userId,
      data: this.sanitizeData(data),
      hash: crypto.randomBytes(16).toString('hex'),
      immutable: true
    };

    this.auditLog.entries.push(entry);
    this.saveAuditLog();
    return entry.id;
  }

  logIncomeChange(oldIncome, newIncome, userId) {
    return this.logTaxEvent('INCOME_UPDATED', {
      oldIncome,
      newIncome,
      taxImpact: this.calculateTaxImpact(oldIncome, newIncome)
    }, userId);
  }

  logTaxTransfer(transferData) {
    return this.logTaxEvent('TAX_TRANSFER', transferData);
  }

  logUnauthorizedAccess(endpoint, userId, ip) {
    return this.logTaxEvent('UNAUTHORIZED_ACCESS', {
      endpoint,
      userId,
      ip,
      severity: 'HIGH'
    });
  }

  sanitizeData(data) {
    const sanitized = JSON.parse(JSON.stringify(data));
    // Remove sensitive fields
    delete sanitized.apiKey;
    delete sanitized.password;
    delete sanitized.token;
    return sanitized;
  }

  calculateTaxImpact(oldIncome, newIncome) {
    const TAX_RATES = {
      youtube: 0.19, affiliate: 0.25, dropshipping: 0.30,
      dividends: 0.26375, p2p: 0.26375, reits: 0.26375,
      courses: 0.25, apps: 0.25
    };

    let oldTax = 0, newTax = 0;
    Object.keys(TAX_RATES).forEach(stream => {
      oldTax += (oldIncome[stream] || 0) * TAX_RATES[stream];
      newTax += (newIncome[stream] || 0) * TAX_RATES[stream];
    });

    return {
      oldTaxAmount: Math.round(oldTax * 100) / 100,
      newTaxAmount: Math.round(newTax * 100) / 100,
      difference: Math.round((newTax - oldTax) * 100) / 100
    };
  }

  getAuditTrail(limit = 100) {
    return {
      entries: this.auditLog.entries.slice(-limit).reverse(),
      totalEntries: this.auditLog.entries.length,
      integrityVerified: this.verifyIntegrity()
    };
  }

  verifyIntegrity() {
    const currentHash = this.generateIntegrityHash(this.auditLog.entries);
    return currentHash === this.auditLog.integrity;
  }

  getTaxAuditReport() {
    const taxEvents = this.auditLog.entries.filter(e => e.type === 'TAX_EVENT');
    const transfers = taxEvents.filter(e => e.event === 'TAX_TRANSFER');
    const incomeChanges = taxEvents.filter(e => e.event === 'INCOME_UPDATED');

    return {
      totalTaxEvents: taxEvents.length,
      totalTransfers: transfers.length,
      totalIncomeChanges: incomeChanges.length,
      lastTransfer: transfers[transfers.length - 1]?.timestamp,
      integrityStatus: this.verifyIntegrity() ? 'VERIFIED' : 'COMPROMISED'
    };
  }
}

module.exports = AuditService;