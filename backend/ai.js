// backend/ai.js
const express = require('express');
const axios = require('axios');
const router = express.Router();
const validateSchema = require('./src/middleware/validateSchema');

// Unterstützte KI-Provider
const PROVIDERS = {
  openai: {
    url: 'https://api.openai.com/v1/chat/completions',
    keyHeader: 'Authorization',
    keyPrefix: 'Bearer ',
    buildPayload: (prompt, model) => ({
      model: model || 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 512
    })
  },
  // Weitere Provider können hier ergänzt werden
};

// KI-Proxy-Endpoint
router.post('/ai', validateSchema('aiProxy.schema.json'), async (req, res) => {
  const { provider, apiKey, prompt, model } = req.body;
  const conf = PROVIDERS[provider];
  if (!conf) return res.status(400).json({ error: 'Provider nicht unterstützt' });
  try {
    const response = await axios.post(conf.url, conf.buildPayload(prompt, model), {
      headers: { [conf.keyHeader]: conf.keyPrefix + apiKey }
    });
    res.json({ result: response.data });
  } catch (e) {
    res.status(500).json({ error: 'KI-Request fehlgeschlagen', detail: e.response?.data || e.message });
  }
});

module.exports = router;
