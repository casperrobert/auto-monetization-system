import React, { useState } from "react";
import { Box, Typography, TextField, Button, Select, MenuItem, Alert } from "@mui/material";
import axios from "axios";

const PROVIDERS = [
  { value: "openai", label: "OpenAI GPT" },
  // Weitere Provider können ergänzt werden
];

export default function AISettings() {
  const [provider, setProvider] = useState("openai");
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState("gpt-3.5-turbo");
  const [prompt, setPrompt] = useState("");
  const [result, setResult] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    setLoading(true);
    setError("");
    setResult("");
    try {
      const res = await axios.post("/api/ai", { provider, apiKey, prompt, model });
      setResult(JSON.stringify(res.data.result, null, 2));
    } catch (e) {
      setError(e.response?.data?.error || "KI-Request fehlgeschlagen");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3, maxWidth: 600, mx: "auto" }}>
      <Typography variant="h5" gutterBottom>KI-Integration</Typography>
      <Select value={provider} onChange={e => setProvider(e.target.value)} fullWidth sx={{ mb: 2 }}>
        {PROVIDERS.map(p => <MenuItem key={p.value} value={p.value}>{p.label}</MenuItem>)}
      </Select>
      <TextField label="API-Key" fullWidth sx={{ mb: 2 }} value={apiKey} onChange={e => setApiKey(e.target.value)} />
      <TextField label="Modell" fullWidth sx={{ mb: 2 }} value={model} onChange={e => setModel(e.target.value)} />
      <TextField label="Prompt" fullWidth multiline rows={3} sx={{ mb: 2 }} value={prompt} onChange={e => setPrompt(e.target.value)} />
      <Button variant="contained" onClick={handleSend} disabled={loading}>{loading ? "Bitte warten..." : "Senden"}</Button>
      {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
      {result && <Box sx={{ mt: 2, p: 2, bgcolor: "background.paper", borderRadius: 2 }}><pre>{result}</pre></Box>}
    </Box>
  );
}
