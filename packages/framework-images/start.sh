#!/bin/sh
# Shared startup script for all AgentTV framework images.
# Starts the sidecar first, waits for it to be healthy, then runs the agent.

set -e

echo "[agenttv] Starting sidecar..."
node /sidecar/dist/index.js &
SIDECAR_PID=$!

# Wait for sidecar to be ready (up to 10 seconds)
for i in $(seq 1 20); do
  if wget -q -O /dev/null http://localhost:8080/health 2>/dev/null; then
    echo "[agenttv] Sidecar ready"
    break
  fi
  sleep 0.5
done

echo "[agenttv] Starting agent: $AGENT_CMD"
eval "$AGENT_CMD"
AGENT_EXIT=$?

# Give sidecar time to flush final events
sleep 2
kill $SIDECAR_PID 2>/dev/null || true

exit $AGENT_EXIT
