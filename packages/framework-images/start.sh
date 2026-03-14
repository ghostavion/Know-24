#!/bin/sh
# Shared startup script for all AgentTV framework images.
# Starts the sidecar first, waits for it to be healthy, then runs the agent.

set -e

SIDECAR_PID=""
AGENT_PID=""

cleanup() {
  echo "[agenttv] Shutting down..."
  if [ -n "$AGENT_PID" ] && kill -0 "$AGENT_PID" 2>/dev/null; then
    kill -TERM "$AGENT_PID" 2>/dev/null || true
    wait "$AGENT_PID" 2>/dev/null || true
  fi
  if [ -n "$SIDECAR_PID" ] && kill -0 "$SIDECAR_PID" 2>/dev/null; then
    kill -TERM "$SIDECAR_PID" 2>/dev/null || true
    wait "$SIDECAR_PID" 2>/dev/null || true
  fi
  echo "[agenttv] Clean exit."
  exit 0
}

trap cleanup SIGTERM SIGINT

# Validate required env
if [ -z "$AGENT_CMD" ]; then
  echo "[agenttv] ERROR: AGENT_CMD not set"
  exit 1
fi

# Start sidecar in background
echo "[agenttv] Starting sidecar..."
node /sidecar/dist/index.js &
SIDECAR_PID=$!

# Wait for sidecar to be ready (up to 15 seconds)
for i in $(seq 1 30); do
  if wget -q -O /dev/null http://localhost:8080/health 2>/dev/null; then
    echo "[agenttv] Sidecar ready"
    break
  fi
  if [ "$i" = "30" ]; then
    echo "[agenttv] ERROR: Sidecar failed to start"
    exit 1
  fi
  sleep 0.5
done

# Start the agent process (no eval — AGENT_CMD is validated server-side)
echo "[agenttv] Starting agent: $AGENT_CMD"
cd /agent
$AGENT_CMD &
AGENT_PID=$!

# Wait for agent to finish
wait "$AGENT_PID"
AGENT_EXIT=$?
echo "[agenttv] Agent exited with code $AGENT_EXIT"

# Give sidecar time to flush final events
sleep 2
if kill -0 "$SIDECAR_PID" 2>/dev/null; then
  kill -TERM "$SIDECAR_PID" 2>/dev/null || true
  wait "$SIDECAR_PID" 2>/dev/null || true
fi

exit "$AGENT_EXIT"
