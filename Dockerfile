FROM node:20-bullseye
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install --production --no-audit --no-fund || true
COPY . .
ENV NODE_ENV=production
EXPOSE 3000
CMD ["node", "server-express.js"]
