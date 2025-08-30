import React, { useState, useEffect } from 'react';
import { IconButton, Badge, Menu, MenuItem, Typography, Box, Chip } from '@mui/material';
import { Notifications, Warning, Error, Info } from '@mui/icons-material';
import ApiService from '../services/api';

const NotificationBell = () => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const loadNotifications = async () => {
      try {
        const data = await ApiService.getNotifications();
        setNotifications(data);
        setUnreadCount(data.filter(n => !n.read).length);
      } catch (error) {
        console.error('Failed to load notifications:', error);
        setNotifications([]);
        setUnreadCount(0);
      }
    };
    
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'CRITICAL': return <Error color="error" />;
      case 'HIGH': return <Warning color="warning" />;
      default: return <Info color="info" />;
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'CRITICAL': return 'error';
      case 'HIGH': return 'warning';
      default: return 'info';
    }
  };

  return (
    <>
      <IconButton onClick={handleClick} color="inherit">
        <Badge badgeContent={unreadCount} color="error">
          <Notifications />
        </Badge>
      </IconButton>
      
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        PaperProps={{
          sx: { width: 350, maxHeight: 400 }
        }}
      >
        <Box sx={{ p: 2, borderBottom: '1px solid #333' }}>
          <Typography variant="h6">Benachrichtigungen</Typography>
        </Box>
        
        {notifications.length === 0 ? (
          <MenuItem>
            <Typography variant="body2" color="text.secondary">
              Keine neuen Benachrichtigungen
            </Typography>
          </MenuItem>
        ) : (
          notifications.map((notification) => (
            <MenuItem key={notification.id} sx={{ flexDirection: 'column', alignItems: 'flex-start', py: 2 }}>
              <Box display="flex" alignItems="center" width="100%" mb={1}>
                {getSeverityIcon(notification.severity)}
                <Typography variant="subtitle2" sx={{ ml: 1, flex: 1 }}>
                  {notification.title}
                </Typography>
                <Chip 
                  label={notification.severity} 
                  color={getSeverityColor(notification.severity)}
                  size="small"
                />
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                {notification.message}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {new Date(notification.timestamp).toLocaleString('de-DE')}
              </Typography>
            </MenuItem>
          ))
        )}
      </Menu>
    </>
  );
};

export default NotificationBell;