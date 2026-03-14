-- Migration: 00015_llm_usage
-- Description: LLM usage tracking table for the llm-router edge function
-- Date: 2026-03-14

CREATE TABLE IF NOT EXISTS llm_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid REFERENCES agents(id),
  run_id uuid REFERENCES agent_runs(id),
  provider text NOT NULL,
  model text NOT NULL,
  input_tokens integer,
  output_tokens integer,
  cost_cents numeric,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_llm_usage_agent ON llm_usage(agent_id, created_at DESC);

ALTER TABLE llm_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role only" ON llm_usage FOR ALL USING (false);
