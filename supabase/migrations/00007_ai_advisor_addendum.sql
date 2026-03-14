-- ============================================================
-- KNOW24 — AI ADVISOR ADDENDUM TABLES
-- Migration: 00007_ai_advisor_addendum.sql
--
-- Adds remaining Level 2 Addendum tables for the AI Advisor
-- proactive intelligence layer. The advisor_items table and
-- all advisor ENUMs already exist in 00001_initial_schema.sql.
-- ============================================================

-- ============================================================
-- Table: advisor_rules
-- Configurable rules that trigger advisor recommendations
-- ============================================================

CREATE TABLE public.advisor_rules (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id         UUID NOT NULL REFERENCES public.businesses (id) ON DELETE CASCADE,
  rule_type           advisor_rule_type NOT NULL,
  name                TEXT NOT NULL,
  description         TEXT,
  config              JSONB NOT NULL DEFAULT '{}',
  is_active           BOOLEAN NOT NULL DEFAULT true,
  last_triggered_at   TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_advisor_rules_business ON public.advisor_rules (business_id);
CREATE INDEX idx_advisor_rules_business_active ON public.advisor_rules (business_id)
  WHERE is_active = true;

CREATE TRIGGER trg_advisor_rules_updated_at
  BEFORE UPDATE ON public.advisor_rules
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE public.advisor_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "advisor_rules_rw_business_member" ON public.advisor_rules
  FOR ALL USING (business_id IN (SELECT public.user_business_ids()));

-- ============================================================
-- Table: advisor_daily_analysis
-- Daily snapshot of AI-generated metrics, insights, and recs
-- ============================================================

CREATE TABLE public.advisor_daily_analysis (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id         UUID NOT NULL REFERENCES public.businesses (id) ON DELETE CASCADE,
  analysis_date       DATE NOT NULL,
  metrics             JSONB NOT NULL DEFAULT '{}',
  insights            JSONB NOT NULL DEFAULT '[]',
  recommendations     JSONB NOT NULL DEFAULT '[]',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(business_id, analysis_date)
);

CREATE INDEX idx_advisor_daily_analysis_business ON public.advisor_daily_analysis (business_id);
CREATE INDEX idx_advisor_daily_analysis_date ON public.advisor_daily_analysis (business_id, analysis_date DESC);

ALTER TABLE public.advisor_daily_analysis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "advisor_daily_analysis_rw_business_member" ON public.advisor_daily_analysis
  FOR ALL USING (business_id IN (SELECT public.user_business_ids()));

-- ============================================================
-- Table: product_health_scores
-- Per-product daily health scores across multiple dimensions
-- ============================================================

CREATE TABLE public.product_health_scores (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id              UUID NOT NULL REFERENCES public.products (id) ON DELETE CASCADE,
  business_id             UUID NOT NULL REFERENCES public.businesses (id) ON DELETE CASCADE,
  score_date              DATE NOT NULL,
  overall_score           INT NOT NULL CHECK (overall_score BETWEEN 0 AND 100),
  content_quality_score   INT CHECK (content_quality_score BETWEEN 0 AND 100),
  sales_velocity_score    INT CHECK (sales_velocity_score BETWEEN 0 AND 100),
  engagement_score        INT CHECK (engagement_score BETWEEN 0 AND 100),
  factors                 JSONB NOT NULL DEFAULT '{}',
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(product_id, score_date)
);

CREATE INDEX idx_product_health_scores_business ON public.product_health_scores (business_id);
CREATE INDEX idx_product_health_scores_product_date ON public.product_health_scores (product_id, score_date DESC);
CREATE INDEX idx_product_health_scores_business_date ON public.product_health_scores (business_id, score_date DESC);

ALTER TABLE public.product_health_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "product_health_scores_rw_business_member" ON public.product_health_scores
  FOR ALL USING (business_id IN (SELECT public.user_business_ids()));

-- ============================================================
-- Table: knowledge_gap_queries
-- Tracks unanswered/underserved queries to surface content ideas
-- ============================================================

CREATE TABLE public.knowledge_gap_queries (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id         UUID NOT NULL REFERENCES public.businesses (id) ON DELETE CASCADE,
  query_text          TEXT NOT NULL,
  frequency           INT NOT NULL DEFAULT 1,
  last_asked_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_addressed        BOOLEAN NOT NULL DEFAULT false,
  suggested_content   TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_knowledge_gap_queries_business ON public.knowledge_gap_queries (business_id);
CREATE INDEX idx_knowledge_gap_queries_unaddressed ON public.knowledge_gap_queries (business_id)
  WHERE is_addressed = false;
CREATE INDEX idx_knowledge_gap_queries_frequency ON public.knowledge_gap_queries (business_id, frequency DESC);

CREATE TRIGGER trg_knowledge_gap_queries_updated_at
  BEFORE UPDATE ON public.knowledge_gap_queries
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE public.knowledge_gap_queries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "knowledge_gap_queries_rw_business_member" ON public.knowledge_gap_queries
  FOR ALL USING (business_id IN (SELECT public.user_business_ids()));
