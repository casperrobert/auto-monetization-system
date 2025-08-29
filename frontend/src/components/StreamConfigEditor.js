import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  TextField,
  Switch,
  FormControlLabel,
  Typography,
  Divider,
  Chip,
  CircularProgress,
  Tooltip
} from '@mui/material';
import { Add, Edit, Delete, Save, Cancel } from '@mui/icons-material';

function apiFetch(path, opts = {}) {
  const token = localStorage.getItem('ams_token');
  const headers = { 'Content-Type': 'application/json', ...(opts.headers || {}) };
  if (token) headers['Authorization'] = 'Bearer ' + token;
  return fetch(path, { ...opts, headers }).then(async (r) => {
    const txt = await r.text();
    try { return JSON.parse(txt||'{}'); } catch { return { ok: r.ok, data: txt }; }
  });
}

export default function StreamConfigEditor() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [paramsText, setParamsText] = useState('{}');
  const [error, setError] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/api/streams-config');
      if (Array.isArray(res)) setList(res);
      else if (res.streams) setList(res.streams);
      else if (res.error) setError(res.error);
    } catch (e) { setError(e.message); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditing({ id: '', type: 'youtube', enabled: true, params: {} });
    setParamsText(JSON.stringify({}, null, 2));
    setError(null);
    setDialogOpen(true);
  };
  const openEdit = (item) => {
    setEditing(JSON.parse(JSON.stringify(item)));
    setParamsText(JSON.stringify(item.params || {}, null, 2));
    setError(null);
    setDialogOpen(true);
  };
  const closeDialog = () => { setDialogOpen(false); setEditing(null); setError(null); };

  const handleSave = async () => {
    if (!editing || !editing.id) return setError('ID is required');
    let params;
    try { params = JSON.parse(paramsText || '{}'); } catch (e) { return setError('Params must be valid JSON'); }
    const payload = { ...editing, params };
    const exists = list.find(s => s.id === editing.id);
    try {
      const method = exists ? 'PUT' : 'POST';
      const url = exists ? '/api/streams-config/' + encodeURIComponent(editing.id) : '/api/streams-config';
      const res = await apiFetch(url, { method, body: JSON.stringify(payload) });
      if (res && res.error) return setError(res.error);
      await load();
      closeDialog();
    } catch (e) { setError(e.message); }
  };

  const handleDelete = async (id) => {
    if (!confirm(`Delete stream config "${id}"?`)) return;
    try { await apiFetch('/api/streams-config/' + encodeURIComponent(id), { method: 'DELETE' }); await load(); } catch (e) { setError(e.message); }
  };

  const toggleEnabled = async (item) => {
    try {
      const updated = { ...item, enabled: !item.enabled };
      await apiFetch('/api/streams-config/' + encodeURIComponent(item.id), { method: 'PUT', body: JSON.stringify(updated) });
      await load();
    } catch (e) { setError(e.message); }
  };

  return (
    <Box sx={{ p: 2 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">Stream-Konfiguration</Typography>
        <Box>
          <Tooltip title="Neu">
            <Button startIcon={<Add />} variant="contained" onClick={openCreate}>Neu</Button>
          </Tooltip>
        </Box>
      </Box>

      {error && <Typography color="error" sx={{ mb: 1 }}>{error}</Typography>}
      {loading ? <CircularProgress /> : (
        <List>
          {list.map(item => (
            <React.Fragment key={item.id}>
              <ListItem>
                <ListItemText
                  primary={item.id}
                  secondary={<>
                    <Chip label={item.type} size="small" sx={{ mr: 1 }} />
                    {item.enabled ? 'aktiv' : 'deaktiviert'}
                  </>}
                />
                <ListItemSecondaryAction>
                  <FormControlLabel control={<Switch checked={!!item.enabled} onChange={() => toggleEnabled(item)} />} label="Enabled" />
                  <IconButton edge="end" aria-label="edit" onClick={() => openEdit(item)}><Edit /></IconButton>
                  <IconButton edge="end" aria-label="delete" onClick={() => handleDelete(item.id)}><Delete /></IconButton>
                </ListItemSecondaryAction>
              </ListItem>
              <Divider />
            </React.Fragment>
          ))}
        </List>
      )}

      <Dialog open={dialogOpen} onClose={closeDialog} maxWidth="md" fullWidth>
        <DialogTitle>{editing && editing.id ? (list.find(s=>s.id===editing.id) ? 'Bearbeiten' : 'Erstellen') : 'Erstellen'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: '1fr 1fr', mt: 1 }}>
            <TextField label="ID" value={editing?.id||''} onChange={e=>setEditing({...editing, id:e.target.value})} fullWidth disabled={!!(list.find(s=>s.id===editing?.id))} />
            <TextField label="Type" value={editing?.type||''} onChange={e=>setEditing({...editing, type:e.target.value})} fullWidth />
            <FormControlLabel control={<Switch checked={!!editing?.enabled} onChange={e=>setEditing({...editing, enabled:e.target.checked})} />} label="Enabled" />
            <Box />
            <TextField label="Params (JSON)" multiline minRows={6} value={paramsText} onChange={e=>setParamsText(e.target.value)} fullWidth sx={{ gridColumn: '1 / -1' }} />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button startIcon={<Cancel />} onClick={closeDialog}>Abbrechen</Button>
          <Button startIcon={<Save />} variant="contained" onClick={handleSave}>Speichern</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
