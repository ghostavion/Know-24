import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { spawnAgent, stopAgent } from "./stdout-capture.js";
import { FlyManager } from "./fly-manager.js";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const PORT = parseInt(process.env.SIDECAR_PORT || "8080", 10);
const API_URL = process.env.AGENTTV_INGEST_URL || process.env.AGENTTV_API_URL || "https://agenttv.com";
const RUN_TOKEN = process.env.AGENTTV_RUN_TOKEN || "";
const DAILY_CAP = parseFloat(process.env.AGENTTV_DAILY_CAP || "0"); // 0 = unlimited
const AGENT_CMD = process.env.AGENT_CMD || "";
const AGENT_ID = process.env.AGENTTV_AGENT_ID || "";
const RUN_ID = process.env.AGENTTV_RUN_ID || "";
const BUDGET_POLL_INTERVAL = 30_000; // 30 seconds

// ---------------------------------------------------------------------------
// Event types & validation
// ---------------------------------------------------------------------------

interface AgentEvent {
  event_type: "action" | "revenue" | "status" | "error";
  event_name: string;
  data: Record<string, unknown>;
}

type ValidationError = string | null;

function validateEvent(evt: unknown): { parsed: AgentEvent | null; error: ValidationError } {
  if (!evt || typeof evt !== "object") {
    return { parsed: null, error: "Body must be a JSON object" };
  }

  const e = evt as Record<string, unknown>;

  if (!["action", "revenue", "status", "error"].includes(e.event_type as string)) {
    return { parsed: null, error: "event_type must be action | revenue | status | error" };
  }
  if (typeof e.event_name !== "string" || e.event_name.length === 0) {
    return { parsed: null, error: "event_name is required" };
  }
  if (!e.data || typeof e.data !== "object") {
    return { parsed: null, error: "data must be an object" };
  }

  const data = e.data as Record<string, unknown>;
  const type = e.event_type as string;

  if (type === "action" && typeof data.description !== "string") {
    return { parsed: null, error: "action events require data.description (string)" };
  }
  if (type === "revenue") {
    if (typeof data.amount !== "number") return { parsed: null, error: "revenue events require data.amount (number)" };
    if (typeof data.currency !== "string") return { parsed: null, error: "revenue events require data.currency (string)" };
  }
  if (type === "status") {
    if (typeof data.state !== "string") return { parsed: null, error: "status events require data.state (string)" };
    if (typeof data.uptime !== "number") return { parsed: null, error: "status events require data.uptime (number)" };
    if (typeof data.budget_left !== "number") return { parsed: null, error: "status events require data.budget_left (number)" };
  }
  if (type === "error") {
    if (typeof data.message !== "string") return { parsed: null, error: "error events require data.message (string)" };
    if (!["warning", "critical", "fatal"].includes(data.severity as string)) {
      return { parsed: null, error: "error events require data.severity (warning | critical | fatal)" };
    }
  }

  return { parsed: e as unknown as AgentEvent, error: null };
}

// ---------------------------------------------------------------------------
// Budget watchdog
// ---------------------------------------------------------------------------

let cumulativeSpend = 0;
let dailySpendResetAt = Date.now();

function checkBudget(evt: AgentEvent): boolean {
  // Reset daily counter at midnight boundaries
  const now = Date.now();
  if (now - dailySpendResetAt > 86_400_000) {
    cumulativeSpend = 0;
    dailySpendResetAt = now;
  }

  if (evt.event_type === "status") {
    const budgetLeft = evt.data.budget_left as number;
    if (budgetLeft <= 0) {
      console.error("[sidecar] Budget exhausted — killing agent");
      emitFatalAndKill("Budget exhausted (budget_left <= 0)");
      return false;
    }
  }

  if (DAILY_CAP > 0 && evt.event_type === "status") {
    // Track spend as (initial budget - current budget_left) — approximate
    const budgetLeft = evt.data.budget_left as number;
    if (cumulativeSpend === 0) {
      // First status event — set baseline
      cumulativeSpend = 0;
    }
    // If daily cap exceeded
    const spent = DAILY_CAP - budgetLeft;
    if (spent >= DAILY_CAP) {
      console.error("[sidecar] Daily cap exceeded — killing agent");
      emitFatalAndKill(`Daily spend cap exceeded ($${DAILY_CAP})`);
      return false;
    }
  }

  return true;
}

async function emitFatalAndKill(reason: string): Promise<void> {
  const fatalEvent: AgentEvent = {
    event_type: "error",
    event_name: "budget_kill",
    data: { message: reason, severity: "fatal" },
  };
  await forwardToApi(fatalEvent);
  stopAgent();
}

// ---------------------------------------------------------------------------
// Forward events to the AgentTV API
// ---------------------------------------------------------------------------

async function forwardToApi(evt: AgentEvent): Promise<void> {
  try {
    const res = await fetch(`${API_URL}/api/events/ingest`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(RUN_TOKEN ? { Authorization: `Bearer ${RUN_TOKEN}` } : {}),
      },
      body: JSON.stringify({
        ...evt,
        agent_id: AGENT_ID || undefined,
        run_id: RUN_ID || undefined,
        timestamp: new Date().toISOString(),
      }),
    });
    if (!res.ok) {
      console.error(`[sidecar] API responded ${res.status}: ${await res.text()}`);
    }
  } catch (err) {
    console.error("[sidecar] Failed to forward event:", err);
  }
}

// ---------------------------------------------------------------------------
// Exported emit function (used by stdout-capture)
// ---------------------------------------------------------------------------

export async function emitEvent(evt: AgentEvent): Promise<void> {
  const { error } = validateEvent(evt);
  if (error) {
    console.warn(`[sidecar] Dropping invalid event: ${error}`);
    return;
  }
  if (!checkBudget(evt)) return;
  await forwardToApi(evt);
}

// ---------------------------------------------------------------------------
// HTTP helpers
// ---------------------------------------------------------------------------

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => resolve(Buffer.concat(chunks).toString()));
    req.on("error", reject);
  });
}

function json(res: ServerResponse, status: number, body: unknown): void {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(body));
}

// ---------------------------------------------------------------------------
// HTTP server
// ---------------------------------------------------------------------------

const server = createServer(async (req, res) => {
  const url = new URL(req.url || "/", `http://localhost:${PORT}`);

  // Health check
  if (req.method === "GET" && url.pathname === "/health") {
    return json(res, 200, { status: "ok", uptime: process.uptime() });
  }

  // Event ingestion from SDK
  if (req.method === "POST" && url.pathname === "/emit") {
    let body: unknown;
    try {
      const raw = await readBody(req);
      body = JSON.parse(raw);
    } catch {
      return json(res, 400, { error: "Invalid JSON" });
    }

    const { parsed, error } = validateEvent(body);
    if (error || !parsed) {
      return json(res, 422, { error });
    }

    if (!checkBudget(parsed)) {
      return json(res, 403, { error: "Budget exceeded — agent is being terminated" });
    }

    // Fire-and-forget forward
    forwardToApi(parsed).catch(() => {});
    return json(res, 202, { accepted: true });
  }

  json(res, 404, { error: "Not found" });
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`[sidecar] Listening on http://127.0.0.1:${PORT}`);
});

// ---------------------------------------------------------------------------
// Start agent process if AGENT_CMD is provided
// ---------------------------------------------------------------------------

if (AGENT_CMD) {
  console.log(`[sidecar] Starting agent: ${AGENT_CMD}`);
  spawnAgent(AGENT_CMD, emitEvent);
}

// ---------------------------------------------------------------------------
// Budget polling watchdog — polls agent_runs every 30s
// ---------------------------------------------------------------------------

let budgetPollTimer: ReturnType<typeof setInterval> | null = null;

if (AGENT_ID && RUN_ID) {
  budgetPollTimer = setInterval(async () => {
    try {
      // Query the API for agent run status (uses the ingest URL base)
      const baseUrl = API_URL.replace("/api/events/ingest", "");
      const res = await fetch(`${baseUrl}/api/runs/${RUN_ID}`, {
        headers: {
          ...(RUN_TOKEN ? { Authorization: `Bearer ${RUN_TOKEN}` } : {}),
        },
        signal: AbortSignal.timeout(10_000),
      });

      if (res.ok) {
        const body = await res.json() as { data?: { status?: string; spend_cents?: number } };
        const run = body?.data;
        if (run?.status === "stopped" || run?.status === "crashed") {
          console.error(`[sidecar] Run status is ${run.status} — shutting down`);
          await emitFatalAndKill(`Run terminated externally (status: ${run.status})`);
          return;
        }
      }
    } catch (err) {
      // Non-fatal: if we can't poll, just log and try again next interval
      console.warn("[sidecar] Budget poll failed:", err);
    }
  }, BUDGET_POLL_INTERVAL);
}

// ---------------------------------------------------------------------------
// Graceful shutdown on SIGTERM / SIGINT
// ---------------------------------------------------------------------------

let shuttingDown = false;

async function gracefulShutdown(signal: string): Promise<void> {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`[sidecar] Received ${signal}, shutting down gracefully...`);

  // Clear budget polling
  if (budgetPollTimer) clearInterval(budgetPollTimer);

  // Emit final status event
  try {
    await forwardToApi({
      event_type: "status",
      event_name: "shutdown",
      data: { state: "terminated", uptime: process.uptime(), budget_left: 0, reason: signal },
    });
  } catch {
    // Best-effort
  }

  // Stop agent process
  stopAgent();

  // Close HTTP server
  server.close(() => {
    console.log("[sidecar] HTTP server closed");
    process.exit(0);
  });

  // Force exit after 5 seconds if server doesn't close
  setTimeout(() => {
    console.error("[sidecar] Forced exit after timeout");
    process.exit(1);
  }, 5000).unref();
}

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

export { FlyManager } from "./fly-manager.js";
