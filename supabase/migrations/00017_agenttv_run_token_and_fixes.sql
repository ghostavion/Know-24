-- Migration: 00017_agenttv_run_token_and_fixes
-- Description: Add run_token to agents, fix missing indexes, add missing DELETE policies
-- Date: 2026-03-14

-- ============================================================================
-- 1. Add run_token column to agents (used for sidecar + SDK authentication)
-- ============================================================================
ALTER TABLE agents
  ADD COLUMN IF NOT EXISTS run_token text UNIQUE;

-- Backfill existing agents with a generated run_token
UPDATE agents
SET run_token = 'atv_' || encode(extensions.gen_random_bytes(24), 'hex')
WHERE run_token IS NULL;

-- Now make it NOT NULL
ALTER TABLE agents
  ALTER COLUMN run_token SET NOT NULL;

-- ============================================================================
-- 2. Add missing indexes for performance
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_events_run_id ON events (run_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_items_agent_id ON marketplace_items (agent_id);
CREATE INDEX IF NOT EXISTS idx_agents_run_token ON agents (run_token);

-- ============================================================================
-- 3. Add missing DELETE policies
-- ============================================================================

-- marketplace_items: sellers can delete their own items
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'marketplace_items' AND policyname = 'marketplace_items_delete_owner'
  ) THEN
    CREATE POLICY "marketplace_items_delete_owner" ON marketplace_items
      FOR DELETE USING (seller_id = (auth.jwt()->>'sub'));
  END IF;
END $$;

-- marketplace_purchases: buyers can delete their own records
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'marketplace_purchases' AND policyname = 'marketplace_purchases_delete_own'
  ) THEN
    CREATE POLICY "marketplace_purchases_delete_own" ON marketplace_purchases
      FOR DELETE USING (buyer_id = (auth.jwt()->>'sub'));
  END IF;
END $$;

-- ============================================================================
-- 4. Add service role SELECT on llm_usage (needed by LLM Router edge function)
-- ============================================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'llm_usage' AND policyname = 'llm_usage_select_service'
  ) THEN
    CREATE POLICY "llm_usage_select_service" ON llm_usage
      FOR SELECT USING (true);
  END IF;
END $$;

-- ============================================================================
-- 5. Add missing columns to agent_subscriptions
-- ============================================================================
ALTER TABLE agent_subscriptions
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'inactive',
  ADD COLUMN IF NOT EXISTS price_cents integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS current_period_start timestamptz;
