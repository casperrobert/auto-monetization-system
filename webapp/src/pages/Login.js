// Backend starten:
// cd /workspaces/auto-monetization-system/backend
// npm install
// npm start

// Frontend mit Backend verbinden:
// API-Calls in React-Komponenten integrieren
// Wichtige API-Endpunkte:
// POST /api/login                 - Benutzer-Anmeldung
// GET  /api/income               - Einkommensdaten abrufen
// PUT  /api/income               - Einkommensdaten aktualisieren
// POST /api/income/simulate      - Daten-Simulation
// GET  /api/analytics            - Einkommens-Analytik
// POST /api/ai/configure         - KI-Provider konfigurieren
// POST /api/ai/optimize          - KI-Optimierungen
// GET  /api/ai/status            - KI-Status
// GET  /api/admin/logs           - System-Logs
// POST /api/admin/scan           - Sicherheitsscan
// POST /api/admin/restart        - Services neustarten
import React, { useState } from 'react';
import { Container, Paper, TextField, Button, Typography, Box } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import ApiService from '../services/api';

const Login = () => {
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const navigate = useNavigate();

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await ApiService.login(credentials);
      if (response.success) {
        navigate('/');
      } else {
        setError(response.message || 'Login fehlgeschlagen');
      }
    } catch (error) {
      setError('Backend nicht erreichbar. Bitte prüfen Sie die Verbindung.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 8 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" align="center" gutterBottom>
          Casper-AMS Login
        </Typography>
        <Box component="form" onSubmit={handleLogin}>
          {error && <Typography color="error" sx={{ mb: 2 }}>{error}</Typography>}
          <TextField
            fullWidth
            label="Benutzername"
            margin="normal"
            value={credentials.username}
            onChange={(e) => setCredentials({...credentials, username: e.target.value})}
          />
          <TextField
            fullWidth
            label="Passwort"
            type="password"
            margin="normal"
            value={credentials.password}
            onChange={(e) => setCredentials({...credentials, password: e.target.value})}
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
            disabled={loading}
          >
            {loading ? "Bitte warten..." : "Anmelden"}
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default Login;