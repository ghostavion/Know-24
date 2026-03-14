-- ============================================================
-- KNOW24 — INITIAL DATABASE SCHEMA
-- Migration: 00001_initial_schema.sql
-- ============================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS "pgcrypto" SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS "vector";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================================
-- Custom Types
-- ============================================================

CREATE TYPE subscription_status AS ENUM (
  'trialing', 'active', 'past_due', 'canceled', 'unpaid', 'paused'
);

CREATE TYPE product_type_enum AS ENUM (
  'guide_ebook', 'framework_template_pack', 'cheat_sheet', 'email_course',
  'assessment_quiz', 'prompt_pack', 'swipe_file', 'resource_directory',
  'worksheet_workbook', 'mini_course', 'chatbot', 'expert_engine'
);

CREATE TYPE pricing_model AS ENUM (
  'one_time', 'subscription_monthly', 'subscription_annual', 'per_use', 'free', 'bundle'
);

CREATE TYPE knowledge_source_type AS ENUM (
  'url', 'document_upload', 'video_link', 'ai_interview'
);

CREATE TYPE knowledge_status AS ENUM (
  'pending', 'processing', 'analyzed', 'failed'
);

CREATE TYPE product_status AS ENUM (
  'draft', 'generating', 'review', 'active', 'archived'
);

CREATE TYPE order_status AS ENUM (
  'pending', 'completed', 'refunded', 'disputed', 'canceled'
);

CREATE TYPE email_sequence_type AS ENUM (
  'welcome', 'nurture', 'product_launch', 're_engagement', 'custom'
);

CREATE TYPE scout_opportunity_type AS ENUM (
  'hot_thread', 'influencer_match', 'podcast_opportunity',
  'trending_topic', 'community_engagement', 'competitor_activity'
);

CREATE TYPE scout_opportunity_status AS ENUM (
  'pending', 'approved', 'dismissed', 'acted'
);

CREATE TYPE activity_event_type AS ENUM (
  'sale', 'subscription_started', 'subscription_canceled',
  'blog_published', 'product_created', 'product_updated',
  'scout_scan_completed', 'email_sequence_sent',
  'social_post_generated', 'referral_converted',
  'customer_signup', 'knowledge_ingested', 'storefront_published',
  'support_ticket_opened', 'support_ticket_closed',
  'ai_workspace_action'
);

-- Level 2 Addendum types
CREATE TYPE advisor_category AS ENUM (
  'sales_insight', 'content_draft', 'scout_opportunity',
  'product_idea', 'performance_alert', 'reminder', 'engagement_prompt'
);

CREATE TYPE advisor_priority AS ENUM ('high', 'medium', 'low');

CREATE TYPE advisor_action_type AS ENUM (
  'send_email', 'publish_blog', 'publish_social', 'update_product',
  'update_storefront', 'trigger_scout', 'create_product', 'custom'
);

CREATE TYPE advisor_item_status AS ENUM (
  'pending', 'approved', 'dismissed', 'snoozed', 'expired'
);

CREATE TYPE advisor_rule_type AS ENUM (
  'content_frequency', 'sales_milestone', 'engagement_drop',
  'scout_auto', 'product_suggestion', 'pricing_review', 'knowledge_gap'
);

-- ============================================================
-- Helper function: auto-update updated_at
-- ============================================================

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- ============================================================
-- Table: users
-- ============================================================

CREATE TABLE public.users (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id     TEXT NOT NULL UNIQUE,
  email             TEXT NOT NULL UNIQUE,
  email_verified    BOOLEAN NOT NULL DEFAULT false,
  first_name        TEXT,
  last_name         TEXT,
  display_name      TEXT GENERATED ALWAYS AS (
    COALESCE(first_name || ' ' || last_name, first_name, last_name, email)
  ) STORED,
  avatar_url        TEXT,
  bio               TEXT,
  timezone          TEXT NOT NULL DEFAULT 'UTC',
  stripe_customer_id TEXT UNIQUE,
  onboarding_completed BOOLEAN NOT NULL DEFAULT false,
  last_seen_at      TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at        TIMESTAMPTZ
);

CREATE INDEX idx_users_clerk_user_id ON public.users (clerk_user_id);
CREATE INDEX idx_users_email ON public.users (email);
CREATE INDEX idx_users_deleted_at ON public.users (deleted_at) WHERE deleted_at IS NULL;

CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_select_own" ON public.users
  FOR SELECT USING (clerk_user_id = auth.jwt()->>'sub');

CREATE POLICY "users_update_own" ON public.users
  FOR UPDATE USING (clerk_user_id = auth.jwt()->>'sub');

-- ============================================================
-- Table: organizations
-- ============================================================

CREATE TABLE public.organizations (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_org_id      TEXT UNIQUE,
  owner_id          UUID NOT NULL REFERENCES public.users (id) ON DELETE RESTRICT,
  name              TEXT NOT NULL,
  slug              TEXT NOT NULL UNIQUE,
  stripe_customer_id         TEXT UNIQUE,
  stripe_subscription_id     TEXT UNIQUE,
  stripe_price_id            TEXT,
  subscription_status        subscription_status NOT NULL DEFAULT 'trialing',
  subscription_current_period_end TIMESTAMPTZ,
  scout_enabled              BOOLEAN NOT NULL DEFAULT false,
  scout_stripe_subscription_id TEXT UNIQUE,
  ai_tokens_used_this_month  BIGINT NOT NULL DEFAULT 0,
  ai_tokens_ceiling          BIGINT NOT NULL DEFAULT 5000000,
  social_posts_used_this_month INT NOT NULL DEFAULT 0,
  social_posts_ceiling        INT NOT NULL DEFAULT 300,
  scout_scans_used_this_month INT NOT NULL DEFAULT 0,
  scout_scans_ceiling         INT NOT NULL DEFAULT 20,
  usage_reset_at             TIMESTAMPTZ NOT NULL DEFAULT DATE_TRUNC('month', NOW()) + INTERVAL '1 month',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at        TIMESTAMPTZ
);

CREATE INDEX idx_organizations_owner_id ON public.organizations (owner_id);
CREATE INDEX idx_organizations_deleted_at ON public.organizations (deleted_at) WHERE deleted_at IS NULL;

CREATE TRIGGER trg_organizations_updated_at
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- Table: organization_members
-- ============================================================

CREATE TABLE public.organization_members (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  role            TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  invited_by      UUID REFERENCES public.users (id),
  joined_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (organization_id, user_id)
);

CREATE INDEX idx_org_members_org_id ON public.organization_members (organization_id);
CREATE INDEX idx_org_members_user_id ON public.organization_members (user_id);

CREATE TRIGGER trg_org_members_updated_at
  BEFORE UPDATE ON public.organization_members
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;

-- Helper function: return all org IDs the current user belongs to
CREATE OR REPLACE FUNCTION public.user_org_ids()
RETURNS SETOF UUID LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT o.id
  FROM public.organizations o
  JOIN public.organization_members om ON om.organization_id = o.id
  JOIN public.users u ON u.id = om.user_id
  WHERE u.clerk_user_id = auth.jwt()->>'sub'
    AND o.deleted_at IS NULL
$$;

CREATE POLICY "orgs_select_member" ON public.organizations
  FOR SELECT USING (id IN (SELECT public.user_org_ids()));

CREATE POLICY "orgs_update_owner" ON public.organizations
  FOR UPDATE USING (
    owner_id IN (SELECT id FROM public.users WHERE clerk_user_id = auth.jwt()->>'sub')
  );

CREATE POLICY "org_members_select" ON public.organization_members
  FOR SELECT USING (organization_id IN (SELECT public.user_org_ids()));

-- ============================================================
-- Table: businesses
-- ============================================================

CREATE TABLE public.businesses (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id       UUID NOT NULL REFERENCES public.organizations (id) ON DELETE RESTRICT,
  owner_id              UUID NOT NULL REFERENCES public.users (id) ON DELETE RESTRICT,
  name                  TEXT NOT NULL,
  slug                  TEXT NOT NULL,
  tagline               TEXT,
  bio                   TEXT,
  niche                 TEXT,
  credibility_line      TEXT,
  avatar_url            TEXT,
  status                TEXT NOT NULL DEFAULT 'setup'
                          CHECK (status IN ('setup', 'active', 'paused', 'archived')),
  onboarding_step       INT NOT NULL DEFAULT 1 CHECK (onboarding_step BETWEEN 1 AND 5),
  onboarding_completed  BOOLEAN NOT NULL DEFAULT false,
  stripe_account_id     TEXT UNIQUE,
  stripe_account_status TEXT CHECK (stripe_account_status IN ('pending', 'active', 'restricted')),
  scout_enabled         BOOLEAN NOT NULL DEFAULT false,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at            TIMESTAMPTZ,
  UNIQUE (organization_id, slug)
);

CREATE INDEX idx_businesses_organization_id ON public.businesses (organization_id);
CREATE INDEX idx_businesses_owner_id ON public.businesses (owner_id);
CREATE INDEX idx_businesses_slug ON public.businesses (slug);
CREATE INDEX idx_businesses_status ON public.businesses (status);
CREATE INDEX idx_businesses_deleted_at ON public.businesses (deleted_at) WHERE deleted_at IS NULL;

CREATE TRIGGER trg_businesses_updated_at
  BEFORE UPDATE ON public.businesses
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;

-- Helper function: return all business IDs accessible to current user
CREATE OR REPLACE FUNCTION public.user_business_ids()
RETURNS SETOF UUID LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT b.id
  FROM public.businesses b
  WHERE b.organization_id IN (SELECT public.user_org_ids())
    AND b.deleted_at IS NULL
$$;

CREATE POLICY "businesses_select_member" ON public.businesses
  FOR SELECT USING (id IN (SELECT public.user_business_ids()));

CREATE POLICY "businesses_insert_member" ON public.businesses
  FOR INSERT WITH CHECK (organization_id IN (SELECT public.user_org_ids()));

CREATE POLICY "businesses_update_member" ON public.businesses
  FOR UPDATE USING (id IN (SELECT public.user_business_ids()));

CREATE POLICY "businesses_delete_owner" ON public.businesses
  FOR DELETE USING (
    owner_id IN (SELECT id FROM public.users WHERE clerk_user_id = auth.jwt()->>'sub')
  );

-- ============================================================
-- Table: product_types (static lookup, seeded)
-- ============================================================

CREATE TABLE public.product_types (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug            product_type_enum NOT NULL UNIQUE,
  display_name    TEXT NOT NULL,
  description     TEXT NOT NULL,
  icon_name       TEXT,
  sort_order      INT NOT NULL DEFAULT 0,
  is_digital      BOOLEAN NOT NULL DEFAULT true,
  is_ai_product   BOOLEAN NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO public.product_types (slug, display_name, description, icon_name, sort_order, is_ai_product) VALUES
  ('guide_ebook',            'Guide / eBook',              'Long-form PDF with structured chapters',                     'BookOpen',      1, false),
  ('framework_template_pack','Framework / Template Pack',  'Fillable templates, checklists, SOPs',                       'Layout',        2, false),
  ('cheat_sheet',            'Cheat Sheet',                '1-3 page condensed knowledge reference',                     'FileText',      3, false),
  ('email_course',           'Email Course',               '5-7 day educational drip email sequence',                    'Mail',          4, false),
  ('assessment_quiz',        'Assessment / Quiz',          'Self-evaluation with scoring and recommendations',           'CheckSquare',   5, false),
  ('prompt_pack',            'Prompt Pack / Toolkit',      'Curated AI prompts for a specific workflow',                 'Zap',           6, false),
  ('swipe_file',             'Swipe File / Script Library','Copy-paste scripts for common situations',                   'Copy',          7, false),
  ('resource_directory',     'Resource Directory',         'Curated list of tools, links, and resources',                'List',          8, false),
  ('worksheet_workbook',     'Worksheet / Workbook',       'Interactive exercises with guided reflection',               'PenTool',       9, false),
  ('mini_course',            'Mini-Course',                'Multi-module lessons with generated slides',                 'Monitor',       10, false),
  ('chatbot',                'Chatbot',                    'Conversational access to creator knowledge',                 'MessageCircle', 11, true),
  ('expert_engine',          'Expert Engine',              'Creator knowledge as a structured API service',              'Cpu',           12, true);

-- ============================================================
-- Table: products
-- ============================================================

CREATE TABLE public.products (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id         UUID NOT NULL REFERENCES public.businesses (id) ON DELETE CASCADE,
  product_type_id     UUID NOT NULL REFERENCES public.product_types (id),
  title               TEXT NOT NULL,
  slug                TEXT NOT NULL,
  tagline             TEXT,
  description         TEXT,
  content             JSONB NOT NULL DEFAULT '{}',
  cover_image_url     TEXT,
  preview_content     TEXT,
  pricing_model       pricing_model NOT NULL DEFAULT 'one_time',
  price_cents         INT,
  compare_price_cents INT,
  stripe_price_id     TEXT,
  stripe_product_id   TEXT,
  is_lead_magnet      BOOLEAN NOT NULL DEFAULT false,
  is_featured         BOOLEAN NOT NULL DEFAULT false,
  sort_order          INT NOT NULL DEFAULT 0,
  status              product_status NOT NULL DEFAULT 'draft',
  published_at        TIMESTAMPTZ,
  chatbot_system_prompt TEXT,
  chatbot_personality TEXT,
  ai_generation_prompt TEXT,
  metadata            JSONB NOT NULL DEFAULT '{}',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at          TIMESTAMPTZ,
  UNIQUE (business_id, slug)
);

CREATE INDEX idx_products_business_id ON public.products (business_id);
CREATE INDEX idx_products_status ON public.products (status);
CREATE INDEX idx_products_deleted_at ON public.products (deleted_at) WHERE deleted_at IS NULL;

CREATE TRIGGER trg_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "products_rw_business_member" ON public.products
  FOR ALL USING (business_id IN (SELECT public.user_business_ids()));

-- ============================================================
-- Table: knowledge_items
-- ============================================================

CREATE TABLE public.knowledge_items (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id     UUID NOT NULL REFERENCES public.businesses (id) ON DELETE CASCADE,
  source_type     knowledge_source_type NOT NULL,
  source_url      TEXT,
  source_filename TEXT,
  source_title    TEXT,
  raw_content     TEXT,
  processed_content TEXT,
  summary         TEXT,
  key_topics      TEXT[],
  embedding       VECTOR(1536),
  status          knowledge_status NOT NULL DEFAULT 'pending',
  token_count     INT,
  error_message   TEXT,
  metadata        JSONB NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ
);

CREATE INDEX idx_knowledge_items_business_id ON public.knowledge_items (business_id);
CREATE INDEX idx_knowledge_items_status ON public.knowledge_items (status);
CREATE INDEX idx_knowledge_items_deleted_at ON public.knowledge_items (deleted_at) WHERE deleted_at IS NULL;

CREATE INDEX idx_knowledge_items_embedding ON public.knowledge_items
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

CREATE TRIGGER trg_knowledge_items_updated_at
  BEFORE UPDATE ON public.knowledge_items
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE public.knowledge_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "knowledge_items_business_member" ON public.knowledge_items
  FOR ALL USING (business_id IN (SELECT public.user_business_ids()));

-- ============================================================
-- Table: knowledge_chunks
-- ============================================================

CREATE TABLE public.knowledge_chunks (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  knowledge_item_id UUID NOT NULL REFERENCES public.knowledge_items (id) ON DELETE CASCADE,
  business_id     UUID NOT NULL REFERENCES public.businesses (id) ON DELETE CASCADE,
  chunk_index     INT NOT NULL,
  content         TEXT NOT NULL,
  token_count     INT,
  embedding       VECTOR(1536),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_knowledge_chunks_business_id ON public.knowledge_chunks (business_id);

CREATE INDEX idx_knowledge_chunks_embedding ON public.knowledge_chunks
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

ALTER TABLE public.knowledge_chunks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "knowledge_chunks_business_member" ON public.knowledge_chunks
  FOR ALL USING (business_id IN (SELECT public.user_business_ids()));

-- ============================================================
-- Table: storefronts
-- ============================================================

CREATE TABLE public.storefronts (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id           UUID NOT NULL REFERENCES public.businesses (id) ON DELETE CASCADE UNIQUE,
  subdomain             TEXT NOT NULL UNIQUE,
  custom_domain         TEXT UNIQUE,
  custom_domain_verified BOOLEAN NOT NULL DEFAULT false,
  color_palette         TEXT NOT NULL DEFAULT 'teal',
  primary_color         TEXT NOT NULL DEFAULT '#0891b2',
  secondary_color       TEXT NOT NULL DEFAULT '#1e293b',
  accent_color          TEXT NOT NULL DEFAULT '#f97316',
  font_family           TEXT NOT NULL DEFAULT 'Inter',
  logo_url              TEXT,
  hero_title            TEXT,
  hero_tagline          TEXT,
  hero_credibility      TEXT,
  hero_cta_primary      TEXT NOT NULL DEFAULT 'Browse Products',
  hero_cta_secondary    TEXT,
  about_title           TEXT,
  about_body            TEXT,
  about_photo_url       TEXT,
  lead_magnet_product_id UUID REFERENCES public.products (id),
  lead_magnet_headline  TEXT,
  social_links          JSONB NOT NULL DEFAULT '{}',
  meta_title            TEXT,
  meta_description      TEXT,
  is_published          BOOLEAN NOT NULL DEFAULT false,
  published_at          TIMESTAMPTZ,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_storefronts_subdomain ON public.storefronts (subdomain);
CREATE INDEX idx_storefronts_is_published ON public.storefronts (is_published);

CREATE TRIGGER trg_storefronts_updated_at
  BEFORE UPDATE ON public.storefronts
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE public.storefronts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "storefronts_rw_business_member" ON public.storefronts
  FOR ALL USING (business_id IN (SELECT public.user_business_ids()));

-- ============================================================
-- Table: customers
-- ============================================================

CREATE TABLE public.customers (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email             TEXT NOT NULL UNIQUE,
  first_name        TEXT,
  last_name         TEXT,
  stripe_customer_id TEXT,
  referral_code_used TEXT,
  referred_by_customer_id UUID REFERENCES public.customers (id),
  metadata          JSONB NOT NULL DEFAULT '{}',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_customers_email ON public.customers (email);

CREATE TRIGGER trg_customers_updated_at
  BEFORE UPDATE ON public.customers
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- Table: orders
-- ============================================================

CREATE TABLE public.orders (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id           UUID NOT NULL REFERENCES public.businesses (id) ON DELETE CASCADE,
  customer_id           UUID NOT NULL REFERENCES public.customers (id),
  product_id            UUID NOT NULL REFERENCES public.products (id),
  stripe_payment_intent_id TEXT,
  amount_cents          INT NOT NULL,
  currency              TEXT NOT NULL DEFAULT 'usd',
  platform_fee_cents    INT,
  status                order_status NOT NULL DEFAULT 'pending',
  access_granted_at     TIMESTAMPTZ,
  refunded_at           TIMESTAMPTZ,
  metadata              JSONB NOT NULL DEFAULT '{}',
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_orders_business_id ON public.orders (business_id);
CREATE INDEX idx_orders_customer_id ON public.orders (customer_id);
CREATE INDEX idx_orders_status ON public.orders (status);

CREATE TRIGGER trg_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "orders_rw_business_member" ON public.orders
  FOR ALL USING (business_id IN (SELECT public.user_business_ids()));

-- ============================================================
-- Table: blog_posts
-- ============================================================

CREATE TABLE public.blog_posts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id     UUID NOT NULL REFERENCES public.businesses (id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  slug            TEXT NOT NULL,
  excerpt         TEXT,
  body            TEXT NOT NULL,
  cover_image_url TEXT,
  meta_title      TEXT,
  meta_description TEXT,
  author_name     TEXT,
  is_ai_generated BOOLEAN NOT NULL DEFAULT false,
  status          TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  published_at    TIMESTAMPTZ,
  embedding       VECTOR(1536),
  view_count      INT NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ,
  UNIQUE (business_id, slug)
);

CREATE INDEX idx_blog_posts_business_id ON public.blog_posts (business_id);
CREATE INDEX idx_blog_posts_status ON public.blog_posts (status);
CREATE INDEX idx_blog_posts_deleted_at ON public.blog_posts (deleted_at) WHERE deleted_at IS NULL;

CREATE TRIGGER trg_blog_posts_updated_at
  BEFORE UPDATE ON public.blog_posts
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "blog_posts_rw_business_member" ON public.blog_posts
  FOR ALL USING (business_id IN (SELECT public.user_business_ids()));

-- ============================================================
-- Table: activity_log
-- ============================================================

CREATE TABLE public.activity_log (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id     UUID NOT NULL REFERENCES public.businesses (id) ON DELETE CASCADE,
  event_type      activity_event_type NOT NULL,
  title           TEXT NOT NULL,
  description     TEXT,
  metadata        JSONB NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_activity_log_business_id ON public.activity_log (business_id, created_at DESC);

ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "activity_log_rw_business_member" ON public.activity_log
  FOR ALL USING (business_id IN (SELECT public.user_business_ids()));

-- ============================================================
-- Table: scout_scans
-- ============================================================

CREATE TABLE public.scout_scans (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id     UUID NOT NULL REFERENCES public.businesses (id) ON DELETE CASCADE,
  scan_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  platforms       TEXT[] NOT NULL DEFAULT '{}',
  opportunities_found INT NOT NULL DEFAULT 0,
  status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  error_message   TEXT,
  metadata        JSONB NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_scout_scans_business_id ON public.scout_scans (business_id, created_at DESC);

ALTER TABLE public.scout_scans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "scout_scans_rw_business_member" ON public.scout_scans
  FOR ALL USING (business_id IN (SELECT public.user_business_ids()));

-- ============================================================
-- Table: scout_opportunities
-- ============================================================

CREATE TABLE public.scout_opportunities (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_id         UUID NOT NULL REFERENCES public.scout_scans (id) ON DELETE CASCADE,
  business_id     UUID NOT NULL REFERENCES public.businesses (id) ON DELETE CASCADE,
  platform        TEXT NOT NULL,
  type            scout_opportunity_type NOT NULL,
  title           TEXT NOT NULL,
  url             TEXT,
  relevance_score INT NOT NULL CHECK (relevance_score BETWEEN 0 AND 100),
  context         TEXT,
  suggested_moves JSONB NOT NULL DEFAULT '[]',
  draft_response  TEXT,
  status          scout_opportunity_status NOT NULL DEFAULT 'pending',
  metadata        JSONB NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_scout_opportunities_business_id ON public.scout_opportunities (business_id);
CREATE INDEX idx_scout_opportunities_status ON public.scout_opportunities (status);

CREATE TRIGGER trg_scout_opportunities_updated_at
  BEFORE UPDATE ON public.scout_opportunities
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE public.scout_opportunities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "scout_opportunities_rw_business_member" ON public.scout_opportunities
  FOR ALL USING (business_id IN (SELECT public.user_business_ids()));

-- ============================================================
-- Table: advisor_items (Level 2 Addendum)
-- ============================================================

CREATE TABLE public.advisor_items (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id       UUID NOT NULL REFERENCES public.businesses (id) ON DELETE CASCADE,
  category          advisor_category NOT NULL,
  priority          advisor_priority NOT NULL DEFAULT 'medium',
  title             TEXT NOT NULL,
  summary           TEXT,
  context_data      JSONB NOT NULL DEFAULT '{}',
  action_type       advisor_action_type,
  action_payload    JSONB NOT NULL DEFAULT '{}',
  status            advisor_item_status NOT NULL DEFAULT 'pending',
  snoozed_until     TIMESTAMPTZ,
  approved_at       TIMESTAMPTZ,
  approved_result   JSONB,
  dismissed_at      TIMESTAMPTZ,
  dismissed_reason  TEXT,
  expired_at        TIMESTAMPTZ,
  source_job_id     TEXT,
  source_type       TEXT NOT NULL DEFAULT 'daily_analysis'
                      CHECK (source_type IN (
                        'daily_analysis', 'event_trigger', 'scout_auto',
                        'milestone_check', 'manual', 'weekly_digest'
                      )),
  metadata          JSONB NOT NULL DEFAULT '{}',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at        TIMESTAMPTZ
);

CREATE INDEX idx_advisor_items_business_status ON public.advisor_items (business_id, status)
  WHERE deleted_at IS NULL;
CREATE INDEX idx_advisor_items_business_pending ON public.advisor_items (business_id)
  WHERE status = 'pending' AND deleted_at IS NULL;

CREATE TRIGGER trg_advisor_items_updated_at
  BEFORE UPDATE ON public.advisor_items
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE public.advisor_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "advisor_items_rw_business_member" ON public.advisor_items
  FOR ALL USING (business_id IN (SELECT public.user_business_ids()));

-- ============================================================
-- RPC: match_knowledge_chunks (pgvector similarity search)
-- ============================================================

CREATE OR REPLACE FUNCTION public.match_knowledge_chunks(
  query_embedding TEXT,
  match_business_id UUID,
  match_threshold FLOAT DEFAULT 0.7,
  match_count INT DEFAULT 5,
  scope_ids UUID[] DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  content TEXT,
  similarity FLOAT,
  knowledge_item_id UUID,
  source_title TEXT
)
LANGUAGE plpgsql STABLE AS $$
BEGIN
  RETURN QUERY
  SELECT
    kc.id,
    kc.content,
    1 - (kc.embedding <=> query_embedding::vector) AS similarity,
    kc.knowledge_item_id,
    ki.source_title
  FROM public.knowledge_chunks kc
  JOIN public.knowledge_items ki ON ki.id = kc.knowledge_item_id
  WHERE kc.business_id = match_business_id
    AND kc.embedding IS NOT NULL
    AND 1 - (kc.embedding <=> query_embedding::vector) > match_threshold
    AND (scope_ids IS NULL OR kc.knowledge_item_id = ANY(scope_ids))
  ORDER BY kc.embedding <=> query_embedding::vector
  LIMIT match_count;
END;
$$;
