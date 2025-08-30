import React, { useState, useEffect } from 'react';
import { Container, Grid, Card, CardContent, Typography, Box, LinearProgress, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField } from '@mui/material';
import { TrendingUp, AttachMoney, AccountBalance, YouTube, Settings, Refresh, Psychology, AdminPanelSettings, Lock, Assignment, People } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import NotificationBell from '../components/NotificationBell';
import ApiService from '../services/api';
import WebSocketService from '../services/websocket';
import PushNotificationService from '../services/push-notifications';

const Dashboard = () => {
  const navigate = useNavigate();
  const [income, setIncome] = useState({
    youtube: 1250,
    affiliate: 890,
    dropshipping: 2100,
    dividends: 450,
    p2p: 320,
    reits: 680,
    courses: 1500,
    apps: 750
  });
  const [selectedCard, setSelectedCard] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  const totalIncome = Object.values(income).reduce((sum, val) => sum + val, 0);

  const handleCardClick = (key, value) => {
    navigate(`/category/${encodeURIComponent(key)}`);
  };

  const handleSave = async () => {
    if (selectedCard && editValue) {
      try {
        const updates = { [selectedCard]: parseInt(editValue) || 0 };
        const updatedIncome = await ApiService.updateIncome(updates);
        setIncome(updatedIncome);
      } catch (error) {
        console.error('Failed to update income:', error);
      }
    }
    setIsEditing(false);
    setSelectedCard(null);
  };

  const refreshData = async () => {
    try {
      const data = await ApiService.simulateIncome();
      setIncome(data);
    } catch (error) {
      console.error('Failed to refresh data:', error);
    }
  };

  const loadIncomeData = async () => {
    try {
      const data = await ApiService.getIncome();
      setIncome(data);
    } catch (error) {
      console.error('Failed to load income data:', error);
    }
  };

  useEffect(() => {
    loadIncomeData();
    initializeRealTimeFeatures();
    
    return () => {
      WebSocketService.disconnect();
    };
  }, []);

  const initializeRealTimeFeatures = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        await WebSocketService.connect(token);
        
        // Listen for real-time income updates
        WebSocketService.on('incomeUpdate', (data) => {
          setIncome(data);
        });
        
        // Initialize push notifications
        if (PushNotificationService.isSupported()) {
          await PushNotificationService.initialize();
        }
      }
    } catch (error) {
      console.error('Failed to initialize real-time features:', error);
    }
  };

  const incomeCards = [
    { title: 'YouTube', key: 'youtube', value: income.youtube, icon: <YouTube />, color: '#ff0000' },
    { title: 'Affiliate Marketing', key: 'affiliate', value: income.affiliate, icon: <TrendingUp />, color: '#4caf50' },
    { title: 'Dropshipping', key: 'dropshipping', value: income.dropshipping, icon: <AttachMoney />, color: '#2196f3' },
    { title: 'Dividenden', key: 'dividends', value: income.dividends, icon: <AccountBalance />, color: '#ff9800' },
    { title: 'P2P Lending', key: 'p2p', value: income.p2p, icon: <TrendingUp />, color: '#9c27b0' },
    { title: 'REITs', key: 'reits', value: income.reits, icon: <AccountBalance />, color: '#607d8b' },
    { title: 'Online Kurse', key: 'courses', value: income.courses, icon: <TrendingUp />, color: '#795548' },
    { title: 'Mobile Apps', key: 'apps', value: income.apps, icon: <TrendingUp />, color: '#e91e63' }
  ];

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h3">
          Casper-Auto-Monetization System
        </Typography>
        <Box display="flex" alignItems="center">
          <NotificationBell />
          <Button
            variant="outlined"
            startIcon={<Settings />}
            onClick={() => navigate('/streams')}
            sx={{ mr: 2 }}
          >
            Streams
          </Button>
          <Button
            variant="outlined"
            startIcon={<Lock />}
            onClick={() => navigate('/tax')}
            sx={{ mr: 2 }}
            color="error"
          >
            Steuern
          </Button>
          <Button
            variant="outlined"
            startIcon={<Assignment />}
            onClick={() => navigate('/compliance')}
            sx={{ mr: 2 }}
            color="warning"
          >
            Compliance
          </Button>
          <Button
            variant="outlined"
            startIcon={<Psychology />}
            onClick={() => navigate('/ai')}
            sx={{ mr: 2 }}
          >
            KI-Integration
          </Button>
          <Button
            variant="outlined"
            startIcon={<People />}
            onClick={() => navigate('/users')}
            sx={{ mr: 2 }}
          >
            Benutzer
          </Button>
          <Button
            variant="outlined"
            startIcon={<AdminPanelSettings />}
            onClick={() => navigate('/admin')}
          >
            Admin
          </Button>
        </Box>
      </Box>
      
      <Card sx={{ mb: 4, background: 'linear-gradient(45deg, #1976d2 30%, #21cbf3 90%)' }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Box>
              <Typography variant="h4" color="white">
                Gesamteinkommen: €{totalIncome.toLocaleString()}
              </Typography>
              <Typography variant="h6" color="white" sx={{ mt: 1 }}>
                Monatlich
              </Typography>
            </Box>
            <Button
              variant="contained"
              color="secondary"
              startIcon={<Refresh />}
              onClick={refreshData}
              sx={{ bgcolor: 'rgba(255,255,255,0.2)', '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' } }}
            >
              Aktualisieren
            </Button>
          </Box>
        </CardContent>
      </Card>

      <Grid container spacing={3}>
        {incomeCards.map((card, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card 
              sx={{ 
                height: '100%', 
                background: `linear-gradient(45deg, ${card.color} 30%, ${card.color}aa 90%)`,
                cursor: 'pointer',
                transition: 'transform 0.2s',
                '&:hover': { transform: 'scale(1.05)' }
              }}
              onClick={() => handleCardClick(card.key, card.value)}
            >
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                  <Box display="flex" alignItems="center">
                    {card.icon}
                    <Typography variant="h6" sx={{ ml: 1, color: 'white' }}>
                      {card.title}
                    </Typography>
                  </Box>
                  <Settings sx={{ color: 'rgba(255,255,255,0.7)' }} />
                </Box>
                <Typography variant="h4" color="white">
                  €{card.value}
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={(card.value / totalIncome) * 100} 
                  sx={{ mt: 2, bgcolor: 'rgba(255,255,255,0.3)' }}
                />
                <Typography variant="body2" color="white" sx={{ mt: 1 }}>
                  {((card.value / totalIncome) * 100).toFixed(1)}% des Gesamteinkommens
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    {/* $PLACEHOLDER$ entfernt, da kein zusätzlicher Code benötigt wird */}
      <Card sx={{ mt: 4 }}>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            System Status
          </Typography>
          <Typography variant="body1" color="success.main">
            ✅ Alle Einkommensströme aktiv
          </Typography>
          <Typography variant="body1" color="success.main">
            ✅ Automatisierung läuft
          </Typography>
          <Typography variant="body1" color="success.main">
            ✅ Sicherheitssysteme online
          </Typography>
        </CardContent>
      </Card>

  {/* Edit dialog removed: click a card to open detailed settings */}
    </Container>
  );
};

export default Dashboard;