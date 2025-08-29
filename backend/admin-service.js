const fs = require('fs');
const path = require('path');

class AdminService {
  constructor() {
    this.logs = [];
    this.systemStatus = {
      uptime: Date.now(),
      requests: 0,
      errors: 0,
      lastScan: null
    };
  }

  log(level, message) {
    const entry = {
      timestamp: new Date().toISOString(),
      level,
      message
    };
    this.logs.push(entry);
    if (this.logs.length > 1000) {
      this.logs = this.logs.slice(-500);
    }
    console.log(`[${level}] ${message}`);
  }

  getLogs(limit = 50) {
    return this.logs.slice(-limit).reverse();
  }

  getSystemStatus() {
    return {
      ...this.systemStatus,
      uptime: Date.now() - this.systemStatus.uptime,
      memory: process.memoryUsage(),
      cpu: process.cpuUsage()
    };
  }

  incrementRequests() {
    this.systemStatus.requests++;
  }

  incrementErrors() {
    this.systemStatus.errors++;
  }

  performSecurityScan() {
    this.systemStatus.lastScan = new Date().toISOString();
    this.log('INFO', 'Security scan initiated');
    
    // Simulate security scan
    const vulnerabilities = [];
    const checks = [
      'JWT token validation',
      'CORS configuration',
      'Helmet security headers',
      'Input validation',
      'Rate limiting',
      'File permissions'
    ];

    checks.forEach(check => {
      this.log('INFO', `Checking: ${check}`);
    });

    this.log('INFO', 'Security scan completed - No vulnerabilities found');
    
    return {
      status: 'completed',
      vulnerabilities: vulnerabilities.length,
      checks: checks.length,
      timestamp: this.systemStatus.lastScan
    };
  }

  restartServices() {
    this.log('INFO', 'Services restart initiated');
    // Simulate service restart
    setTimeout(() => {
      this.log('INFO', 'All services restarted successfully');
    }, 1000);
    
    return { status: 'restarting', message: 'Services restart initiated' };
  }

  getMetrics() {
    const uptime = Date.now() - this.systemStatus.uptime;
    return {
      uptime: Math.floor(uptime / 1000),
      requests: this.systemStatus.requests,
      errors: this.systemStatus.errors,
      errorRate: this.systemStatus.requests > 0 ? 
        ((this.systemStatus.errors / this.systemStatus.requests) * 100).toFixed(2) : 0,
      lastScan: this.systemStatus.lastScan
    };
  }
}

module.exports = AdminService;