# 🚀 AMS Webapp

## Features
- Modernes React-Frontend (Material UI, Dark Mode)
- Login & Authentifizierung (JWT)
- Einnahmen-Log (Cloud-basiert)
- Responsive Design
- API-Anbindung

## Entwicklung

```bash
cd webapp
npm install
npm start
```

## Backend

Express-API mit JWT-Auth und Einnahmen-Log unter `/api`.

**Wichtig:** Setze die Umgebungsvariable `JWT_SECRET` für Produktion:
```bash
export JWT_SECRET="dein-geheimer-schlüssel"
```

## Deployment
- Dockerfile folgt
- CI/CD-Vorlage folgt

## Sicherheit
- Passwörter werden aktuell im Klartext gespeichert (Demo). Für Produktion: Hashing (z.B. bcrypt) ergänzen!
- JWT-Secret in Umgebungsvariable setzen.

## ToDo
- Tests (Jest, Supertest)
- Passwort-Hashing
- Multi-Language
- Weitere Features nach Bedarf
