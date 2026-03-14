-- ============================================================
-- KNOW24 — PIVOT SCHEMA: "Pick a niche, AI builds everything"
-- Migration: 00012_pivot_schema.sql
-- ============================================================

-- ============================================================
-- 1. niche_categories — Pre-seeded lookup table
-- ============================================================

CREATE TABLE public.niche_categories (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name               TEXT NOT NULL UNIQUE,
  slug               TEXT NOT NULL UNIQUE,
  icon               TEXT,
  description        TEXT,
  sub_niches         TEXT[] NOT NULL DEFAULT '{}',
  research_keywords  TEXT[] NOT NULL DEFAULT '{}',
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed 12 categories
INSERT INTO public.niche_categories (name, slug, icon, description, sub_niches, research_keywords) VALUES
  (
    'Health & Wellness',
    'health-wellness',
    'Heart',
    'Holistic health, nutrition, natural remedies, and wellness coaching',
    ARRAY['Nutrition', 'Supplements', 'Holistic Medicine', 'Gut Health', 'Sleep Optimization', 'Longevity', 'Functional Medicine'],
    ARRAY['health tips', 'wellness guide', 'nutrition plan', 'holistic health', 'natural remedies', 'biohacking']
  ),
  (
    'Finance & Investing',
    'finance-investing',
    'DollarSign',
    'Personal finance, investing strategies, crypto, and wealth building',
    ARRAY['Stock Investing', 'Crypto', 'Personal Budgeting', 'Real Estate Investing', 'Retirement Planning', 'Tax Strategy'],
    ARRAY['investing guide', 'personal finance', 'wealth building', 'passive income', 'financial freedom', 'portfolio strategy']
  ),
  (
    'Marketing & Sales',
    'marketing-sales',
    'Megaphone',
    'Digital marketing, copywriting, funnels, and sales strategy',
    ARRAY['Copywriting', 'Email Marketing', 'SEO', 'Social Media Marketing', 'Paid Ads', 'Funnel Strategy', 'Conversion Optimization'],
    ARRAY['marketing strategy', 'sales funnel', 'copywriting', 'lead generation', 'growth hacking', 'digital marketing']
  ),
  (
    'Tech & Development',
    'tech-development',
    'Code',
    'Software engineering, AI/ML, no-code tools, and tech careers',
    ARRAY['Web Development', 'AI & Machine Learning', 'No-Code / Low-Code', 'DevOps', 'Mobile Development', 'Cybersecurity'],
    ARRAY['programming tutorial', 'software engineering', 'AI tools', 'no-code', 'web development', 'tech career']
  ),
  (
    'Education & Learning',
    'education-learning',
    'GraduationCap',
    'Online teaching, course creation, study techniques, and edtech',
    ARRAY['Course Creation', 'Study Techniques', 'Language Learning', 'Tutoring', 'EdTech Tools', 'Homeschooling'],
    ARRAY['online course', 'learning strategy', 'study tips', 'course creation', 'education technology', 'teaching methods']
  ),
  (
    'Creative Arts & Design',
    'creative-arts-design',
    'Palette',
    'Graphic design, photography, illustration, and creative business',
    ARRAY['Graphic Design', 'Photography', 'Illustration', 'UI/UX Design', 'Video Production', 'Creative Freelancing'],
    ARRAY['design tips', 'creative business', 'graphic design', 'photography guide', 'illustration', 'creative freelance']
  ),
  (
    'Food & Cooking',
    'food-cooking',
    'ChefHat',
    'Recipes, meal planning, food business, and culinary education',
    ARRAY['Meal Prep', 'Baking', 'Vegan / Plant-Based', 'Food Photography', 'Restaurant Business', 'Fermentation'],
    ARRAY['recipes', 'meal planning', 'cooking guide', 'food business', 'culinary tips', 'diet plan']
  ),
  (
    'Business Operations & Strategy',
    'business-operations-strategy',
    'Briefcase',
    'Entrepreneurship, operations, hiring, scaling, and business systems',
    ARRAY['Startup Strategy', 'Operations / SOPs', 'Hiring & Team Building', 'Business Automation', 'Consulting', 'E-commerce Operations'],
    ARRAY['business strategy', 'startup guide', 'operations', 'scaling business', 'entrepreneurship', 'business systems']
  ),
  (
    'Parenting & Family',
    'parenting-family',
    'Users',
    'Child development, parenting strategies, family wellness, and education',
    ARRAY['Newborn Care', 'Toddler Development', 'Teen Parenting', 'Homeschool Curriculum', 'Family Finance', 'Co-Parenting'],
    ARRAY['parenting tips', 'child development', 'family wellness', 'parenting guide', 'homeschool', 'baby care']
  ),
  (
    'Real Estate',
    'real-estate',
    'Home',
    'Property investing, flipping, rental management, and real estate marketing',
    ARRAY['Rental Properties', 'House Flipping', 'Commercial Real Estate', 'Real Estate Marketing', 'Property Management', 'First-Time Buyers'],
    ARRAY['real estate investing', 'rental income', 'property management', 'house flipping', 'real estate marketing', 'buy first home']
  ),
  (
    'Fitness & Sports',
    'fitness-sports',
    'Dumbbell',
    'Personal training, sports performance, workout programming, and fitness business',
    ARRAY['Strength Training', 'Yoga & Flexibility', 'Running / Endurance', 'Sports Nutrition', 'Online Coaching', 'Recovery & Mobility'],
    ARRAY['workout plan', 'fitness coaching', 'strength training', 'sports performance', 'personal training', 'exercise guide']
  ),
  (
    'Mental Health & Mindfulness',
    'mental-health-mindfulness',
    'Brain',
    'Therapy techniques, meditation, stress management, and emotional wellness',
    ARRAY['Meditation', 'Anxiety Management', 'Journaling', 'CBT Techniques', 'Stress Reduction', 'Emotional Intelligence'],
    ARRAY['mental health', 'mindfulness', 'meditation guide', 'anxiety tips', 'stress management', 'emotional wellness']
  );

-- Public read so the niche picker works for everyone
ALTER TABLE public.niche_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "niche_categories_public_read" ON public.niche_categories
  FOR SELECT USING (true);

-- ============================================================
-- 2. research_documents — AI research output per business
-- ============================================================

CREATE TABLE public.research_documents (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id              UUID NOT NULL REFERENCES public.businesses (id) ON DELETE CASCADE,
  niche_category_id        UUID REFERENCES public.niche_categories (id),
  niche_text               TEXT NOT NULL,
  personal_context         TEXT,

  -- AI research output
  research_data            JSONB NOT NULL DEFAULT '{}',
  recommended_product_type TEXT,
  recommended_title        TEXT,
  recommended_price_cents  INT,
  recommended_reasoning    TEXT,

  -- Sources
  sources                  JSONB NOT NULL DEFAULT '[]',
  source_count             INT NOT NULL DEFAULT 0,

  -- Telemetry
  research_provider        TEXT,
  research_duration_ms     INT,
  research_cost_cents      INT,

  -- Lifecycle
  status                   TEXT NOT NULL DEFAULT 'pending'
                             CHECK (status IN ('pending', 'researching', 'completed', 'failed')),
  error_message            TEXT,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at             TIMESTAMPTZ
);

CREATE INDEX idx_research_documents_business_id ON public.research_documents (business_id);

CREATE TRIGGER trg_research_documents_updated_at
  BEFORE UPDATE ON public.research_documents
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE public.research_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "research_documents_rw_business_member" ON public.research_documents
  FOR ALL USING (business_id IN (SELECT public.user_business_ids()));

-- ============================================================
-- 3. product_assets — Multi-format product outputs
-- ============================================================

CREATE TABLE public.product_assets (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id            UUID NOT NULL REFERENCES public.products (id) ON DELETE CASCADE,
  business_id           UUID NOT NULL REFERENCES public.businesses (id) ON DELETE CASCADE,

  asset_type            TEXT NOT NULL
                          CHECK (asset_type IN (
                            'pdf', 'epub', 'docx', 'audio', 'video',
                            'cover_image', 'mockup_3d', 'og_image', 'favicon'
                          )),
  r2_key                TEXT NOT NULL,
  r2_bucket             TEXT NOT NULL,
  file_size_bytes       BIGINT,
  mime_type             TEXT,
  duration_seconds      INT,

  -- Generation telemetry
  generation_model      TEXT,
  generation_cost_cents INT,

  -- Lifecycle
  status                TEXT NOT NULL DEFAULT 'pending'
                          CHECK (status IN ('pending', 'generating', 'completed', 'failed')),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_product_assets_product_type ON public.product_assets (product_id, asset_type);

ALTER TABLE public.product_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "product_assets_rw_business_member" ON public.product_assets
  FOR ALL USING (business_id IN (SELECT public.user_business_ids()));

-- ============================================================
-- 4. storefront_themes — Pre-seeded design themes
-- ============================================================

CREATE TABLE public.storefront_themes (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name              TEXT NOT NULL UNIQUE,
  slug              TEXT NOT NULL UNIQUE,
  description       TEXT,
  preview_image_url TEXT,
  best_for          TEXT[] NOT NULL DEFAULT '{}',
  component_key     TEXT NOT NULL,
  default_palette   JSONB NOT NULL DEFAULT '{}',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed 6 themes
INSERT INTO public.storefront_themes (name, slug, description, best_for, component_key, default_palette) VALUES
  (
    'Minimal Clean',
    'minimal-clean',
    'Airy whitespace, clean typography, and subtle accents. Lets content breathe.',
    ARRAY['Tech & Development', 'Education & Learning', 'Business Operations & Strategy'],
    'theme-minimal-clean',
    '{"primary": "#0f172a", "secondary": "#64748b", "accent": "#3b82f6", "background": "#ffffff", "surface": "#f8fafc"}'::jsonb
  ),
  (
    'Bold Impact',
    'bold-impact',
    'High-contrast hero sections, strong CTAs, and energetic color pops.',
    ARRAY['Marketing & Sales', 'Fitness & Sports', 'Finance & Investing'],
    'theme-bold-impact',
    '{"primary": "#18181b", "secondary": "#a1a1aa", "accent": "#ef4444", "background": "#09090b", "surface": "#18181b"}'::jsonb
  ),
  (
    'Warm Earthy',
    'warm-earthy',
    'Organic tones, rounded shapes, and warm gradients. Approachable and grounded.',
    ARRAY['Health & Wellness', 'Food & Cooking', 'Parenting & Family'],
    'theme-warm-earthy',
    '{"primary": "#422006", "secondary": "#78716c", "accent": "#d97706", "background": "#fffbeb", "surface": "#fef3c7"}'::jsonb
  ),
  (
    'Professional Edge',
    'professional-edge',
    'Corporate polish with modern flair. Trust signals and structured layouts.',
    ARRAY['Finance & Investing', 'Real Estate', 'Business Operations & Strategy'],
    'theme-professional-edge',
    '{"primary": "#1e293b", "secondary": "#475569", "accent": "#0891b2", "background": "#f1f5f9", "surface": "#ffffff"}'::jsonb
  ),
  (
    'Creative Pop',
    'creative-pop',
    'Playful gradients, bold type, and expressive layouts for creative brands.',
    ARRAY['Creative Arts & Design', 'Marketing & Sales', 'Education & Learning'],
    'theme-creative-pop',
    '{"primary": "#581c87", "secondary": "#a855f7", "accent": "#f472b6", "background": "#faf5ff", "surface": "#f3e8ff"}'::jsonb
  ),
  (
    'Serene Wellness',
    'serene-wellness',
    'Calming pastels, gentle gradients, and generous whitespace for mindful brands.',
    ARRAY['Mental Health & Mindfulness', 'Health & Wellness', 'Yoga & Flexibility'],
    'theme-serene-wellness',
    '{"primary": "#134e4a", "secondary": "#5eead4", "accent": "#2dd4bf", "background": "#f0fdfa", "surface": "#ccfbf1"}'::jsonb
  );

-- Public read so storefront builder can display themes
ALTER TABLE public.storefront_themes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "storefront_themes_public_read" ON public.storefront_themes
  FOR SELECT USING (true);

-- ============================================================
-- 5. voice_memos — Transcribed user voice input
-- ============================================================

CREATE TABLE public.voice_memos (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id         UUID NOT NULL REFERENCES public.businesses (id) ON DELETE CASCADE,
  r2_key              TEXT,
  transcript          TEXT NOT NULL,
  duration_seconds    INT,
  transcription_model TEXT NOT NULL DEFAULT 'whisper-1',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_voice_memos_business_id ON public.voice_memos (business_id);

ALTER TABLE public.voice_memos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "voice_memos_rw_business_member" ON public.voice_memos
  FOR ALL USING (business_id IN (SELECT public.user_business_ids()));

-- ============================================================
-- 6. referral_links — Viral referral tracking
-- ============================================================

CREATE TABLE public.referral_links (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 UUID NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  code                    TEXT NOT NULL UNIQUE,
  source                  TEXT NOT NULL DEFAULT 'manual',
  clicks                  INT NOT NULL DEFAULT 0,
  signups                 INT NOT NULL DEFAULT 0,
  active_subscriptions    INT NOT NULL DEFAULT 0,
  total_earnings_cents    INT NOT NULL DEFAULT 0,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_referral_links_user_id ON public.referral_links (user_id);
CREATE INDEX idx_referral_links_code ON public.referral_links (code);

CREATE TRIGGER trg_referral_links_updated_at
  BEFORE UPDATE ON public.referral_links
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE public.referral_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "referral_links_own" ON public.referral_links
  FOR ALL USING (
    user_id IN (SELECT id FROM public.users WHERE clerk_user_id = auth.jwt()->>'sub')
  );

-- ============================================================
-- 7. referral_conversions — Individual referral events
-- ============================================================

CREATE TABLE public.referral_conversions (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referral_link_id            UUID NOT NULL REFERENCES public.referral_links (id) ON DELETE CASCADE,
  referrer_user_id            UUID NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  referred_user_id            UUID NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  status                      TEXT NOT NULL DEFAULT 'clicked'
                                CHECK (status IN ('clicked', 'signed_up', 'subscribed', 'churned')),
  reward_granted              TEXT,
  revenue_share_earnings_cents INT NOT NULL DEFAULT 0,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  subscribed_at               TIMESTAMPTZ,
  UNIQUE (referrer_user_id, referred_user_id)
);

CREATE INDEX idx_referral_conversions_link_id ON public.referral_conversions (referral_link_id);
CREATE INDEX idx_referral_conversions_referrer ON public.referral_conversions (referrer_user_id);
CREATE INDEX idx_referral_conversions_referred ON public.referral_conversions (referred_user_id);

ALTER TABLE public.referral_conversions ENABLE ROW LEVEL SECURITY;

-- Referrer can see their own conversions
CREATE POLICY "referral_conversions_referrer" ON public.referral_conversions
  FOR SELECT USING (
    referrer_user_id IN (SELECT id FROM public.users WHERE clerk_user_id = auth.jwt()->>'sub')
  );

-- Service role handles inserts/updates (webhook-driven)
-- No INSERT/UPDATE policy needed for end users

-- ============================================================
-- 8. platform_intelligence — Aggregate niche metrics
-- ============================================================

CREATE TABLE public.platform_intelligence (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  niche_slug      TEXT NOT NULL,
  metric_type     TEXT NOT NULL
                    CHECK (metric_type IN (
                      'avg_conversion_rate', 'avg_price', 'top_format',
                      'trending_topics', 'total_products', 'total_revenue'
                    )),
  metric_value    JSONB NOT NULL,
  period          TEXT NOT NULL DEFAULT 'last_30d',
  calculated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (niche_slug, metric_type, period)
);

CREATE INDEX idx_platform_intelligence_niche ON public.platform_intelligence (niche_slug);

-- Read-only for authenticated users (aggregate data, no PII)
ALTER TABLE public.platform_intelligence ENABLE ROW LEVEL SECURITY;

CREATE POLICY "platform_intelligence_authenticated_read" ON public.platform_intelligence
  FOR SELECT USING (auth.jwt() IS NOT NULL);

-- Writes are service-role only (cron job / Edge Function)
-- No INSERT/UPDATE policy for end users

-- ============================================================
-- 9. Missing RLS policy for existing customers table
-- ============================================================
-- NOTE: The customers table has no business_id column. We link
-- through orders to determine which businesses a customer belongs to.

CREATE POLICY "customers_business_member" ON public.customers
  FOR ALL USING (
    id IN (
      SELECT DISTINCT o.customer_id
      FROM public.orders o
      WHERE o.business_id IN (SELECT public.user_business_ids())
    )
  );
