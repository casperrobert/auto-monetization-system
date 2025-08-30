import React, { useEffect, useState } from 'react';
import { Container, Box, Typography, Button, TextField, Switch, FormControlLabel, Paper, Divider } from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import ApiService from '../services/api';

export default function CategoryDetail() {
  const { category } = useParams();
  const navigate = useNavigate();
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paramsText, setParamsText] = useState('{}');
  const [enabled, setEnabled] = useState(true);

  useEffect(() => { loadConfig(); }, [category]);

  async function loadConfig() {
    setLoading(true);
    try {
      const streams = await ApiService.getStreams();
      const item = streams.find(s => s.id === category) || { id: category, type: category, enabled: false, params: {} };
      setConfig(item);
      setParamsText(JSON.stringify(item.params || {}, null, 2));
      setEnabled(!!item.enabled);
    } catch (e) {
      console.error('Failed to load stream config', e);
    }
    setLoading(false);
  }

  async function saveConfig() {
    try {
      const parsed = JSON.parse(paramsText || '{}');
      const payload = { ...config, params: parsed, enabled };
      if (config && config.id) {
        await ApiService.updateStream(config.id, payload);
      } else {
        await ApiService.createStream(payload);
      }
      await loadConfig();
    } catch (e) {
      console.error('Failed to save config', e);
    }
  }

  async function startAutomation() {
    try {
      await ApiService.startAutomation(category);
    } catch (e) { console.error(e); }
  }

  async function stopAutomation() {
    try { await ApiService.stopAutomation(category); } catch (e) { console.error(e); }
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Button variant="outlined" onClick={() => navigate(-1)}>Zurück</Button>
      <Paper sx={{ p: 2, mt: 2 }}>
        <Typography variant="h5">Kategorie: {category}</Typography>
        <Divider sx={{ my: 1 }} />
        <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
          <FormControlLabel control={<Switch checked={enabled} onChange={e => setEnabled(e.target.checked)} />} label="Aktiviert" />
          <Button variant="contained" color="primary" onClick={saveConfig}>Speichern</Button>
          <Button variant="contained" color="success" onClick={startAutomation}>Start Automation</Button>
          <Button variant="outlined" color="error" onClick={stopAutomation}>Stop Automation</Button>
        </Box>
        <Box sx={{ mt: 2 }}>
          <TextField label="Parameter (JSON)" value={paramsText} onChange={e => setParamsText(e.target.value)} multiline minRows={8} fullWidth />
        </Box>
      </Paper>
    </Container>
  );
}
