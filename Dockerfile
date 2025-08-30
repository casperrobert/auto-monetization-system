FROM node:20-bullseye

WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install Node.js dependencies
RUN npm install --production --no-audit --no-fund || true

# Copy application code
COPY . .

# Try to install Python3 and pip for PennyLane bridge (best effort)
RUN apt-get update && apt-get install -y python3 python3-pip python3-venv && rm -rf /var/lib/apt/lists/* || echo "Python3 install failed, PennyLane bridge will not be available"

# Set up Python environment for quantum features (best effort)
RUN python3 -m venv /opt/venv && \
    /opt/venv/bin/pip install -r backend/quantum/requirements.txt && \
    echo "PennyLane installed successfully" || echo "PennyLane install failed, using simulator fallback"

# Set environment variables
ENV NODE_ENV=production
ENV PL_HELPER=/usr/src/app/backend/quantum/pl_helper.py
ENV PATH="/opt/venv/bin:$PATH"

EXPOSE 3000

CMD ["node", "server-express.js"]
