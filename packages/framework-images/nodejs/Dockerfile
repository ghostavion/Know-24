# ── Sidecar build stage ──────────────────────────────────────
FROM node:20-alpine AS sidecar-build
WORKDIR /sidecar
COPY packages/sidecar/package.json packages/sidecar/package-lock.json* ./
RUN npm ci --production
COPY packages/sidecar/tsconfig.json ./
COPY packages/sidecar/src/ ./src/
RUN npx tsc

# ── SDK build stage ─────────────────────────────────────────
FROM node:20-alpine AS sdk-build
WORKDIR /sdk-node
COPY packages/sdk-node/package.json packages/sdk-node/package-lock.json* ./
RUN npm ci --production
COPY packages/sdk-node/tsconfig.json ./
COPY packages/sdk-node/src/ ./src/
RUN npx tsc

# ── Runtime ──────────────────────────────────────────────────
FROM node:20-alpine

# Install wget for health checks
RUN apk add --no-cache wget

# Copy pre-built sidecar and SDK
COPY --from=sidecar-build /sidecar /sidecar
COPY --from=sdk-build /sdk-node /sdk-node

# Link SDK globally so agents can require('agenttv')
WORKDIR /sdk-node
RUN npm link

# Copy startup script
COPY packages/framework-images/start.sh /start.sh
RUN chmod +x /start.sh

# Agent code is mounted or copied at runtime
WORKDIR /agent

ENV AGENTTV_SIDECAR_URL=http://localhost:8080

HEALTHCHECK --interval=15s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -q -O /dev/null http://localhost:8080/health || exit 1

ENTRYPOINT ["/start.sh"]
