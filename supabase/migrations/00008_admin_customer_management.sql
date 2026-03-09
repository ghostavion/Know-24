-- Admin notes on users (internal CRM)
CREATE TABLE IF NOT EXISTS admin_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  admin_user_id TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_admin_notes_user ON admin_notes(user_id);

-- Credit/comp ledger for tracking admin-issued credits
CREATE TABLE IF NOT EXISTS admin_credit_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  admin_user_id TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('credit_added', 'comp_month', 'bonus_tokens', 'bonus_scout_scans', 'bonus_social_posts', 'custom')),
  description TEXT NOT NULL,
  amount_cents INTEGER DEFAULT 0,
  token_amount INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_admin_credit_ledger_org ON admin_credit_ledger(organization_id);

-- No RLS on these — admin-only tables accessed via service role
