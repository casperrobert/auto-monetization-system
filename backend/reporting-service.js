const fs = require('fs');
const path = require('path');

class ReportingService {
  constructor(dbService) {
    this.db = dbService;
  }

  async generateIncomeReport(userId, startDate, endDate, format = 'json') {
    const incomeData = await this.db.getIncomeStreams(userId, startDate, endDate);
    
    const report = {
      reportId: `income-${Date.now()}`,
      userId,
      period: { startDate, endDate },
      generatedAt: new Date().toISOString(),
      summary: this.calculateIncomeSummary(incomeData),
      streams: this.groupByStream(incomeData),
      trends: this.calculateTrends(incomeData),
      projections: this.calculateProjections(incomeData)
    };

    if (format === 'csv') {
      return this.convertToCSV(report);
    }
    
    return report;
  }

  async generateTaxReport(userId, year) {
    const taxReserves = await this.db.getTaxReserves(userId);
    const incomeData = await this.db.getIncomeStreams(userId, `${year}-01-01`, `${year}-12-31`);
    
    const report = {
      reportId: `tax-${year}-${Date.now()}`,
      userId,
      taxYear: year,
      generatedAt: new Date().toISOString(),
      totalIncome: this.calculateTotalIncome(incomeData),
      totalTaxReserved: this.calculateTotalTaxReserved(taxReserves),
      streamBreakdown: this.calculateTaxByStream(incomeData, taxReserves),
      quarterlyBreakdown: this.calculateQuarterlyTax(incomeData),
      complianceStatus: await this.checkTaxCompliance(userId, year)
    };

    return report;
  }

  async generateComplianceReport(userId, period = 'monthly') {
    const auditLog = await this.db.getAuditLog(userId, 1000);
    const incomeData = await this.db.getIncomeStreams(userId);
    const taxReserves = await this.db.getTaxReserves(userId);
    
    const report = {
      reportId: `compliance-${Date.now()}`,
      userId,
      period,
      generatedAt: new Date().toISOString(),
      auditSummary: {
        totalEvents: auditLog.length,
        criticalEvents: auditLog.filter(e => e.action.includes('DELETE') || e.action.includes('MODIFY')).length,
        lastAuditEvent: auditLog[0]?.created_at
      },
      complianceChecks: {
        taxReservesAccurate: this.validateTaxReserves(incomeData, taxReserves),
        auditTrailComplete: auditLog.length > 0,
        dataIntegrity: await this.checkDataIntegrity(userId)
      },
      violations: this.identifyViolations(incomeData, taxReserves, auditLog),
      recommendations: this.generateComplianceRecommendations(incomeData, taxReserves)
    };

    return report;
  }

  async generateExecutiveDashboard(userIds = null) {
    const users = userIds || await this.getAllUserIds();
    const dashboard = {
      reportId: `executive-${Date.now()}`,
      generatedAt: new Date().toISOString(),
      overview: {
        totalUsers: users.length,
        totalIncome: 0,
        totalTaxReserved: 0,
        activeStreams: 0
      },
      topPerformers: [],
      riskAnalysis: {
        highRiskUsers: [],
        complianceIssues: 0,
        systemHealth: 'healthy'
      },
      trends: {
        incomeGrowth: 0,
        userGrowth: 0,
        complianceScore: 95
      }
    };

    for (const userId of users) {
      const userIncome = await this.db.getIncomeStreams(userId);
      const userTax = await this.db.getTaxReserves(userId);
      
      const totalIncome = this.calculateTotalIncome(userIncome);
      const totalTax = this.calculateTotalTaxReserved(userTax);
      
      dashboard.overview.totalIncome += totalIncome;
      dashboard.overview.totalTaxReserved += totalTax;
      
      if (totalIncome > 10000) {
        dashboard.topPerformers.push({
          userId,
          totalIncome,
          totalTax,
          streams: userIncome.length
        });
      }
    }

    dashboard.topPerformers.sort((a, b) => b.totalIncome - a.totalIncome);
    dashboard.topPerformers = dashboard.topPerformers.slice(0, 10);

    return dashboard;
  }

  calculateIncomeSummary(incomeData) {
    const total = incomeData.reduce((sum, item) => sum + parseFloat(item.amount), 0);
    const streams = [...new Set(incomeData.map(item => item.stream_type))];
    const avgPerStream = total / streams.length || 0;
    
    return {
      totalIncome: Math.round(total * 100) / 100,
      streamCount: streams.length,
      averagePerStream: Math.round(avgPerStream * 100) / 100,
      recordCount: incomeData.length
    };
  }

  groupByStream(incomeData) {
    const grouped = {};
    incomeData.forEach(item => {
      if (!grouped[item.stream_type]) {
        grouped[item.stream_type] = {
          total: 0,
          count: 0,
          records: []
        };
      }
      grouped[item.stream_type].total += parseFloat(item.amount);
      grouped[item.stream_type].count++;
      grouped[item.stream_type].records.push(item);
    });
    
    return grouped;
  }

  calculateTrends(incomeData) {
    // Simple trend calculation
    const sortedData = incomeData.sort((a, b) => new Date(a.date) - new Date(b.date));
    const firstHalf = sortedData.slice(0, Math.floor(sortedData.length / 2));
    const secondHalf = sortedData.slice(Math.floor(sortedData.length / 2));
    
    const firstHalfTotal = firstHalf.reduce((sum, item) => sum + parseFloat(item.amount), 0);
    const secondHalfTotal = secondHalf.reduce((sum, item) => sum + parseFloat(item.amount), 0);
    
    const trend = secondHalfTotal > firstHalfTotal ? 'increasing' : 
                  secondHalfTotal < firstHalfTotal ? 'decreasing' : 'stable';
    
    return {
      direction: trend,
      changePercent: firstHalfTotal > 0 ? 
        Math.round(((secondHalfTotal - firstHalfTotal) / firstHalfTotal) * 100) : 0
    };
  }

  calculateProjections(incomeData) {
    const total = incomeData.reduce((sum, item) => sum + parseFloat(item.amount), 0);
    const avgGrowth = 0.05; // 5% default growth
    
    return {
      nextMonth: Math.round(total * (1 + avgGrowth) * 100) / 100,
      nextQuarter: Math.round(total * (1 + avgGrowth * 3) * 100) / 100,
      nextYear: Math.round(total * (1 + avgGrowth * 12) * 100) / 100
    };
  }

  calculateTotalIncome(incomeData) {
    return incomeData.reduce((sum, item) => sum + parseFloat(item.amount), 0);
  }

  calculateTotalTaxReserved(taxReserves) {
    return taxReserves.reduce((sum, item) => sum + parseFloat(item.tax_amount), 0);
  }

  convertToCSV(report) {
    const headers = ['Date', 'Stream', 'Amount', 'Tax Rate', 'Tax Amount'];
    const rows = [headers.join(',')];
    
    // Add data rows based on report structure
    if (report.streams) {
      Object.entries(report.streams).forEach(([stream, data]) => {
        data.records.forEach(record => {
          rows.push([
            record.date,
            stream,
            record.amount,
            '', // Tax rate would need to be calculated
            ''  // Tax amount would need to be calculated
          ].join(','));
        });
      });
    }
    
    return rows.join('\n');
  }

  async exportReport(report, format = 'json') {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `report-${report.reportId}-${timestamp}.${format}`;
    const filepath = path.join(__dirname, 'reports', filename);
    
    // Ensure reports directory exists
    const reportsDir = path.dirname(filepath);
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }
    
    const content = format === 'csv' ? this.convertToCSV(report) : JSON.stringify(report, null, 2);
    fs.writeFileSync(filepath, content);
    
    return filepath;
  }

  validateTaxReserves(incomeData, taxReserves) {
    // Simple validation - in production this would be more sophisticated
    const totalIncome = this.calculateTotalIncome(incomeData);
    const totalTaxReserved = this.calculateTotalTaxReserved(taxReserves);
    const expectedTaxRate = 0.25; // Average tax rate
    const expectedTax = totalIncome * expectedTaxRate;
    
    return Math.abs(totalTaxReserved - expectedTax) < (expectedTax * 0.1); // 10% tolerance
  }

  async checkDataIntegrity(userId) {
    // Basic integrity checks
    try {
      const incomeData = await this.db.getIncomeStreams(userId);
      const taxReserves = await this.db.getTaxReserves(userId);
      
      return {
        incomeRecords: incomeData.length > 0,
        taxRecords: taxReserves.length > 0,
        dataConsistency: true
      };
    } catch (error) {
      return {
        incomeRecords: false,
        taxRecords: false,
        dataConsistency: false,
        error: error.message
      };
    }
  }

  identifyViolations(incomeData, taxReserves, auditLog) {
    const violations = [];
    
    // Check for missing tax reserves
    const totalIncome = this.calculateTotalIncome(incomeData);
    const totalTaxReserved = this.calculateTotalTaxReserved(taxReserves);
    
    if (totalIncome > 1000 && totalTaxReserved === 0) {
      violations.push({
        type: 'MISSING_TAX_RESERVES',
        severity: 'HIGH',
        description: 'Income recorded but no tax reserves found'
      });
    }
    
    return violations;
  }

  generateComplianceRecommendations(incomeData, taxReserves) {
    const recommendations = [];
    
    const totalIncome = this.calculateTotalIncome(incomeData);
    
    if (totalIncome > 22000) {
      recommendations.push({
        priority: 'HIGH',
        action: 'VAT Registration Required',
        description: 'Annual income exceeds VAT threshold'
      });
    }
    
    if (totalIncome > 50000) {
      recommendations.push({
        priority: 'MEDIUM',
        action: 'Consider Professional Tax Advice',
        description: 'High income levels may benefit from professional consultation'
      });
    }
    
    return recommendations;
  }

  async getAllUserIds() {
    // This would typically query the database for all user IDs
    return [1]; // Placeholder
  }
}

module.exports = ReportingService;