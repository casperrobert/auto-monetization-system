const fs = require('fs');
const path = require('path');

class ComplianceService {
  constructor() {
    this.regulations = {
      DE: {
        maxCashTransaction: 10000,
        taxReportingThreshold: 1000,
        vatRate: 0.19,
        corporateTaxRate: 0.30,
        auditRetentionYears: 10
      },
      EU: {
        gdprCompliant: true,
        vatThreshold: 10000,
        crossBorderReporting: true
      }
    };
  }

  validateTaxCompliance(incomeData, taxReserves) {
    const violations = [];
    const warnings = [];

    // Prüfe Steuerreserven-Verhältnis
    Object.entries(incomeData).forEach(([stream, amount]) => {
      if (stream === 'lastUpdated') return;
      
      const expectedTax = this.calculateExpectedTax(stream, amount);
      const actualReserve = taxReserves[stream]?.taxAmount || 0;
      
      if (Math.abs(expectedTax - actualReserve) > 0.01) {
        violations.push({
          type: 'TAX_MISMATCH',
          stream,
          expected: expectedTax,
          actual: actualReserve,
          severity: 'HIGH'
        });
      }
    });

    // Prüfe Umsatzsteuer-Schwellenwerte
    const totalRevenue = Object.values(incomeData)
      .filter((_, i) => Object.keys(incomeData)[i] !== 'lastUpdated')
      .reduce((sum, val) => sum + val, 0);

    if (totalRevenue > 22000) {
      warnings.push({
        type: 'VAT_THRESHOLD_EXCEEDED',
        message: 'Umsatzsteuer-Kleinunternehmerregelung nicht mehr anwendbar',
        threshold: 22000,
        current: totalRevenue
      });
    }

    // Prüfe Gewerbesteuer-Freibetrag
    const businessIncome = (incomeData.affiliate || 0) + 
                          (incomeData.dropshipping || 0) + 
                          (incomeData.courses || 0) + 
                          (incomeData.apps || 0);

    if (businessIncome > 24500) {
      warnings.push({
        type: 'BUSINESS_TAX_THRESHOLD',
        message: 'Gewerbesteuer-Freibetrag überschritten',
        threshold: 24500,
        current: businessIncome
      });
    }

    return {
      compliant: violations.length === 0,
      violations,
      warnings,
      lastCheck: new Date().toISOString()
    };
  }

  calculateExpectedTax(stream, amount) {
    const rates = {
      youtube: 0.19, affiliate: 0.25, dropshipping: 0.30,
      dividends: 0.26375, p2p: 0.26375, reits: 0.26375,
      courses: 0.25, apps: 0.25
    };
    return Math.round(amount * (rates[stream] || 0) * 100) / 100;
  }

  generateComplianceReport(incomeData, taxData, auditTrail) {
    const compliance = this.validateTaxCompliance(incomeData, taxData.reserves || {});
    
    return {
      reportId: `COMP-${Date.now()}`,
      generatedAt: new Date().toISOString(),
      period: new Date().toISOString().substring(0, 7),
      
      summary: {
        totalIncome: Object.values(incomeData)
          .filter((_, i) => Object.keys(incomeData)[i] !== 'lastUpdated')
          .reduce((sum, val) => sum + val, 0),
        totalTaxReserved: taxData.totalReserved || 0,
        complianceStatus: compliance.compliant ? 'COMPLIANT' : 'NON_COMPLIANT'
      },
      
      compliance,
      
      auditSummary: {
        totalEvents: auditTrail.totalEntries || 0,
        integrityVerified: auditTrail.integrityVerified || false
      },
      
      recommendations: this.generateRecommendations(compliance, incomeData),
      
      certifications: {
        gdprCompliant: true,
        taxTransparency: true,
        auditTrail: true,
        dataIntegrity: auditTrail.integrityVerified || false
      }
    };
  }

  generateRecommendations(compliance, incomeData) {
    const recommendations = [];

    if (compliance.violations.length > 0) {
      recommendations.push({
        priority: 'HIGH',
        action: 'Steuerberechnung korrigieren',
        description: 'Unstimmigkeiten in Steuerreserven beheben'
      });
    }

    const totalIncome = Object.values(incomeData)
      .filter((_, i) => Object.keys(incomeData)[i] !== 'lastUpdated')
      .reduce((sum, val) => sum + val, 0);

    if (totalIncome > 50000) {
      recommendations.push({
        priority: 'MEDIUM',
        action: 'Steuerberater konsultieren',
        description: 'Bei höheren Einkommen professionelle Beratung empfohlen'
      });
    }

    if (compliance.warnings.some(w => w.type === 'VAT_THRESHOLD_EXCEEDED')) {
      recommendations.push({
        priority: 'HIGH',
        action: 'Umsatzsteuer-Registrierung',
        description: 'Anmeldung zur Umsatzsteuer erforderlich'
      });
    }

    return recommendations;
  }

  getRegulationInfo(country = 'DE') {
    return this.regulations[country] || this.regulations.DE;
  }
}

module.exports = ComplianceService;