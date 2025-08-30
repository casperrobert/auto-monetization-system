#!/bin/bash

echo "🚀 Quick Start - Quantum Auto-Monetization System"

# Navigate to backend
cd backend

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Create basic .env if not exists
if [ ! -f .env ]; then
    echo "⚙️ Creating development .env..."
    cat > .env << EOF
NODE_ENV=development
PORT=3002
QUANTUM_ENABLED=true
PREFERRED_QPU=ibm-falcon
QUANTUM_INTERVAL=*/30 * * * * *
QUANTUM_ENCRYPTION_KEY=dev_quantum_key_32_characters_long
MOCK_MODE=true
DISABLE_AI=false
DISABLE_NOTIFICATION=false
DISABLE_WS=false
DISABLE_PUSH=false
USE_POSTGRES=false
EOF
    echo "✅ Development .env created"
fi

# Start backend
echo "🚀 Starting backend server..."
npm start &
BACKEND_PID=$!

# Wait for backend to start
sleep 5

# Check if backend is running
if curl -f http://localhost:3002/health > /dev/null 2>&1; then
    echo "✅ Backend is running on http://localhost:3002"
    echo "🔬 Quantum API: http://localhost:3002/api/quantum/status"
    echo "📊 Dashboard: Open ../public/quantum-dashboard.html in browser"
    echo ""
    echo "🛑 To stop: kill $BACKEND_PID"
    echo "📝 Logs: Check terminal output"
    
    # Keep script running
    wait $BACKEND_PID
else
    echo "❌ Backend failed to start"
    kill $BACKEND_PID 2>/dev/null
    exit 1
fi