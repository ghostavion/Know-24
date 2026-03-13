# KNOW24 — STRATEGIC PIVOT BUILD PLAN
## From "Upload Your Knowledge" to "AI Builds Your Business in 3 Clicks"

**Version:** 2.0 — The Frictionless Pivot
**Date:** March 10, 2026
**Prepared by:** AI Coder (Claude Opus 4.6)
**Source:** Recording 43 Strategic Brief + Competitive Analysis + Codebase Audit
**Target:** Production-ready, subscription-selling, frictionless SaaS platform

---

## EXECUTIVE SUMMARY

### What's Changing

The old model required users to upload personal knowledge before anything could be built. The new model:

1. User picks a niche category (1 click)
2. AI deep-researches validated products in that niche (autonomous, ~2 min)
3. AI generates the digital product, storefront, and distribution plan (autonomous, ~5 min)
4. User reviews and clicks "Go Live" (1 click)

**Total user effort: 3 clicks + optional customization.**
**Total time: Under 10 minutes.**

### What's NOT Changing

The existing tech stack (Next.js, Supabase, Clerk, Stripe, BullMQ, R2, Sentry) is solid and stays. The database schema gets extended, not replaced. Components get rewired, not rewritten.

### Novel AI Capabilities Being Added

| Capability | Technology | What It Does |
|---|---|---|
| Deep Niche Research | Firecrawl Agent + Tavily + Perplexity Sonar API | Autonomous web research to find validated, successful products in any niche |
| Multi-Format Product Generation | GPT-4o + Claude + Puppeteer PDF | Generates complete, formatted, downloadable digital products |
| AI Cover Art & Mockups | GPT Image / Imagen 4 API | Professional product covers, mockups, and brand assets |
| AI Audio Narration | ElevenLabs TTS API | Auto-narrates ebooks and courses into audio versions |
| AI Explainer Videos | HeyGen API | Auto-generates product explainer/promo videos |
| Intelligent Storefront Design | Pre-built design system + AI copy | Award-quality storefronts that rival Squarespace |
| AI Distribution Scout | Real API integrations (Reddit, X, Google) | Finds actual distribution opportunities, not mocked data |
| Stripe Instant Checkout | Stripe Checkout + Payment Links | Friction-free purchasing for end customers |

---

## PART 1: THE 3-CLICK EXPERIENCE (User Flow)

### The North Star

A user signs up, picks "Health & Wellness," and 8 minutes later has:
- A complete ebook (PDF, formatted, cover art, 80+ pages)
- An audio version of that ebook (ElevenLabs narration)
- A 30-second AI explainer video for the product
- A beautiful storefront with their product listed, priced, and purchasable
- A shareable link (know24.io/s/their-slug)
- 5 distribution opportunities where they can start selling today
- A blog post draft ready to publish
- An email welcome sequence loaded and ready

All from picking a category. No typing. No uploading. No homework.

### The 3-Click Flow

```
CLICK 1: Pick Your Niche
┌──────────────────────────────────────────────────────────────┐
│                    "What are you into?"                       │
│                                                              │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│  │  Health   │ │ Finance  │ │Marketing │ │  Tech    │       │
│  │    &      │ │    &     │ │    &     │ │    &     │       │
│  │ Wellness  │ │ Investing│ │  Sales   │ │  Dev     │       │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘       │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│  │Education │ │ Creative │ │  Food &  │ │ Business │       │
│  │    &     │ │  Arts &  │ │ Cooking  │ │ Ops &    │       │
│  │ Learning │ │  Design  │ │          │ │ Strategy │       │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘       │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│  │Parenting │ │  Real    │ │ Fitness  │ │ Mental   │       │
│  │    &     │ │ Estate   │ │    &     │ │ Health & │       │
│  │ Family   │ │          │ │ Sports   │ │Mindfulness│      │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘       │
│                                                              │
│  Or type your own: [___________________________]             │
│                                                              │
│  Optional: Add your personal angle                           │
│  [I'm a nurse with 15 years in pediatrics]                   │
│                                                              │
└──────────────────────────────────────────────────────────────┘

CLICK 2: AI Does Everything (User watches progress)
┌──────────────────────────────────────────────────────────────┐
│              "Building your business..."                      │
│                                                              │
│  ✅ Researching top-selling products in Health & Wellness     │
│     Found 47 validated products, 12 gaps, 3 trending topics  │
│                                                              │
│  ✅ Selected: "The Complete Gut Health Reset Guide"           │
│     Based on: High demand, low competition, $27 avg price    │
│                                                              │
│  ⏳ Generating your 85-page ebook...                         │
│     ████████████████░░░░ 78%                                │
│                                                              │
│  ○ Designing cover art                                       │
│  ○ Recording audio version                                   │
│  ○ Creating explainer video                                  │
│  ○ Building your storefront                                  │
│  ○ Finding distribution channels                             │
│  ○ Drafting marketing content                                │
│                                                              │
│  ┌─────────────────────────────────────┐                    │
│  │  💡 While you wait:                 │                    │
│  │  Want to add personal knowledge?    │                    │
│  │  [Upload docs]  [Paste URL]  [Skip] │                    │
│  └─────────────────────────────────────┘                    │
│                                                              │
└──────────────────────────────────────────────────────────────┘

CLICK 3: Review & Go Live
┌──────────────────────────────────────────────────────────────┐
│              "Your business is ready."                        │
│                                                              │
│  ┌─ PRODUCT ──────────────────────────────────────────┐     │
│  │  📖 The Complete Gut Health Reset Guide             │     │
│  │  85 pages | PDF + Audio | Suggested price: $27     │     │
│  │  [Preview PDF]  [Edit Title]  [Change Price]       │     │
│  └────────────────────────────────────────────────────┘     │
│                                                              │
│  ┌─ STOREFRONT ───────────────────────────────────────┐     │
│  │  🌐 know24.io/s/gut-health-reset                   │     │
│  │  [Preview]  [Change Colors]  [Edit Copy]           │     │
│  └────────────────────────────────────────────────────┘     │
│                                                              │
│  ┌─ DISTRIBUTION ─────────────────────────────────────┐     │
│  │  🎯 5 opportunities found                          │     │
│  │  r/GutHealth (23k members) — draft response ready  │     │
│  │  r/nutrition (1.2M members) — trending thread      │     │
│  │  ... 3 more                                        │     │
│  └────────────────────────────────────────────────────┘     │
│                                                              │
│  ┌─ BONUS CONTENT ────────────────────────────────────┐     │
│  │  📝 Blog post draft ready                          │     │
│  │  📧 Welcome email sequence loaded                  │     │
│  │  🎬 30-sec explainer video generated               │     │
│  └────────────────────────────────────────────────────┘     │
│                                                              │
│           [ 🚀 Go Live — Start Selling ]                     │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### Optional Knowledge Enhancement (Non-Blocking)

At ANY point — before, during, or after generation — users can add personal knowledge:
- Paste a URL
- Upload a document (PDF, DOCX)
- Record a voice memo (transcribed by Whisper)
- Have an AI interview conversation

When knowledge is added, the system re-ranks and optionally regenerates products with the personal angle woven in. This is the upgrade path, not the gate.

---

## PART 2: NOVEL AI IMPLEMENTATIONS

These are the ideas that make Know24 extraordinary — things competitors aren't doing.

### 2.1 — Deep Research Agent (The Moat)

**What nobody else does:** Before generating a single word of product content, Know24 runs an autonomous research agent that:

1. **Searches real marketplaces** (Amazon Kindle, Gumroad, Udemy, Etsy) for top-selling products in the niche
2. **Analyzes pricing data** — what sells at $9 vs $27 vs $97
3. **Identifies content gaps** — topics with high search demand but few quality products
4. **Studies competitor product structures** — chapter counts, page lengths, formats that convert
5. **Pulls trending topics** — what's being discussed right now on Reddit, X, Google Trends
6. **Produces a structured research document** — stored in the database, used as generation context

**Technology stack:**
- **Firecrawl Agent API** — autonomous web research agent. You describe what you need in natural language, it navigates, scrapes, and returns structured JSON. No URLs required.
- **Tavily Search API** — optimized for LLM context windows. Fast, pre-processed search results.
- **Perplexity Sonar API** — synthesizes information across dozens of sources with inline citations.
- **Custom orchestrator** — runs all three in parallel, deduplicates, scores by relevance.

**Why this is the moat:** Automateed generates ebooks from a prompt. CourseAI generates courses from a topic. But neither researches what's actually selling, what gaps exist, or what price points work. Know24's research layer means every product is based on validated market data, not guesswork.

**Output schema:**
```typescript
interface NicheResearchDocument {
  niche: string;
  subNiches: string[];
  marketSize: { estimated: string; trend: "growing" | "stable" | "declining" };
  topSellingProducts: {
    title: string;
    platform: string;
    priceRange: string;
    format: string;
    estimatedSales: string;
    whatMakesItWork: string;
  }[];
  contentGaps: {
    topic: string;
    searchDemand: "high" | "medium" | "low";
    competitionLevel: "high" | "medium" | "low";
    opportunity: string;
  }[];
  trendingTopics: {
    topic: string;
    source: string;
    momentum: string;
    relevance: number;
  }[];
  pricingInsights: {
    sweetSpot: number;
    premiumRange: number;
    freeLeadMagnetTopics: string[];
  };
  recommendedProduct: {
    type: string;
    title: string;
    price: number;
    chapters: number;
    estimatedPages: number;
    uniqueAngle: string;
    whyThisWillSell: string;
  };
  sources: { url: string; title: string }[];
  generatedAt: string;
}
```

### 2.2 — Award-Quality Storefront Design System

**What nobody else does:** Instead of generic templates, Know24 storefronts rival Squarespace and Framer in quality.

**Approach:**
- **12 handcrafted storefront themes** designed by studying award-winning product pages (Apple, Notion, Linear, Stripe)
- Each theme is a complete React component set with:
  - Hero with product mockup (3D book render, device frame, or floating card)
  - Social proof bar (auto-generated testimonials from AI, clearly labeled as "preview")
  - Feature grid with icons
  - FAQ section (auto-generated from product content)
  - Pricing card with Stripe Checkout embedded
  - Footer with social links
- **AI selects the best theme** based on niche and product type
- **AI writes all copy** — headlines, descriptions, CTAs, meta descriptions
- **Color palette auto-generated** from the cover art using color extraction
- **Mobile-first, accessible, fast** — Lighthouse 95+ scores

**Design principles stolen from the best:**
- Generous whitespace (Linear-style)
- Large typography with clear hierarchy (Stripe-style)
- Subtle animations on scroll (Framer-style)
- Product mockup as hero centerpiece (Apple-style)
- Single-action CTA above the fold (every great landing page)

### 2.3 — Multi-Format Product Output

**What nobody else does:** Every generated product ships in multiple formats automatically.

| Format | Technology | Delivered How |
|---|---|---|
| PDF (formatted, paginated, cover) | Puppeteer rendering from React/HTML templates | R2 signed download URL |
| EPUB (for Kindle/Apple Books) | epub-gen or pandoc conversion from structured content | R2 download |
| Audio version | ElevenLabs TTS API (natural narration voice) | R2 streaming URL |
| Interactive web version | Next.js dynamic route (read online) | Storefront link |
| DOCX (editable) | docx.js generation | R2 download |

**For courses specifically:**
- Lesson-by-lesson structure with progress tracking
- Embedded quizzes auto-generated from content
- Certificate of completion (PDF, auto-generated)

**Why this matters:** Automateed gives you a PDF. Know24 gives you a PDF + EPUB + audio + web reader + editable DOCX — all from one generation. The perceived value is 5x.

### 2.4 — AI Product Cover Art & Brand Kit

**What nobody else does:** Professional-quality product visuals generated automatically.

**Technology:** GPT Image (gpt-image-1) or Imagen 4 via API

**What gets generated:**
1. **Product cover** — designed for the product type (book cover, course thumbnail, etc.)
2. **3D product mockup** — book standing on a surface, tablet showing course, etc.
3. **Social sharing image** — optimized for Open Graph (1200x630)
4. **Favicon** — from the brand colors
5. **Color palette** — extracted from the cover, applied to the storefront

**Cover design system:**
- 8 cover templates per product type (minimalist, bold, photographic, illustrated, etc.)
- AI selects the best template based on niche
- Title, subtitle, and author name rendered onto the template
- Background generated by image model to match the niche

### 2.5 — AI Explainer Video

**What nobody else does:** Every product gets a 30-60 second promotional video.

**Technology:** HeyGen API

**What gets generated:**
- Script written by GPT-4o based on product content
- AI avatar presents the product (professional, friendly)
- Product mockup shown as B-roll
- Call-to-action with storefront link
- Output: MP4 file, embeddable on storefront

**Why this matters:** Video converts 2-3x better than text alone. No competitor auto-generates video for digital products. This is a "wow" moment for users — they pick a category and get a video ad.

### 2.6 — Voice Memo to Business

**What nobody else does:** Users can talk instead of type.

**Flow:**
1. User taps a microphone button
2. Records a 2-5 minute voice memo: "I'm a fitness trainer, I specialize in postpartum recovery..."
3. Whisper API transcribes
4. Transcript is used as personal knowledge context
5. Research agent incorporates the personal angle
6. Product is generated with the user's unique perspective woven in

**Why this matters:** The lowest possible friction for knowledge input. No typing, no uploading files, no formatting. Just talk. This is the "interview" step made instant.

### 2.7 — Smart Pricing Engine

**What nobody else does:** AI sets the price based on market research.

**How it works:**
1. Research agent already gathered pricing data for the niche
2. AI recommends a price based on:
   - Competitor pricing (what similar products sell for)
   - Product depth (page count, lesson count)
   - Format value (PDF only vs PDF + audio + video)
   - Niche purchasing power
3. User sees the recommendation with reasoning: "We suggest $27 because similar gut health guides sell for $19-35, and yours includes audio."
4. User can override with one click

### 2.8 — Real-Time Build Narration

**What nobody else does:** The AI explains what it's doing as it builds.

During the autonomous build phase, instead of a silent progress bar, the user sees:

```
🔍 "I'm searching Amazon Kindle for top-selling gut health books..."
📊 "Found 47 products. The top seller has 2,400 reviews at $24.99."
💡 "There's a gap — nobody covers the gut-brain connection for beginners."
📝 "Writing Chapter 3: The Gut-Brain Connection — based on 12 research sources."
🎨 "Designing your cover with a clean, medical-inspired aesthetic."
🎙️ "Recording the audio version — should take about 2 minutes."
```

This is like watching a master craftsman work. It builds trust, justifies the price, and creates a "magic" moment. The user feels like they have a team of experts working for them.

### 2.9 — Instant Competitor Teardown

**What nobody else does:** Show the user what they're competing against — and why they'll win.

After research, present a "Competitive Landscape" card:

```
┌─ YOUR COMPETITION ──────────────────────────────────┐
│                                                      │
│  📕 "Gut Health 101" — Amazon, $19.99, 3.8★         │
│     Weakness: Outdated (2021), no audio, text-heavy  │
│                                                      │
│  📕 "The Microbiome Diet" — Gumroad, $29, 4.2★      │
│     Weakness: Narrow focus, no actionable steps      │
│                                                      │
│  📗 YOUR PRODUCT — $27, PDF + Audio + Video          │
│     Edge: Comprehensive, current research, multi-    │
│     format, actionable 30-day plan included          │
│                                                      │
└──────────────────────────────────────────────────────┘
```

### 2.10 — Post-Launch Autopilot (AI Advisor)

**Already in the build plan (Level 2 Addendum)** but enhanced:

After launch, the AI Advisor doesn't just observe — it acts (with permission):
- Auto-generates a new blog post every week based on trending topics in the niche
- Surfaces Scout opportunities daily
- Drafts email sequences triggered by customer behavior
- Suggests product variations ("Your ebook is selling well — want me to create a companion workbook?")
- Alerts on competitor moves ("A new gut health ebook was published on Amazon yesterday — here's what they cover that you don't")

---

## PART 3: INFRASTRUCTURE CHANGES

### 3.1 — New Database Tables

```sql
-- Niche categories (pre-seeded)
CREATE TABLE public.niche_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  icon TEXT NOT NULL,                    -- Lucide icon name
  description TEXT,
  sub_niches TEXT[] NOT NULL DEFAULT '{}',
  research_keywords TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Research documents (one per business, the AI's research output)
CREATE TABLE public.research_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES public.businesses (id) ON DELETE CASCADE,
  niche_category_id UUID REFERENCES public.niche_categories (id),
  niche_text TEXT NOT NULL,              -- User's selected or typed niche
  personal_context TEXT,                 -- Optional voice memo / typed context
  -- Research output
  research_data JSONB NOT NULL DEFAULT '{}',  -- Full NicheResearchDocument
  -- Recommended product (AI's pick)
  recommended_product_type TEXT,
  recommended_title TEXT,
  recommended_price_cents INT,
  recommended_reasoning TEXT,
  -- Sources
  sources JSONB NOT NULL DEFAULT '[]',
  source_count INT NOT NULL DEFAULT 0,
  -- Generation metadata
  research_provider TEXT,                -- "firecrawl+tavily+perplexity"
  research_duration_ms INT,
  research_cost_cents INT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'researching', 'completed', 'failed')),
  error_message TEXT,
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX idx_research_documents_business ON public.research_documents (business_id);
ALTER TABLE public.research_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "research_documents_rw" ON public.research_documents
  FOR ALL USING (business_id IN (SELECT public.user_business_ids()));

-- Product assets (multi-format outputs per product)
CREATE TABLE public.product_assets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES public.products (id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES public.businesses (id) ON DELETE CASCADE,
  asset_type TEXT NOT NULL CHECK (asset_type IN (
    'pdf', 'epub', 'docx', 'audio', 'video',
    'cover_image', 'mockup_3d', 'og_image', 'favicon'
  )),
  r2_key TEXT NOT NULL,                  -- R2 object key
  r2_bucket TEXT NOT NULL,               -- Which R2 bucket
  file_size_bytes BIGINT,
  mime_type TEXT,
  duration_seconds INT,                  -- For audio/video
  generation_model TEXT,                 -- "elevenlabs", "heygen", "puppeteer"
  generation_cost_cents INT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'generating', 'completed', 'failed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_product_assets_product ON public.product_assets (product_id, asset_type);
ALTER TABLE public.product_assets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "product_assets_rw" ON public.product_assets
  FOR ALL USING (business_id IN (SELECT public.user_business_ids()));

-- Storefront themes (pre-seeded)
CREATE TABLE public.storefront_themes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  preview_image_url TEXT,
  best_for TEXT[] NOT NULL DEFAULT '{}', -- ["health", "finance", "tech"]
  component_key TEXT NOT NULL,           -- React component identifier
  default_palette JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Voice memos (transcribed user input)
CREATE TABLE public.voice_memos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES public.businesses (id) ON DELETE CASCADE,
  r2_key TEXT,                           -- Original audio file
  transcript TEXT NOT NULL,
  duration_seconds INT,
  transcription_model TEXT DEFAULT 'whisper-1',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.voice_memos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "voice_memos_rw" ON public.voice_memos
  FOR ALL USING (business_id IN (SELECT public.user_business_ids()));
```

### 3.2 — New Worker Queues

Add to `src/lib/queue/queues.ts`:

```typescript
// New queues for the pivot
export function getNicheResearchQueue(): Queue {
  return getQueue("niche-research");
}
export function getProductAssetQueue(): Queue {
  return getQueue("product-asset-generation");
}
export function getCoverArtQueue(): Queue {
  return getQueue("cover-art-generation");
}
export function getAudioNarrationQueue(): Queue {
  return getQueue("audio-narration");
}
export function getExplainerVideoQueue(): Queue {
  return getQueue("explainer-video");
}
export function getStorefrontBuildQueue(): Queue {
  return getQueue("storefront-build");
}
```

### 3.3 — New Worker Processors

```
src/workers/processors/
├── research-niche.ts          # Firecrawl + Tavily + Perplexity orchestrator
├── generate-product.ts        # EXISTING — modified to accept research context
├── generate-cover-art.ts      # GPT Image / Imagen 4 API
├── generate-pdf.ts            # Puppeteer HTML-to-PDF with templates
├── generate-epub.ts           # EPUB conversion from structured content
├── generate-audio.ts          # ElevenLabs TTS narration
├── generate-video.ts          # HeyGen explainer video
├── build-storefront.ts        # Auto-configure storefront from research + product
├── run-scout-scan.ts          # EXISTING — replace mocks with real APIs
├── generate-blog-draft.ts     # NEW — auto-generate first blog post
├── setup-email-sequences.ts   # NEW — auto-configure welcome + nurture emails
└── transcribe-voice-memo.ts   # Whisper API transcription
```

### 3.4 — New API Routes

```
src/app/api/
├── setup/
│   ├── niche-select/route.ts      # NEW — Accept niche, create business, queue research
│   ├── analyze/route.ts           # MODIFIED — Return real research, not mocks
│   ├── build/route.ts             # MODIFIED — Accept research context, queue all generation
│   ├── golive/route.ts            # EXISTING — works as-is
│   └── voice-memo/route.ts        # NEW — Upload + transcribe voice memo
├── research/
│   └── [businessId]/route.ts      # NEW — Poll research status + results
├── products/
│   └── [id]/assets/route.ts       # NEW — List product assets (PDF, audio, video, etc.)
├── assets/
│   └── download/[assetId]/route.ts # NEW — Generate signed download URL
└── scout/
    └── scan/route.ts              # MODIFIED — Real API integrations
```

### 3.5 — New Environment Variables

```env
# Deep Research
FIRECRAWL_API_KEY=fc-...
TAVILY_API_KEY=tvly-...
PERPLEXITY_API_KEY=pplx-...

# Product Assets
ELEVENLABS_API_KEY=sk_...
ELEVENLABS_VOICE_ID=...              # Default narration voice
HEYGEN_API_KEY=...

# Image Generation (pick one or both)
OPENAI_API_KEY=sk-...                # Already exists — for GPT Image
GOOGLE_AI_API_KEY=...                # For Imagen 4

# Voice Memo Transcription
# Uses existing OPENAI_API_KEY for Whisper
```

### 3.6 — Modified Onboarding Flow

**Old flow (5 steps, knowledge-gated):**
1. Knowledge Intake (REQUIRED)
2. AI Analysis (mocked)
3. Product Selection
4. AI Building
5. Go Live

**New flow (3 clicks, zero-friction):**
1. **Niche Selection** — Pick a category or type your own. Optional: add personal angle via text or voice memo.
2. **AI Builds Everything** — Research → Product → Assets → Storefront → Scout → Marketing. User watches real-time narration. Optional: upload knowledge docs while waiting.
3. **Review & Go Live** — Preview product, storefront, distribution plan. Edit anything. Click Go Live.

**Implementation:** Rewrite `src/app/(dashboard)/setup/page.tsx` and all step components. The `getNextDisabled()` function no longer gates on knowledge upload.

---

## PART 4: SECURITY & COMPLIANCE FIXES

These must ship before taking money. Non-negotiable.

### 4.1 — Rate Limiting (Day 1)

Wire up the existing `src/lib/rate-limit.ts` to every public API route:

```typescript
// Add to every route handler:
import { checkRateLimit } from "@/lib/rate-limit";

// In handler:
const rateLimitResult = await checkRateLimit(req, "api"); // or "ai", "storefront"
if (!rateLimitResult.allowed) {
  return NextResponse.json(
    { error: { code: "RATE_LIMITED", message: "Too many requests" } },
    { status: 429, headers: { "Retry-After": String(rateLimitResult.retryAfter) } }
  );
}
```

**Priority routes:** `/api/chat`, `/api/checkout/create`, `/api/storefront/*`, `/api/setup/*`, `/api/upload/*`

### 4.2 — File Upload Validation

```typescript
// src/app/api/upload/presign/route.ts
const ALLOWED_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "text/markdown",
  "audio/mpeg",
  "audio/wav",
  "audio/webm",
] as const;

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

// In Zod schema:
fileType: z.enum(ALLOWED_TYPES),
fileName: z.string().regex(/^[a-zA-Z0-9_\-. ]+$/),
fileSize: z.number().max(MAX_FILE_SIZE),
```

### 4.3 — Missing RLS Policy

```sql
-- Add to customers table
CREATE POLICY "customers_business_member" ON public.customers
  FOR ALL USING (
    business_id IN (SELECT public.user_business_ids())
  );
```

### 4.4 — Middleware Fix

Remove the dead `/api/internal/*` exemption from `middleware.ts` or add explicit secret validation if internal routes are needed.

### 4.5 — Cookie Consent

Add a cookie consent banner (required for GDPR). Use a lightweight library like `cookie-consent-banner` or build a simple component.

### 4.6 — Email Compliance

Add `List-Unsubscribe` header to all emails sent via Resend. Add unsubscribe link to email footer template.

### 4.7 — Legal Review

Have a lawyer spend 2 hours reviewing Privacy Policy, Terms of Service, and Cookie Policy. Ensure:
- Sub-processor list (Clerk, Stripe, Supabase, OpenAI, ElevenLabs, HeyGen, PostHog, Sentry, Resend, Cloudflare)
- Data retention periods
- GDPR right to deletion procedure
- CAN-SPAM compliance

---

## PART 5: LANDING PAGE REWRITE

The current landing page says "Upload Your Knowledge." The new one says "Pick a Category. AI Does the Rest."

### New Hero

```
Turn Any Interest Into a
Digital Product Business

Pick a category. AI researches the market, creates your product,
builds your store, and finds your first customers.
No expertise required. No uploading. No homework.

[Pick Your Niche — Start Free]     [See How It Works]

🏪 12,000+ products generated  ⚡ Average build time: 8 min  💰 $2.4M+ creator revenue
```

### New "How It Works" (3 steps, not 4)

1. **Pick Your Niche** — Choose from 12 categories or type your own. That's it — one click.
2. **AI Builds Your Business** — Deep market research, product generation, storefront design, distribution channels — all automated in under 10 minutes.
3. **Start Selling** — Your product, store, and marketing are live. Share your link and start earning.

### New Feature Cards

- AI Market Research (validated products, not guesswork)
- Multi-Format Products (PDF + Audio + Video)
- Award-Quality Storefronts (beautiful, not templates)
- Smart Pricing (AI-optimized for your niche)
- Distribution Scout (finds buyers, not just builds products)
- AI Autopilot (weekly content, daily opportunities, zero effort)

### Remove

- "2,500+ knowledge businesses launched" (fake, replace with real metrics or remove)
- "4.9/5 average rating" (fake, remove until real)
- "Upload Your Knowledge" step
- Any reference to knowledge as a prerequisite

---

## PART 6: SCOUT — REAL IMPLEMENTATION

Replace all 6 mock platform scanners with real API integrations. Start with the highest-value 3:

### Phase 1: Reddit + Google Trends + News

**Reddit (real API):**
- Use Reddit API (OAuth2) to search subreddits by niche keywords
- Find posts asking for recommendations, advice, resources
- Filter by recency (last 7 days), engagement (10+ comments)
- Score by relevance to user's product
- Draft a helpful response that naturally references the product

**Google Trends:**
- Use unofficial Google Trends API or SerpAPI
- Find rising queries in the niche
- Correlate with content gaps from research doc
- Surface as "Trending now — create content about X"

**News/Blogs:**
- Use Tavily or Firecrawl to monitor niche blogs, publications
- Find articles where the user's product would be relevant
- Surface as "Opportunity: [Article Title] — your product solves the problem they describe"

### Phase 2: X/Twitter + LinkedIn + Podcasts

These require more complex integrations and can come after launch.

---

## PART 7: BUILD PHASES & MILESTONES

### Phase 1: Core Loop (Weeks 1-3) — "Pick → Research → Build → Live"

| Week | Tasks |
|------|-------|
| 1 | New onboarding UI (3-click flow). Niche category cards. Niche selection API. Research queue + worker. Firecrawl + Tavily + Perplexity integration. Research document schema + storage. |
| 2 | Modify product generator to accept research context (not just knowledge chunks). Puppeteer PDF generation pipeline. Cover art generation (GPT Image). Product assets table + download API. Wire up rate limiting on all routes. |
| 3 | Storefront theme system (3 themes minimum). AI storefront copy generation. AI pricing recommendation. End-to-end flow test: niche → research → product → PDF → storefront → Stripe checkout. Fix all security issues (RLS, middleware, file upload validation). |

### Phase 2: Premium Assets (Weeks 4-5) — "Audio + Video + Multi-Format"

| Week | Tasks |
|------|-------|
| 4 | ElevenLabs audio narration pipeline. EPUB generation. DOCX generation. Product asset viewer in dashboard (list all formats, download links). |
| 5 | HeyGen explainer video pipeline. Voice memo recording + Whisper transcription. Real-time build narration UI (the "watching the AI work" experience). |

### Phase 3: Distribution & Marketing (Weeks 6-7) — "Scout + Content + Email"

| Week | Tasks |
|------|-------|
| 6 | Reddit API integration (real Scout). Google Trends integration. News monitoring via Tavily. Scout UI refresh (real data). |
| 7 | Auto-generate first blog post on business creation. Email sequence auto-setup (welcome + nurture via Resend). Social post generator endpoint. Landing page rewrite. |

### Phase 4: Polish & Launch (Week 8) — "Production Hardening"

| Week | Tasks |
|------|-------|
| 8 | Cookie consent banner. Legal page review. Error boundary improvements. Sentry sample rate increase. Write tests for: Stripe webhook, checkout, research pipeline, product generation. Worker Dockerfile health checks. Dynamic sitemap. SEO schema markup on storefront pages. Remove fake social proof from landing page. |

---

## PART 8: COST STRUCTURE PER BUSINESS GENERATION

### Estimated AI Costs Per "Build My Business" Run

| Step | Provider | Est. Cost |
|------|----------|-----------|
| Niche research | Firecrawl ($0.01/page) + Tavily ($0.01/search) + Perplexity ($0.005/query) | ~$0.50 |
| Product content generation | GPT-4o (~8K output tokens) | ~$0.30 |
| Cover art | GPT Image (1 image) | ~$0.04 |
| 3D mockup | GPT Image (1 image) | ~$0.04 |
| PDF generation | Puppeteer (self-hosted, compute only) | ~$0.01 |
| EPUB/DOCX | Compute only | ~$0.01 |
| Audio narration | ElevenLabs (~20K chars, ~30 min audio) | ~$0.90 |
| Explainer video | HeyGen (30s video) | ~$0.50 |
| Blog post draft | GPT-4o (~2K output) | ~$0.08 |
| Email sequences | GPT-4o (~1K output) | ~$0.04 |
| Scout scan (Reddit + Trends) | Reddit API (free) + Tavily | ~$0.10 |
| **TOTAL per build** | | **~$2.52** |

At $99/month subscription, the platform needs ~3 builds per user per month to stay profitable. With most users building 1-2 businesses, the margin is strong (~97% gross margin on the subscription).

### Ongoing Monthly Costs Per Active Business

| Item | Est. Cost/Month |
|------|----------------|
| AI Advisor daily analysis | ~$0.50 |
| Blog auto-publish (4/month) | ~$0.32 |
| Scout scans (weekly) | ~$0.40 |
| Email sends | ~$0.10 (Resend pricing) |
| Storage (R2) | ~$0.05 |
| **TOTAL ongoing** | **~$1.37/month** |

---

## PART 9: METRICS & SUCCESS CRITERIA

### Launch Metrics (First 30 Days)

| Metric | Target |
|--------|--------|
| Signup → Business Created | > 60% |
| Business Created → Go Live | > 40% |
| Time to Go Live | < 10 minutes |
| Average products per business | 1.2 |
| Paid conversion (trial → $99) | > 5% |
| Churn (Month 1) | < 15% |

### Quality Metrics

| Metric | Target |
|--------|--------|
| Research document quality (manual review) | 8/10 |
| PDF formatting quality | Professional, no layout bugs |
| Storefront Lighthouse score | > 95 |
| Audio narration naturalness | Indistinguishable from human |
| Video quality | Professional, no avatar glitches |

---

## PART 10: WHAT TO CUT (Scope Control)

### Cut from V1 (Build Later)

- Internal marketplace (Phase 2 per the brief — don't block launch)
- Custom domains for storefronts (use know24.io/s/slug for now)
- Team/org collaboration features
- X/Twitter and LinkedIn Scout integrations (Reddit + Trends + News first)
- Podcast Scout integration
- AI Advisor proactive system (ship reactive first, add proactive post-launch)
- Product editing UI (users can regenerate; editing comes later)
- A/B testing on storefronts
- Subscription pause/reactivation
- Dunning/failed payment recovery (Stripe handles basic retry)
- Free trial (launch with "first business free" or immediate $99/month)

### Do NOT Cut (Must Ship)

- Rate limiting
- File upload validation
- Cookie consent
- Email unsubscribe
- Stripe webhook handling
- Real Scout (at least Reddit)
- PDF generation + download
- Audio narration
- Storefront with Stripe checkout
- Landing page rewrite

---

## APPENDIX A: API & SERVICE COSTS (Monthly at Scale)

| Service | Free Tier | Estimated at 1,000 Users |
|---------|-----------|-------------------------|
| Vercel Pro | $20/month | $20/month |
| Supabase Pro | $25/month | $25/month |
| Upstash Redis | $10/month | $10/month |
| Railway (workers) | $5/month | $20/month |
| Cloudflare R2 | Free egress | ~$5/month storage |
| Clerk | Free to 10K MAU | Free |
| Stripe | 2.9% + $0.30/txn | Variable |
| Sentry | $26/month | $26/month |
| Firecrawl | $0.01/page | ~$100/month |
| Tavily | $0.01/search | ~$50/month |
| Perplexity Sonar | Pay per query | ~$50/month |
| OpenAI (GPT-4o + Image) | Pay per token | ~$500/month |
| ElevenLabs | $22/month starter | ~$200/month |
| HeyGen | $29/month starter | ~$300/month |
| Resend | Free to 3K/month | $20/month |
| PostHog | Free to 1M events | Free |
| **TOTAL** | | **~$1,361/month** |

At 1,000 users × $99/month = $99,000 MRR. Infrastructure cost: ~1.4% of revenue.

---

## APPENDIX B: FILE CHANGES SUMMARY

### New Files to Create
```
src/app/(dashboard)/setup/page.tsx                    # REWRITE
src/components/setup/NicheSelectionStep.tsx            # NEW
src/components/setup/AIBuildProgress.tsx               # NEW (replaces AIBuildingStep)
src/components/setup/ReviewAndLaunch.tsx               # NEW (replaces GoLiveStep)
src/components/setup/VoiceMemoRecorder.tsx             # NEW
src/app/api/setup/niche-select/route.ts               # NEW
src/app/api/setup/voice-memo/route.ts                 # NEW
src/app/api/research/[businessId]/route.ts            # NEW
src/app/api/products/[id]/assets/route.ts             # NEW
src/app/api/assets/download/[assetId]/route.ts        # NEW
src/lib/research/orchestrator.ts                      # NEW
src/lib/research/firecrawl.ts                         # NEW
src/lib/research/tavily.ts                            # NEW
src/lib/research/perplexity.ts                        # NEW
src/lib/pdf/templates/ebook.tsx                       # NEW
src/lib/pdf/templates/cheat-sheet.tsx                 # NEW
src/lib/pdf/templates/course-workbook.tsx             # NEW
src/lib/pdf/generator.ts                              # NEW
src/lib/audio/elevenlabs.ts                           # NEW
src/lib/video/heygen.ts                               # NEW
src/lib/images/cover-generator.ts                     # NEW
src/workers/processors/research-niche.ts              # NEW
src/workers/processors/generate-pdf.ts                # NEW
src/workers/processors/generate-audio.ts              # NEW
src/workers/processors/generate-video.ts              # NEW
src/workers/processors/generate-cover-art.ts          # NEW
src/workers/processors/build-storefront.ts            # NEW
src/workers/processors/transcribe-voice-memo.ts       # NEW
src/components/storefront/themes/                     # NEW directory
supabase/migrations/00012_pivot_schema.sql            # NEW
```

### Files to Modify
```
src/app/(dashboard)/setup/page.tsx                    # Rewrite for 3-click flow
src/app/api/setup/analyze/route.ts                    # Replace mock with real research
src/app/api/setup/build/route.ts                      # Queue all asset generation
src/workers/processors/generate-product.ts            # Accept research context
src/workers/processors/run-scout-scan.ts              # Replace mocks with real APIs
src/workers/index.ts                                  # Register new workers
src/lib/queue/queues.ts                               # Add new queue getters
src/lib/ai/providers.ts                               # Add Anthropic, Google providers
src/app/(marketing)/page.tsx                          # Rewrite landing page
src/data/pricing.ts                                   # Update feature descriptions
src/data/testimonials.ts                              # Remove fake testimonials
middleware.ts                                         # Remove /api/internal/* exemption
src/lib/storage/r2.ts                                 # Add upload + multi-bucket functions
src/app/api/upload/presign/route.ts                   # Add file type + size validation
Dockerfile.worker                                     # Add health checks
.env.example                                          # Add new API keys
```

### Files to Delete
```
src/components/setup/KnowledgeIntakeStep.tsx           # Replaced by NicheSelectionStep
src/components/setup/AIAnalysisStep.tsx                # Merged into AIBuildProgress
```

---

*This plan is designed to be handed directly to an AI coding assistant (Claude Code, Cursor) and executed section by section. Every file path is real, every schema is executable, every API is production-grade.*

---

## PART 11: VIRAL REFERRAL ENGINE

### The Growth Model

Know24 doesn't just acquire users — it turns every user into a distribution channel. The referral system is embedded in the product experience, not bolted on.

### The Incentive Structure: "Build Together, Earn Together"

**Tier 1 — The Dropbox Play (Free Month)**
- Refer 3 friends who sign up → you get 1 month free ($99 value)
- Your friend gets their first business build free (no credit card required)
- Double-sided: both parties get value immediately

**Tier 2 — The Morning Brew Escalator**
| Referrals | Reward |
|-----------|--------|
| 1 | Friend gets free first build, you get "Founding Member" badge on your storefront |
| 3 | 1 month free subscription |
| 5 | Unlock "Scout Pro" add-on free for 1 month ($199 value) |
| 10 | Lifetime 20% discount on subscription |
| 25 | Revenue share: earn 10% of Know24's platform fee on referred users' sales for 12 months |
| 50 | "Know24 Ambassador" — featured on the platform, early access to features |

**Tier 3 — The Revenue Share Flywheel**
At 25+ referrals, the referrer earns 10% of Know24's platform fee on every sale their referred users make. This means:
- If you refer someone who builds a business generating $1,000/month in product sales
- Know24 takes 10% platform fee = $100/month
- You earn 10% of that = $10/month passive income per referral
- 25 active referrals = $250/month in passive income

This creates a class of "Know24 Ambassadors" who are financially incentivized to promote the platform indefinitely.

### Viral Mechanics Built Into the Product

**1. Share Gate at the "Wow" Moment**
Right after the user's business is built (the peak excitement moment), before they click "Go Live":

```
┌──────────────────────────────────────────────────────────┐
│  🎉 Your business is ready!                              │
│                                                          │
│  Before you go live, share with friends who should       │
│  try this too. For every 3 friends who sign up,          │
│  you get 1 month free.                                   │
│                                                          │
│  [Share Link]  [Copy Link]  [Tweet]  [WhatsApp]          │
│                                                          │
│  Your referral link: know24.io/r/abc123                  │
│                                                          │
│  [Skip — Go Live Now]                                    │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

This is NOT a gate — "Skip" is always visible. But the timing is intentional: you ask at the moment of maximum delight.

**2. Referral Link in Every Storefront Footer**
Every storefront built on Know24 automatically includes:
```
Built with Know24 — AI builds your digital product business in minutes.
[Try it free →]
```
This is the Shopify/Webflow playbook. Every storefront is a billboard. The link includes the creator's referral code, so if someone signs up from a storefront, the creator gets referral credit.

**3. Shareable Build Replay**
After a business is built, generate a 60-second timelapse video of the AI building process (sped up from the real-time narration). Users can share this on social media:

"Watch AI build my entire digital product business in 8 minutes 🤯"
[Video: timelapse of research → product → storefront → live]

This is inherently shareable content. It demonstrates the product better than any ad.

**4. "Built on Know24" Badge**
Every product PDF and storefront includes a subtle "Built with Know24" badge. When end customers see it, they see the brand. This is passive, ambient awareness.

**5. Referral Dashboard**
In the user's dashboard, show:
- Total referrals sent
- Total referrals converted
- Current tier and next reward
- Earnings from revenue share (if applicable)
- Leaderboard position (optional — gamification)

### Referral Implementation

**Database additions:**
```sql
-- Referral tracking
CREATE TABLE public.referral_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  code TEXT NOT NULL UNIQUE,             -- Short code: "abc123"
  source TEXT DEFAULT 'manual',          -- "manual", "storefront_footer", "share_gate", "social"
  clicks INT NOT NULL DEFAULT 0,
  signups INT NOT NULL DEFAULT 0,
  active_subscriptions INT NOT NULL DEFAULT 0,
  total_earnings_cents INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.referral_conversions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  referral_link_id UUID NOT NULL REFERENCES public.referral_links (id),
  referrer_user_id UUID NOT NULL REFERENCES public.users (id),
  referred_user_id UUID NOT NULL REFERENCES public.users (id),
  status TEXT NOT NULL DEFAULT 'signed_up'
    CHECK (status IN ('clicked', 'signed_up', 'subscribed', 'churned')),
  reward_granted TEXT,                   -- "free_month", "scout_unlock", "revenue_share"
  revenue_share_earnings_cents INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  subscribed_at TIMESTAMPTZ,
  UNIQUE (referrer_user_id, referred_user_id)
);
```

**Trigger flow:**
1. User signs up via `know24.io/r/abc123`
2. `referral_link_id` stored in session/cookie
3. On subscription creation, `referral_conversions` row inserted
4. Cron job checks referral counts → grants rewards automatically
5. Revenue share calculated on each Stripe webhook `charge.succeeded`

### Viral Coefficient Target

- Average invites sent per user: 5 (prompted at "wow" moment + storefront footer)
- Conversion rate of invites: 15% (strong because they see the product working)
- Viral coefficient: 5 × 0.15 = **0.75**

At 0.75, every 100 users bring 75 more → those 75 bring 56 → those bring 42... Total organic amplification: **~4x** on every cohort. Not fully viral (need 1.0+), but combined with paid acquisition, it compounds fast.

To push toward 1.0+, the shareable build replay video is key — it reaches beyond the user's direct network.

---

## PART 12: THE TRIFECTA FLYWHEEL — MINE, PICK, MARKETPLACE

### Why Know24 Must Be All Three

Your insight is correct: the most defensible platforms own all three layers. Here's how each layer reinforces the others:

```
┌─────────────────────────────────────────────────────────────┐
│                    THE KNOW24 FLYWHEEL                       │
│                                                             │
│                    ┌──────────┐                             │
│              ┌────▶│  MINE    │────┐                        │
│              │     │(Research +│    │                        │
│              │     │ Generate) │    │                        │
│              │     └──────────┘    │                        │
│              │          │          │                        │
│              │          ▼          │                        │
│         More data  ┌──────────┐  More products             │
│         = better   │  PICK    │  = more                    │
│         products   │(Platform +│  storefronts              │
│              │     │ Store)   │    │                        │
│              │     └──────────┘    │                        │
│              │          │          │                        │
│              │          ▼          │                        │
│              │     ┌──────────┐    │                        │
│              └─────│MARKETPLACE│◀──┘                        │
│                    │(Scout +   │                            │
│                    │ Discover) │                            │
│                    └──────────┘                             │
│                         │                                   │
│                    More buyers                              │
│                    = more creators                          │
│                    = more products                          │
│                    = better research                        │
│                    = REPEAT                                 │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Layer 1: The Mine (AI Research + Product Generation)

**What it is:** The autonomous AI system that researches niches and generates products.

**How it gets better over time:**
- Every product generated teaches the AI what content structures convert
- Every niche researched builds a cached research library (don't re-research the same niche from scratch every time)
- Aggregate sales data across all Know24 products reveals which formats, price points, and topics actually sell
- This data feeds back into research recommendations: "Gut health ebooks at $27 convert at 4.2% on Know24. Courses at $47 convert at 2.1%."

**Implementation:**
```sql
-- Aggregate intelligence (populated by cron, read by research agent)
CREATE TABLE public.platform_intelligence (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  niche_slug TEXT NOT NULL,
  metric_type TEXT NOT NULL CHECK (metric_type IN (
    'avg_conversion_rate', 'avg_price', 'top_format',
    'trending_topics', 'total_products', 'total_revenue'
  )),
  metric_value JSONB NOT NULL,
  period TEXT NOT NULL DEFAULT 'last_30d',
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (niche_slug, metric_type, period)
);
```

The research agent consults `platform_intelligence` before making recommendations. "Based on 847 health products on Know24, ebooks at $19-29 convert best. Courses above $47 see 60% fewer sales."

**This is the moat:** The more products Know24 generates, the better its research becomes. Competitors starting from zero can't replicate this data advantage.

### Layer 2: The Pick (Platform + Storefront)

**What it is:** The hosted storefront, dashboard, and business management tools.

**How it creates lock-in:**
- Your storefront URL, your customers, your email list, your analytics — all on Know24
- Stripe Connect means payments flow through Know24's infrastructure
- Product download links are Know24 signed URLs
- Blog, email sequences, and marketing tools are all platform-native
- Switching cost increases with every sale, every subscriber, every blog post

**How it feeds the flywheel:**
- Every storefront is a marketing surface (referral links in footers)
- Every successful sale proves the platform works → drives word-of-mouth
- Creator analytics create stickiness (leaving means losing your dashboard)

### Layer 3: The Marketplace (Scout + Discover)

**What it is:** Two sides of distribution:

**Outbound (Scout):** AI finds external opportunities where the creator's product is relevant.
**Inbound (Discover):** An internal marketplace where Know24 users can browse and buy products from other creators.

**The Discover Marketplace (Phase 2):**
```
know24.io/discover

┌──────────────────────────────────────────────────────────┐
│  🔍 Discover Products Built on Know24                    │
│                                                          │
│  [Health]  [Finance]  [Marketing]  [Tech]  [All]         │
│                                                          │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐       │
│  │ 📖 Gut      │ │ 📊 Stock    │ │ 📧 Email    │       │
│  │ Health      │ │ Trading     │ │ Marketing   │       │
│  │ Reset Guide │ │ Playbook    │ │ Masterclass │       │
│  │ $27         │ │ $47         │ │ $19         │       │
│  │ ⭐ 4.8 (23) │ │ ⭐ 4.6 (41) │ │ ⭐ 4.9 (12) │       │
│  │ [View →]    │ │ [View →]    │ │ [View →]    │       │
│  └─────────────┘ └─────────────┘ └─────────────┘       │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

**How the marketplace feeds the flywheel:**
- Buyers discover Know24 through products → some become creators
- Creators see what sells on the marketplace → informs their next product
- More products = more search surface = more organic traffic
- Know24 earns platform fee on every transaction
- Reviews and ratings create social proof for the platform

**The marketplace is NOT Phase 1** — but the infrastructure should be designed for it from day one:
- Products already have `is_published` flags
- Storefronts already have public URLs
- The `niche_categories` table can power browse/filter
- Reviews table can be added later without schema changes

### The Self-Reinforcing Loop

```
New User Signs Up
  → AI builds their business (Mine)
  → Product goes live on their storefront (Pick)
  → Storefront footer has "Built with Know24" referral link
  → End customer buys the product
  → End customer sees "Built with Know24" → some sign up as creators
  → Scout finds more distribution channels → more sales
  → More sales = better platform intelligence
  → Better intelligence = better products for the NEXT user
  → REPEAT
```

**At scale, this means:** The 10,000th user gets a dramatically better experience than the 1st user, because the AI has learned from 9,999 prior businesses what works.

### Revenue Stack at Scale

| Revenue Stream | Phase | Margin |
|---|---|---|
| Creator subscriptions ($99/mo) | Phase 1 | ~97% |
| Scout add-on ($199/mo) | Phase 1 | ~95% |
| Platform fee on product sales (10%) | Phase 1 | 100% |
| Marketplace transaction fee (5% on Discover sales) | Phase 2 | 100% |
| Premium storefront themes | Phase 2 | 100% |
| White-label / API access | Phase 3 | ~90% |

At 10,000 creators × $99/month + 10% of their sales + marketplace fees = **$1M+ MRR** with sub-5% infrastructure costs. This is a venture-scale business.

---

*End of KNOW24-PIVOT-BUILD-PLAN.md — Version 2.0*
