const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const AuditService = require('./audit-service');
const ComplianceService = require('./compliance-service');
let SqliteAdapter;
try { SqliteAdapter = require('./sqlite-adapter'); } catch (e) { SqliteAdapter = null; }

const TAX_FILE = path.join(__dirname, 'tax-escrow.json');
const TAX_RATES = {
  youtube: 0.19,      // 19% Umsatzsteuer + Einkommensteuer
  affiliate: 0.25,    // 25% Gewerbesteuer + Einkommensteuer
  dropshipping: 0.30, // 30% Gewerbe + Umsatz + Einkommen
  dividends: 0.26375, // 26,375% Abgeltungssteuer
  p2p: 0.26375,      // 26,375% Abgeltungssteuer
  reits: 0.26375,    // 26,375% Abgeltungssteuer
  courses: 0.25,     // 25% Gewerbesteuer + Einkommensteuer
  apps: 0.25         // 25% Gewerbesteuer + Einkommensteuer
};

class TaxService {
  constructor(notificationService = null) {
  this.sqlite = SqliteAdapter ? new SqliteAdapter(path.join(process.cwd(),'data','ams.db')) : null;
    this.taxData = this.loadTaxData();
    this.finanzamtAccount = process.env.FINANZAMT_IBAN || 'DE89370400440532013000';
    this.isLocked = true; // Immer gesperrt für Benutzer
    this.auditService = new AuditService();
    this.complianceService = new ComplianceService();
    this.notificationService = notificationService;
  }

  loadTaxData() {
    try {
      if (this.sqlite) {
        const payload = this.sqlite.getKV('taxData');
        if (payload) {
          const dec = this.decrypt(payload);
          return dec ? JSON.parse(dec) : null;
        }
      }
      const data = fs.readFileSync(TAX_FILE, 'utf8');
      // attempt decrypt first
      const maybeDecrypted = this.decrypt(data);
      if (maybeDecrypted) return JSON.parse(maybeDecrypted);
      return JSON.parse(data);
    } catch {
      return {
        totalReserved: 0,
        monthlyReserved: {},
        transactions: [],
        lastTransfer: null,
        escrowAccount: this.generateEscrowAccount()
      };
    }
  }

  generateEscrowAccount() {
    return {
      iban: 'DE' + crypto.randomBytes(8).toString('hex').toUpperCase(),
      bic: 'TAXESCR1XXX',
      holder: 'Steuer-Treuhandkonto AMS',
      locked: true,
      accessLevel: 'FINANZAMT_ONLY'
    };
  }

  saveTaxData() {
    try {
      const payload = this.encrypt(JSON.stringify(this.taxData));
      if (this.sqlite) {
        this.sqlite.setKV('taxData', payload);
        return;
      }
      const tmp = `${TAX_FILE}.tmp`;
      fs.writeFileSync(tmp, payload, 'utf8');
      fs.renameSync(tmp, TAX_FILE);
    } catch (e) {
      console.warn('saveTaxData failed:', e.message);
    }
  }

  encrypt(text) {
    const algorithm = 'aes-256-gcm';
    const key = crypto.scryptSync(process.env.TAX_SECRET || 'tax-secret-key', 'salt', 32);
    const iv = crypto.randomBytes(12); // 96-bit recommended for GCM
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const tag = cipher.getAuthTag();
    return JSON.stringify({ iv: iv.toString('hex'), data: encrypted, tag: tag.toString('hex') });
  }

  decrypt(payload) {
    try {
      const parsed = JSON.parse(payload);
      const algorithm = 'aes-256-gcm';
      const key = crypto.scryptSync(process.env.TAX_SECRET || 'tax-secret-key', 'salt', 32);
      const iv = Buffer.from(parsed.iv, 'hex');
      const tag = Buffer.from(parsed.tag, 'hex');
      const decipher = crypto.createDecipheriv(algorithm, key, iv);
      decipher.setAuthTag(tag);
      let decrypted = decipher.update(parsed.data, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    } catch (e) {
      console.warn('decrypt failed:', e.message);
      return null;
    }
  }

  calculateTaxReserve(incomeData) {
    const reserves = {};
    let totalReserve = 0;

    Object.entries(incomeData).forEach(([stream, amount]) => {
      if (stream !== 'lastUpdated' && TAX_RATES[stream]) {
        const taxAmount = Math.round(amount * TAX_RATES[stream] * 100) / 100;
        reserves[stream] = {
          grossIncome: amount,
          taxRate: TAX_RATES[stream],
          taxAmount: taxAmount,
          netIncome: amount - taxAmount
        };
        totalReserve += taxAmount;
      }
    });

    return {
      reserves,
      totalReserve,
      timestamp: new Date().toISOString()
    };
  }

  updateTaxReserves(incomeData, userId = 'system') {
    const oldData = { ...this.taxData };
    const calculation = this.calculateTaxReserve(incomeData);
    const month = new Date().toISOString().substring(0, 7);
    
    this.taxData.monthlyReserved[month] = calculation;
    this.taxData.totalReserved = Object.values(this.taxData.monthlyReserved)
      .reduce((sum, data) => sum + data.totalReserve, 0);
    
    // Audit-Log für Änderungen
    this.auditService.logIncomeChange(oldData, this.taxData, userId);
    
    // Compliance-Prüfung
    const compliance = this.complianceService.validateTaxCompliance(incomeData, calculation.reserves);
    if (!compliance.compliant && this.notificationService) {
      this.notificationService.notifyComplianceViolation(compliance.violations);
    }
    
    // Automatische Überweisung bei Schwellenwert
    if (this.taxData.totalReserved >= 1000) {
      if (this.notificationService) {
        this.notificationService.notifyTaxThreshold(this.taxData.totalReserved, 1000);
      }
      this.scheduleTransferToFinanzamt();
    }
    
    this.saveTaxData();
    return { ...calculation, compliance };
  }

  scheduleTransferToFinanzamt() {
    const transferId = crypto.randomUUID();
    const transfer = {
      id: transferId,
      amount: this.taxData.totalReserved,
      recipient: {
        name: 'Finanzamt',
        iban: this.finanzamtAccount,
        bic: 'FINANZAMT1XXX'
      },
      purpose: 'Steuervorauszahlung AMS System',
      scheduledDate: new Date().toISOString(),
      status: 'SCHEDULED',
      locked: true,
      userAccess: false
    };

    this.taxData.transactions.push(transfer);
    this.taxData.lastTransfer = new Date().toISOString();
    
    // Simuliere automatische Überweisung
    setTimeout(() => {
      this.executeTransfer(transferId);
    }, 5000);
  }

  executeTransfer(transferId) {
    const transfer = this.taxData.transactions.find(t => t.id === transferId);
    if (transfer) {
      transfer.status = 'COMPLETED';
      transfer.executedDate = new Date().toISOString();
      
      // Audit-Log für Transfer
      this.auditService.logTaxTransfer(transfer);
      
      // Benachrichtigung über Transfer
      if (this.notificationService) {
        this.notificationService.notifyTaxTransfer(transfer);
      }
      
      // Reset nach Überweisung
      this.taxData.totalReserved = 0;
      this.taxData.monthlyReserved = {};
      
      this.saveTaxData();
      console.log(`[TAX] Automatische Überweisung von €${transfer.amount} an Finanzamt ausgeführt`);
    }
  }

  getTaxStatus() {
    return {
      totalReserved: this.taxData.totalReserved,
      escrowAccount: this.taxData.escrowAccount,
      isLocked: this.isLocked,
      userAccess: false,
      lastTransfer: this.taxData.lastTransfer,
      pendingTransfers: this.taxData.transactions.filter(t => t.status === 'SCHEDULED').length,
      message: 'Steuerreserven sind vollständig gesperrt und nur für das Finanzamt zugänglich'
    };
  }

  getTaxBreakdown() {
    const month = new Date().toISOString().substring(0, 7);
    const currentMonth = this.taxData.monthlyReserved[month];
    
    return {
      currentMonth: currentMonth || { reserves: {}, totalReserve: 0 },
      taxRates: TAX_RATES,
      totalReserved: this.taxData.totalReserved,
      accessDenied: true,
      warning: 'Diese Mittel sind ausschließlich für Steuerzahlungen reserviert'
    };
  }

  getComplianceReport(incomeData) {
    const auditTrail = this.auditService.getAuditTrail();
    return this.complianceService.generateComplianceReport(incomeData, this.taxData, auditTrail);
  }

  getAuditTrail(limit) {
    return this.auditService.getAuditTrail(limit);
  }

  // Nur für Finanzamt-API (simuliert)
  getFinanzamtAccess(authCode) {
    if (authCode !== process.env.FINANZAMT_ACCESS_CODE) {
      this.auditService.logUnauthorizedAccess('/api/finanzamt/data', 'unknown', 'unknown');
      throw new Error('Unauthorized: Finanzamt access only');
    }
    
    return {
      fullTaxData: this.taxData,
      transactions: this.taxData.transactions,
      escrowBalance: this.taxData.totalReserved,
      auditTrail: this.auditService.getAuditTrail(1000),
      complianceStatus: this.complianceService.validateTaxCompliance({}, this.taxData)
    };
  }
}

module.exports = TaxService;