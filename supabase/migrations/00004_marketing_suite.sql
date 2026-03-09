-- ============================================================
-- KNOW24 — MARKETING SUITE SCHEMA
-- Migration: 00004_marketing_suite.sql
-- ============================================================

-- ============================================================
-- Table: social_posts
-- ============================================================

CREATE TABLE public.social_posts (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id     UUID NOT NULL REFERENCES public.businesses (id) ON DELETE CASCADE,
  product_id      UUID REFERENCES public.products (id) ON DELETE SET NULL,
  content         TEXT NOT NULL,
  image_url       TEXT,
  platform        TEXT NOT NULL CHECK (platform IN ('twitter', 'linkedin', 'facebook', 'instagram')),
  length          TEXT NOT NULL CHECK (length IN ('short', 'medium', 'long')),
  status          TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'scheduled')),
  scheduled_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_social_posts_business_id ON public.social_posts (business_id);
CREATE INDEX idx_social_posts_status ON public.social_posts (status);

CREATE TRIGGER trg_social_posts_updated_at
  BEFORE UPDATE ON public.social_posts
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE public.social_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "social_posts_rw_business_member" ON public.social_posts
  FOR ALL USING (business_id IN (SELECT public.user_business_ids()));

-- ============================================================
-- Table: email_sequences
-- ============================================================

CREATE TABLE public.email_sequences (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id     UUID NOT NULL REFERENCES public.businesses (id) ON DELETE CASCADE,
  type            email_sequence_type NOT NULL,
  name            TEXT NOT NULL,
  subject_template TEXT NOT NULL,
  body_template   TEXT NOT NULL,
  delay_hours     INT NOT NULL DEFAULT 0,
  sort_order      INT NOT NULL DEFAULT 0,
  is_active       BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_email_sequences_business_id ON public.email_sequences (business_id);
CREATE INDEX idx_email_sequences_type ON public.email_sequences (type);

CREATE TRIGGER trg_email_sequences_updated_at
  BEFORE UPDATE ON public.email_sequences
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE public.email_sequences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "email_sequences_rw_business_member" ON public.email_sequences
  FOR ALL USING (business_id IN (SELECT public.user_business_ids()));

-- ============================================================
-- Table: email_sequence_sends
-- ============================================================

CREATE TABLE public.email_sequence_sends (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sequence_id     UUID NOT NULL REFERENCES public.email_sequences (id) ON DELETE CASCADE,
  business_id     UUID NOT NULL REFERENCES public.businesses (id) ON DELETE CASCADE,
  recipient_email TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'bounced')),
  sent_at         TIMESTAMPTZ,
  error_message   TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_email_sequence_sends_sequence_id ON public.email_sequence_sends (sequence_id);
CREATE INDEX idx_email_sequence_sends_business_id ON public.email_sequence_sends (business_id);
CREATE INDEX idx_email_sequence_sends_recipient_email ON public.email_sequence_sends (recipient_email);

ALTER TABLE public.email_sequence_sends ENABLE ROW LEVEL SECURITY;

CREATE POLICY "email_sequence_sends_rw_business_member" ON public.email_sequence_sends
  FOR ALL USING (business_id IN (SELECT public.user_business_ids()));

-- ============================================================
-- Table: referral_links
-- ============================================================

CREATE TABLE public.referral_links (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id     UUID NOT NULL REFERENCES public.businesses (id) ON DELETE CASCADE,
  product_id      UUID REFERENCES public.products (id) ON DELETE SET NULL,
  code            TEXT NOT NULL UNIQUE,
  clicks          INT NOT NULL DEFAULT 0,
  signups         INT NOT NULL DEFAULT 0,
  purchases       INT NOT NULL DEFAULT 0,
  commission_rate NUMERIC(5,4) NOT NULL DEFAULT 0.1000,
  is_active       BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_referral_links_business_id ON public.referral_links (business_id);
CREATE INDEX idx_referral_links_code ON public.referral_links (code);

CREATE TRIGGER trg_referral_links_updated_at
  BEFORE UPDATE ON public.referral_links
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE public.referral_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "referral_links_rw_business_member" ON public.referral_links
  FOR ALL USING (business_id IN (SELECT public.user_business_ids()));

-- ============================================================
-- Table: referral_conversions
-- ============================================================

CREATE TABLE public.referral_conversions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  link_id         UUID NOT NULL REFERENCES public.referral_links (id) ON DELETE CASCADE,
  business_id     UUID NOT NULL REFERENCES public.businesses (id) ON DELETE CASCADE,
  customer_id     UUID REFERENCES public.customers (id) ON DELETE SET NULL,
  order_id        UUID REFERENCES public.orders (id) ON DELETE SET NULL,
  commission_cents INT NOT NULL DEFAULT 0,
  status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid', 'rejected')),
  paid_at         TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_referral_conversions_link_id ON public.referral_conversions (link_id);
CREATE INDEX idx_referral_conversions_business_id ON public.referral_conversions (business_id);
CREATE INDEX idx_referral_conversions_status ON public.referral_conversions (status);

CREATE TRIGGER trg_referral_conversions_updated_at
  BEFORE UPDATE ON public.referral_conversions
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE public.referral_conversions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "referral_conversions_rw_business_member" ON public.referral_conversions
  FOR ALL USING (business_id IN (SELECT public.user_business_ids()));
