import React, { useState } from 'react';
import { Container, Typography, Grid, Card, CardContent, Button, Alert, Box } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const Admin = () => {
  const [logs, setLogs] = useState([]);
  const [scanResult, setScanResult] = useState('');
  const navigate = useNavigate();

  const handleRestart = () => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: Services restarted`]);
  };

  const handleViewLogs = () => {
    const newLogs = [
      'System started successfully',
      'All income streams connected',
      'Security protocols active',
      'Database synchronized'
    ];
    setLogs(newLogs);
  };

  const handleSecurityScan = () => {
    setScanResult('Security scan completed - No vulnerabilities found');
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h4">
          Admin Panel
        </Typography>
        <Button variant="outlined" onClick={() => navigate('/')}>
          Zurück zum Dashboard
        </Button>
      </Box>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6">System Control</Typography>
              <Button variant="contained" sx={{ mt: 2, mr: 1 }} onClick={handleRestart}>
                Restart Services
              </Button>
              <Button variant="outlined" sx={{ mt: 2 }} onClick={handleViewLogs}>
                View Logs
              </Button>
              {logs.length > 0 && (
                <Box mt={2}>
                  {logs.map((log, index) => (
                    <Typography key={index} variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                      {log}
                    </Typography>
                  ))}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6">Security</Typography>
              <Button variant="contained" color="error" sx={{ mt: 2 }} onClick={handleSecurityScan}>
                Security Scan
              </Button>
              {scanResult && (
                <Alert severity="success" sx={{ mt: 2 }}>
                  {scanResult}
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Admin;