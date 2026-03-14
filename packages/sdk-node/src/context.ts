/**
 * AgentTV SDK context — emits events to the local sidecar process.
 *
 * Zero dependencies: uses Node.js built-in fetch (available since Node 18).
 */

// ---------------------------------------------------------------------------
// Event type interfaces
// ---------------------------------------------------------------------------

export interface ActionData {
  description: string;
  [key: string]: unknown;
}

export interface RevenueData {
  amount: number;
  currency: string;
  [key: string]: unknown;
}

export interface StatusData {
  state: string;
  uptime: number;
  budget_left: number;
  [key: string]: unknown;
}

export interface ErrorData {
  message: string;
  severity: "warning" | "critical" | "fatal";
  [key: string]: unknown;
}

export interface AgentEvent {
  event_type: "action" | "revenue" | "status" | "error";
  event_name: string;
  data: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

export class AgentTVContext {
  private baseUrl: string;
  private startTime: number;

  constructor() {
    this.baseUrl = process.env.AGENTTV_SIDECAR_URL || "http://localhost:8080";
    this.startTime = Date.now();
  }

  /** Seconds since the context was created. */
  get elapsed(): number {
    return (Date.now() - this.startTime) / 1000;
  }

  /**
   * Emit an action event.
   * @param name  - A short identifier for the action (e.g. "search", "click").
   * @param data  - Must include `description`.
   */
  async emitAction(name: string, data: ActionData): Promise<void> {
    if (!data.description) {
      throw new Error("action events require data.description");
    }
    await this._emit("action", name, data);
  }

  /**
   * Emit a revenue event.
   * @param name  - A short identifier (e.g. "booking", "sale").
   * @param data  - Must include `amount` (number) and `currency` (string).
   */
  async emitRevenue(name: string, data: RevenueData): Promise<void> {
    if (typeof data.amount !== "number") throw new Error("revenue events require data.amount (number)");
    if (typeof data.currency !== "string") throw new Error("revenue events require data.currency (string)");
    await this._emit("revenue", name, data);
  }

  /**
   * Emit a status heartbeat.
   * @param data - Must include `state`, `uptime`, and `budget_left`.
   */
  async emitStatus(data: StatusData): Promise<void> {
    if (typeof data.state !== "string") throw new Error("status events require data.state (string)");
    if (typeof data.uptime !== "number") throw new Error("status events require data.uptime (number)");
    if (typeof data.budget_left !== "number") throw new Error("status events require data.budget_left (number)");
    await this._emit("status", "heartbeat", data);
  }

  /**
   * Emit an error event.
   * @param data - Must include `message` and `severity` (warning | critical | fatal).
   */
  async emitError(data: ErrorData): Promise<void> {
    if (!data.message) throw new Error("error events require data.message");
    if (!["warning", "critical", "fatal"].includes(data.severity)) {
      throw new Error("error events require data.severity (warning | critical | fatal)");
    }
    await this._emit("error", "error", data);
  }

  /** POST an event to the sidecar. */
  private async _emit(eventType: string, eventName: string, data: Record<string, unknown>): Promise<void> {
    const payload: AgentEvent = {
      event_type: eventType as AgentEvent["event_type"],
      event_name: eventName,
      data,
    };

    try {
      const res = await fetch(`${this.baseUrl}/emit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.status === 403) {
        throw new Error("AgentTV budget exceeded — agent will be terminated");
      }

      if (!res.ok) {
        const body = await res.text();
        console.error(`[agenttv] Sidecar responded ${res.status}: ${body}`);
      }
    } catch (err) {
      // Connection refused = sidecar not running. Don't crash the agent.
      if (err instanceof TypeError && (err.message.includes("fetch") || err.message.includes("ECONNREFUSED"))) {
        return;
      }
      throw err;
    }
  }
}
