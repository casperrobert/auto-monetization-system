#!/bin/bash

echo "🚀 Starting Quantum Auto-Monetization System (Production)"

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ .env file not found. Creating from template..."
    cp .env.example .env
    echo "⚠️  Please configure .env file with your settings"
    exit 1
fi

# Check required environment variables
required_vars=("QUANTUM_ENCRYPTION_KEY" "POSTGRES_PASSWORD" "REDIS_PASSWORD")
for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        echo "❌ Required environment variable $var is not set"
        exit 1
    fi
done

# Build and start services
echo "🔧 Building Docker images..."
docker-compose -f docker-compose.production.yml build

echo "🚀 Starting services..."
docker-compose -f docker-compose.production.yml up -d

echo "⏳ Waiting for services to be ready..."
sleep 30

# Health check
echo "🔍 Checking service health..."
if curl -f http://localhost:3002/health > /dev/null 2>&1; then
    echo "✅ Backend is healthy"
else
    echo "❌ Backend health check failed"
    docker-compose -f docker-compose.production.yml logs backend
    exit 1
fi

if curl -f http://localhost > /dev/null 2>&1; then
    echo "✅ Frontend is accessible"
else
    echo "❌ Frontend is not accessible"
    exit 1
fi

echo ""
echo "🎉 Quantum Auto-Monetization System is running!"
echo "📊 Dashboard: http://localhost"
echo "🔬 Quantum API: http://localhost/api/quantum/status"
echo "💰 Backend API: http://localhost/api/health"
echo ""
echo "📝 View logs: docker-compose -f docker-compose.production.yml logs -f"
echo "🛑 Stop system: docker-compose -f docker-compose.production.yml down"