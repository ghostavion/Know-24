/**
 * Fly.io Machines API wrapper.
 *
 * Manages the lifecycle of Fly.io Machines that run agent workloads.
 * Docs: https://fly.io/docs/machines/api/
 */

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const FLY_API_BASE = "https://api.machines.dev/v1";
const FLY_API_TOKEN = process.env.FLY_API_TOKEN || "";
const FLY_APP_NAME = process.env.FLY_APP_NAME || "agenttv-agents";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AgentMachineConfig {
  /** Unique run ID for this agent execution */
  runId: string;
  /** Docker image to use (e.g. "registry.fly.io/agenttv-langgraph:latest") */
  image: string;
  /** Agent command to run inside the container */
  agentCmd: string;
  /** Environment variables to inject */
  env?: Record<string, string>;
  /** VM size preset */
  vmSize?: "shared-cpu-1x" | "shared-cpu-2x" | "shared-cpu-4x" | "performance-1x" | "performance-2x";
  /** Memory in MB */
  memoryMb?: number;
  /** Region (defaults to Fly.io auto-placement) */
  region?: string;
  /** AgentTV run token for the sidecar */
  runToken: string;
  /** Daily spending cap in USD */
  dailyCap?: number;
}

export interface MachineStatus {
  id: string;
  state: "created" | "starting" | "started" | "stopping" | "stopped" | "destroying" | "destroyed";
  region: string;
  createdAt: string;
  updatedAt: string;
}

interface FlyMachineResponse {
  id: string;
  name: string;
  state: string;
  region: string;
  created_at: string;
  updated_at: string;
  config: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// API helpers
// ---------------------------------------------------------------------------

async function flyFetch(path: string, options: RequestInit = {}): Promise<Response> {
  if (!FLY_API_TOKEN) {
    throw new Error("FLY_API_TOKEN environment variable is required");
  }

  const url = `${FLY_API_BASE}/apps/${FLY_APP_NAME}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${FLY_API_TOKEN}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Fly API ${res.status}: ${body}`);
  }

  return res;
}

// ---------------------------------------------------------------------------
// FlyManager
// ---------------------------------------------------------------------------

export class FlyManager {
  /**
   * Creates a new Fly.io Machine configured to run an agent with the sidecar.
   * Returns the machine ID.
   */
  async createMachine(config: AgentMachineConfig): Promise<string> {
    const env: Record<string, string> = {
      AGENT_CMD: config.agentCmd,
      AGENTTV_RUN_TOKEN: config.runToken,
      AGENTTV_SIDECAR_URL: "http://localhost:8080",
      ...config.env,
    };

    if (config.dailyCap) {
      env.AGENTTV_DAILY_CAP = String(config.dailyCap);
    }

    const machineConfig = {
      name: `agenttv-${config.runId}`,
      config: {
        image: config.image,
        env,
        guest: {
          cpu_kind: config.vmSize?.startsWith("performance") ? "performance" : "shared",
          cpus: getCpuCount(config.vmSize),
          memory_mb: config.memoryMb || 256,
        },
        auto_destroy: true,
        restart: { policy: "no" },
        // Health check on sidecar
        checks: {
          sidecar: {
            type: "http",
            port: 8080,
            path: "/health",
            interval: "15s",
            timeout: "5s",
          },
        },
      },
      ...(config.region ? { region: config.region } : {}),
    };

    const res = await flyFetch("/machines", {
      method: "POST",
      body: JSON.stringify(machineConfig),
    });

    const machine = (await res.json()) as FlyMachineResponse;
    console.log(`[fly-manager] Created machine ${machine.id} in ${machine.region}`);
    return machine.id;
  }

  /**
   * Stops a running machine. The machine can be restarted later.
   */
  async stopMachine(machineId: string): Promise<void> {
    await flyFetch(`/machines/${machineId}/stop`, { method: "POST" });
    console.log(`[fly-manager] Stopped machine ${machineId}`);
  }

  /**
   * Destroys a machine permanently.
   */
  async destroyMachine(machineId: string, force = false): Promise<void> {
    const query = force ? "?force=true" : "";
    await flyFetch(`/machines/${machineId}${query}`, { method: "DELETE" });
    console.log(`[fly-manager] Destroyed machine ${machineId}`);
  }

  /**
   * Gets the current status of a machine.
   */
  async getMachineStatus(machineId: string): Promise<MachineStatus> {
    const res = await flyFetch(`/machines/${machineId}`);
    const machine = (await res.json()) as FlyMachineResponse;

    return {
      id: machine.id,
      state: machine.state as MachineStatus["state"],
      region: machine.region,
      createdAt: machine.created_at,
      updatedAt: machine.updated_at,
    };
  }

  /**
   * Lists all machines for the app, optionally filtered by a run ID prefix.
   */
  async listMachines(runIdPrefix?: string): Promise<MachineStatus[]> {
    const res = await flyFetch("/machines");
    const machines = (await res.json()) as FlyMachineResponse[];

    let results = machines.map((m) => ({
      id: m.id,
      state: m.state as MachineStatus["state"],
      region: m.region,
      createdAt: m.created_at,
      updatedAt: m.updated_at,
    }));

    if (runIdPrefix) {
      results = results.filter((m) => m.id.includes(runIdPrefix));
    }

    return results;
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getCpuCount(vmSize?: string): number {
  if (!vmSize) return 1;
  if (vmSize.includes("4x")) return 4;
  if (vmSize.includes("2x")) return 2;
  return 1;
}
