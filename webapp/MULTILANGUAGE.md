# Multi-Language (Basis)

## Beispiel für React-Frontend

1. Installation:
   ```bash
   npm install i18next react-i18next
   ```
2. Beispiel-Konfiguration:
   ```js
   // src/i18n.js
   import i18n from 'i18next';
   import { initReactI18next } from 'react-i18next';

   i18n.use(initReactI18next).init({
     resources: {
       de: { translation: { "Login": "Anmelden", "Dashboard": "Übersicht" } },
       en: { translation: { "Login": "Login", "Dashboard": "Dashboard" } }
     },
     lng: "de",
     fallbackLng: "en",
     interpolation: { escapeValue: false }
   });
   export default i18n;
   ```
3. Nutzung im Code:
   ```js
   import { useTranslation } from 'react-i18next';
   const { t } = useTranslation();
   <Button>{t('Login')}</Button>
   ```

## Backend
- Endpunkte können das gewünschte Language-Tag im Header akzeptieren.
