FROM node:20-alpine

# Install wget for health checks
RUN apk add --no-cache wget

# Copy and build sidecar
COPY packages/sidecar /sidecar
WORKDIR /sidecar
RUN npm ci --production && npx tsc

# Install the Node.js SDK globally
COPY packages/sdk-node /sdk-node
WORKDIR /sdk-node
RUN npm ci --production && npm run build && npm link

# Copy startup script
COPY packages/framework-images/start.sh /start.sh
RUN chmod +x /start.sh

# Agent code is mounted or copied at runtime
WORKDIR /agent

ENV AGENTTV_SIDECAR_URL=http://localhost:8080

ENTRYPOINT ["/start.sh"]
