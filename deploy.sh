#!/bin/bash

# AMS Deployment Script
set -e

echo "🚀 Starting AMS Deployment..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo "⚠️  Please edit .env file with your configuration before running again."
    exit 1
fi

# Build and start services
echo "🔨 Building Docker images..."
docker-compose build --no-cache

echo "🚀 Starting services..."
docker-compose up -d

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 10

# Health checks
echo "🔍 Performing health checks..."

# Check backend
if curl -f -s http://localhost/health > /dev/null; then
    echo "✅ Backend is healthy"
else
    echo "❌ Backend health check failed"
    docker-compose logs backend
    exit 1
fi

# Check frontend
if curl -f -s http://localhost > /dev/null; then
    echo "✅ Frontend is accessible"
else
    echo "❌ Frontend health check failed"
    docker-compose logs frontend
    exit 1
fi

# Check SSL
if curl -k -f -s https://localhost > /dev/null; then
    echo "✅ HTTPS is working"
else
    echo "⚠️  HTTPS check failed (this is normal for self-signed certificates)"
fi

echo ""
echo "🎉 Deployment completed successfully!"
echo ""
echo "📱 Access your application:"
echo "   HTTP:  http://localhost"
echo "   HTTPS: https://localhost (accept self-signed certificate)"
echo "   Monitoring: http://localhost:9090"
echo ""
echo "🔑 Default login:"
echo "   Username: admin"
echo "   Password: secure123"
echo ""
echo "📊 Useful commands:"
echo "   View logs:    docker-compose logs -f"
echo "   Stop:         docker-compose down"
echo "   Restart:      docker-compose restart"
echo "   Update:       docker-compose pull && docker-compose up -d"
echo ""