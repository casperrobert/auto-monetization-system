# AMS Backend API

## Endpunkte

### Registrierung
`POST /api/register`
- Body: `{ "username": "...", "password": "..." }`
- Antwort: `{ ok: true }`

### Login
`POST /api/login`
- Body: `{ "username": "...", "password": "..." }`
- Antwort: `{ token: "JWT..." }`

### Einnahmen abrufen
`GET /api/income`
- Header: `Authorization: Bearer <token>`
- Antwort: `[ { ts, username, amount, source } ]`

### Einnahme speichern
`POST /api/income`
- Header: `Authorization: Bearer <token>`
- Body: `{ "amount": 10, "source": "Test" }`
- Antwort: `{ ok: true }`

## Hinweise
- Passwörter werden sicher gehasht gespeichert.
- JWT-Secret über Umgebungsvariable `JWT_SECRET` setzen.
- CORS ist aktiviert.
