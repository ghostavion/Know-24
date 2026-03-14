import { spawn, type ChildProcess } from "node:child_process";
import { createInterface } from "node:readline";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AgentEvent {
  event_type: "action" | "revenue" | "status" | "error";
  event_name: string;
  data: Record<string, unknown>;
}

type EmitFn = (evt: AgentEvent) => Promise<void>;

// ---------------------------------------------------------------------------
// Rate limiter — max 1 stdout event per second
// ---------------------------------------------------------------------------

class RateLimiter {
  private lastEmit = 0;
  private readonly intervalMs: number;

  constructor(maxPerSecond: number) {
    this.intervalMs = 1000 / maxPerSecond;
  }

  canEmit(): boolean {
    const now = Date.now();
    if (now - this.lastEmit >= this.intervalMs) {
      this.lastEmit = now;
      return true;
    }
    return false;
  }
}

// ---------------------------------------------------------------------------
// Agent process management
// ---------------------------------------------------------------------------

let agentProcess: ChildProcess | null = null;

/**
 * Spawns the agent command as a child process, captures stdout line-by-line,
 * and converts each line into an action event (rate-limited to 1/sec).
 */
export function spawnAgent(command: string, emit: EmitFn): ChildProcess {
  const parts = command.split(/\s+/);
  const cmd = parts[0];
  const args = parts.slice(1);

  const child = spawn(cmd, args, {
    stdio: ["inherit", "pipe", "pipe"],
    shell: true,
  });

  agentProcess = child;
  const limiter = new RateLimiter(1);

  // Capture stdout
  if (child.stdout) {
    const rl = createInterface({ input: child.stdout });
    rl.on("line", (line) => {
      // Always echo to sidecar's own stdout for debugging
      process.stdout.write(`[agent] ${line}\n`);

      if (limiter.canEmit()) {
        emit({
          event_type: "action",
          event_name: "log",
          data: { description: line },
        }).catch(() => {});
      }
    });
  }

  // Pass stderr through
  if (child.stderr) {
    const rl = createInterface({ input: child.stderr });
    rl.on("line", (line) => {
      process.stderr.write(`[agent:err] ${line}\n`);
    });
  }

  child.on("exit", (code, signal) => {
    console.log(`[sidecar] Agent exited (code=${code}, signal=${signal})`);
    emit({
      event_type: "status",
      event_name: "agent_exit",
      data: {
        state: "stopped",
        uptime: process.uptime(),
        budget_left: -1, // unknown at exit time
        exit_code: code,
        exit_signal: signal,
      },
    }).catch(() => {});

    // Give a moment for the final event to flush, then exit the sidecar too
    setTimeout(() => process.exit(code ?? 1), 2000);
  });

  child.on("error", (err) => {
    console.error(`[sidecar] Failed to spawn agent:`, err.message);
    emit({
      event_type: "error",
      event_name: "spawn_failure",
      data: { message: `Failed to spawn agent: ${err.message}`, severity: "fatal" },
    }).catch(() => {});
  });

  return child;
}

/**
 * Kills the running agent process (used by budget watchdog).
 */
export function stopAgent(): void {
  if (agentProcess && !agentProcess.killed) {
    console.log("[sidecar] Sending SIGTERM to agent process");
    agentProcess.kill("SIGTERM");

    // Force kill after 5 seconds if it hasn't exited
    setTimeout(() => {
      if (agentProcess && !agentProcess.killed) {
        console.log("[sidecar] Force-killing agent (SIGKILL)");
        agentProcess.kill("SIGKILL");
      }
    }, 5000);
  }
}
