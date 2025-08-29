// models/dividends.js

// Beispiel-Daten für Dividenden
const dividends = [
  {
    id: 1,
    company: 'Apple Inc.',
    ticker: 'AAPL',
    amount: 0.24,            // USD pro Aktie
    currency: 'USD',
    exDate: '2025-08-20',    // Ex-Dividenden-Datum
    payDate: '2025-09-01'    // Auszahlungstag
  },
  {
    id: 2,
    company: 'Microsoft Corp.',
    ticker: 'MSFT',
    amount: 0.68,
    currency: 'USD',
    exDate: '2025-09-10',
    payDate: '2025-09-25'
  },
  {
    id: 3,
    company: 'Siemens AG',
    ticker: 'SIE',
    amount: 3.95,
    currency: 'EUR',
    exDate: '2025-02-14',
    payDate: '2025-02-21'
  }
];

// Optional: Funktionen für Abfragen
function getAll() {
  return dividends;
}

function getByTicker(ticker) {
  return dividends.filter(d => d.ticker.toUpperCase() === ticker.toUpperCase());
}

function addDividend(dividend) {
  const newDiv = { id: dividends.length + 1, ...dividend };
  dividends.push(newDiv);
  return newDiv;
}

module.exports = {
  getAll,
  getByTicker,
  addDividend
};
// models/dividends.js
function getAll() {
  return [
    { id: 1, company: 'Apple Inc.', ticker: 'AAPL', amount: 0.24, currency: 'USD', exDate: '2025-08-20', payDate: '2025-09-01' },
    { id: 2, company: 'Microsoft Corp.', ticker: 'MSFT', amount: 0.68, currency: 'USD', exDate: '2025-09-10', payDate: '2025-09-25' },
    { id: 3, company: 'Siemens AG', ticker: 'SIE', amount: 3.95, currency: 'EUR', exDate: '2025-02-14', payDate: '2025-02-21' }
  ];
}

module.exports = { getAll };

