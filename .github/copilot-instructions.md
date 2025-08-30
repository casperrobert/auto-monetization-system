# Copilot Instructions for Casper-Auto-Monetization System (AMS)

## Big Picture Architecture
- **Backend:** Node.js/Express API (`backend/`), JWT auth, modular routes, security (Helmet, CORS, rate-limit), file+sqlite adapters, AI integration via ENV flags.
- **Frontend:** React SPA (`webapp/`), Material-UI, category cards, per-category detail, API service wrappers.
- **Data:** Streams, income, tax, and user data stored in JSON files or SQLite (fallback: in-memory Map if native module missing).
- **AI/Automation:** Optional heavy services (AI, Push, WS) are toggled via ENV (DISABLE_AI etc.), with no-op stubs for testability.
- **Compliance:** Tax calculation, escrow, audit trail, and Finanzamt integration endpoints.

## Developer Workflows
- **Backend Start:** `node server-express.js` (uses `backend/src/app.js`)
- **Frontend Start:** `npm start` in `webapp/`
- **Tests:** `npm test` (Jest, Supertest) in backend and webapp; memory fallback for sqlite if native build fails.
- **Docker:** Use `docker-compose.dev.yml` for local dev, disables heavy services by default.
- **Health Check:** `GET /api/health` (returns `{ ok: true }`)
- **Default Login:** `admin` / `secure123`

## Project-Specific Patterns
- **ENV-based Feature Flags:** All heavy/optional integrations (AI, Push, Notification, WS) are disabled by default for dev/test; set ENV to enable.
- **Resilient Imports:** All native modules (better-sqlite3, bcryptjs, tfjs-node) are wrapped in try/catch with fallback stubs for CI/test/dev.
- **Data Directory:** All persistent data is written to `./data/` (auto-created if possible); fallback to memory if FS unavailable.
- **API Auth:** JWT tokens, issued via `/api/auth/login`, required for most `/api/*` endpoints.
- **StreamConfig:** CRUD via `/api/streams-config`, per-category automation via `/api/streams/:id/start|stop`.
- **Schema Validation:** Ajv-based JSON Schema validation middleware for POST/PUT endpoints.

## Integration Points
- **AI Providers:** Configurable via `/api/ai/configure`, ENV flags, and optional routers.
- **Tax/Compliance:** Endpoints `/api/tax/*`, `/api/compliance/report`, `/api/audit/trail`.
- **Frontend-Backend:** API calls via `webapp/src/services/api.js`, category detail via `/category/:category` route.

## Examples
- To add a new income stream: update `models/` and `backend/stream-config.js`, extend schema in `backend/src/schemas/`.
- To add a new AI provider: extend AI router, add ENV flag, update `/api/ai/configure`.
- To run tests in CI: ensure ENV disables heavy services, rely on memory fallback for sqlite.

## Key Files/Directories
- `backend/src/app.js` — main Express app
- `server-express.js` — backend entrypoint
- `backend/sqlite-adapter.js` — sqlite+memory adapter
- `webapp/src/pages/CategoryDetail.js` — per-category UI
- `webapp/src/services/api.js` — API wrappers
- `backend/src/middleware/validateSchema.js` — Ajv validation
- `docker-compose.dev.yml` — dev container config

---
Feedback: If any section is unclear or missing, please specify which workflows, patterns, or integration points need more detail.
