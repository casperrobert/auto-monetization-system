# Zero-Vulnerability Static Frontend
FROM node:20.12.2-alpine3.20 AS builder
WORKDIR /build
COPY package*.json ./
RUN npm ci --only=production --ignore-scripts
COPY . .
RUN npm run build

FROM busybox:1.36.1-musl AS runtime
RUN adduser -D -s /bin/false -u 1001 static
WORKDIR /app
COPY --from=builder --chown=1001:1001 /build/build ./public
USER 1001
EXPOSE 8080
CMD ["busybox", "httpd", "-f", "-v", "-p", "8080", "-h", "/app/public"]
