const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

class BlockchainAuth {
  constructor() {
    this.chain = [];
    this.adminKeys = this.loadAdminKeys();
    this.authSessions = new Map();
    this.initializeGenesis();
  }

  loadAdminKeys() {
    const keysFile = path.join(__dirname, 'admin-keys.json');
    if (fs.existsSync(keysFile)) {
      return JSON.parse(fs.readFileSync(keysFile, 'utf8'));
    }
    
    // Generate master admin keys (NEVER LOSE THESE!)
    const masterKey = crypto.randomBytes(64).toString('hex');
    const recoveryKey = crypto.randomBytes(64).toString('hex');
    const emergencyKey = crypto.randomBytes(64).toString('hex');
    
    const adminKeys = {
      masterKey,
      recoveryKey,
      emergencyKey,
      created: new Date().toISOString(),
      fingerprint: this.generateFingerprint(masterKey)
    };
    
    fs.writeFileSync(keysFile, JSON.stringify(adminKeys, null, 2));
    console.log('🔐 CRITICAL: Admin keys generated. BACKUP IMMEDIATELY!');
    console.log('Master Key:', masterKey);
    console.log('Recovery Key:', recoveryKey);
    console.log('Emergency Key:', emergencyKey);
    
    return adminKeys;
  }

  generateFingerprint(key) {
    return crypto.createHash('sha256').update(key).digest('hex').substring(0, 16);
  }

  initializeGenesis() {
    if (this.chain.length === 0) {
      const genesisBlock = {
        index: 0,
        timestamp: new Date().toISOString(),
        data: {
          type: 'GENESIS',
          adminFingerprint: this.adminKeys.fingerprint,
          immutable: true
        },
        previousHash: '0',
        hash: this.calculateHash({
          index: 0,
          timestamp: new Date().toISOString(),
          data: { type: 'GENESIS' },
          previousHash: '0'
        }),
        nonce: 0
      };
      
      this.chain.push(genesisBlock);
      this.saveChain();
    }
  }

  calculateHash(block) {
    return crypto
      .createHash('sha256')
      .update(block.index + block.previousHash + block.timestamp + JSON.stringify(block.data) + block.nonce)
      .digest('hex');
  }

  validateAdminKey(key) {
    return key === this.adminKeys.masterKey || 
           key === this.adminKeys.recoveryKey || 
           key === this.adminKeys.emergencyKey;
  }

  createSecureSession(adminKey, deviceFingerprint) {
    if (!this.validateAdminKey(adminKey)) {
      throw new Error('UNAUTHORIZED: Invalid admin key');
    }

    const sessionId = crypto.randomUUID();
    const sessionToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const session = {
      sessionId,
      sessionToken,
      adminFingerprint: this.generateFingerprint(adminKey),
      deviceFingerprint,
      createdAt: new Date().toISOString(),
      expiresAt: expiresAt.toISOString(),
      active: true
    };

    this.authSessions.set(sessionId, session);

    return {
      sessionId,
      sessionToken,
      expiresAt: expiresAt.toISOString(),
      adminLevel: 'SUPREME'
    };
  }

  validateSession(sessionId, sessionToken) {
    const session = this.authSessions.get(sessionId);
    
    if (!session || !session.active) {
      return { valid: false, error: 'Session not found' };
    }

    if (new Date() > new Date(session.expiresAt)) {
      session.active = false;
      return { valid: false, error: 'Session expired' };
    }

    if (session.sessionToken !== sessionToken) {
      return { valid: false, error: 'Invalid session token' };
    }

    return { valid: true, session };
  }

  isSupremeAdmin(sessionId, sessionToken) {
    const validation = this.validateSession(sessionId, sessionToken);
    return validation.valid;
  }

  getAdminKeys() {
    return {
      masterKey: this.adminKeys.masterKey,
      recoveryKey: this.adminKeys.recoveryKey,
      emergencyKey: this.adminKeys.emergencyKey,
      fingerprint: this.adminKeys.fingerprint
    };
  }

  saveChain() {
    const chainFile = path.join(__dirname, 'admin-blockchain.json');
    fs.writeFileSync(chainFile, JSON.stringify(this.chain, null, 2));
  }
}

module.exports = BlockchainAuth;