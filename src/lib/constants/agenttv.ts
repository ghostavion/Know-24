/**
 * Safe column list for agent queries — never includes run_token.
 * Used by all API routes that return agent data to prevent token leaks.
 */
export const AGENT_PUBLIC_COLUMNS =
  "id, owner_id, name, slug, description, framework, config, byok_provider, personality_fingerprint, status, tier, total_revenue_cents, follower_count, created_at, updated_at";
