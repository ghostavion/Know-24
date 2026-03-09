-- ============================================================
-- KNOW24 — STOREFRONT & E-COMMERCE ADDITIONS
-- Migration: 00003_storefront_ecommerce.sql
-- ============================================================

-- ============================================================
-- Table: email_subscribers
-- ============================================================

CREATE TABLE public.email_subscribers (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id     UUID NOT NULL REFERENCES public.businesses (id) ON DELETE CASCADE,
  email           TEXT NOT NULL,
  first_name      TEXT,
  source          TEXT NOT NULL DEFAULT 'storefront'
                    CHECK (source IN ('storefront', 'lead_magnet', 'checkout', 'import')),
  subscribed_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  unsubscribed_at TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (business_id, email)
);

CREATE INDEX idx_email_subscribers_business_id ON public.email_subscribers (business_id);
CREATE INDEX idx_email_subscribers_email ON public.email_subscribers (email);

CREATE TRIGGER trg_email_subscribers_updated_at
  BEFORE UPDATE ON public.email_subscribers
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE public.email_subscribers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "email_subscribers_rw_business_member" ON public.email_subscribers
  FOR ALL USING (business_id IN (SELECT auth.user_business_ids()));

-- ============================================================
-- Table: storefront_testimonials
-- ============================================================

CREATE TABLE public.storefront_testimonials (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id     UUID NOT NULL REFERENCES public.businesses (id) ON DELETE CASCADE,
  customer_name   TEXT NOT NULL,
  customer_title  TEXT,
  avatar_url      TEXT,
  quote           TEXT NOT NULL,
  rating          INT CHECK (rating BETWEEN 1 AND 5),
  sort_order      INT NOT NULL DEFAULT 0,
  is_visible      BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_storefront_testimonials_business_id ON public.storefront_testimonials (business_id);

CREATE TRIGGER trg_storefront_testimonials_updated_at
  BEFORE UPDATE ON public.storefront_testimonials
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE public.storefront_testimonials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "storefront_testimonials_rw_business_member" ON public.storefront_testimonials
  FOR ALL USING (business_id IN (SELECT auth.user_business_ids()));

-- ============================================================
-- Public read policies for anonymous storefront access
-- ============================================================

-- Storefronts: allow anyone to read published storefronts
CREATE POLICY "storefront_public_read" ON public.storefronts
  FOR SELECT USING (is_published = true);

-- Products: allow anyone to read active products from published storefronts
CREATE POLICY "products_public_read" ON public.products
  FOR SELECT USING (
    business_id IN (
      SELECT business_id FROM public.storefronts WHERE is_published = true
    )
    AND status = 'active'
    AND deleted_at IS NULL
  );

-- Blog posts: allow anyone to read published posts from published storefronts
CREATE POLICY "blog_posts_public_read" ON public.blog_posts
  FOR SELECT USING (
    business_id IN (
      SELECT business_id FROM public.storefronts WHERE is_published = true
    )
    AND status = 'published'
    AND deleted_at IS NULL
  );

-- Email subscribers: allow anonymous insert for published storefronts
CREATE POLICY "email_subscribers_public_insert" ON public.email_subscribers
  FOR INSERT WITH CHECK (
    business_id IN (
      SELECT business_id FROM public.storefronts WHERE is_published = true
    )
  );

-- Orders: allow customers to view their own orders via JWT email claim
CREATE POLICY "orders_public_select_own" ON public.orders
  FOR SELECT USING (
    customer_id IN (
      SELECT id FROM public.customers
      WHERE email = current_setting('request.jwt.claim.email', true)
    )
  );
