-- Migration 00013: Credit System
-- Adds credit ledger, credit transactions, and updates ebooks table for V1 pivot

-- ============================================================================
-- Credit Ledger
-- ============================================================================

CREATE TABLE IF NOT EXISTS credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  balance INTEGER NOT NULL DEFAULT 200,
  monthly_allocation INTEGER NOT NULL DEFAULT 200,
  reset_date TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '30 days'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT credits_user_id_unique UNIQUE (user_id)
);

-- Auto-update updated_at
CREATE TRIGGER credits_updated_at
  BEFORE UPDATE ON credits
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE credits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own credits"
  ON credits FOR SELECT
  USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Service role full access on credits"
  ON credits FOR ALL
  USING (current_setting('role', true) = 'service_role');

-- ============================================================================
-- Credit Transactions (append-only ledger)
-- ============================================================================

CREATE TABLE IF NOT EXISTS credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  amount INTEGER NOT NULL,
  balance_after INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN (
    'monthly_reset',
    'generation',
    'purchase',
    'referral_reward',
    'refund',
    'bonus'
  )),
  action TEXT CHECK (action IN (
    'research_report',
    'ebook_generation',
    'cover_generation',
    'scout_scan',
    'chapter_rewrite',
    'voice_transcription'
  )),
  reference_id UUID,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for common queries
CREATE INDEX idx_credit_transactions_user_id ON credit_transactions (user_id);
CREATE INDEX idx_credit_transactions_created_at ON credit_transactions (created_at DESC);
CREATE INDEX idx_credit_transactions_type ON credit_transactions (type);

-- RLS
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own credit transactions"
  ON credit_transactions FOR SELECT
  USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Service role full access on credit_transactions"
  ON credit_transactions FOR ALL
  USING (current_setting('role', true) = 'service_role');

-- ============================================================================
-- Ebooks table (core V1 product)
-- ============================================================================

CREATE TABLE IF NOT EXISTS ebooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  research_run_id UUID,
  title TEXT NOT NULL,
  subtitle TEXT,
  author_name TEXT,
  description TEXT,
  chapters JSONB NOT NULL DEFAULT '[]',
  total_pages INTEGER,
  total_words INTEGER,
  target_price NUMERIC(10,2),
  niche TEXT,
  personal_angle TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN (
    'draft',
    'generating',
    'reviewing',
    'published',
    'archived'
  )),
  generation_model TEXT,
  credits_charged INTEGER,
  pdf_url TEXT,
  pdf_storage_path TEXT,
  cover_url TEXT,
  cover_storage_path TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  published_at TIMESTAMPTZ
);

CREATE TRIGGER ebooks_updated_at
  BEFORE UPDATE ON ebooks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX idx_ebooks_user_id ON ebooks (user_id);
CREATE INDEX idx_ebooks_status ON ebooks (status);

-- RLS
ALTER TABLE ebooks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own ebooks"
  ON ebooks FOR SELECT
  USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can update own ebooks"
  ON ebooks FOR UPDATE
  USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Service role full access on ebooks"
  ON ebooks FOR ALL
  USING (current_setting('role', true) = 'service_role');

-- ============================================================================
-- Covers table (generated cover options)
-- ============================================================================

CREATE TABLE IF NOT EXISTS covers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ebook_id UUID NOT NULL REFERENCES ebooks(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  prompt TEXT NOT NULL,
  image_url TEXT,
  storage_path TEXT,
  selected BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_covers_ebook_id ON covers (ebook_id);

ALTER TABLE covers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own covers"
  ON covers FOR SELECT
  USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Service role full access on covers"
  ON covers FOR ALL
  USING (current_setting('role', true) = 'service_role');

-- ============================================================================
-- Research Runs (replaces/extends research_documents for credit tracking)
-- ============================================================================

CREATE TABLE IF NOT EXISTS research_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  niche_query TEXT NOT NULL,
  niche_hash TEXT NOT NULL,
  personal_angle TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending',
    'scraping',
    'analyzing',
    'synthesizing',
    'completed',
    'failed',
    'cached'
  )),
  phase TEXT,
  pain_points JSONB,
  product_analysis JSONB,
  blueprint JSONB,
  proof_card JSONB,
  confidence_score INTEGER,
  narration_events JSONB DEFAULT '[]',
  api_costs JSONB DEFAULT '{}',
  total_cost NUMERIC(10,4),
  credits_charged INTEGER,
  cached_from UUID REFERENCES research_runs(id),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX idx_research_runs_user_id ON research_runs (user_id);
CREATE INDEX idx_research_runs_niche_hash ON research_runs (niche_hash);
CREATE INDEX idx_research_runs_status ON research_runs (status);

ALTER TABLE research_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own research runs"
  ON research_runs FOR SELECT
  USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Service role full access on research_runs"
  ON research_runs FOR ALL
  USING (current_setting('role', true) = 'service_role');

-- ============================================================================
-- Scout Scans (credit-tracked)
-- ============================================================================

CREATE TABLE IF NOT EXISTS scout_scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  ebook_id UUID REFERENCES ebooks(id),
  niche TEXT NOT NULL,
  platforms JSONB DEFAULT '["reddit", "twitter", "linkedin", "podcasts"]',
  opportunities_found INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending',
    'scanning',
    'completed',
    'failed'
  )),
  results JSONB DEFAULT '[]',
  credits_charged INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX idx_scout_scans_user_id ON scout_scans (user_id);

ALTER TABLE scout_scans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own scout scans"
  ON scout_scans FOR SELECT
  USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Service role full access on scout_scans"
  ON scout_scans FOR ALL
  USING (current_setting('role', true) = 'service_role');

-- ============================================================================
-- Referrals
-- ============================================================================

CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_user_id TEXT NOT NULL,
  referred_user_id TEXT,
  referral_code TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending',
    'clicked',
    'signed_up',
    'converted',
    'rewarded'
  )),
  reward_type TEXT CHECK (reward_type IN ('free_month', 'bonus_credits')),
  reward_applied_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  signed_up_at TIMESTAMPTZ,
  converted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_referrals_referrer ON referrals (referrer_user_id);
CREATE INDEX idx_referrals_code ON referrals (referral_code);

ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own referrals"
  ON referrals FOR SELECT
  USING (referrer_user_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Service role full access on referrals"
  ON referrals FOR ALL
  USING (current_setting('role', true) = 'service_role');

-- ============================================================================
-- User Profiles (subscription tier, founder status)
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL UNIQUE,
  display_name TEXT,
  subscription_tier TEXT NOT NULL DEFAULT 'standard' CHECK (subscription_tier IN (
    'founder',
    'standard'
  )),
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  subscription_status TEXT DEFAULT 'inactive' CHECK (subscription_status IN (
    'active',
    'past_due',
    'cancelled',
    'inactive'
  )),
  monthly_price_cents INTEGER NOT NULL DEFAULT 9900,
  referral_code TEXT UNIQUE,
  total_referrals INTEGER NOT NULL DEFAULT 0,
  founding_member BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
  ON user_profiles FOR SELECT
  USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Service role full access on user_profiles"
  ON user_profiles FOR ALL
  USING (current_setting('role', true) = 'service_role');

-- ============================================================================
-- Orders (storefront purchases)
-- ============================================================================

CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  storefront_id UUID,
  ebook_id UUID REFERENCES ebooks(id),
  buyer_email TEXT NOT NULL,
  buyer_name TEXT,
  amount_cents INTEGER NOT NULL,
  platform_fee_cents INTEGER NOT NULL DEFAULT 0,
  creator_payout_cents INTEGER NOT NULL DEFAULT 0,
  stripe_payment_intent_id TEXT,
  stripe_checkout_session_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending',
    'completed',
    'refunded',
    'failed'
  )),
  download_count INTEGER NOT NULL DEFAULT 0,
  download_token TEXT UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX idx_orders_buyer_email ON orders (buyer_email);
CREATE INDEX idx_orders_ebook_id ON orders (ebook_id);
CREATE INDEX idx_orders_download_token ON orders (download_token);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on orders"
  ON orders FOR ALL
  USING (current_setting('role', true) = 'service_role');

-- ============================================================================
-- Research Cache (avoid re-running same niche queries)
-- ============================================================================

CREATE TABLE IF NOT EXISTS research_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  niche_hash TEXT NOT NULL,
  research_run_id UUID NOT NULL REFERENCES research_runs(id),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '7 days'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_research_cache_hash ON research_cache (niche_hash);
CREATE INDEX idx_research_cache_expires ON research_cache (expires_at);
