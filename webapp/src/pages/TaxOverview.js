import React, { useState, useEffect } from 'react';
import { Container, Typography, Grid, Card, CardContent, Box, Alert, Chip, LinearProgress } from '@mui/material';
import { AccountBalance, Lock, Warning, CheckCircle } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import ApiService from '../services/api';

const TaxOverview = () => {
  const navigate = useNavigate();
  const [taxStatus, setTaxStatus] = useState(null);
  const [taxBreakdown, setTaxBreakdown] = useState(null);

  useEffect(() => {
    // Simulate API calls
    setTaxStatus({
      totalReserved: 2847.50,
      isLocked: true,
      userAccess: false,
      lastTransfer: '2024-01-15T10:30:00Z',
      pendingTransfers: 0,
      escrowAccount: {
        iban: 'DE89370400440532013000',
        holder: 'Steuer-Treuhandkonto AMS',
        locked: true
      }
    });

    setTaxBreakdown({
      currentMonth: {
        reserves: {
          youtube: { grossIncome: 1250, taxRate: 0.19, taxAmount: 237.50, netIncome: 1012.50 },
          affiliate: { grossIncome: 890, taxRate: 0.25, taxAmount: 222.50, netIncome: 667.50 },
          dropshipping: { grossIncome: 2100, taxRate: 0.30, taxAmount: 630.00, netIncome: 1470.00 },
          dividends: { grossIncome: 450, taxRate: 0.26375, taxAmount: 118.69, netIncome: 331.31 }
        },
        totalReserve: 1208.69
      },
      taxRates: {
        youtube: 0.19,
        affiliate: 0.25,
        dropshipping: 0.30,
        dividends: 0.26375,
        p2p: 0.26375,
        reits: 0.26375,
        courses: 0.25,
        apps: 0.25
      }
    });
  }, []);

  const formatCurrency = (amount) => `€${amount.toFixed(2)}`;

  const getTaxRateColor = (rate) => {
    if (rate >= 0.30) return 'error';
    if (rate >= 0.25) return 'warning';
    return 'success';
  };

  if (!taxStatus || !taxBreakdown) return null;

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h4" sx={{ display: 'flex', alignItems: 'center' }}>
          <AccountBalance sx={{ mr: 2 }} />
          Steuer-Treuhandkonto
        </Typography>
      </Box>

      <Alert severity="warning" sx={{ mb: 4 }}>
        <Box display="flex" alignItems="center">
          <Lock sx={{ mr: 1 }} />
          <Typography>
            Alle Steuerreserven sind vollständig gesperrt und können ausschließlich an das Finanzamt überwiesen werden.
            Manueller Zugriff ist nicht möglich.
          </Typography>
        </Box>
      </Alert>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card sx={{ bgcolor: 'error.dark', color: 'white' }}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="h6">Gesperrte Steuerreserven</Typography>
                  <Typography variant="h3">{formatCurrency(taxStatus.totalReserved)}</Typography>
                  <Typography variant="body2">Automatische Überweisung bei €1.000</Typography>
                </Box>
                <Lock sx={{ fontSize: 60, opacity: 0.7 }} />
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={(taxStatus.totalReserved / 1000) * 100} 
                sx={{ mt: 2, bgcolor: 'rgba(255,255,255,0.3)' }}
              />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Treuhandkonto-Details</Typography>
              <Typography variant="body2"><strong>IBAN:</strong> {taxStatus.escrowAccount.iban}</Typography>
              <Typography variant="body2"><strong>Inhaber:</strong> {taxStatus.escrowAccount.holder}</Typography>
              <Typography variant="body2" sx={{ mt: 2 }}>
                <strong>Status:</strong> 
                <Chip label="GESPERRT" color="error" size="small" sx={{ ml: 1 }} />
              </Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>
                <strong>Letzter Transfer:</strong> {new Date(taxStatus.lastTransfer).toLocaleDateString('de-DE')}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Aktuelle Steuerberechnung</Typography>
              <Grid container spacing={2}>
                {Object.entries(taxBreakdown.currentMonth.reserves).map(([stream, data]) => (
                  <Grid item xs={12} sm={6} md={3} key={stream}>
                    <Box p={2} border={1} borderColor="divider" borderRadius={2}>
                      <Typography variant="subtitle2" sx={{ textTransform: 'capitalize' }}>
                        {stream}
                      </Typography>
                      <Typography variant="body2">
                        Brutto: {formatCurrency(data.grossIncome)}
                      </Typography>
                      <Typography variant="body2">
                        Steuersatz: 
                        <Chip 
                          label={`${(data.taxRate * 100).toFixed(1)}%`} 
                          color={getTaxRateColor(data.taxRate)}
                          size="small" 
                          sx={{ ml: 1 }}
                        />
                      </Typography>
                      <Typography variant="body2" color="error">
                        Steuer: {formatCurrency(data.taxAmount)}
                      </Typography>
                      <Typography variant="body2" color="success.main">
                        Netto: {formatCurrency(data.netIncome)}
                      </Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Sicherheitsmaßnahmen</Typography>
              <Box display="flex" flexDirection="column" gap={1}>
                <Box display="flex" alignItems="center">
                  <CheckCircle color="success" sx={{ mr: 1 }} />
                  <Typography>Automatische Steuerberechnung bei jeder Einkommensänderung</Typography>
                </Box>
                <Box display="flex" alignItems="center">
                  <CheckCircle color="success" sx={{ mr: 1 }} />
                  <Typography>Verschlüsselte Speicherung aller Steuerdaten</Typography>
                </Box>
                <Box display="flex" alignItems="center">
                  <CheckCircle color="success" sx={{ mr: 1 }} />
                  <Typography>Automatische Überweisung an Finanzamt bei Schwellenwert</Typography>
                </Box>
                <Box display="flex" alignItems="center">
                  <Lock color="error" sx={{ mr: 1 }} />
                  <Typography>Vollständige Sperrung für Benutzer-Zugriff</Typography>
                </Box>
                <Box display="flex" alignItems="center">
                  <Warning color="warning" sx={{ mr: 1 }} />
                  <Typography>Keine Möglichkeit zur Steuerhinterziehung</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default TaxOverview;