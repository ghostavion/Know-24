-- User feedback / issue reports submitted via right-click widget
CREATE TABLE IF NOT EXISTS feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT,
  session_id TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in-progress', 'resolved', 'wont-fix')),
  page_url TEXT NOT NULL,
  page_route TEXT,
  element_tag TEXT,
  element_text TEXT,
  element_id TEXT,
  element_class TEXT,
  message TEXT NOT NULL,
  category TEXT DEFAULT 'general' CHECK (category IN ('bug', 'ux', 'feature', 'general')),
  severity TEXT DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  context_logs JSONB DEFAULT '[]'::jsonb,
  browser_info JSONB DEFAULT '{}'::jsonb,
  dev_response TEXT,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_feedback_status ON feedback (status);
CREATE INDEX idx_feedback_clerk_user ON feedback (clerk_user_id);
CREATE INDEX idx_feedback_created ON feedback (created_at DESC);
