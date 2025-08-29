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
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation();
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
    if (!editing || !editing.id) return setError(t('streams.idRequired'));
    let params;
    try { params = JSON.parse(paramsText || '{}'); } catch (e) { return setError(t('streams.paramsInvalid')); }
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
    if (!window.confirm(t('streams.deleteConfirm', { id }))) return;
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
        <Typography variant="h6">{t('streams.title')}</Typography>
        <Box>
          <Tooltip title={t('streams.new')}>
            <Button startIcon={<Add />} variant="contained" onClick={openCreate}>{t('streams.new')}</Button>
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
                    {item.enabled ? t('streams.active') : t('streams.inactive')}
                  </>}
                />
                <ListItemSecondaryAction>
                  <FormControlLabel control={<Switch checked={!!item.enabled} onChange={() => toggleEnabled(item)} />} label={t('streams.enabled')} />
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
        <DialogTitle>{editing && editing.id ? (list.find(s=>s.id===editing.id) ? t('streams.edit') : t('streams.create')) : t('streams.create')}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: '1fr 1fr', mt: 1 }}>
            <TextField label="ID" value={editing?.id||''} onChange={e=>setEditing({...editing, id:e.target.value})} fullWidth disabled={!!(list.find(s=>s.id===editing?.id))} />
            <TextField label="Type" value={editing?.type||''} onChange={e=>setEditing({...editing, type:e.target.value})} fullWidth />
            <FormControlLabel control={<Switch checked={!!editing?.enabled} onChange={e=>setEditing({...editing, enabled:e.target.checked})} />} label={t('streams.enabled')} />
            <Box />
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', gridColumn: '1 / -1' }}>
              <TextField label={t('streams.paramsLabel')} multiline minRows={6} value={paramsText} onChange={e=>setParamsText(e.target.value)} fullWidth />
              <Button variant="outlined" onClick={()=>{ try { const p = JSON.parse(paramsText||'{}'); setParamsText(JSON.stringify(p,null,2)); setError(null); } catch(e){ setError(t('streams.paramsInvalid')); } }}>{t('streams.format')}</Button>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button startIcon={<Cancel />} onClick={closeDialog}>{t('streams.cancel')}</Button>
          <Button startIcon={<Save />} variant="contained" onClick={async ()=>{
            if(!editing || !editing.id) { setError(t('streams.idRequired')); return; }
            try { JSON.parse(paramsText||'{}'); } catch(e){ setError(t('streams.paramsInvalid')); return; }
            await handleSave();
          }}>{t('streams.save')}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
