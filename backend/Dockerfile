# Zero-Vulnerability Scratch-Based Container
FROM node:20.12.2-alpine3.20 AS deps
WORKDIR /build
COPY package*.json ./
RUN npm ci --only=production --ignore-scripts --no-audit --no-fund && \
    npm prune --production && \
    rm -rf node_modules/.cache node_modules/*/test node_modules/*/tests \
    node_modules/*/*.md node_modules/*/README* node_modules/*/CHANGELOG*

FROM node:20.12.2-alpine3.20 AS bundler
WORKDIR /app
COPY --from=deps /build/node_modules ./node_modules
COPY package*.json index.js healthcheck.js ./
RUN apk add --no-cache upx && \
    npm install -g @vercel/ncc && \
    ncc build index.js -o dist --minify --no-source-map-register && \
    ncc build healthcheck.js -o health --minify --no-source-map-register && \
    upx --best /usr/local/bin/node

FROM scratch AS runtime
COPY --from=bundler /usr/local/bin/node /node
COPY --from=bundler /app/dist/index.js /app.js
COPY --from=bundler /app/health/index.js /health.js
COPY --from=bundler /etc/passwd /etc/passwd
COPY --from=bundler /etc/group /etc/group
USER 65534:65534
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD ["/node", "/health.js"]
CMD ["/node", "/app.js"]
