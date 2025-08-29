import React, { useState, useEffect } from 'react';
import { Container, Typography, Grid, Card, CardContent, Button, TextField, Switch, FormControlLabel, Alert, Box, Chip } from '@mui/material';
import { Psychology, AutoAwesome, TrendingUp, Security, ArrowBack } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const AIIntegration = () => {
  const navigate = useNavigate();
  const [aiProviders, setAiProviders] = useState({
    openai: { enabled: false, apiKey: '', model: 'gpt-4', tier: 'free' },
    anthropic: { enabled: false, apiKey: '', model: 'claude-3', tier: 'free' },
    google: { enabled: false, apiKey: '', model: 'gemini-pro', tier: 'free' },
    local: { enabled: false, endpoint: 'http://localhost:11434', model: 'll2', tier: 'free' }
  });
  
  const [optimizations, setOptimizations] = useState({
    autoTuning: false,
    marketAnalysis: false,
    riskAssessment: false,
    performanceBoost: false
  });

  const handleProviderToggle = (provider) => {
    setAiProviders(prev => ({
      ...prev,
      [provider]: { ...prev[provider], enabled: !prev[provider].enabled }
    }));
  };

  const handleApiKeyChange = (provider, value) => {
    setAiProviders(prev => ({
      ...prev,
      [provider]: { ...prev[provider], apiKey: value }
    }));
  };

  const handleOptimizationToggle = (optimization) => {
    setOptimizations(prev => ({
      ...prev,
      [optimization]: !prev[optimization]
    }));
  };

  const getTierColor = (tier) => {
    return tier === 'premium' ? 'success' : tier === 'pro' ? 'warning' : 'default';
  };

  const upgradeTier = (provider) => {
    setAiProviders(prev => ({
      ...prev,
      [provider]: { 
        ...prev[provider], 
        tier: prev[provider].tier === 'free' ? 'pro' : 'premium' 
      }
    }));
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h4" sx={{ display: 'flex', alignItems: 'center' }}>
          <Psychology sx={{ mr: 2 }} />
          KI-Integration & Optimierung
        </Typography>
        <Button
          variant="outlined"
          startIcon={<ArrowBack />}
          onClick={() => navigate('/')}
        >
          Zurück zum Dashboard
        </Button>
      </Box>

      <Alert severity="info" sx={{ mb: 4 }}>
        Integrieren Sie Ihre bevorzugten KI-Systeme für maximale Effizienz und automatische Optimierung
      </Alert>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                KI-Provider Konfiguration
              </Typography>
              
              {Object.entries(aiProviders).map(([provider, config]) => (
                <Box key={provider} sx={{ mb: 3, p: 2, border: '1px solid #333', borderRadius: 2 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="subtitle1" sx={{ textTransform: 'capitalize' }}>
                      {provider === 'openai' ? 'OpenAI GPT' : 
                       provider === 'anthropic' ? 'Anthropic Claude' :
                       provider === 'google' ? 'Google Gemini' : 'Local LLM'}
                    </Typography>
                    <Box>
                      <Chip 
                        label={config.tier} 
                        color={getTierColor(config.tier)} 
                        size="small" 
                        sx={{ mr: 1 }}
                      />
                      <Switch
                        checked={config.enabled}
                        onChange={() => handleProviderToggle(provider)}
                      />
                    </Box>
                  </Box>
                  
                  {config.enabled && (
                    <>
                      <TextField
                        fullWidth
                        label={provider === 'local' ? 'Endpoint URL' : 'API Key'}
                        type={provider === 'local' ? 'text' : 'password'}
                        value={provider === 'local' ? config.endpoint : config.apiKey}
                        onChange={(e) => handleApiKeyChange(provider, e.target.value)}
                        sx={{ mb: 2 }}
                        size="small"
                      />
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Typography variant="body2">
                          Model: {config.model}
                        </Typography>
                        {config.tier !== 'premium' && (
                          <Button 
                            size="small" 
                            variant="outlined" 
                            onClick={() => upgradeTier(provider)}
                          >
                            Upgrade zu {config.tier === 'free' ? 'Pro' : 'Premium'}
                          </Button>
                        )}
                      </Box>
                    </>
                  )}
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                KI-Optimierungen
              </Typography>
              
              <FormControlLabel
                control={
                  <Switch
                    checked={optimizations.autoTuning}
                    onChange={() => handleOptimizationToggle('autoTuning')}
                  />
                }
                label={
                  <Box>
                    <Typography>Auto-Tuning</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Automatische Parameteranpassung basierend auf Performance
                    </Typography>
                  </Box>
                }
                sx={{ mb: 2, alignItems: 'flex-start' }}
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={optimizations.marketAnalysis}
                    onChange={() => handleOptimizationToggle('marketAnalysis')}
                  />
                }
                label={
                  <Box>
                    <Typography>Marktanalyse</Typography>
                    <Typography variant="body2" color="text.secondary">
                      KI-gestützte Markttrend-Erkennung und Vorhersagen
                    </Typography>
                  </Box>
                }
                sx={{ mb: 2, alignItems: 'flex-start' }}
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={optimizations.riskAssessment}
                    onChange={() => handleOptimizationToggle('riskAssessment')}
                  />
                }
                label={
                  <Box>
                    <Typography>Risikobewertung</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Intelligente Risikoanalyse für alle Einkommensströme
                    </Typography>
                  </Box>
                }
                sx={{ mb: 2, alignItems: 'flex-start' }}
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={optimizations.performanceBoost}
                    onChange={() => handleOptimizationToggle('performanceBoost')}
                  />
                }
                label={
                  <Box>
                    <Typography>Performance Boost</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Premium KI-Features für maximale Effizienz
                    </Typography>
                  </Box>
                }
                sx={{ mb: 2, alignItems: 'flex-start' }}
              />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                KI-Performance Dashboard
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <Box textAlign="center" p={2}>
                    <AutoAwesome sx={{ fontSize: 40, color: 'primary.main' }} />
                    <Typography variant="h6">Optimierungen</Typography>
                    <Typography variant="h4" color="primary">
                      {Object.values(optimizations).filter(Boolean).length}
                    </Typography>
                    <Typography variant="body2">Aktive Features</Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={12} sm={4}>
                  <Box textAlign="center" p={2}>
                    <TrendingUp sx={{ fontSize: 40, color: 'success.main' }} />
                    <Typography variant="h6">Effizienz</Typography>
                    <Typography variant="h4" color="success.main">
                      {Object.values(aiProviders).filter(p => p.enabled).length * 25}%
                    </Typography>
                    <Typography variant="body2">Steigerung</Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={12} sm={4}>
                  <Box textAlign="center" p={2}>
                    <Security sx={{ fontSize: 40, color: 'warning.main' }} />
                    <Typography variant="h6">KI-Provider</Typography>
                    <Typography variant="h4" color="warning.main">
                      {Object.values(aiProviders).filter(p => p.enabled).length}
                    </Typography>
                    <Typography variant="body2">Verbunden</Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default AIIntegration;