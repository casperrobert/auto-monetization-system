import React, { useState, useEffect } from 'react';
import { 
  Container, Typography, Grid, Card, CardContent, Box, Button, TextField, 
  Select, MenuItem, FormControl, InputLabel, Chip, Alert, Accordion,
  AccordionSummary, AccordionDetails, Switch, FormControlLabel
} from '@mui/material';
import { Psychology, ExpandMore, Settings, Security, TrendingUp } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import ApiService from '../services/api';

const AIConfiguration = () => {
  const navigate = useNavigate();
  const [providers, setProviders] = useState({
    openai: { enabled: false, apiKey: '', model: 'gpt-4' },
    anthropic: { enabled: false, apiKey: '', model: 'claude-3-sonnet-20240229' },
    google: { enabled: false, apiKey: '', model: 'gemini-pro' },
    grok: { enabled: false, apiKey: '', model: 'grok-beta' },
    deepseek: { enabled: false, apiKey: '', model: 'deepseek-chat' },
    cohere: { enabled: false, apiKey: '', model: 'command-r-plus' },
    perplexity: { enabled: false, apiKey: '', model: 'llama-3.1-sonar-huge-128k-online' },
    together: { enabled: false, apiKey: '', model: 'meta-llama/Llama-3-70b-chat-hf' },
    replicate: { enabled: false, apiKey: '', model: 'meta/llama-2-70b-chat' }
  });

  const [aiStatus, setAiStatus] = useState(null);
  const [testResults, setTestResults] = useState({});

  const providerInfo = {
    openai: {
      name: 'OpenAI GPT-4',
      description: 'Advanced reasoning and analysis',
      pricing: '$20/month (Plus) - $200/month (Team)',
      features: ['Advanced reasoning', 'Code analysis', 'Creative insights'],
      tier: 'Premium'
    },
    anthropic: {
      name: 'Anthropic Claude',
      description: 'Ethical AI with deep analysis',
      pricing: '$20/month (Pro) - $400/month (Team)',
      features: ['Ethical reasoning', 'Long context', 'Safety-focused'],
      tier: 'Premium'
    },
    google: {
      name: 'Google Gemini Pro',
      description: 'Multimodal AI capabilities',
      pricing: '$20/month (Advanced)',
      features: ['Multimodal', 'Real-time data', 'Google integration'],
      tier: 'Premium'
    },
    grok: {
      name: 'Grok (X.AI)',
      description: 'Real-time insights with personality',
      pricing: '$16/month (X Premium+)',
      features: ['Real-time data', 'Witty responses', 'X platform integration'],
      tier: 'Premium'
    },
    deepseek: {
      name: 'DeepSeek',
      description: 'Advanced mathematical reasoning',
      pricing: '$20/month (Pro)',
      features: ['Mathematical analysis', 'Code generation', 'Research-grade'],
      tier: 'Professional'
    },
    cohere: {
      name: 'Cohere Command-R+',
      description: 'Enterprise-grade language model',
      pricing: '$50/month (Starter) - Custom Enterprise',
      features: ['Enterprise security', 'Custom training', 'API optimization'],
      tier: 'Enterprise'
    },
    perplexity: {
      name: 'Perplexity AI',
      description: 'Real-time search and analysis',
      pricing: '$20/month (Pro)',
      features: ['Real-time search', 'Source citations', 'Research assistant'],
      tier: 'Professional'
    },
    together: {
      name: 'Together AI',
      description: 'Open-source model hosting',
      pricing: '$25/month (Starter) - Custom',
      features: ['Open models', 'Custom hosting', 'Fine-tuning'],
      tier: 'Professional'
    },
    replicate: {
      name: 'Replicate',
      description: 'ML model deployment platform',
      pricing: 'Pay-per-use - $50/month+',
      features: ['Model variety', 'Custom deployment', 'Scalable inference'],
      tier: 'Professional'
    }
  };

  useEffect(() => {
    loadAIStatus();
  }, []);

  const loadAIStatus = async () => {
    try {
      const status = await ApiService.request('/api/ai/status');
      setAiStatus(status);
    } catch (error) {
      console.error('Failed to load AI status:', error);
    }
  };

  const handleProviderChange = (provider, field, value) => {
    setProviders(prev => ({
      ...prev,
      [provider]: {
        ...prev[provider],
        [field]: value
      }
    }));
  };

  const testProvider = async (provider) => {
    try {
      const config = providers[provider];
      const result = await ApiService.request('/api/ai/configure', {
        method: 'POST',
        body: JSON.stringify({ provider, config })
      });
      
      setTestResults(prev => ({
        ...prev,
        [provider]: { success: result.success, message: result.message }
      }));
    } catch (error) {
      setTestResults(prev => ({
        ...prev,
        [provider]: { success: false, message: error.message }
      }));
    }
  };

  const saveConfiguration = async () => {
    const enabledProviders = Object.entries(providers)
      .filter(([_, config]) => config.enabled && config.apiKey)
      .map(([provider, config]) => ({ provider, config }));

    for (const { provider, config } of enabledProviders) {
      await testProvider(provider);
    }

    alert(`${enabledProviders.length} AI providers configured successfully!`);
  };

  const getTierColor = (tier) => {
    const colors = {
      'Premium': 'primary',
      'Professional': 'secondary',
      'Enterprise': 'error'
    };
    return colors[tier] || 'default';
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h4" sx={{ display: 'flex', alignItems: 'center' }}>
          <Psychology sx={{ mr: 2 }} />
          Premium AI Configuration
        </Typography>
        <Box>
          <Button variant="contained" onClick={saveConfiguration} sx={{ mr: 2 }}>
            Save Configuration
          </Button>
          <Button variant="outlined" onClick={() => navigate('/')}>
            Back to Dashboard
          </Button>
        </Box>
      </Box>

      {aiStatus && (
        <Alert severity="info" sx={{ mb: 3 }}>
          Current AI Status: {aiStatus.providers?.length || 0} providers configured
        </Alert>
      )}

      <Grid container spacing={3}>
        {Object.entries(providerInfo).map(([provider, info]) => (
          <Grid item xs={12} key={provider}>
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Box display="flex" alignItems="center" width="100%">
                  <Box flexGrow={1}>
                    <Typography variant="h6">{info.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {info.description}
                    </Typography>
                  </Box>
                  <Box display="flex" alignItems="center" gap={2}>
                    <Chip 
                      label={info.tier} 
                      color={getTierColor(info.tier)}
                      size="small"
                    />
                    <Typography variant="body2" sx={{ minWidth: 120 }}>
                      {info.pricing}
                    </Typography>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={providers[provider].enabled}
                          onChange={(e) => handleProviderChange(provider, 'enabled', e.target.checked)}
                        />
                      }
                      label="Enable"
                    />
                  </Box>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="API Key"
                      type="password"
                      value={providers[provider].apiKey}
                      onChange={(e) => handleProviderChange(provider, 'apiKey', e.target.value)}
                      disabled={!providers[provider].enabled}
                      placeholder="Enter your API key"
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="Model"
                      value={providers[provider].model}
                      onChange={(e) => handleProviderChange(provider, 'model', e.target.value)}
                      disabled={!providers[provider].enabled}
                    />
                  </Grid>
                  <Grid item xs={12} md={2}>
                    <Button
                      fullWidth
                      variant="outlined"
                      onClick={() => testProvider(provider)}
                      disabled={!providers[provider].enabled || !providers[provider].apiKey}
                    >
                      Test
                    </Button>
                  </Grid>
                  <Grid item xs={12}>
                    <Box display="flex" gap={1} mb={2}>
                      {info.features.map((feature, index) => (
                        <Chip key={index} label={feature} size="small" variant="outlined" />
                      ))}
                    </Box>
                    {testResults[provider] && (
                      <Alert 
                        severity={testResults[provider].success ? 'success' : 'error'}
                        sx={{ mt: 1 }}
                      >
                        {testResults[provider].message}
                      </Alert>
                    )}
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>
          </Grid>
        ))}
      </Grid>

      <Card sx={{ mt: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            <TrendingUp sx={{ mr: 1, verticalAlign: 'middle' }} />
            AI Analysis Features
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <Typography variant="subtitle2" gutterBottom>Income Predictions</Typography>
              <Typography variant="body2" color="text.secondary">
                Advanced forecasting using multiple AI models for accurate income projections.
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="subtitle2" gutterBottom>Market Insights</Typography>
              <Typography variant="body2" color="text.secondary">
                Real-time market analysis and trend identification for optimization opportunities.
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="subtitle2" gutterBottom>Risk Assessment</Typography>
              <Typography variant="body2" color="text.secondary">
                Comprehensive risk analysis and mitigation strategies powered by AI.
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Container>
  );
};

export default AIConfiguration;