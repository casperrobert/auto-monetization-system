/**
 * P&L Helper - Profit & Loss Calculation System
 * Manages cryptocurrency trading transactions and calculates P&L
 */
(function() {
  'use strict';
  
  const PLHelper = {
    // Storage keys
    plKey: 'casper24_pl_transactions',
    holdingsKey: 'casper24_holdings',
    
    // Initialize the P&L system
    init() {
      this.setupEventListeners();
      this.setDefaultDate();
      this.renderTransactions();
      this.updateHoldings();
      this.updateSummary();
    },
    
    // Setup event listeners
    setupEventListeners() {
      const $ = document.querySelector.bind(document);
      
      $('#btn-add-pl')?.addEventListener('click', () => this.addTransaction());
      $('#btn-export-pl')?.addEventListener('click', () => this.exportToCSV());
      $('#btn-clear-pl')?.addEventListener('click', () => this.clearAllTransactions());
      
      // Set current date/time as default
      this.setDefaultDate();
    },
    
    // Set default date to current time
    setDefaultDate() {
      const now = new Date();
      const localISOTime = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
      const dateInput = document.querySelector('#pl-date');
      if (dateInput && !dateInput.value) {
        dateInput.value = localISOTime;
      }
    },
    
    // Get form values
    getFormValues() {
      const getValue = (id) => document.querySelector(id)?.value.trim() || '';
      
      return {
        asset: getValue('#pl-asset').toUpperCase(),
        type: getValue('#pl-type'),
        amount: parseFloat(getValue('#pl-amount')) || 0,
        price: parseFloat(getValue('#pl-price')) || 0,
        date: getValue('#pl-date')
      };
    },
    
    // Clear form
    clearForm() {
      ['#pl-asset', '#pl-amount', '#pl-price'].forEach(id => {
        const el = document.querySelector(id);
        if (el) el.value = '';
      });
      this.setDefaultDate();
    },
    
    // Add new transaction
    addTransaction() {
      const values = this.getFormValues();
      
      // Validation
      if (!values.asset) return alert('Asset eingeben (z.B. BTC, ETH)');
      if (values.amount <= 0) return alert('Gültige Menge eingeben');
      if (values.price <= 0) return alert('Gültigen Preis eingeben');
      if (!values.date) return alert('Datum auswählen');
      
      const transaction = {
        id: Date.now() + Math.random(),
        timestamp: new Date(values.date).getTime(),
        asset: values.asset,
        type: values.type,
        amount: values.amount,
        price: values.price,
        value: values.amount * values.price,
        date: values.date
      };
      
      // Save transaction
      const transactions = this.getTransactions();
      transactions.unshift(transaction);
      this.saveTransactions(transactions);
      
      // Update displays
      this.renderTransactions();
      this.updateHoldings();
      this.updateSummary();
      this.clearForm();
      
      console.log('Transaction added:', transaction);
    },
    
    // Get all transactions from storage
    getTransactions() {
      return JSON.parse(localStorage.getItem(this.plKey) || '[]');
    },
    
    // Save transactions to storage
    saveTransactions(transactions) {
      localStorage.setItem(this.plKey, JSON.stringify(transactions));
    },
    
    // Delete a transaction
    deleteTransaction(id) {
      if (!confirm('Transaktion löschen?')) return;
      
      const transactions = this.getTransactions().filter(t => t.id !== id);
      this.saveTransactions(transactions);
      this.renderTransactions();
      this.updateHoldings();
      this.updateSummary();
    },
    
    // Clear all transactions
    clearAllTransactions() {
      if (!confirm('Alle P&L Transaktionen löschen?')) return;
      
      localStorage.removeItem(this.plKey);
      localStorage.removeItem(this.holdingsKey);
      this.renderTransactions();
      this.updateHoldings();
      this.updateSummary();
    },
    
    // Render transactions table
    renderTransactions() {
      const tbody = document.querySelector('#pl-table tbody');
      if (!tbody) return;
      
      const transactions = this.getTransactions();
      tbody.innerHTML = '';
      
      transactions.forEach(tx => {
        const pl = this.calculateTransactionPL(tx);
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${new Date(tx.timestamp).toLocaleString()}</td>
          <td>${tx.asset}</td>
          <td><span class="badge ${tx.type}">${tx.type === 'buy' ? 'Kauf' : 'Verkauf'}</span></td>
          <td>${tx.amount.toFixed(6)}</td>
          <td>$${tx.price.toFixed(2)}</td>
          <td>$${tx.value.toFixed(2)}</td>
          <td class="${pl >= 0 ? 'profit' : 'loss'}">${pl !== null ? '$' + pl.toFixed(2) : '-'}</td>
          <td><button class="btn btn-sm btn-danger" onclick="PLHelper.deleteTransaction(${tx.id})">Löschen</button></td>
        `;
        tbody.appendChild(row);
      });
    },
    
    // Calculate P&L for a specific transaction
    calculateTransactionPL(sellTx) {
      if (sellTx.type !== 'sell') return null;
      
      const transactions = this.getTransactions();
      const buyTxs = transactions
        .filter(tx => tx.asset === sellTx.asset && tx.type === 'buy' && tx.timestamp < sellTx.timestamp)
        .sort((a, b) => a.timestamp - b.timestamp); // FIFO
      
      let remainingAmount = sellTx.amount;
      let totalCost = 0;
      
      for (const buyTx of buyTxs) {
        if (remainingAmount <= 0) break;
        
        const usedAmount = Math.min(remainingAmount, buyTx.amount);
        totalCost += usedAmount * buyTx.price;
        remainingAmount -= usedAmount;
      }
      
      if (remainingAmount > 0) return null; // Not enough buy transactions
      
      const sellValue = sellTx.amount * sellTx.price;
      return sellValue - totalCost;
    },
    
    // Update holdings display
    updateHoldings() {
      const tbody = document.querySelector('#holdings-table tbody');
      if (!tbody) return;
      
      const holdings = this.calculateHoldings();
      const currentPrices = window.getCurrentPrices ? window.getCurrentPrices() : {};
      
      tbody.innerHTML = '';
      
      Object.entries(holdings).forEach(([asset, data]) => {
        if (data.amount <= 0.00001) return; // Skip very small amounts
        
        const currentPrice = currentPrices[asset] || 0;
        const currentValue = data.amount * currentPrice;
        const pl = currentValue - (data.amount * data.avgPrice);
        const plPercent = data.avgPrice > 0 ? ((currentPrice - data.avgPrice) / data.avgPrice * 100) : 0;
        
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${asset}</td>
          <td>${data.amount.toFixed(6)}</td>
          <td>$${data.avgPrice.toFixed(2)}</td>
          <td>$${currentPrice.toFixed(2)}</td>
          <td>$${currentValue.toFixed(2)}</td>
          <td class="${pl >= 0 ? 'profit' : 'loss'}">$${pl.toFixed(2)}</td>
          <td class="${plPercent >= 0 ? 'profit' : 'loss'}">${plPercent.toFixed(2)}%</td>
        `;
        tbody.appendChild(row);
      });
    },
    
    // Calculate current holdings
    calculateHoldings() {
      const transactions = this.getTransactions();
      const holdings = {};
      
      transactions.forEach(tx => {
        if (!holdings[tx.asset]) {
          holdings[tx.asset] = { amount: 0, totalCost: 0, avgPrice: 0 };
        }
        
        const holding = holdings[tx.asset];
        
        if (tx.type === 'buy') {
          holding.totalCost += tx.value;
          holding.amount += tx.amount;
        } else if (tx.type === 'sell') {
          // FIFO calculation for average price adjustment
          const sellRatio = tx.amount / holding.amount;
          holding.totalCost *= (1 - sellRatio);
          holding.amount -= tx.amount;
        }
        
        holding.avgPrice = holding.amount > 0 ? holding.totalCost / holding.amount : 0;
        
        // Handle edge cases to prevent NaN
        if (isNaN(holding.avgPrice) || !isFinite(holding.avgPrice)) {
          holding.avgPrice = 0;
        }
        if (isNaN(holding.totalCost) || !isFinite(holding.totalCost)) {
          holding.totalCost = 0;
        }
        if (isNaN(holding.amount) || !isFinite(holding.amount)) {
          holding.amount = 0;
        }
      });
      
      return holdings;
    },
    
    // Update P&L summary
    updateSummary() {
      const transactions = this.getTransactions();
      const holdings = this.calculateHoldings();
      const currentPrices = window.getCurrentPrices ? window.getCurrentPrices() : {};
      
      // Calculate realized P&L (from completed sells)
      let realizedPL = 0;
      transactions.filter(tx => tx.type === 'sell').forEach(tx => {
        const pl = this.calculateTransactionPL(tx);
        if (pl !== null) realizedPL += pl;
      });
      
      // Calculate unrealized P&L (current holdings)
      let unrealizedPL = 0;
      let portfolioValue = 0;
      Object.entries(holdings).forEach(([asset, data]) => {
        const currentPrice = currentPrices[asset] || 0;
        const currentValue = data.amount * currentPrice;
        const costBasis = data.amount * data.avgPrice;
        unrealizedPL += (currentValue - costBasis);
        portfolioValue += currentValue;
      });
      
      // Calculate today's P&L (simplified - transactions from today)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayTransactions = transactions.filter(tx => new Date(tx.timestamp) >= today);
      let todayPL = 0;
      todayTransactions.filter(tx => tx.type === 'sell').forEach(tx => {
        const pl = this.calculateTransactionPL(tx);
        if (pl !== null) todayPL += pl;
      });
      
      const totalPL = realizedPL + unrealizedPL;
      
      // Handle NaN values
      const safeTotalPL = isNaN(totalPL) || !isFinite(totalPL) ? 0 : totalPL;
      const safeTodayPL = isNaN(todayPL) || !isFinite(todayPL) ? 0 : todayPL;
      const safePortfolioValue = isNaN(portfolioValue) || !isFinite(portfolioValue) ? 0 : portfolioValue;
      
      // Update display
      this.updateStatElement('#total-pl', safeTotalPL);
      this.updateStatElement('#today-pl', safeTodayPL);
      this.updateStatElement('#portfolio-value', safePortfolioValue);
    },
    
    // Update a stat element with proper formatting and color
    updateStatElement(selector, value) {
      const element = document.querySelector(selector);
      if (!element) return;
      
      // Handle NaN and infinite values
      const safeValue = isNaN(value) || !isFinite(value) ? 0 : value;
      
      element.textContent = '$' + safeValue.toFixed(2);
      element.className = 'stat-value ' + (safeValue >= 0 ? 'profit' : 'loss');
    },
    
    // Export transactions to CSV
    exportToCSV() {
      const transactions = this.getTransactions();
      if (transactions.length === 0) {
        alert('Keine Transaktionen zum Exportieren');
        return;
      }
      
      const headers = ['Datum', 'Asset', 'Typ', 'Menge', 'Preis', 'Wert', 'P&L'];
      const csvContent = [
        headers.join(','),
        ...transactions.map(tx => {
          const pl = this.calculateTransactionPL(tx);
          return [
            new Date(tx.timestamp).toISOString(),
            tx.asset,
            tx.type,
            tx.amount,
            tx.price,
            tx.value,
            pl || ''
          ].join(',');
        })
      ].join('\n');
      
      // Download CSV
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `pl-transactions-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    },
    
    // Update P&L calculations when prices change (called from dashboard.js)
    updatePLCalculations() {
      this.updateHoldings();
      this.updateSummary();
    }
  };
  
  // Make PLHelper available globally
  window.PLHelper = PLHelper;
  
  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => PLHelper.init());
  } else {
    PLHelper.init();
  }
})();