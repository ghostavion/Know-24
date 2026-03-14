FROM node:20-alpine

WORKDIR /sidecar

# Install dependencies first (layer caching)
COPY package.json package-lock.json* ./
RUN npm ci --production

# Copy sidecar source and build
COPY tsconfig.json ./
COPY src/ ./src/
RUN npx tsc

# The agent command is provided at runtime via AGENT_CMD env var
ENV AGENTTV_SIDECAR_URL=http://localhost:8080
ENV SIDECAR_PORT=8080

EXPOSE 8080

ENTRYPOINT ["node", "dist/index.js"]
