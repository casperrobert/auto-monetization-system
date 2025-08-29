# End-to-End-Test (Deployment)

## Schritte
1. Docker-Build für Backend und Frontend:
   ```bash
   cd backend && docker build -t ams-backend .
   cd ../webapp && docker build -t ams-frontend .
   ```
2. Container starten (z.B. mit Docker Compose):
   ```yaml
   version: '3'
   services:
     backend:
       build: ./backend
       ports:
         - "3000:3000"
       environment:
         - JWT_SECRET=supersecret
     frontend:
       build: ./webapp
       ports:
         - "8080:3000"
   ```
3. Testen:
   - API-Endpunkte mit Postman oder curl prüfen
   - Frontend im Browser öffnen (http://localhost:8080)
   - Login, Dashboard, Admin-Panel durchspielen

## Sicherheit
- Setze sichere Secrets und prüfe die Container auf Schwachstellen (z.B. mit Trivy).
