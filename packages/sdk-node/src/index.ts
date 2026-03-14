export { AgentTVContext } from "./context.js";
export type { ActionData, RevenueData, StatusData, ErrorData, AgentEvent } from "./context.js";

import { AgentTVContext } from "./context.js";

/** Singleton context instance for convenience. */
export const ctx = new AgentTVContext();
