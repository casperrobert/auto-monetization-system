import React from 'react';
import { Container, Box, Button } from '@mui/material';
import StreamConfigEditor from '../components/StreamConfigEditor';
import { useNavigate } from 'react-router-dom';

const StreamConfig = () => {
  const navigate = useNavigate();
  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Box display="flex" justifyContent="flex-end" mb={2}>
        <Button variant="outlined" onClick={() => navigate('/')}>Zurück zum Dashboard</Button>
      </Box>
      <StreamConfigEditor />
    </Container>
  );
};

export default StreamConfig;