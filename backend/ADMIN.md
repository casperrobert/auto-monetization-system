# AMS Admin Panel (Basis)

## Features
- User-Liste anzeigen
- Einnahmen aller User einsehen
- User löschen (Demo)

## Beispiel-API (nur Backend, Demo)

### User-Liste
`GET /api/admin/users`
- Header: `Authorization: Bearer <admin-token>`
- Antwort: `[ { username } ]`

### Einnahmen aller User
`GET /api/admin/income`
- Header: `Authorization: Bearer <admin-token>`
- Antwort: `[ { ts, username, amount, source } ]`

### User löschen
`DELETE /api/admin/user/:username`
- Header: `Authorization: Bearer <admin-token>`
- Antwort: `{ ok: true }`

## Hinweis
- Admin-Token manuell generieren (Demo). Für Produktion: Rollen und Rechte ergänzen!
