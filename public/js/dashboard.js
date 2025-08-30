/**
 * Dashboard functionality for CASPER SYSTEM 24
 * Secure implementation with input validation and error handling
 */

(function () {
  'use strict';

  // Configuration constants
  const CONFIG_KEY = 'casper24_cfg';
  const LOG_KEY = 'casper24_logs';
  const DEFAULT_CONFIG = {
    affTag: '',
    appId: '',
    apiKey: '',
    table: 'Transactions'
  };

  // State management
  let web3 = null;
  let isConnecting = false;
  let priceUpdateInterval = null;

  // Configuration management with validation
  const configManager = {
    load() {
      const config = secureStorage.get(CONFIG_KEY) || DEFAULT_CONFIG;
      return { ...DEFAULT_CONFIG, ...config };
    },

    save(config) {
      // Validate configuration before saving
      const validatedConfig = this.validate(config);
      return secureStorage.set(CONFIG_KEY, validatedConfig);
    },

    clear() {
      return secureStorage.remove(CONFIG_KEY);
    },

    validate(config) {
      return {
        affTag: String(config.affTag || '')
          .trim()
          .substring(0, 50),
        appId: String(config.appId || '')
          .trim()
          .substring(0, 100),
        apiKey: String(config.apiKey || '')
          .trim()
          .substring(0, 200),
        table: String(config.table || 'Transactions')
          .trim()
          .substring(0, 50)
      };
    }
  };

  // Revenue log management
  const logManager = {
    read() {
      return secureStorage.get(LOG_KEY) || [];
    },

    write(logs) {
      // Limit to 1000 entries to prevent storage overflow
      const limitedLogs = logs.slice(0, 1000);
      return secureStorage.set(LOG_KEY, limitedLogs);
    },

    add(entry) {
      const logs = this.read();
      const validatedEntry = {
        ts: Date.now(),
        source: sanitizeHtml(String(entry.source || 'Manual')).substring(0, 50),
        amount: parseFloat(entry.amount) || 0
      };

      logs.unshift(validatedEntry);
      return this.write(logs);
    },

    render() {
      const logs = this.read();
      const tbody = $('#log-table tbody');

      if (!tbody) return;

      // Clear existing content
      tbody.innerHTML = '';

      if (logs.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML =
          '<td colspan="3" class="text-center muted">Keine Einträge vorhanden</td>';
        tbody.appendChild(row);
        return;
      }

      logs.forEach(log => {
        const row = document.createElement('tr');
        const date = new Date(log.ts).toLocaleString('de-DE');
        const amount = Number(log.amount).toFixed(2);

        row.innerHTML = `
          <td>${sanitizeHtml(date)}</td>
          <td>${sanitizeHtml(log.source)}</td>
          <td>${sanitizeHtml(amount)}</td>
        `;

        tbody.appendChild(row);
      });
    }
  };

  // Wallet management with enhanced security
  const walletManager = {
    async connect() {
      if (isConnecting) {
        notifications.warning('Verbindung läuft bereits...');
        return;
      }

      isConnecting = true;

      try {
        // Check if MetaMask is available
        if (!window.ethereum) {
          throw new Error(
            'MetaMask nicht gefunden. Bitte installieren Sie MetaMask.'
          );
        }

        // Request account access
        const accounts = await window.ethereum.request({
          method: 'eth_requestAccounts'
        });

        if (accounts.length === 0) {
          throw new Error('Keine Konten gefunden');
        }

        // Initialize Web3
        web3 = new Web3(window.ethereum);

        // Get account info
        const account = accounts[0];
        const balance = await web3.eth.getBalance(account);
        const balanceEth = web3.utils.fromWei(balance, 'ether');

        // Update UI
        const walletInfo = $('#wallet-info');
        if (walletInfo) {
          walletInfo.innerHTML = `
            <strong>Verbunden:</strong> ${account}<br>
            <strong>Balance:</strong> ${parseFloat(balanceEth).toFixed(4)} ETH
          `;
        }

        notifications.success('Wallet erfolgreich verbunden!');

        // Listen for account changes
        window.ethereum.on(
          'accountsChanged',
          this.handleAccountChange.bind(this)
        );
        window.ethereum.on('chainChanged', this.handleChainChange.bind(this));

        return { account, balance: balanceEth };
      } catch (error) {
        console.error('Wallet connection error:', error);
        notifications.error(`Wallet-Fehler: ${error.message}`);
        this.outputMessage(`Wallet-Fehler: ${error.message}`);
        throw error;
      } finally {
        isConnecting = false;
      }
    },

    async sendTransaction() {
      if (!web3) {
        notifications.error('Erst Wallet verbinden');
        return;
      }

      try {
        const to = getValue('#send-to');
        const amountStr = getValue('#send-amount');

        // Validate inputs
        if (!validators.isValidEthereumAddress(to)) {
          throw new Error('Ungültige Zieladresse');
        }

        if (!validators.isValidAmount(amountStr)) {
          throw new Error('Ungültiger Betrag');
        }

        const amount = parseFloat(amountStr);

        // Rate limiting check
        if (!rateLimiter('send-transaction', 5, 60000)) {
          throw new Error(
            'Zu viele Transaktionen. Bitte warten Sie eine Minute.'
          );
        }

        // Get current account
        const accounts = await web3.eth.getAccounts();
        if (accounts.length === 0) {
          throw new Error('Kein verbundenes Konto gefunden');
        }

        const from = accounts[0];
        const value = web3.utils.toWei(String(amount), 'ether');

        // Check balance
        const balance = await web3.eth.getBalance(from);
        const balanceEth = parseFloat(web3.utils.fromWei(balance, 'ether'));

        if (amount > balanceEth) {
          throw new Error('Unzureichendes Guthaben');
        }

        // Send transaction
        const tx = await web3.eth.sendTransaction({
          from,
          to,
          value,
          gas: 21000
        });

        this.outputMessage(`✅ Transaktion gesendet: ${tx.transactionHash}`);
        notifications.success('Transaktion erfolgreich gesendet!');

        // Clear form
        const amountInput = $('#send-amount');
        const toInput = $('#send-to');
        if (amountInput) amountInput.value = '';
        if (toInput) toInput.value = '';

        return tx;
      } catch (error) {
        console.error('Transaction error:', error);
        const errorMsg = `Transaktion fehlgeschlagen: ${error.message}`;
        this.outputMessage(errorMsg);
        notifications.error(errorMsg);
        throw error;
      }
    },

    outputMessage(message) {
      const output = $('#tx-out');
      if (output) {
        const timestamp = new Date().toLocaleTimeString();
        const newMessage = `[${timestamp}] ${message}`;
        output.textContent = (output.textContent + '\n' + newMessage).trim();
        output.scrollTop = output.scrollHeight;
      }
    },

    handleAccountChange(accounts) {
      if (accounts.length === 0) {
        web3 = null;
        const walletInfo = $('#wallet-info');
        if (walletInfo) walletInfo.textContent = 'Wallet getrennt';
        notifications.warning('Wallet wurde getrennt');
      } else {
        notifications.info('Konto geändert, bitte erneut verbinden');
        this.connect();
      }
    },

    handleChainChange(chainId) {
      notifications.info('Netzwerk geändert, Seite wird neu geladen...');
      setTimeout(() => window.location.reload(), 2000);
    }
  };

  // Price management with error handling
  const priceManager = {
    async loadPrices() {
      try {
        // Rate limiting for API calls
        if (!rateLimiter('price-update', 10, 60000)) {
          throw new Error(
            'Zu viele Preisabfragen. Bitte warten Sie eine Minute.'
          );
        }

        const coins = 'bitcoin,ethereum,solana';
        const url = `https://api.coingecko.com/api/v3/simple/price?ids=${coins}&vs_currencies=usd&include_24hr_change=true`;

        const data = await secureApiRequest(url);

        this.renderPrices(data);
        this.updateTimestamp();

        notifications.success('Preise aktualisiert');
      } catch (error) {
        console.error('Price loading error:', error);
        this.updateTimestamp('Preisfeed nicht erreichbar');
        notifications.error(`Preisfehler: ${error.message}`);
      }
    },

    renderPrices(data) {
      const tbody = $('#price-table tbody');
      if (!tbody) return;

      tbody.innerHTML = '';

      const coins = [
        ['Bitcoin', 'bitcoin'],
        ['Ethereum', 'ethereum'],
        ['Solana', 'solana']
      ];

      coins.forEach(([name, key]) => {
        const coinData = data[key];
        if (!coinData) return;

        const row = document.createElement('tr');
        const price =
          coinData.usd?.toLocaleString('en-US', { maximumFractionDigits: 2 }) ||
          'N/A';
        const change = (coinData.usd_24h_change || 0).toFixed(2);
        const changeClass =
          coinData.usd_24h_change >= 0 ? 'positive' : 'negative';

        row.innerHTML = `
          <td>${sanitizeHtml(name)}</td>
          <td>${sanitizeHtml(price)}</td>
          <td class="${changeClass}">${sanitizeHtml(change)}%</td>
        `;

        tbody.appendChild(row);
      });
    },

    updateTimestamp(message) {
      const timestamp = $('#price-ts');
      if (timestamp) {
        timestamp.textContent =
          message || `Aktualisiert: ${new Date().toLocaleTimeString()}`;
      }
    },

    startAutoUpdate(interval = 300000) {
      // 5 minutes
      this.stopAutoUpdate();
      priceUpdateInterval = setInterval(() => this.loadPrices(), interval);
    },

    stopAutoUpdate() {
      if (priceUpdateInterval) {
        clearInterval(priceUpdateInterval);
        priceUpdateInterval = null;
      }
    }
  };

  // Affiliate link generator with validation
  const affiliateManager = {
    generateLink() {
      try {
        const url = getValue('#aff-url');
        const config = configManager.load();

        if (!url) {
          throw new Error('Bitte geben Sie eine URL ein');
        }

        if (!config.affTag) {
          throw new Error('Affiliate-Tag in den Einstellungen speichern');
        }

        if (!validators.isValidAmazonUrl(url)) {
          throw new Error('Keine gültige Amazon-URL');
        }

        const urlObj = new URL(url);
        urlObj.searchParams.set('tag', config.affTag);

        const output = $('#aff-out');
        if (output) {
          output.value = urlObj.toString();
        }

        notifications.success('Affiliate-Link generiert!');
      } catch (error) {
        console.error('Affiliate link generation error:', error);
        notifications.error(error.message);
      }
    }
  };

  // Initialize configuration form
  function initializeConfigForm() {
    const config = configManager.load();

    // Load saved values
    const elements = {
      aff: $('#cfg-aff'),
      app: $('#cfg-app'),
      key: $('#cfg-key'),
      table: $('#cfg-table')
    };

    if (elements.aff) elements.aff.value = config.affTag;
    if (elements.app) elements.app.value = config.appId;
    if (elements.key) elements.key.value = config.apiKey;
    if (elements.table) elements.table.value = config.table;
  }

  // Save configuration
  function saveConfiguration() {
    try {
      const config = {
        affTag: getValue('#cfg-aff'),
        appId: getValue('#cfg-app'),
        apiKey: getValue('#cfg-key'),
        table: getValue('#cfg-table') || 'Transactions'
      };

      if (configManager.save(config)) {
        notifications.success('Einstellungen gespeichert!');
      } else {
        throw new Error('Fehler beim Speichern');
      }
    } catch (error) {
      console.error('Configuration save error:', error);
      notifications.error(`Speicherfehler: ${error.message}`);
    }
  }

  // Clear configuration
  function clearConfiguration() {
    if (confirm('Alle Einstellungen löschen?')) {
      try {
        configManager.clear();
        setTimeout(() => window.location.reload(), 500);
      } catch (error) {
        console.error('Configuration clear error:', error);
        notifications.error(`Löschfehler: ${error.message}`);
      }
    }
  }

  // Add revenue log entry
  function addLogEntry() {
    try {
      const amount = getValue('#log-amount');
      const source = getValue('#log-source') || 'Manual';

      if (!validators.isValidAmount(amount)) {
        throw new Error('Bitte geben Sie einen gültigen Betrag ein');
      }

      logManager.add({ amount, source });
      logManager.render();

      // Clear form
      const amountInput = $('#log-amount');
      const sourceInput = $('#log-source');
      if (amountInput) amountInput.value = '';
      if (sourceInput) sourceInput.value = '';

      notifications.success('Eintrag hinzugefügt!');
    } catch (error) {
      console.error('Log entry error:', error);
      notifications.error(error.message);
    }
  }

  // Event listeners with debouncing
  function setupEventListeners() {
    // Configuration
    const saveBtn = $('#save-cfg');
    const clearBtn = $('#clear-cfg');

    if (saveBtn)
      saveBtn.addEventListener('click', debounce(saveConfiguration, 300));
    if (clearBtn) clearBtn.addEventListener('click', clearConfiguration);

    // Wallet
    const connectBtn = $('#btn-connect');
    const sendBtn = $('#btn-send');

    if (connectBtn)
      connectBtn.addEventListener(
        'click',
        debounce(() => walletManager.connect(), 1000)
      );
    if (sendBtn)
      sendBtn.addEventListener(
        'click',
        debounce(() => walletManager.sendTransaction(), 1000)
      );

    // Prices
    const pricesBtn = $('#btn-prices');
    if (pricesBtn)
      pricesBtn.addEventListener(
        'click',
        debounce(() => priceManager.loadPrices(), 1000)
      );

    // Affiliate
    const buildBtn = $('#btn-build');
    if (buildBtn)
      buildBtn.addEventListener(
        'click',
        debounce(() => affiliateManager.generateLink(), 500)
      );

    // Revenue log
    const logBtn = $('#btn-log');
    if (logBtn) logBtn.addEventListener('click', debounce(addLogEntry, 500));
  }

  // Initialize dashboard
  function initializeDashboard() {
    try {
      console.log('Initializing CASPER SYSTEM 24 Dashboard...');

      // Initialize components
      initializeConfigForm();
      logManager.render();
      setupEventListeners();

      // Load initial prices
      priceManager.loadPrices();

      // Start auto price updates
      priceManager.startAutoUpdate();

      console.log('Dashboard initialized successfully');
    } catch (error) {
      console.error('Dashboard initialization error:', error);
      reportError(error, { context: 'dashboard-initialization' });
      notifications.error('Dashboard-Initialisierungsfehler');
    }
  }

  // Cleanup on page unload
  function cleanup() {
    priceManager.stopAutoUpdate();

    // Remove MetaMask event listeners
    if (window.ethereum) {
      window.ethereum.removeAllListeners('accountsChanged');
      window.ethereum.removeAllListeners('chainChanged');
    }
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeDashboard);
  } else {
    initializeDashboard();
  }

  // Cleanup on page unload
  window.addEventListener('beforeunload', cleanup);

  // Global error handler for unhandled promise rejections
  window.addEventListener('unhandledrejection', event => {
    console.error('Unhandled promise rejection:', event.reason);
    reportError(new Error(event.reason), {
      context: 'unhandled-promise-rejection'
    });
    event.preventDefault();
  });
})();
