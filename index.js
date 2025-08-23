// index.js
const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// Static Files aus dem Ordner "public"
app.use(express.static(path.join(__dirname, "public")));

// Health Check
app.get("/api/health", (req, res) => {
  res.json({ ok: true, time: new Date().toISOString() });
});

// Server nur starten, wenn Datei direkt ausgeführt wird
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`✅ Server läuft auf Port ${PORT}`);
  });
}

module.exports = app;
