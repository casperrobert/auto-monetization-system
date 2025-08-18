// index.js
const express = require("express");
const path = require("path");

const app = express(); // NUR EINMAL deklarieren
const PORT = process.env.PORT || 3000; // NUR EINMAL deklarieren

// Static Files aus dem Ordner "public"
app.use(express.static(path.join(__dirname, "public")));

// Health Check
app.get("/api/health", (req, res) => {
  res.json({ ok: true, time: new Date().toISOString() });
});

// Server starten
app.listen(PORT, () => {
  console.log(`✅ Server läuft auf Port ${PORT}`);
});
