// ---------------------------------------------------------------------------
// AgentTV — shared domain types
// ---------------------------------------------------------------------------

/** Supported AI agent frameworks */
export type AgentFramework =
  | "langgraph"
  | "crewai"
  | "openai-agents"
  | "raw-python"
  | "nodejs";

/** Revenue tiers — computed from total_revenue_cents */
export type AgentTier = "rookie" | "operator" | "strategist" | "veteran" | "legend";

/** Agent operational status */
export type AgentStatus = "running" | "starting" | "offline" | "paused" | "stopped" | "error" | "deleted";

/** Event types emitted by the sidecar */
export type EventType = "action" | "revenue" | "status" | "error";

/** Reaction emoji set */
export type ReactionKind = "fire" | "facepalm" | "money" | "eyes";

/** Marketplace item categories */
export type MarketplaceItemType = "template" | "strategy_pack" | "clone";

// ---------------------------------------------------------------------------
// Core entities
// ---------------------------------------------------------------------------

export interface Agent {
  id: string;
  owner_id: string; // Clerk user ID
  name: string;
  slug: string;
  description: string | null;
  framework: AgentFramework;
  config: Record<string, unknown>;
  byok_provider: string | null;
  personality_fingerprint: string | null;
  status: AgentStatus;
  tier: AgentTier;
  total_revenue_cents: number;
  follower_count: number;
  run_token?: string; // only returned to owner; excluded from public API responses
  created_at: string;
  updated_at: string;
}

/** Subset returned on public list endpoints (no run_token, no config) */
export interface AgentSummary {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  framework: AgentFramework;
  personality_fingerprint: string | null;
  status: AgentStatus;
  tier: AgentTier;
  total_revenue_cents: number;
  follower_count: number;
  created_at: string;
}

export interface AgentRun {
  id: string;
  agent_id: string;
  run_id: string;
  revenue_cents: number;
  status: "running" | "completed" | "failed";
  started_at: string;
  ended_at: string | null;
}

export interface AgentEvent {
  id: string;
  agent_id: string;
  run_id: string | null;
  event_type: EventType;
  event_name: string;
  data: Record<string, unknown>;
  created_at: string;
}

export interface Follow {
  id: string;
  user_id: string;
  agent_id: string;
  created_at: string;
}

export interface Reaction {
  id: string;
  user_id: string;
  event_id: string;
  agent_id: string;
  kind: ReactionKind;
  created_at: string;
}

export interface AgentStats {
  id: string;
  agent_id: string;
  date: string; // YYYY-MM-DD
  revenue_cents: number;
  actions_count: number;
  follower_count: number;
  rank: number | null;
  created_at: string;
}

export interface MarketplaceItem {
  id: string;
  seller_id: string; // Clerk user ID
  agent_id: string | null; // for clones
  item_type: MarketplaceItemType;
  title: string;
  description: string | null;
  price_cents: number;
  config_snapshot: Record<string, unknown>;
  status: "active" | "inactive" | "sold";
  purchase_count: number;
  created_at: string;
  updated_at: string;
}

export interface MarketplacePurchase {
  id: string;
  buyer_id: string;
  item_id: string;
  price_cents: number;
  stripe_payment_intent_id: string;
  status: "pending" | "completed" | "refunded";
  created_at: string;
}

// ---------------------------------------------------------------------------
// API request / response helpers
// ---------------------------------------------------------------------------

export interface AgentListParams {
  sort?: "revenue" | "followers" | "newest";
  status?: AgentStatus;
  framework?: AgentFramework;
  limit?: number;
  offset?: number;
}

export interface CreateAgentBody {
  name: string;
  slug: string;
  description?: string;
  framework: AgentFramework;
  config?: Record<string, unknown>;
  byok_provider?: string;
}

export interface UpdateAgentBody {
  name?: string;
  description?: string;
  config?: Record<string, unknown>;
  status?: AgentStatus;
}

export interface IngestEventBody {
  agent_id: string;
  run_id: string;
  event_type: EventType;
  event_name: string;
  data: Record<string, unknown>;
}

export interface LeaderboardEntry {
  slug: string;
  name: string;
  tier: AgentTier;
  total_revenue_cents: number;
  follower_count: number;
  status: AgentStatus;
  framework: AgentFramework;
  personality_fingerprint: string | null;
  revenue_change_24h: number;
  rank: number;
  rank_change: number; // positive = moved up
}

export interface FollowResponse {
  following: boolean;
  follower_count: number;
}

export interface StatsResponse {
  total_revenue_cents: number;
  daily_revenue: { date: string; revenue_cents: number }[];
  follower_trend: { date: string; follower_count: number }[];
  actions_per_day: { date: string; count: number }[];
}

export interface CreateMarketplaceItemBody {
  item_type: MarketplaceItemType;
  title: string;
  description?: string;
  price_cents: number;
  agent_id?: string;
  config_snapshot: Record<string, unknown>;
}
