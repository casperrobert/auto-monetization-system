# Auto Monetization System

Auto Monetization System is a Node.js-based TikTok shop automation platform with React frontend, Express backend, and Redis database. The system provides affiliate link management, wallet integration, price tracking, and transaction logging capabilities.

Always reference these instructions first and fallback to search or bash commands only when you encounter unexpected information that does not match the info here.

## Working Effectively

### Bootstrap and Dependencies
- Ensure Node.js 20.19.4+ and npm 10.8.2+ are available (check with `node --version && npm --version`)
- Install root dependencies: `npm install` -- takes ~1 second. NEVER CANCEL.
- Install frontend dependencies: `cd auto-monetization-system_codespaces_v1/frontend && npm install` -- takes ~2 minutes with deprecation warnings (normal). NEVER CANCEL. Set timeout to 5+ minutes.
- Install backend dependencies: `cd auto-monetization-system_codespaces_v1/backend && npm install` -- takes ~3 seconds. NEVER CANCEL.

### Build and Test
- Build frontend: `cd auto-monetization-system_codespaces_v1/frontend && npm run build` -- takes ~30 seconds. NEVER CANCEL. Set timeout to 2+ minutes.
  - **IMPORTANT**: When prompted "Would you like to add the defaults to your package.json?", answer "Y" to proceed with build.
- No separate build process needed for root application or backend.
- No testing framework is configured - manual testing only.

### Run Applications

#### Main Application (Recommended for development)
- Start main server: `npm start` or `npm run dev` -- starts in <1 second on port 3000
- Health check: `curl http://localhost:3000/api/health` should return `{"ok":true,"time":"..."}`
- Static files served from `public/` directory
- Automation scheduler: `npm run automation` -- starts cron-based automation, runs indefinitely

#### Codespaces Multi-Service Setup
- Start with Docker: `cd auto-monetization-system_codespaces_v1 && docker compose up -d redis backend frontend` -- takes ~10 seconds for Redis. NEVER CANCEL. Set timeout to 2+ minutes.
- Frontend dev server: `cd auto-monetization-system_codespaces_v1/frontend && npm start` -- takes ~15 seconds, runs on port 3000
- Backend server: `cd auto-monetization-system_codespaces_v1/backend && npm start` -- starts in <1 second on port 5000
- Redis status check: `docker exec auto-monetization-system_codespaces_v1-redis-1 redis-cli ping` should return "PONG"

#### macOS Quick Start (if Docker Desktop available)
- Run `auto-monetization-system_codespaces_v1/Start_macOS.command` to start all services via Docker
- Stop with `auto-monetization-system_codespaces_v1/Stop_macOS.command`

### Environment Variables
- Create `.env` file in root directory for automation configuration
- Required variables: `TIKTOK_API_KEY` (defaults to "demo-key" if not set)
- Example: `echo "TIKTOK_API_KEY=your-api-key" > .env`

## Validation

### Manual Testing Requirements
- **ALWAYS** test at least one complete workflow after making changes
- Test main application: Start with `npm start`, verify health endpoint, check static file serving
- Test automation: Run `npm run automation`, verify "Automation scheduler initialised" message
- Test frontend: Build with `npm run build`, start dev server, verify React app loads
- Test backend: Start backend server, verify it responds on port 5000
- Test Docker: Start Redis, verify connection with ping command

### Standard Validation Workflow
1. Install all dependencies (root, frontend, backend)
2. Build frontend application 
3. Start main application and test health endpoint
4. Test automation scheduler startup
5. Start frontend dev server and verify React app
6. Start backend server and test basic functionality
7. Test Docker Redis setup if Docker changes made

## Common Tasks

### Port Configuration
- Main application: Port 3000 (Express server with static files)
- Frontend dev server: Port 3000 (React development server)
- Backend API: Port 5000 (Express API server)  
- Redis: Port 6379 (Docker container)
- **Note**: Frontend dev server and main app both use port 3000 - run only one at a time

### Development Workflows
- For main app development: Use `npm start` in root directory
- For frontend development: Use React dev server in `auto-monetization-system_codespaces_v1/frontend/`
- For full-stack development: Use Docker compose setup in `auto-monetization-system_codespaces_v1/`

### Key File Locations
- Main server: `index.js` (Express server with static file serving)
- Automation logic: `automation.js` (cron scheduler with TikTok API integration)
- Frontend source: `auto-monetization-system_codespaces_v1/frontend/src/`
- Backend source: `auto-monetization-system_codespaces_v1/backend/`
- Static files: `public/` (served by main Express app)
- Documentation files: `docs/` (HTML dashboard files)

### Common File Operations
- Static HTML files are in `public/` and `docs/` directories
- React components are in `auto-monetization-system_codespaces_v1/frontend/src/`
- Backend API routes are in `auto-monetization-system_codespaces_v1/backend/server.js`
- Docker configurations in `auto-monetization-system_codespaces_v1/docker-compose.yml` and `deploy/docker-compose.tunnel.yml`

## Critical Timing and Timeout Settings

### NEVER CANCEL Commands - Required Timeouts
- `npm install` (frontend): Set timeout to 5+ minutes (normally ~2 minutes)
- `npm run build` (frontend): Set timeout to 2+ minutes (normally ~30 seconds)
- Docker operations: Set timeout to 2+ minutes (normally ~10 seconds)

### Quick Commands (<5 seconds)
- `npm install` (root and backend)
- `npm start` (all applications)
- Health checks and API tests

### Expected Warnings (Normal)
- Frontend npm install: Multiple deprecation warnings (normal, ignore)
- Docker compose: "version attribute is obsolete" warning (normal, ignore)
- React build: Browser target prompt (answer "Y" to proceed)

## Known Limitations and Workarounds

### Build Requirements
- Frontend build requires browser target configuration - answer "Y" when prompted
- No linting or testing scripts configured - manual validation required
- Docker containers may conflict on port 6379 if multiple Redis instances running

### Development Constraints
- Cannot run main app and frontend dev server simultaneously (both use port 3000)
- Automation script runs indefinitely - kill process manually when testing
- Backend server in codespaces folder has minimal functionality (placeholder)

### Environment Setup
- No CI/CD pipeline configured - manual testing required for all changes
- No automated linting - follow existing code style
- Docker Desktop required for macOS quick start scripts

## Architecture Overview

### Root Application
- Express.js server serving static files from `public/`
- Automation scheduler using node-cron for TikTok API integration
- Health check endpoint at `/api/health`

### Codespaces Setup  
- React frontend (port 3000) - full development environment
- Express backend (port 5000) - API server with minimal routes
- Redis database (port 6379) - Docker container
- Docker Compose orchestration for multi-service development

### File Structure
```
├── index.js                    # Main Express server
├── automation.js               # Cron-based automation scheduler  
├── package.json               # Root dependencies
├── public/                    # Static HTML/CSS files
├── docs/                      # Documentation HTML files
└── auto-monetization-system_codespaces_v1/
    ├── frontend/              # React application
    ├── backend/               # Express API server
    ├── deploy/                # Docker configurations
    └── *.command              # macOS startup scripts
```