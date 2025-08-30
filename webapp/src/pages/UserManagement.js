import React, { useState, useEffect } from 'react';
import { 
  Container, Typography, Grid, Card, CardContent, Box, Button, Dialog, DialogTitle, 
  DialogContent, TextField, Select, MenuItem, FormControl, InputLabel, Table, 
  TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Chip, IconButton
} from '@mui/material';
import { Add, Edit, Delete, People } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import ApiService from '../services/api';

const UserManagement = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    role: 'user',
    password: ''
  });

  useEffect(() => {
    loadUsers();
    loadRoles();
  }, []);

  const loadUsers = async () => {
    try {
      const data = await ApiService.request('/api/users');
      setUsers(data);
    } catch (error) {
      console.error('Failed to load users:', error);
      // Fallback data
      setUsers([
        { id: 1, username: 'admin', role: 'admin', active: true },
        { id: 2, username: 'manager1', role: 'manager', active: true },
        { id: 3, username: 'user1', role: 'user', active: true }
      ]);
    }
  };

  const loadRoles = async () => {
    try {
      const data = await ApiService.request('/api/rbac/roles');
      setRoles(data);
    } catch (error) {
      console.error('Failed to load roles:', error);
      // Fallback data
      setRoles([
        { name: 'admin', description: 'Full system access', permissions: ['*'] },
        { name: 'manager', description: 'Management access', permissions: ['income:read', 'income:write'] },
        { name: 'user', description: 'Standard user access', permissions: ['income:read'] },
        { name: 'viewer', description: 'Read-only access', permissions: ['income:read'] }
      ]);
    }
  };

  const handleCreateUser = () => {
    setEditingUser(null);
    setFormData({ username: '', email: '', role: 'user', password: '' });
    setOpenDialog(true);
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      email: user.email || '',
      role: user.role,
      password: ''
    });
    setOpenDialog(true);
  };

  const handleSaveUser = async () => {
    try {
      if (editingUser) {
        // Update user (not implemented in this demo)
        console.log('Update user:', formData);
      } else {
        // Create new user
        await ApiService.request('/api/users', {
          method: 'POST',
          body: JSON.stringify(formData)
        });
      }
      setOpenDialog(false);
      loadUsers();
    } catch (error) {
      console.error('Failed to save user:', error);
    }
  };

  const getRoleColor = (role) => {
    const colors = {
      admin: 'error',
      manager: 'warning',
      user: 'primary',
      viewer: 'default'
    };
    return colors[role] || 'default';
  };

  const getRolePermissions = (roleName) => {
    const role = roles.find(r => r.name === roleName);
    return role ? role.permissions : [];
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h4" sx={{ display: 'flex', alignItems: 'center' }}>
          <People sx={{ mr: 2 }} />
          Benutzerverwaltung
        </Typography>
        <Box>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleCreateUser}
            sx={{ mr: 2 }}
          >
            Benutzer hinzufügen
          </Button>
          <Button variant="outlined" onClick={() => navigate('/')}>
            Zurück
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Benutzer</Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Benutzername</TableCell>
                      <TableCell>Rolle</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Aktionen</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>{user.username}</TableCell>
                        <TableCell>
                          <Chip 
                            label={user.role} 
                            color={getRoleColor(user.role)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={user.active ? 'Aktiv' : 'Inaktiv'}
                            color={user.active ? 'success' : 'default'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <IconButton 
                            size="small" 
                            onClick={() => handleEditUser(user)}
                          >
                            <Edit />
                          </IconButton>
                          <IconButton size="small" color="error">
                            <Delete />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Rollen & Berechtigungen</Typography>
              {roles.map((role) => (
                <Box key={role.name} sx={{ mb: 2, p: 2, border: '1px solid #333', borderRadius: 1 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <Chip 
                      label={role.name} 
                      color={getRoleColor(role.name)}
                      size="small"
                    />
                    <Typography variant="caption">
                      {role.permissions.length} Berechtigung(en)
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    {role.description}
                  </Typography>
                  <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
                    {role.permissions.slice(0, 3).join(', ')}
                    {role.permissions.length > 3 && '...'}
                  </Typography>
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* User Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingUser ? 'Benutzer bearbeiten' : 'Neuen Benutzer erstellen'}
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Benutzername"
            value={formData.username}
            onChange={(e) => setFormData({...formData, username: e.target.value})}
            margin="normal"
          />
          <TextField
            fullWidth
            label="E-Mail"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
            margin="normal"
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>Rolle</InputLabel>
            <Select
              value={formData.role}
              onChange={(e) => setFormData({...formData, role: e.target.value})}
            >
              {roles.map((role) => (
                <MenuItem key={role.name} value={role.name}>
                  {role.name} - {role.description}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          {!editingUser && (
            <TextField
              fullWidth
              label="Passwort"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              margin="normal"
            />
          )}
          <Box display="flex" justifyContent="flex-end" gap={2} mt={3}>
            <Button onClick={() => setOpenDialog(false)}>
              Abbrechen
            </Button>
            <Button variant="contained" onClick={handleSaveUser}>
              {editingUser ? 'Aktualisieren' : 'Erstellen'}
            </Button>
          </Box>
        </DialogContent>
      </Dialog>
    </Container>
  );
};

export default UserManagement;