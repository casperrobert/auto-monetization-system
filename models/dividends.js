function getAll(){
  return [
    { id:1, company:'Apple Inc.', ticker:'AAPL', amount:0.24, currency:'USD', exDate:'2025-08-20', payDate:'2025-09-01' }
  ];
}
module.exports = { getAll };
const express = require("express");
const app = express();
const PORT = process.env.PORT || 3000;

// Fake-Daten
const courses = [{ id: 1, title: "Crypto Basics" }];
const dropshipping = [{ id: 1, product: "T-Shirt" }];
const dividends = [{ id: 1, company: "Apple", amount: 0.25 }];

app.get("/api/courses", (req, res) => res.json(courses));
app.get("/api/dropshipping", (req, res) => res.json(dropshipping));
app.get("/api/dividends", (req, res) => res.json(dividends));

app.listen(PORT, () =>
  console.log(`✅ Server läuft auf http://localhost:${PORT}`)
);

