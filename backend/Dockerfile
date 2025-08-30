FROM node:18-alpine

WORKDIR /app

# Install system dependencies for quantum computing
RUN apk add --no-cache python3 make g++ curl

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Create quantum directory
RUN mkdir -p quantum

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3002/health || exit 1

# Expose port
EXPOSE 3002

# Start application
CMD ["npm", "start"]