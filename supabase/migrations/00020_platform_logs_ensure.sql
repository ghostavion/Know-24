-- Ensure platform_logs table exists (original migration 00009 may not have run)
CREATE TABLE IF NOT EXISTS public.platform_logs (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp         TIMESTAMPTZ NOT NULL DEFAULT now(),
  event_category    TEXT NOT NULL CHECK (event_category IN ('AUTH','USER_ACTION','UI','DATA','LLM','API','ERROR','SYSTEM','SECURITY','ADMIN_AUDIT')),
  event_type        TEXT NOT NULL,
  user_id           UUID,
  clerk_user_id     TEXT,
  session_id        TEXT,
  ip_address        INET,
  user_agent        TEXT,
  geo_country       TEXT,
  geo_city          TEXT,
  page_url          TEXT,
  page_route        TEXT,
  status            TEXT CHECK (status IN ('success','failure','error','warning','info')),
  duration_ms       INTEGER,
  business_id       UUID,
  organization_id   UUID,
  payload           JSONB DEFAULT '{}'::jsonb,
  error_code        TEXT,
  error_message     TEXT,
  environment       TEXT DEFAULT 'production',
  server_id         TEXT,
  app_version       TEXT
);

-- Indexes (IF NOT EXISTS to be safe)
CREATE INDEX IF NOT EXISTS idx_platform_logs_timestamp ON platform_logs (timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_platform_logs_user_id ON platform_logs (user_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_platform_logs_event_type ON platform_logs (event_type);
CREATE INDEX IF NOT EXISTS idx_platform_logs_event_cat ON platform_logs (event_category);
CREATE INDEX IF NOT EXISTS idx_platform_logs_ip ON platform_logs (ip_address);
CREATE INDEX IF NOT EXISTS idx_platform_logs_session ON platform_logs (session_id);
CREATE INDEX IF NOT EXISTS idx_platform_logs_status ON platform_logs (status);
CREATE INDEX IF NOT EXISTS idx_platform_logs_payload ON platform_logs USING GIN (payload);
