-- Migration: 00016_fix_llm_usage_rls
-- Description: Fix llm_usage RLS policy that blocks service_role inserts.
--              The old policy FOR ALL USING (false) prevents ALL access,
--              including service_role via PostgREST. Replace with proper policies.
-- Date: 2026-03-14

-- Drop the broken policy
DROP POLICY IF EXISTS "Service role only" ON llm_usage;

-- Service role can insert/update/delete (for LLM Router edge function)
CREATE POLICY "llm_usage_insert_service" ON llm_usage
  FOR INSERT WITH CHECK (true);

CREATE POLICY "llm_usage_update_service" ON llm_usage
  FOR UPDATE USING (true);

CREATE POLICY "llm_usage_delete_service" ON llm_usage
  FOR DELETE USING (true);

-- Agent owners can view their own agents' LLM usage
CREATE POLICY "llm_usage_select_owner" ON llm_usage
  FOR SELECT
  USING (
    agent_id IN (
      SELECT id FROM agents WHERE owner_id = auth.uid()::text
    )
  );

-- Add missing DELETE policies on other AgentTV tables (from audit)
DROP POLICY IF EXISTS "Users can delete own stakes" ON stakes;
CREATE POLICY "Users can delete own stakes" ON stakes
  FOR DELETE USING (user_id = auth.uid()::text);

DROP POLICY IF EXISTS "Users can delete own subscriptions" ON agent_subscriptions;
CREATE POLICY "Users can delete own subscriptions" ON agent_subscriptions
  FOR DELETE USING (user_id = auth.uid()::text);
