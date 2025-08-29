const express = require('express');
const cors = require('cors');

class AIService {
  constructor() {
    this.providers = {
      openai: null,
      anthropic: null,
      google: null,
      local: null
    };
    this.optimizations = {
      autoTuning: false,
      marketAnalysis: false,
      riskAssessment: false,
      performanceBoost: false
    };
  }

  async configureProvider(provider, config) {
    try {
      switch (provider) {
        case 'openai':
          if (config.apiKey) {
            this.providers.openai = {
              apiKey: config.apiKey,
              model: config.model || 'gpt-4',
              tier: config.tier || 'free'
            };
          }
          break;
        case 'anthropic':
          if (config.apiKey) {
            this.providers.anthropic = {
              apiKey: config.apiKey,
              model: config.model || 'claude-3',
              tier: config.tier || 'free'
            };
          }
          break;
        case 'google':
          if (config.apiKey) {
            this.providers.google = {
              apiKey: config.apiKey,
              model: config.model || 'gemini-pro',
              tier: config.tier || 'free'
            };
          }
          break;
        case 'local':
          if (config.endpoint) {
            this.providers.local = {
              endpoint: config.endpoint,
              model: config.model || 'll2',
              tier: 'free'
            };
          }
          break;
      }
      return { success: true, message: `${provider} configured successfully` };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async optimizeIncome(incomeData) {
    const optimizations = [];
    
    if (this.optimizations.autoTuning) {
      // Simulate AI-based auto-tuning
      Object.keys(incomeData).forEach(stream => {
        const currentValue = incomeData[stream];
        const optimizedValue = Math.round(currentValue * (1 + Math.random() * 0.2));
        optimizations.push({
          stream,
          current: currentValue,
          optimized: optimizedValue,
          improvement: ((optimizedValue - currentValue) / currentValue * 100).toFixed(1)
        });
      });
    }

    if (this.optimizations.marketAnalysis) {
      optimizations.push({
        type: 'market_trend',
        recommendation: 'Increase focus on YouTube and Dropshipping based on market trends',
        confidence: 85
      });
    }

    if (this.optimizations.riskAssessment) {
      optimizations.push({
        type: 'risk_analysis',
        lowRisk: ['dividends', 'reits'],
        mediumRisk: ['youtube', 'courses'],
        highRisk: ['dropshipping', 'p2p'],
        recommendation: 'Diversify portfolio to reduce overall risk'
      });
    }

    return optimizations;
  }

  async generateInsights(incomeData) {
    const insights = [];
    const totalIncome = Object.values(incomeData).reduce((sum, val) => sum + val, 0);
    
    // Performance insights
    const topPerformer = Object.entries(incomeData).reduce((a, b) => 
      incomeData[a[0]] > incomeData[b[0]] ? a : b
    );
    
    insights.push({
      type: 'performance',
      title: 'Top Performer',
      message: `${topPerformer[0]} generates €${topPerformer[1]} (${((topPerformer[1]/totalIncome)*100).toFixed(1)}% of total income)`,
      priority: 'high'
    });

    // Growth opportunities
    const lowPerformers = Object.entries(incomeData)
      .filter(([_, value]) => value < totalIncome / Object.keys(incomeData).length)
      .map(([key, _]) => key);
    
    if (lowPerformers.length > 0) {
      insights.push({
        type: 'opportunity',
        title: 'Growth Opportunities',
        message: `Focus on improving: ${lowPerformers.join(', ')}`,
        priority: 'medium'
      });
    }

    return insights;
  }

  getStatus() {
    const activeProviders = Object.entries(this.providers)
      .filter(([_, config]) => config !== null).length;
    
    const activeOptimizations = Object.values(this.optimizations)
      .filter(Boolean).length;

    return {
      providers: activeProviders,
      optimizations: activeOptimizations,
      status: activeProviders > 0 ? 'active' : 'inactive',
      capabilities: {
        autoTuning: this.optimizations.autoTuning,
        marketAnalysis: this.optimizations.marketAnalysis,
        riskAssessment: this.optimizations.riskAssessment,
        performanceBoost: this.optimizations.performanceBoost
      }
    };
  }
}

module.exports = AIService;