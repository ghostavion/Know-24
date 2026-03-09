-- ============================================================
-- Know24 — Platform Logs Infrastructure
-- Migration: 00009_platform_logs.sql
-- ============================================================

-- Universal platform log entry — every significant event on the platform
CREATE TABLE IF NOT EXISTS public.platform_logs (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- When
  timestamp         TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- What
  event_category    TEXT NOT NULL CHECK (event_category IN (
    'AUTH', 'USER_ACTION', 'UI', 'DATA', 'LLM', 'API', 'ERROR', 'SYSTEM', 'SECURITY'
  )),
  event_type        TEXT NOT NULL,

  -- Who
  user_id           UUID REFERENCES public.users(id) ON DELETE SET NULL,
  clerk_user_id     TEXT,
  session_id        TEXT,

  -- Where (network)
  ip_address        INET,
  user_agent        TEXT,
  geo_country       TEXT,
  geo_city          TEXT,

  -- Where (app)
  page_url          TEXT,
  page_route        TEXT,

  -- Outcome
  status            TEXT CHECK (status IN ('success', 'failure', 'error', 'warning', 'info')),
  duration_ms       INTEGER,

  -- Context
  business_id       UUID REFERENCES public.businesses(id) ON DELETE SET NULL,
  organization_id   UUID REFERENCES public.organizations(id) ON DELETE SET NULL,

  -- Payload
  payload           JSONB DEFAULT '{}'::jsonb,

  -- Error details
  error_code        TEXT,
  error_message     TEXT,

  -- Infrastructure
  environment       TEXT NOT NULL DEFAULT 'production' CHECK (environment IN ('production', 'staging', 'development')),
  server_id         TEXT,
  app_version       TEXT,

  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for admin dashboard query patterns
CREATE INDEX idx_platform_logs_timestamp     ON public.platform_logs (timestamp DESC);
CREATE INDEX idx_platform_logs_user_id       ON public.platform_logs (user_id, timestamp DESC);
CREATE INDEX idx_platform_logs_event_type    ON public.platform_logs (event_type, timestamp DESC);
CREATE INDEX idx_platform_logs_event_cat     ON public.platform_logs (event_category, timestamp DESC);
CREATE INDEX idx_platform_logs_ip            ON public.platform_logs (ip_address, timestamp DESC);
CREATE INDEX idx_platform_logs_session       ON public.platform_logs (session_id);
CREATE INDEX idx_platform_logs_business      ON public.platform_logs (business_id, timestamp DESC);
CREATE INDEX idx_platform_logs_status        ON public.platform_logs (status, timestamp DESC);
CREATE INDEX idx_platform_logs_payload       ON public.platform_logs USING GIN (payload);

-- No RLS — admin-only table, always accessed via service role client
