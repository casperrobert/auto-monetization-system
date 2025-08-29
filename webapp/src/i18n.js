import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

i18n.use(initReactI18next).init({
  resources: {
    de: {
      translation: {
        welcome: 'Willkommen',
        dashboard: 'Dashboard',
        streams: {
          title: 'Stream-Konfiguration',
          new: 'Neu',
          edit: 'Bearbeiten',
          create: 'Erstellen',
          deleteConfirm: 'Soll "{{id}}" gelöscht werden?',
          enabled: 'Enabled',
          active: 'aktiv',
          inactive: 'deaktiviert',
          format: 'Formatieren',
          idRequired: 'ID ist erforderlich',
          paramsInvalid: 'Params muss gültiges JSON sein',
          paramsLabel: 'Params (JSON)',
          save: 'Speichern',
          cancel: 'Abbrechen'
        }
      }
    }
  },
  lng: 'de',
  fallbackLng: 'de',
  interpolation: {
    escapeValue: false
  }
});

export default i18n;