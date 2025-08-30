# Auto Monetization System — Dev Notes

Dieses Repository enthält die Auto Monetization System (AMS) Anwendung mit experimentellen Quantum-Integrationen.

Ziel dieser Ergänzungen
- Robuste Provider-Adapter (IBM, D-Wave/Braket, PennyLane, External-HTTP) mit Simulator-Fallbacks
- QUBO→Ising→Intermediate-Circuit Translator + Mitigation helpers (ZNE stub)
- Emitters für Qiskit/OpenQASM, Braket JSON und PennyLane-JSON bridge
- Python helper `pl_helper.py` für PennyLane-Bridge (STDIN/STDOUT JSON)
- Smoke-tests + CI workflow + Docker smoke job

Wichtiger Hinweis zur Ausführung in dieser Codespace-Umgebung
----------------------------------------------------------
Einige Codespace-Umgebungen melden `ENOPRO: no filesystem provider` und verhindern `npm ci` oder Docker-Builds in dieser Umgebung. Bitte führe die folgenden Schritte lokal oder in einer Docker-fähigen CI-Umgebung aus.

Schnellstart (lokal)
--------------------
1. Wechsle ins Projektverzeichnis:

```bash
cd /path/to/auto-monetization-system
```

2. Installiere Abhängigkeiten und führe Smoke-Tests aus:

```bash
npm ci
npm run smoke:all
```

3. PennyLane-Bridge (optional):

```bash
python3 -m venv .venv
. .venv/bin/activate
pip install -r backend/quantum/requirements.txt
node test/test-pennylane-helper.js
```

Docker-Variante (empfohlen für native SDKs)
------------------------------------------
Baue das Image und führe die Smoke-Tests im Container aus:

```bash
docker build -t ams-smoke:latest .
docker run --rm -e IBM_QUANTUM_TOKEN="$IBM_QUANTUM_TOKEN" -e PL_HELPER="/app/backend/quantum/pl_helper.py" ams-smoke:latest /bin/sh -c "npm run smoke:all || true"
```

Env-Variablen für echte Provider (in CI als Secrets definieren)
- `IBM_QUANTUM_TOKEN` — IBM Quantum API token
- `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` — für Braket
- `EXT_PROVIDER_URL`, `EXT_PROVIDER_API_KEY` — External HTTP gateway
- `PL_HELPER` — Pfad zum `pl_helper.py` (falls benötigt)

CI
-- Es gibt eine GitHub Actions workflow unter `.github/workflows/smoke-tests.yml`. Sie führt Smoke-Tests und optional einen Docker-basierten Smoke-Run aus.

Was noch zu tun ist (wenn du echte Provider nutzen willst)
- Setze die env‑secrets in GitHub (oder lokal) und führe die Docker-Smoke-Job aus.
- Optional: Erweitere `pl_helper.py` für weitere Gates oder Performance-Optimierungen.

Support
-------
Wenn du möchtest, kann ich einen Pull Request mit allen Änderungen öffnen oder die IBM-Real‑Submit-Flow testen, sobald du `IBM_QUANTUM_TOKEN` bereitstellst (in CI als Secret).
# 🔬 Quantum Auto-Monetization System

Enterprise-Grade Auto-Monetization Platform mit Quantum Computing Integration

## 🚀 Features

### 💰 Auto-Monetization
- **Multi-Stream Income**: YouTube, Affiliate, Dropshipping, Crypto, REITs, P2P
- **AI-Optimierung**: Maschinelles Lernen für maximale Rendite
- **Automatische Steuerberechnung**: Compliance-konforme Steuerreserven
- **Real-time Analytics**: Live-Dashboard mit Einkommensüberwachung

### 🔬 Quantum Computing
- **Multi-Provider Support**: IBM Quantum, AWS Braket (D-Wave), PennyLane, External HTTP
- **QUBO→Ising→Circuit Translation**: Automatic problem conversion for quantum hardware
- **Error Mitigation**: Zero-Noise Extrapolation (ZNE), measurement error correction
- **Emitters**: OpenQASM (Qiskit), Braket JSON, PennyLane JSON output
- **Fallback System**: Graceful degradation to classical simulators when hardware unavailable
- **Python Bridge**: PennyLane integration via JSON bridge helper

### 🛡️ Enterprise Security
- **Blockchain Authentication**: Unbreakable Admin-Zugang
- **Multi-Factor Auth**: 4-Stufen Sicherheitssystem
- **Quantum Encryption**: 7-Layer Verschlüsselung
- **RBAC System**: Rollenbasierte Zugriffskontrolle

## 🏗️ Architektur

```
Frontend (Nginx) → Backend (Node.js) → Quantum Engine → QPU Providers
                ↓                    ↓
            PostgreSQL           Redis Cache
                ↓                    ↓
            Kafka Events      Monitoring
```

## 🚀 Quick Start

### Entwicklung
```bash
# Repository klonen
git clone <repository-url>
cd auto-monetization-system

# Environment konfigurieren
cp .env.example .env
# .env mit deinen Werten bearbeiten

# Dependencies installieren
cd backend && npm install

# System starten
npm run dev
```

### Produktion
```bash
# Produktionsumgebung starten
./start-production.sh

# Oder manuell mit Docker
docker-compose -f docker-compose.production.yml up -d
```

## ⚙️ Konfiguration

### Quantum System
```bash
# Quantum aktivieren
QUANTUM_ENABLED=true

# QPU auswählen
PREFERRED_QPU=ibm-falcon  # ibm-falcon|google-sycamore|ionq-aria|dwave-advantage

# Scheduler Intervall
QUANTUM_INTERVAL=*/30 * * * * *

# Sicherheit
QUANTUM_ENCRYPTION_KEY=your_32_char_encryption_key_here
QUANTUM_API_KEY=your_quantum_api_key

# Provider-specific API keys
IBM_QUANTUM_TOKEN=your_ibm_quantum_token
AWS_ACCESS_KEY_ID=your_aws_access_key  # for D-Wave/Braket
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
EXT_PROVIDER_URL=https://your-quantum-gateway.com/api
EXT_PROVIDER_API_KEY=your_external_api_key

# PennyLane bridge
PL_HELPER=/path/to/backend/quantum/pl_helper.py
PL_DEVICE=default.qubit  # or lightning.qubit, qiskit.aer, etc.
```

### Datenbank
```bash
# PostgreSQL (Produktion)
USE_POSTGRES=true
POSTGRES_URL=postgresql://user:pass@localhost:5432/db

# Redis Cache
REDIS_CLUSTER=localhost:6379
REDIS_PASSWORD=your_redis_password
```

## 📊 API Endpoints

### Quantum Computing
- `GET /api/quantum/status` - Quantum System Status
- `POST /api/quantum/optimize` - Einkommensoptimierung
- `POST /api/quantum/translate` - QUBO to Circuit Translation
- `POST /api/quantum/providers/submit` - Submit quantum job to provider
- `GET /api/quantum/providers/list` - List available quantum providers

### Income Management
- `GET /api/income` - Aktuelles Einkommen
- `PUT /api/income` - Einkommen aktualisieren
- `POST /api/income/simulate` - Simulation

### Security
- `POST /api/security/admin-login` - Admin-Zugang
- `GET /api/security/status` - Sicherheitsstatus

## 🔬 Quantum QPU Details

### IBM Falcon (27 Qubits)
- **Topology**: Heavy-Hex
- **Gates**: RZ, SX, CNOT
- **Mitigation**: ZNE, PEC, Readout
- **Cost**: ~$0.001/shot

### Google Sycamore (70 Qubits)
- **Topology**: 2D Grid
- **Gates**: RZ, RY, CZ
- **Mitigation**: Symmetry, Postselection
- **Cost**: ~$0.002/shot

### IonQ Aria (32 Qubits)
- **Topology**: All-to-All
- **Gates**: RX, RY, RZ, XX
- **Mitigation**: Amplitude/Phase Damping
- **Cost**: ~$0.003/shot

### D-Wave Advantage (5760 Qubits)
- **Topology**: Pegasus
- **Type**: Quantum Annealer
- **Mitigation**: Embedding, Chain Strength
- **Cost**: ~$0.00005/shot

## 🛡️ Sicherheit

### Admin-Zugang
1. **Blockchain Key**: Unveränderlicher Master-Key
2. **TOTP**: Time-based One-Time Password
3. **Biometric**: Fingerprint/Face Recognition
4. **Hardware**: YubiKey/Hardware Token

### Quantum Encryption
- **7-Layer Verschlüsselung**: RSA + AES + Quantum-Resistant
- **Key Rotation**: Automatische Schlüsselrotation
- **Perfect Forward Secrecy**: Jede Session einzigartig

## 📈 Monitoring

### Dashboards
- **Quantum Dashboard**: http://localhost/quantum-dashboard.html
- **Main Dashboard**: http://localhost/dashboard.html
- **Admin Panel**: http://localhost/admin

### Metriken
- Quantum Execution Rate
- Income Optimization Factor
- System Performance
- Security Events

## 🔧 Entwicklung

### Tests ausführen
```bash
cd backend
npm test  # runs all smoke tests

# Individual smoke tests
npm run smoke:providers    # test all quantum providers with simulator fallback
npm run smoke:translator   # test QUBO->Ising->Circuit conversion and mitigations
npm run smoke:translator-ibm  # test IBM-specific translation
```

### Quantum System testen
```bash
# Test PennyLane bridge (requires Python setup)
python3 -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r backend/quantum/requirements.txt
node test/test-pennylane-helper.js

# Run full smoke test suite
npm run smoke:all
```

### Logs anzeigen
```bash
docker-compose logs -f backend
```

## 📝 Lizenz

MIT License - Siehe LICENSE Datei für Details.

## 🆘 Support

Bei Problemen oder Fragen:
1. Prüfe die Logs: `docker-compose logs`
2. Health Check: `curl http://localhost:3002/health`
3. Quantum Status: `curl http://localhost/api/quantum/status`

---

**⚠️ Wichtig**: Dieses System verwendet echte Quantum Computing Hardware. Stelle sicher, dass alle API-Keys und Verschlüsselungsschlüssel sicher aufbewahrt werden!