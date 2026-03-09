-- ============================================================
-- Know24 — Platform Log Partial Indexes + LLM Summary View
-- Migration: 00010_platform_log_indexes.sql
-- ============================================================

-- Partial indexes for common admin queries
CREATE INDEX idx_platform_logs_errors
  ON public.platform_logs (timestamp DESC)
  WHERE status IN ('error', 'failure');

CREATE INDEX idx_platform_logs_security
  ON public.platform_logs (timestamp DESC)
  WHERE event_category = 'SECURITY';

CREATE INDEX idx_platform_logs_llm
  ON public.platform_logs (timestamp DESC, user_id)
  WHERE event_category = 'LLM';

-- LLM cost summary materialized view (refresh via cron)
CREATE MATERIALIZED VIEW public.llm_usage_summary AS
SELECT
  user_id,
  business_id,
  DATE_TRUNC('day', timestamp) AS day,
  COUNT(*)                                        AS call_count,
  COALESCE(SUM((payload->>'input_tokens')::int), 0)   AS total_input_tokens,
  COALESCE(SUM((payload->>'output_tokens')::int), 0)  AS total_output_tokens,
  COALESCE(SUM((payload->>'cost_usd')::numeric), 0)   AS total_cost_usd,
  COALESCE(AVG((payload->>'latency_ms')::int), 0)     AS avg_latency_ms
FROM public.platform_logs
WHERE event_category = 'LLM'
  AND event_type = 'llm.call.completed'
  AND payload->>'cost_usd' IS NOT NULL
GROUP BY user_id, business_id, DATE_TRUNC('day', timestamp);

CREATE UNIQUE INDEX ON public.llm_usage_summary (user_id, business_id, day);
