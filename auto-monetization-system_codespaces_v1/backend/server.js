
const express = require('express');
const app = express();
const PORT = process.env.PORT || 5000;

app.get('/api/status', (req, res) => {
  res.json({ message: "✅ Backend läuft!" });
});

app.listen(PORT, () => console.log(`Backend läuft auf Port ${PORT}`));
