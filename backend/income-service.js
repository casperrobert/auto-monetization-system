const fs = require('fs');
const path = require('path');

const INCOME_FILE = path.join(__dirname, 'income.json');

class IncomeService {
  constructor() {
    this.incomeData = this.loadIncomeData();
  }

  loadIncomeData() {
    try {
      const data = fs.readFileSync(INCOME_FILE, 'utf8');
      const parsed = JSON.parse(data);
      return parsed.length > 0 ? parsed[0] : this.getDefaultIncome();
    } catch {
      return this.getDefaultIncome();
    }
  }

  getDefaultIncome() {
    return {
      youtube: 1250,
      affiliate: 890,
      dropshipping: 2100,
      dividends: 450,
      p2p: 320,
      reits: 680,
      courses: 1500,
      apps: 750,
      lastUpdated: new Date().toISOString()
    };
  }

  saveIncomeData() {
    fs.writeFileSync(INCOME_FILE, JSON.stringify([this.incomeData], null, 2));
  }

  getIncome() {
    return this.incomeData;
  }

  updateIncome(updates) {
    Object.assign(this.incomeData, updates, { lastUpdated: new Date().toISOString() });
    this.saveIncomeData();
    return this.incomeData;
  }

  simulateUpdate() {
    const variations = [-50, -25, 0, 25, 50, 75, 100];
    const streams = ['youtube', 'affiliate', 'dropshipping', 'dividends', 'p2p', 'reits', 'courses', 'apps'];
    
    streams.forEach(stream => {
      const variation = variations[Math.floor(Math.random() * variations.length)];
      this.incomeData[stream] = Math.max(0, this.incomeData[stream] + variation);
    });
    
    this.incomeData.lastUpdated = new Date().toISOString();
    this.saveIncomeData();
    return this.incomeData;
  }

  getAnalytics() {
    const total = Object.entries(this.incomeData)
      .filter(([key]) => key !== 'lastUpdated')
      .reduce((sum, [_, value]) => sum + value, 0);

    const breakdown = Object.entries(this.incomeData)
      .filter(([key]) => key !== 'lastUpdated')
      .map(([stream, value]) => ({
        stream,
        value,
        percentage: ((value / total) * 100).toFixed(1)
      }))
      .sort((a, b) => b.value - a.value);

    return {
      total,
      breakdown,
      topPerformer: breakdown[0],
      lastUpdated: this.incomeData.lastUpdated
    };
  }
}

module.exports = IncomeService;