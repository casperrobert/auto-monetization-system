import React, { useState, useEffect } from 'react';
import { Container, Typography, Grid, Card, CardContent, Box, Alert, Chip, List, ListItem, ListItemIcon, ListItemText } from '@mui/material';
import { CheckCircle, Warning, Error, Security, Assignment, Verified } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const ComplianceReport = () => {
  const navigate = useNavigate();
  const [report, setReport] = useState(null);

  useEffect(() => {
    // Simulate API call
    setReport({
      reportId: 'COMP-1703789234567',
      generatedAt: new Date().toISOString(),
      period: '2024-01',
      
      summary: {
        totalIncome: 7990.00,
        totalTaxReserved: 2847.50,
        complianceStatus: 'COMPLIANT'
      },
      
      compliance: {
        compliant: true,
        violations: [],
        warnings: [
          {
            type: 'VAT_THRESHOLD_EXCEEDED',
            message: 'Umsatzsteuer-Kleinunternehmerregelung nicht mehr anwendbar',
            threshold: 22000,
            current: 35600
          }
        ],
        lastCheck: new Date().toISOString()
      },
      
      auditSummary: {
        totalEvents: 247,
        integrityVerified: true
      },
      
      recommendations: [
        {
          priority: 'MEDIUM',
          action: 'Umsatzsteuer-Registrierung',
          description: 'Anmeldung zur Umsatzsteuer beim Finanzamt erforderlich'
        },
        {
          priority: 'LOW',
          action: 'Steuerberater konsultieren',
          description: 'Bei höheren Einkommen professionelle Beratung empfohlen'
        }
      ],
      
      certifications: {
        gdprCompliant: true,
        taxTransparency: true,
        auditTrail: true,
        dataIntegrity: true
      }
    });
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'COMPLIANT': return 'success';
      case 'NON_COMPLIANT': return 'error';
      default: return 'warning';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'HIGH': return 'error';
      case 'MEDIUM': return 'warning';
      case 'LOW': return 'info';
      default: return 'default';
    }
  };

  if (!report) return null;

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h4" sx={{ display: 'flex', alignItems: 'center' }}>
          <Assignment sx={{ mr: 2 }} />
          Compliance-Bericht
        </Typography>
        <Chip 
          label={`Report ID: ${report.reportId}`} 
          variant="outlined" 
          size="small"
        />
      </Box>

      <Alert severity="info" sx={{ mb: 4 }}>
        Automatisch generierter Compliance-Bericht für Periode {report.period}. 
        Erstellt am: {new Date(report.generatedAt).toLocaleString('de-DE')}
      </Alert>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Compliance-Status</Typography>
              <Box display="flex" alignItems="center" mb={2}>
                <Chip 
                  label={report.summary.complianceStatus}
                  color={getStatusColor(report.summary.complianceStatus)}
                  icon={report.compliance.compliant ? <CheckCircle /> : <Error />}
                />
              </Box>
              <Typography variant="body2">
                Gesamteinkommen: €{report.summary.totalIncome.toFixed(2)}
              </Typography>
              <Typography variant="body2">
                Steuerreserven: €{report.summary.totalTaxReserved.toFixed(2)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Audit-Status</Typography>
              <Box display="flex" alignItems="center" mb={2}>
                <Chip 
                  label={report.auditSummary.integrityVerified ? 'VERIFIZIERT' : 'KOMPROMITTIERT'}
                  color={report.auditSummary.integrityVerified ? 'success' : 'error'}
                  icon={<Security />}
                />
              </Box>
              <Typography variant="body2">
                Audit-Ereignisse: {report.auditSummary.totalEvents}
              </Typography>
              <Typography variant="body2">
                Datenintegrität: {report.auditSummary.integrityVerified ? 'Bestätigt' : 'Verletzt'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Zertifizierungen</Typography>
              <List dense>
                {Object.entries(report.certifications).map(([cert, status]) => (
                  <ListItem key={cert} sx={{ py: 0 }}>
                    <ListItemIcon>
                      {status ? <Verified color="success" /> : <Error color="error" />}
                    </ListItemIcon>
                    <ListItemText 
                      primary={cert.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                      primaryTypographyProps={{ variant: 'body2' }}
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {report.compliance.violations.length > 0 && (
          <Grid item xs={12}>
            <Card sx={{ bgcolor: 'error.dark', color: 'white' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  <Error sx={{ mr: 1 }} />
                  Compliance-Verletzungen
                </Typography>
                {report.compliance.violations.map((violation, index) => (
                  <Alert key={index} severity="error" sx={{ mb: 1 }}>
                    <Typography variant="body2">
                      <strong>{violation.type}:</strong> {violation.message || 'Schwerwiegende Verletzung erkannt'}
                    </Typography>
                  </Alert>
                ))}
              </CardContent>
            </Card>
          </Grid>
        )}

        {report.compliance.warnings.length > 0 && (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  <Warning sx={{ mr: 1 }} />
                  Warnungen
                </Typography>
                {report.compliance.warnings.map((warning, index) => (
                  <Alert key={index} severity="warning" sx={{ mb: 1 }}>
                    <Typography variant="body2">
                      <strong>{warning.type}:</strong> {warning.message}
                    </Typography>
                    {warning.threshold && (
                      <Typography variant="caption">
                        Schwellenwert: €{warning.threshold} | Aktuell: €{warning.current}
                      </Typography>
                    )}
                  </Alert>
                ))}
              </CardContent>
            </Card>
          </Grid>
        )}

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Empfehlungen</Typography>
              {report.recommendations.map((rec, index) => (
                <Box key={index} sx={{ mb: 2, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                  <Box display="flex" alignItems="center" mb={1}>
                    <Chip 
                      label={rec.priority} 
                      color={getPriorityColor(rec.priority)}
                      size="small"
                      sx={{ mr: 2 }}
                    />
                    <Typography variant="subtitle2">{rec.action}</Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {rec.description}
                  </Typography>
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default ComplianceReport;