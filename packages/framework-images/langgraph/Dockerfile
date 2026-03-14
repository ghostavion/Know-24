# ── Sidecar build stage ──────────────────────────────────────
FROM node:20-alpine AS sidecar-build
WORKDIR /sidecar
COPY packages/sidecar/package.json packages/sidecar/package-lock.json* ./
RUN npm ci --production
COPY packages/sidecar/tsconfig.json ./
COPY packages/sidecar/src/ ./src/
RUN npx tsc

# ── Runtime ──────────────────────────────────────────────────
FROM python:3.11-slim

# Install Node.js 20 for the sidecar + wget for health checks
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl wget && \
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
RUN pip install --no-cache-dir \
    langgraph \
    langchain \
    langchain-openai \
    langchain-anthropic \
    agenttv

# Copy pre-built sidecar from build stage
COPY --from=sidecar-build /sidecar /sidecar

# Copy startup script
COPY packages/framework-images/start.sh /start.sh
RUN chmod +x /start.sh

# Agent code is mounted or copied at runtime
WORKDIR /agent

ENV AGENTTV_SIDECAR_URL=http://localhost:8080

HEALTHCHECK --interval=15s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -q -O /dev/null http://localhost:8080/health || exit 1

ENTRYPOINT ["/start.sh"]
