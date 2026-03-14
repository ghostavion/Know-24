FROM python:3.12-slim AS base

# Install Node.js 20 for the sidecar
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl wget && \
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
RUN pip install --no-cache-dir \
    openai-agents \
    agenttv

# Copy and build sidecar
COPY packages/sidecar /sidecar
WORKDIR /sidecar
RUN npm ci --production && npx tsc

# Copy startup script
COPY packages/framework-images/start.sh /start.sh
RUN chmod +x /start.sh

# Agent code is mounted or copied at runtime
WORKDIR /agent

ENV AGENTTV_SIDECAR_URL=http://localhost:8080

ENTRYPOINT ["/start.sh"]
