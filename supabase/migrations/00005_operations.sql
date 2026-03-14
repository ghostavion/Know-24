-- ---------------------------------------------------------------------------
-- Migration 00005: Operations & Analytics tables (Milestone 8)
-- ---------------------------------------------------------------------------

-- =========================================================================
-- Support tickets
-- =========================================================================
CREATE TABLE public.support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses (id) ON DELETE CASCADE,
  customer_email TEXT NOT NULL,
  customer_name TEXT,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  assigned_to UUID REFERENCES public.users (id),
  storefront_slug TEXT,
  replies_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  closed_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_support_tickets_business_id ON public.support_tickets (business_id, created_at DESC);
CREATE INDEX idx_support_tickets_status ON public.support_tickets (status);
CREATE INDEX idx_support_tickets_email ON public.support_tickets (customer_email);

-- Auto-update updated_at
CREATE TRIGGER trg_support_tickets_updated_at
  BEFORE UPDATE ON public.support_tickets
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- RLS
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "support_tickets_rw_business_member" ON public.support_tickets
  FOR ALL USING (business_id IN (SELECT public.user_business_ids()));

-- Public insert policy for storefront contact forms
CREATE POLICY "support_tickets_public_insert" ON public.support_tickets
  FOR INSERT WITH CHECK (true);

-- =========================================================================
-- Support ticket replies
-- =========================================================================
CREATE TABLE public.support_ticket_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES public.support_tickets (id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('customer', 'business')),
  sender_name TEXT,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ticket_replies_ticket_id ON public.support_ticket_replies (ticket_id, created_at);

ALTER TABLE public.support_ticket_replies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ticket_replies_via_ticket" ON public.support_ticket_replies
  FOR ALL USING (
    ticket_id IN (
      SELECT id FROM public.support_tickets
      WHERE business_id IN (SELECT public.user_business_ids())
    )
  );

-- Public insert for customer replies
CREATE POLICY "ticket_replies_public_insert" ON public.support_ticket_replies
  FOR INSERT WITH CHECK (sender_type = 'customer');

-- =========================================================================
-- Usage events log (detailed tracking beyond org counters)
-- =========================================================================
CREATE TABLE public.usage_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses (id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('ai_chat', 'social_post', 'scout_scan', 'email_sent', 'blog_generated')),
  quantity INT NOT NULL DEFAULT 1,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_usage_events_business_id ON public.usage_events (business_id, created_at DESC);
CREATE INDEX idx_usage_events_type ON public.usage_events (event_type);

ALTER TABLE public.usage_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "usage_events_rw_business_member" ON public.usage_events
  FOR ALL USING (business_id IN (SELECT public.user_business_ids()));
