# Know24 — Pivot Build Plan: Decision Log

**Started:** March 12, 2026
**Purpose:** Document every critical decision in the pivot from "upload your knowledge" to "AI product factory." This is the comprehensive walkthrough of every step in the user journey — what we decided, why, and what we ruled out.

---

## Table of Contents

1. [The Core Thesis](#1-the-core-thesis)
2. [Step 1: Landing Page / First Touch](#2-landing-page)
3. [Step 2: Idea Selection / Niche Discovery](#3-idea-selection)
4. [Step 3: The Research Engine](#4-research-engine)
5. [Step 4: Product Creation / The Factory](#5-product-creation)
6. [Step 5: Storefront Generation](#6-storefront)
7. [Step 6: Opportunity Scout / Distribution](#7-opportunity-scout)
8. [Pricing Architecture](#8-pricing)
9. [Technical Architecture Decisions](#9-technical)
10. [What We Cut and Why](#10-cuts)

---

## 1. The Core Thesis

**Date:** March 12, 2026

### The Problem We're Solving

Most people who want to start a digital product business hit the same wall: they don't know what to build, they don't know if anyone will buy it, and even if they figure those out, they don't know how to build it, design it, price it, or sell it.

The existing solutions fail in predictable ways:
- **Automateed / CourseAI**: Generate content from a prompt. No market research. No validation. You get an ebook about a topic — but no evidence anyone wants to buy it.
- **Gumroad / Lemon Squeezy / Stan Store**: Great at selling, but you show up with nothing. They're the register, not the kitchen.
- **Kajabi / Teachable**: Full platforms but they require months of content creation. They're tools for established creators, not zero-to-one builders.

### The Know24 Thesis

**Find the wheel. Make our own version.**

Don't invent products from nothing. Find products that are already selling, with real engagement signals, real revenue evidence. Understand *why* they work — their ingredients of success. Then create a better, more complete, more current version.

This is not plagiarism. This is market-validated product development — the same thing every successful business does, but automated and data-driven.

### The Validation Philosophy (NON-NEGOTIABLE)

Every data point must pass engagement thresholds before it informs a product decision:
- **Reddit**: >10 upvotes + >5 comments on pain-point threads
- **Amazon**: BSR <50K + >100 verified reviews
- **YouTube**: >5K views + >50 comments from channels with >1K subs
- **Gumroad/Digital**: >50 reviews or visible sales signals
- **Cross-referencing**: Pain points must appear across 3+ independent sources

If it doesn't have real humans engaging with it, it doesn't exist to us.

### What We're NOT Building

- A generic AI writing tool (ChatGPT already exists)
- A course platform (Kajabi already exists)
- A marketplace (Gumroad already exists)
- A research-only tool (that's a feature, not a product)

We're building **the full pipeline**: validated research → product generation → storefront → distribution. The value is in the completeness and the automation, not in any single layer.

---

## 2. Landing Page / First Touch

**Date:** March 12, 2026
**Status:** IN DISCUSSION

### The Critical Question

What does the user see when they first arrive? This is the highest-leverage design decision in the entire product because it determines:
- Who self-selects in (our ICP)
- What they expect the product to do
- How fast they get to their first "wow" moment

### Decision: Kill the Category Grid

The existing build plan shows a 12-category grid ("What are you into?"). This is wrong for three reasons:

1. **It's generic.** Every AI tool starts with a category picker. It screams "template generator."
2. **It caps the TAM.** If someone's niche is "sourdough bread for diabetics," they don't fit in "Food & Cooking." They need to type it. The grid is a crutch that makes the common case (broad categories) slightly faster but makes the specific case (where the real value is) feel unsupported.
3. **It doesn't demonstrate the moat.** The grid says "we generate content about categories." The moat is "we research what's actually selling and build you something validated." The landing page needs to communicate the *research* value, not the *generation* convenience.

### The Alternative: The Research-First Landing Page

**Decision: The first thing the user experiences is the research engine, not a product generator.**

The landing page should:
1. Show a single input: "What business are you thinking about?" (text + mic)
2. Below it: a live demo of what the research produces — an actual research report for a real niche, with real data, real numbers, real competitor analysis
3. The CTA isn't "Generate Your Product" — it's "See What's Already Selling"
4. The emotional hook: "Before you build anything, know if anyone will buy it."

This positions Know24 as the *smart* choice. Not "AI writes your ebook" but "AI researches your market, finds what's working, and builds you something validated."

### The Demo Problem

**Open question:** Should the landing page show a pre-built demo report (fast, impressive, but static) or run a live mini-research (slow, but proves it's real)?

**Decision (TENTATIVE):** Hybrid approach:
- Pre-built showcase reports for 3-5 popular niches (instant, click to explore)
- "Try it yourself" input that runs a lightweight research pass (~30 seconds, not the full 3-minute deep dive)
- The lightweight pass shows enough to be impressive (top 5 selling products, 3 pain points, 1 gap identified) without costing a full research run

### Landing Page Copy Framework

**Headline options (to be tested):**
- "Know what sells before you build it."
- "AI researches your market. Then builds the product."
- "From idea to income in 10 minutes."
- "The product factory that does the homework first."

**Decision:** The headline must communicate TWO things: (1) research/validation and (2) automated product creation. If it only says one, we lose differentiation.

### Pricing Visibility on Landing

**Decision:** Show pricing on the landing page. Don't hide it. People who can't afford it shouldn't waste time signing up. Transparency builds trust. Specifically:
- Free tier: 1 research report (no product generation) — this is the hook
- Paid tiers visible with clear value differentiation

---

## Competitive Intelligence (March 2026)

**Date:** March 12, 2026

Before continuing to Step 3, here's what the competitive landscape actually looks like. This informs every decision that follows.

### The Pipeline Nobody Owns

```
[Niche Research] → [Product Generation] → [Storefront/Sales] → [Distribution] → [Optimization]
     EMPTY           Automateed/CourseAI    Genstore/Runner AI      EMPTY           Runner AI (partial)
                     (content only)         (store only)                            (store only)
```

### Direct Competitors

| Platform | What It Does | Price | Critical Gap |
|---|---|---|---|
| **Automateed** | GPT-4 ebook generator, 90+ pages, AI covers | ~$29-49/mo (credit-based) | No research, no storefront, no distribution. Just content. |
| **CourseAI** | AI course creator with video, quizzes, hosting | ~$30-40/mo | Course-only. No ebooks, no research, no distribution. |
| **Heights Platform** | AI product generator + course hosting + community | $29-499/mo | Creator-operated, not autonomous. No niche research. |
| **Kajabi** | AI course outlines + full creator platform | $149-399/mo | AI is supplementary. Expensive. For established creators. |
| **Genstore** | AI agent teams build e-commerce stores (Feb 2026) | $25/mo | Physical products focus. Does NOT generate the product itself. |
| **Runner AI** | Self-optimizing e-commerce engine (Jan 2026) | Credit-based | Optimizes stores, doesn't create products. E-commerce, not digital. |

### Selling Platforms (Payment Layer)

| Platform | Fees | Best For |
|---|---|---|
| Gumroad | 10% + $0.50/sale | Beginners, zero audience |
| Lemon Squeezy | 5% + $0.50/sale | Serious creators, MoR |
| Stan Store | $29/mo flat | Social-first, link-in-bio |
| Polar | 4% + $0.40/sale | Developers, cheapest MoR |
| Payhip | 0% on paid plans | Cost-conscious |

### The Whitespace (What Know24 Owns)

**Nobody ships the full loop.** The six things no platform does today:

1. **Autonomous niche research + validation** — Automateed has "niche suggestions" but it's just GPT brainstorming, not data-driven market analysis
2. **Multi-format product generation** — Everyone is siloed (ebooks OR courses, never both)
3. **Automatic storefront from generated product** — Genstore builds stores but doesn't create the product
4. **Distribution channel discovery** — Zero platforms find where to sell. Entirely manual everywhere.
5. **Product optimization from sales data** — Nobody says "Chapter 7 has high bounce, here's a rewrite"
6. **Portfolio management** — Every platform treats each product as an island

**Decision:** This confirms the thesis. The moat isn't in any single layer — it's in owning the full pipeline. Competitors can't copy this without rebuilding from scratch because they'd have to bolt together research + generation + storefront + distribution, and their architectures aren't designed for it.

---

## 3. Idea Selection / Niche Discovery

**Date:** March 12, 2026

### The Two-User Problem

There are fundamentally two types of users:

**Type A — "I know my niche"**: "I'm a fitness trainer specializing in postpartum recovery." They have domain knowledge. They need research + products + a store.

**Type B — "I want to make money online"**: They have ambition but no direction. They need to discover *what* to build before anything else.

The existing build plan only serves Type A. Type B is the bigger market.

### Decision: Serve Both, But Don't Build Two Products

**The approach:** A single input with two modes.

**Primary flow (Type A):** Text/voice input → "I want to build a business around postpartum fitness recovery" → research engine kicks off immediately.

**Discovery flow (Type B):** "Browse Trending Opportunities" button → curated gallery of pre-researched niches with demand signals, sorted by opportunity score. Each card shows:
- Niche name
- Demand signal strength (e.g., "Reddit: 47 threads/month, Amazon: 12 products with 500+ reviews")
- Competition level (Low / Medium / High)
- Estimated price sweet spot
- "Start Building" CTA

**Why this works:**
- Type A users never see the gallery unless they want to. Zero friction added.
- Type B users get inspired by real data, not generic categories. They're not picking "Health & Wellness" from a grid — they're seeing "Gut Health for People Over 50: 23 validated pain points, $27 avg price, low competition" and thinking "I could do that."
- The gallery is populated by OUR OWN research runs. Every time a user researches a niche, the anonymized metadata feeds the gallery. The product gets smarter with every user.

### Decision: Kill the Category Grid (CONFIRMED)

The 12-category grid from the original build plan is officially dead. Replaced by:
1. Free-text/voice input (primary)
2. Trending opportunities gallery (discovery)
3. Optional "personal angle" field: "I'm a nurse with 15 years experience" — this gets woven into the product to make it unique

### The Personal Angle Problem

**Critical insight from the Pivot Knowledge notes:** The best products aren't generic. They're generic research + personal perspective. A "gut health guide" is a commodity. A "gut health guide by a gastroenterologist who reversed her own IBS" is a product.

**Decision:** The personal angle is ALWAYS optional but ALWAYS encouraged. The flow:

```
Step 1: "What business?" → "gut health"
Step 2: "Add your angle?" → "I'm a nurse who reversed my IBS through diet"
Step 3: Research runs (finds what's selling, what's missing)
Step 4: Product generated WITH the personal angle woven in
```

If no angle is provided, the product is still generated — but it's flagged as "generic" and the user is nudged: "Products with a personal angle sell 3x more. Want to add yours?"

### The Voice Input Decision

**Decision:** Voice input is a V1 feature, not a V2 add-on. Here's why:

The target user for Type B ("I want to make money") is often not a writer. They're a nurse, a trainer, a chef, a parent. Asking them to type a business description is friction. Asking them to *talk about what they know* is natural.

**Implementation:** Whisper API transcription → structured extraction (name, expertise, target audience, pain points they've seen). Cost: ~$0.006/minute. A 2-minute voice memo costs $0.012 to transcribe. Negligible.

### What We Ruled Out

- **AI interview chatbot**: Too slow, too complex for V1. The structured input (text/voice + optional angle) captures 80% of the value at 20% of the complexity.
- **Quiz-style niche finder**: "Answer 10 questions and we'll tell you your perfect niche." Gimmicky. Doesn't use real data.
- **Marketplace browsing**: "Browse niches other users have built." Privacy concerns, competition concerns, and it turns Know24 into a marketplace instead of a factory.

---

## 4. The Research Engine

**Date:** March 12, 2026

### What Makes This The Moat

Every competitor generates products from prompts. Know24 generates products from *research*. The research engine is the single most important technical component because:

1. It's what validates the product idea (reducing user risk)
2. It's what informs the product content (improving quality)
3. It's what justifies the price (you're not paying for AI writing, you're paying for market intelligence)
4. It's what creates the "wow" moment (watching real data come in)

### The Research Pipeline

The engine runs in three phases:

**Phase 1: Pain Mining (~60 seconds)**
Find the problems people actually have in this niche. Sources:
- Reddit (pain-point threads with real engagement)
- Amazon reviews (1-3 star reviews on popular products — what's missing?)
- YouTube comments (what are people asking for?)
- Quora/forums (long-tail questions with engagement)

Output: Ranked list of validated pain points, each with source count and engagement score.

**Phase 2: Product Analysis (~60 seconds)**
Find what's already selling and why. Sources:
- Amazon (top sellers by BSR, pricing, review counts, format)
- Gumroad/digital marketplaces (pricing, reviews, sales signals)
- YouTube (top content creators — what formats work?)
- Course platforms (Udemy, Skillshare — what's popular?)

Output: Competitive landscape with pricing data, format analysis, and gap identification.

**Phase 3: Blueprint Synthesis (~30 seconds)**
LLM takes the pain points + product analysis and produces:
- Recommended product type (ebook, course, template, bundle)
- Recommended title and positioning
- Table of contents / curriculum outline
- Pricing recommendation with reasoning
- Unique angle recommendation
- Gap analysis (what competitors miss that we'll include)

### The Data Source Decision

**This is the highest-stakes technical decision in the entire product.** The research engine is only as good as its data sources.

#### The Architecture: API-First, Scraping as Fallback

**Decision:** Use paid APIs where available (reliable, legal, fast). Fall back to structured scraping only where no API exists. NEVER build a scraping-only stack — it's fragile, legally risky, and a maintenance nightmare.

**Tier 1 — Research APIs (primary data acquisition):**

| Source | Method | What We Get |
|---|---|---|
| **Firecrawl Agent** | API | Autonomous web research — describe what you need, it navigates and returns structured JSON. Best for competitor analysis, pricing data, content gap identification. |
| **Tavily Search** | API | LLM-optimized search results. Fast, pre-processed. Best for broad topic research and trending content. |
| **Perplexity Sonar** | API | Multi-source synthesis with citations. Best for "what's the current state of X?" questions. |

**Tier 2 — Platform-Specific Data:**

| Source | Method | What We Get |
|---|---|---|
| **Reddit** | `.json` endpoint (append .json to any URL) | Pain-point threads, engagement metrics, community size. Free, no API key needed. Rate limited but sufficient. |
| **Amazon** | Firecrawl Agent (scrapes product pages) | BSR, pricing, review counts, review content. No official API for product data. |
| **YouTube** | YouTube Data API v3 (free tier: 10K units/day) | Video stats, channel data, comment threads. Official API, reliable. |
| **Google Trends** | Unofficial API (pytrends equivalent) or Tavily | Trend direction, related queries, geographic interest. |
| **Gumroad/Digital** | Firecrawl Agent | Product listings, review counts, pricing. No API. |

**Tier 3 — SEO Data:**

| Source | Method | What We Get |
|---|---|---|
| **Google Search Console** | API (if user connects their domain) | Real keyword data for their storefront. V2 feature. |
| **Keyword research** | Tavily + Perplexity synthesis | Long-tail keyword opportunities, search volume estimates. |

#### Why Not Self-Hosted Scraping?

The Pivot Knowledge notes explored a full self-hosted scraping stack (Crawl4AI, Camoufox, Tor rotation, proxy mesh). **Decision: Don't build this for V1.**

Reasons:
1. **Maintenance burden.** Anti-bot detection changes weekly. You'd spend more time maintaining scrapers than building the product.
2. **Legal risk.** Scraping Amazon/Reddit at scale without API access is a legal gray area for a SaaS product charging money.
3. **Cost isn't the issue.** Firecrawl + Tavily + Perplexity cost ~$100-300/month total. That's less than one month of maintaining a proxy infrastructure.
4. **Reliability.** APIs have SLAs. Scrapers break at 3am on Saturday.

**The self-hosted scraping stack is a V3 consideration** — only if API costs become unsustainable at scale (thousands of research runs/month) AND we have engineering bandwidth to maintain it.

#### Specific API Pricing (March 2026 — Verified)

**Research APIs:**

| Service | Plan | Cost | What You Get |
|---|---|---|---|
| **Firecrawl** | Standard | $83/mo | 100K page credits, scrape → markdown/JSON. Agent mode (preview) for autonomous multi-site research. |
| **Tavily** | Free + Pay-as-you-go | $0 base, $0.008/search | 1,000 free searches/mo. LLM-optimized results with citations. |
| **Perplexity Sonar** | Pay-as-you-go | $5/1K requests + $1/$1 per M tokens (I/O) | Search-augmented LLM. Send a question, get a researched answer with sources. |

**Platform-Specific:**

| Source | Method | Cost | Notes |
|---|---|---|---|
| **Reddit** | Free OAuth API | $0 (100 req/min) | Non-commercial only. For commercial: $0.24/1K calls. Or use .json endpoints for lightweight reads. |
| **Amazon** | Scrapingdog or Oxylabs | $20-40/mo | PA-API being deprecated April 2026. Need third-party. Scrapingdog cheapest at $0.20/1K requests. |
| **YouTube** | YouTube Data API v3 | $0 (10K units/day) | Official, reliable. Search + video stats + comments. |
| **Gumroad/Digital** | Firecrawl | Included in Firecrawl plan | No official API. Scrape product pages. |

#### The Recommended Research Stack (Decision)

**V1 Research Stack: ~$125/mo total**

| Component | Tool | Monthly Cost |
|---|---|---|
| General web research + Amazon scraping | Firecrawl Standard (100K pages) | $83 |
| Quick search queries | Tavily (1K free + pay-as-you-go) | ~$10-15 |
| Deep synthesis questions | Perplexity Sonar (pay-as-you-go) | ~$15-25 |
| Reddit | Free OAuth API + .json endpoints | $0 |
| YouTube | YouTube Data API v3 (free tier) | $0 |
| **TOTAL** | | **~$108-123/mo** |

This covers approximately **1,000-1,500 research runs per month** at current usage estimates (each run = ~5-10 Firecrawl pages + 3-5 Tavily searches + 1-2 Sonar queries + 5-10 Reddit reads + 3-5 YouTube API calls).

**At 100 paying users doing 3 research runs each/month = 300 runs = well within budget.**

**The research cache (Section 11.6) makes this even cheaper** — popular niches get researched once and served to all subsequent users.

#### Updated Cost Per Research Run

With real API pricing:

| Component | Cost |
|---|---|
| Firecrawl (5-10 pages for Amazon/Gumroad scraping) | $0.05-0.10 |
| Tavily (3-5 searches) | $0.02-0.04 |
| Perplexity Sonar (1-2 synthesis queries) | $0.01-0.05 |
| Reddit API (5-10 reads) | $0 |
| YouTube Data API (3-5 calls) | $0 |
| LLM synthesis (Claude Sonnet 4.5) | $0.20-0.50 |
| **TOTAL per research run** | **$0.28-0.69** |

**This is dramatically cheaper than the $1-4 estimate.** At $0.50 average per research run, even the Growth tier user doing 10 research runs/month costs us only $5 in research — well within the $79/mo revenue.

#### Revised Margin Analysis

| Tier | Revenue | Research Cost (max) | Product Cost (max) | **True Gross Margin** |
|---|---|---|---|---|
| **Starter ($29)** | $29 | $1.50 (3 runs) | $8 (1 product) | **$19.50 (67%)** |
| **Growth ($79)** | $79 | $5 (10 runs) | $40 (5 products) | **$34 (43%)** |
| **Scale ($199)** | $199 | $10 (20 runs avg) | $80 (10 products avg) | **$109 (55%)** |

**All tiers profitable.** The Growth tier concern is resolved — even at max usage, it's 43% margin, not break-even. The cache makes it even better.

### The "Proof Engine" Concept

**New decision:** The research output must include a **Proof Card** — a single, emotionally compelling data point that makes the user believe this will work.

Examples:
- "The #1 gut health guide on Amazon has 2,400 reviews at $24.99. Estimated lifetime revenue: $1.2M."
- "47 Reddit threads in the last 30 days asking about gut health for beginners. Average engagement: 89 upvotes."
- "The top YouTube video on this topic has 2.3M views. The creator has only 12K subscribers."

This isn't just data — it's the moment the user gets emotionally activated. It needs to be surfaced prominently, not buried in a report.

### Real-Time Narration (The "Watch It Work" Experience)

**Decision (CONFIRMED):** The research phase streams progress to the user in real-time. Not a progress bar — a narrated experience.

```
🔍 "Searching Reddit for pain points in gut health..."
📊 "Found 47 threads with 10+ upvotes. Top pain: 'bloating after every meal' (mentioned 23 times)"
🛒 "Analyzing Amazon's top 15 gut health books..."
💰 "Price sweet spot: $19-29. The $27 price point has the best review-to-sales ratio."
🎯 "Gap identified: Nobody covers the gut-brain connection for beginners."
📋 "Building your product blueprint..."
```

This creates word-of-mouth. The experience of watching an AI research your market in real-time is the demo that sells itself. Users will screen-record this and share it.

---

## 5. Product Creation / The Factory

**Date:** March 12, 2026

### What Gets Generated

Based on competitive analysis, the key differentiator is **multi-format output from a single research input.** Automateed gives you a PDF. CourseAI gives you a course. Know24 gives you everything.

**V1 Output Bundle:**
1. **Ebook (PDF)** — 60-100 pages, professionally formatted, with cover art
2. **Lead magnet** — 5-10 page extract (the "free sample" for email capture)
3. **Blog post** — 1,500-word SEO-optimized article derived from the ebook content
4. **Email welcome sequence** — 5 emails that nurture + sell
5. **Social media posts** — 10 posts ready to publish (hooks derived from pain points)

**V2 Output Bundle (post-launch):**
6. Audio version (ElevenLabs TTS)
7. Course version (lesson-by-lesson with quizzes)
8. Template/workbook companion
9. Explainer video (HeyGen)

### Decision: V1 Ships Ebook + Lead Magnet + Blog + Emails + Social

**Rationale:** This is the minimum viable *business*, not just a minimum viable *product*. An ebook alone is useless without distribution assets. The blog post drives SEO. The lead magnet captures emails. The email sequence sells. The social posts create awareness. Together, they form a functional business unit.

### The Quality Ceiling Problem

**This is the elephant in the room.** AI-generated ebooks are recognizable. The Pivot Knowledge notes called this out explicitly: "Most information on the internet will be AI content soon enough. We only base our decisions on real data."

**Decision:** The product generator must produce content that is:
1. **Research-backed** — every claim, stat, and recommendation traces back to the research phase data
2. **Structured around validated pain points** — not generic outlines but specific solutions to specific problems people are actually having
3. **Differentiated by personal angle** — if the user provided expertise, it's woven throughout
4. **Formatted professionally** — design quality matters as much as content quality

**Decision:** We do NOT try to make AI content "pass as human." Instead, we lean into the value proposition: "This product is built on real market research. Every recommendation is backed by data from 50+ sources. The research alone is worth the price — the product is the bonus."

### The Product Generation Pipeline

```
Research Document
    ↓
Blueprint (title, TOC, positioning, price)
    ↓
User approval (can edit title, reorder chapters, adjust price)
    ↓
Content generation (chapter by chapter, research-informed)
    ↓
Formatting (PDF with cover, headers, professional layout)
    ↓
Lead magnet extraction (best 2-3 chapters → free PDF)
    ↓
Marketing assets (blog post, emails, social posts)
    ↓
Package uploaded to R2
    ↓
Ready for storefront
```

### The Cover Art Decision

**Decision:** AI-generated covers via GPT Image (gpt-image-1). Reasons:
- Eliminates the biggest perceived quality gap (amateur covers = no sales)
- Cost per cover: ~$0.04-0.08 (trivial)
- 8 template styles per product type: minimalist, bold, photographic, illustrated, gradient, typographic, editorial, modern
- AI selects best template based on niche
- Color palette extracted from cover → applied to storefront

---

## 6. Storefront Generation

**Date:** March 12, 2026

### The Storefront Philosophy

The storefront is not a nice-to-have. It's the difference between "here's a PDF" and "here's a business." Without a storefront, the user has to manually list on Gumroad, set up Stripe, write copy, and build a landing page. That's where 80% of people quit.

### Decision: Know24-Hosted Storefronts (Not External Platforms)

**Decision:** Every user gets a Know24-hosted storefront at `know24.io/s/{slug}` or `{slug}.know24.io`.

**Why not just list on Gumroad?**
1. We control the experience end-to-end
2. We capture analytics (conversion data feeds the optimization loop)
3. No platform fees (Gumroad takes 10%)
4. Branded to the user, not to Know24
5. Custom domains supported (V2)

**Why not Stripe-only / headless?**
The user needs a *page* to send traffic to. A Stripe payment link with no landing page converts at 1%. A designed storefront with social proof, product mockups, and compelling copy converts at 5-15%.

### Storefront Design System

**Decision:** 6 handcrafted themes (not 12 — that's scope creep). Each is a complete page:

1. **Minimal** — Large typography, generous whitespace (Linear-inspired)
2. **Bold** — Dark background, vibrant accents, strong CTAs (Stripe-inspired)
3. **Editorial** — Magazine-style layout, content-forward (Substack-inspired)
4. **Modern** — Gradient backgrounds, floating cards (Notion-inspired)
5. **Professional** — Corporate feel, trust badges, testimonials (B2B-friendly)
6. **Creative** — Playful, illustrated, colorful (indie creator-friendly)

AI selects the best theme based on niche + product type. User can override.

### Storefront Components (Every Theme)

1. Hero section with product mockup (3D book render or device frame)
2. "What you'll learn" / benefits grid
3. Author/creator section (pulled from personal angle)
4. Social proof section (initially empty, auto-populates with real reviews)
5. Pricing card with Stripe Checkout
6. FAQ section (auto-generated from product content)
7. Lead magnet capture form ("Get 3 free chapters")
8. SEO meta tags, Open Graph image, structured data

### Payment Processing

**Decision:** Stripe Connect. Each user gets a connected Stripe account. Know24 takes a platform fee.

**Platform fee options:**
- Option A: Percentage cut (5% of sales) — aligned incentives, but feels extractive
- Option B: Flat subscription only — simpler, but no skin in the game
- Option C: Hybrid — subscription + small percentage (3%) — balanced

**Decision (TENTATIVE):** Option C — subscription fee covers platform access, small percentage aligns incentives ("we make more when you make more").

---

## 7. Opportunity Scout / Distribution

**Date:** March 12, 2026

### Why Distribution Is Everything

The Pivot Knowledge notes called this out: "Distribution is where most digital products actually die." A beautiful storefront with zero traffic is a graveyard. The Scout is what turns a product into a business.

### Decision: Scout Is Part of V1, Not an Add-On

The original architecture treated Scout as a "per-org add-on." Wrong. If we ship without distribution, we're shipping a product that generates beautiful storefronts nobody visits. The failure mode is obvious: user generates a product, gets excited, launches the store, gets zero traffic, churns.

**Scout must be in V1.** Even if it's limited (5 opportunities per research run on free tier), it must exist.

### What Scout Actually Does

Scout finds **specific, actionable places** where the user can promote their product. Not "post on social media" — actual links to actual threads, communities, and channels.

**V1 Scout Output:**
1. **Reddit opportunities** — Specific subreddits + recent threads where the topic is discussed + draft comment/post
2. **YouTube gaps** — Channels covering the niche + content gaps (topics with views but no great content)
3. **SEO keywords** — Long-tail keywords with search volume where the user's blog post can rank
4. **Newsletter/community list** — Relevant newsletters, Facebook groups, Discord servers in the niche

**V2 Scout Output:**
5. Affiliate/partnership opportunities
6. Podcast guest opportunities
7. Competitor audience targeting suggestions
8. Email outreach templates for cold partnership

### The Distribution Playbook

**Decision:** Every product launch includes a generated **Distribution Playbook** — a step-by-step guide for the first 30 days:

```
Week 1: Foundation
- Publish blog post (already generated) → target 3 long-tail SEO keywords
- Post in r/[niche] using draft response (already generated)
- Share on X/LinkedIn with 3 social posts (already generated)
- Set up lead magnet on storefront (already generated)

Week 2: Community
- Engage in 5 Reddit threads (scout identified)
- Comment on 3 YouTube videos (scout identified)
- Join 2 Facebook groups (scout identified)

Week 3: Content
- Write/generate 2 more blog posts (topics from research)
- Create 5 more social posts (from research pain points)
- Start email sequence to captured leads (already loaded)

Week 4: Optimize
- Review analytics (conversion rate, traffic sources)
- A/B test pricing if needed
- Generate a companion product or lead magnet variation
```

This playbook is auto-generated from the research data. It's not generic advice — it's specific to the niche, with actual links and draft content.

---

## 8. Pricing Architecture

**Date:** March 12, 2026

### The Pricing Philosophy

The free tier must deliver enough value that the user understands what they'd get if they paid. But it must NOT deliver so much that they never need to pay.

### Decision: The Research Report Is the Free Tier

**Free tier (no credit card):**
- 1 full research report per month
- See pain points, competitor analysis, market size, price recommendations
- See the Proof Card (the emotionally compelling data point)
- See the product blueprint (title, TOC, positioning)
- Do NOT get: the actual product, storefront, or distribution opportunities

**This is the hook.** The research report alone is valuable enough to share. When someone sees "there are 47 validated pain points in gut health, the top competitor makes $1.2M, and there's a gap nobody's filling" — they WILL want to build the product. That's when they pay.

### Paid Tiers (DRAFT)

| Feature | Starter ($29/mo) | Growth ($79/mo) | Scale ($199/mo) |
|---|---|---|---|
| Research reports/mo | 3 | 10 | Unlimited |
| Products generated/mo | 1 | 5 | Unlimited |
| Storefronts | 1 | 3 | 10 |
| Scout opportunities | 10/report | 25/report | 50/report |
| Formats | PDF only | PDF + Lead Magnet + Blog | Full bundle (all formats) |
| Audio narration | — | — | Included |
| Custom domain | — | Included | Included |
| Distribution playbook | Basic | Full | Full + weekly refresh |
| Platform sales fee | 5% | 3% | 0% |

### Why These Numbers

- **$29 Starter** competes directly with Automateed ($29-49) but delivers MORE (research + product + storefront + scout vs. just content)
- **$79 Growth** is the sweet spot for serious creators who want to test multiple niches
- **$199 Scale** is for people treating this as a business — multiple products, multiple storefronts, full portfolio management
- **Platform sales fee decreases with tier** — incentivizes upgrading as sales grow
- **Research reports on free tier** — this is the growth engine. Every free user who shares a research report is marketing for us.

### Cost-Per-User Estimate (REAL NUMBERS)

**Research from March 2026 API pricing:**

#### Cost Per Product (V1 Bundle: Ebook + Cover + Lead Magnet + Blog + Emails + Social)

| Component | Tool | Cost |
|---|---|---|
| Ebook text (80 pages) | GPT-4o-mini (draft) + Claude Sonnet 4.5 (polish) | $2-5 |
| Cover image (10-20 variations) | Ideogram V3 or GPT Image 1 | $0.50-3 |
| Lead magnet (extract) | Same generation pass | $0 (included) |
| Blog post (1,500 words) | Claude Sonnet 4.5 | $0.10-0.20 |
| Email sequence (5 emails) | GPT-4o-mini | $0.02-0.05 |
| Social posts (10 posts) | GPT-4o-mini | $0.01-0.02 |
| PDF rendering | Puppeteer (open source) | $0 |
| **TOTAL per V1 product** | | **$3-8** |

#### Cost Per Research Run (VERIFIED)

| Component | Tool | Cost |
|---|---|---|
| Firecrawl (5-10 pages) | Firecrawl Standard | $0.05-0.10 |
| Tavily (3-5 searches) | Tavily pay-as-you-go | $0.02-0.04 |
| Perplexity Sonar (1-2 queries) | Sonar pay-as-you-go | $0.01-0.05 |
| Reddit + YouTube | Free APIs | $0 |
| LLM synthesis pass | Claude Sonnet 4.5 | $0.20-0.50 |
| **TOTAL per research run** | | **$0.28-0.69 (avg ~$0.50)** |

#### V2 Add-on Costs (NOT in V1)

| Component | Tool | Cost |
|---|---|---|
| Audiobook narration (80 pages) | ElevenLabs Creator + overage | $64/book |
| Explainer video (3 min) | HeyGen API | $3-5/video |
| EPUB conversion | epub-gen-memory (open source) | $0 |

#### Margin Analysis Per Tier (VERIFIED WITH REAL API COSTS)

| Tier | Revenue | Research Cost (max) | Product Cost (max) | Infra Cost (share of $125/mo APIs) | **True Gross Margin** |
|---|---|---|---|---|---|
| **Starter ($29)** | $29 | $1.50 (3 runs × $0.50) | $8 (1 product) | ~$2 | **$17.50 (60%)** |
| **Growth ($79)** | $79 | $5 (10 runs × $0.50) | $40 (5 products) | ~$5 | **$29 (37%)** |
| **Scale ($199)** | $199 | $10 (20 runs × $0.50) | $80 (10 products) | ~$10 | **$99 (50%)** |

**All tiers profitable at max usage.** Growth at 37% is the thinnest margin — mitigated by:
1. Research cache (popular niches served from cache, not fresh API calls)
2. Most users won't max out every month
3. Product generation cost drops at volume (models get cheaper over time)

**The $3-8 per product + $0.50 per research run changes everything.** Total COGS for a Starter user who uses everything: ~$9.50. Revenue: $29. That's 67% gross margin on the most price-sensitive tier.

**Why audio/video stay in V2:** Audio adds $64/product. Video adds $29/month minimum. Either would flip margins negative on Starter and Growth. V2 adds them only for Scale tier ($199) where margins absorb the cost.

---

## 9. Technical Architecture Decisions

**Date:** March 12, 2026

### What Stays

The existing stack is solid:
- Next.js 15 (App Router) + TypeScript
- Supabase (PostgreSQL + RLS)
- Clerk (auth)
- Stripe (payments + Connect)
- BullMQ (job queue, already 14 workers)
- R2 (file storage)
- Sentry (monitoring)
- Vercel (hosting) + Railway (workers)

### What Gets Added

1. **Research API layer** — orchestrates Firecrawl/Tavily/Perplexity Sonar (see Data Source Decision below)
2. **Content generation pipeline** — multi-model strategy:
   - **GPT-4o-mini** ($0.15/$0.60 per 1M tokens) — first-draft generation, structured outputs, emails, social posts
   - **Claude Sonnet 4.5** ($3/$15 per 1M tokens) — editing/polishing pass, long-form coherence, the "voice"
   - **GPT Image 1** ($0.04-0.17/image) — cover art, product mockups, OG images
   - **Ideogram V3** ($0.02-0.05/image) — alternative for text-heavy covers (best typography rendering)
3. **PDF rendering engine** — **Puppeteer** (clear winner: full CSS, page breaks, headers/footers, free)
4. **Storefront SSR** — Next.js dynamic routes for `know24.io/s/{slug}`
5. **Real-time streaming** — Server-Sent Events for research/build narration
6. **Scout scanner modules** — per-platform data fetchers (Reddit, YouTube, Amazon, SEO)

### The Multi-Model Strategy (Decision)

**Decision:** Don't use one LLM for everything. Use the cheapest model that meets quality requirements for each task.

| Task | Model | Why |
|---|---|---|
| Ebook first draft | GPT-4o-mini | Cheapest, adequate quality for drafts |
| Ebook polish/edit | Claude Sonnet 4.5 | Best prose quality, long-form coherence |
| Blog post | Claude Sonnet 4.5 | Needs to be good enough to rank in SEO |
| Email sequence | GPT-4o-mini | Formulaic, doesn't need premium quality |
| Social media posts | GPT-4o-mini | Short-form, high volume |
| Research synthesis | Claude Sonnet 4.5 | Complex reasoning, needs to be accurate |
| Blueprint generation | GPT-4o | Good structured output, reasonable cost |
| Cover art | GPT Image 1 or Ideogram V3 | Best quality per dollar |
| Whisper transcription | Whisper API | $0.006/min, only option |

This drops the average cost per product from ~$15 (all Claude) to ~$3-5 (optimized mix).

### The Agent Observability Problem

**Decision:** Every research run gets a full decision log stored in Supabase:
- What sources were queried
- What data was returned
- How the LLM scored/ranked each data point
- Why the blueprint made specific recommendations
- Total cost of the run (API calls tracked)

This is not just for debugging — it's for quality improvement. If a user gets a bad output, we can replay the decision chain and find where it went wrong.

---

## 10. What We Cut and Why

**Date:** March 12, 2026

### Cut from V1

| Feature | Why It Was Cut |
|---|---|
| AI interview chatbot for niche discovery | Too complex for V1. Free-text + trending gallery covers 80% of the use case. |
| EPUB format | Low demand vs. PDF. Add in V2. |
| Audio narration (ElevenLabs) | Expensive per product ($2-5/generation). V2 add-on for Scale tier. |
| AI explainer video (HeyGen) | $0.50-2 per video. Cool but not essential for V1. Add in V2. |
| 12 storefront themes | Reduced to 6. Nobody needs 12 themes at launch. |
| Course generation | Ebooks first. Courses are a different product type with different UX. V2. |
| Custom domains | Technically complex (SSL provisioning). V2 for Growth+ tiers. |
| AI Advisor (post-launch autopilot) | Impressive but requires sales data that won't exist at launch. V2 when users have traffic. |
| Niche intelligence subscription (monitoring) | Requires cron jobs + diffing engine. V2 feature, big retention driver. |
| White-label for agencies | B2B motion that requires different sales/support. V3 if ever. |
| Expert marketplace | Different business entirely. Not building this. |

### What Must Ship in V1 (Non-Negotiable)

1. Research engine with real data sources
2. Ebook generation with cover art
3. Lead magnet extraction
4. Blog post generation
5. Email welcome sequence
6. Social media post drafts
7. Storefront with Stripe checkout
8. Scout (minimum 5 opportunities per report)
9. Distribution playbook
10. Real-time build narration
11. Free tier (research only) + paid tiers
12. Agent decision logging

---

## 11. Unsolved Problems & Open Questions

**Date:** March 12, 2026

These are the problems identified during this planning session that need answers but don't have clean ones yet.

### 11.1 — The Post-Generation UX

**Problem:** The product gets generated. The storefront goes live. Then what? The user has no reason to come back to Know24 unless they want another product.

**The missing piece:** A dashboard that shows:
- Storefront analytics (views, conversions, revenue)
- Scout opportunities refreshing on a schedule
- "Health" of each product (is traffic growing? are reviews coming in?)
- Suggested actions ("Your blog post is ranking #47 for 'gut health guide' — generate 2 more posts to push it higher")

**Decision:** V1 ships with a basic dashboard showing storefront analytics (via Stripe data) + Scout refresh button. The full "AI advisor" dashboard is V2. But the skeleton must exist from day one or users disappear after launch.

### 11.2 — The Feedback Loop (Learning From Outcomes)

**Problem:** Know24 generates products and never learns whether they succeeded. We can't tell users "products in this niche have a 43% success rate" because we don't track outcomes.

**Decision:** V1 captures three signals passively:
1. **Stripe revenue data** — we already have this via Connect
2. **Storefront traffic** — we host the page, so we have analytics
3. **Refund rate** — via Stripe webhooks

These three signals are enough to build a basic quality score per niche. If gut health products generated by Know24 have 5% refund rates and keto products have 25%, we know something's wrong with keto. This feeds back into the research engine over time.

**V2 adds:** Post-purchase surveys, review collection, content engagement analytics (which chapters are read, where do readers drop off).

### 11.3 — The Legal Architecture

**Problem:** We're analyzing competitors' products (structure, pricing, positioning) and creating competing products. What's our legal exposure?

**Decisions:**
1. **Never copy content.** The research engine extracts *structure* and *market signals*, not text. "The top seller has 12 chapters, covers meal prep, and prices at $27" is market intelligence. Copying their chapter text would be plagiarism.
2. **Transform everything.** The generated product is original content informed by market data. Same way a journalist researches competitors before writing an article.
3. **No scraping TOS violations at scale.** API-first approach (Section 4) reduces legal risk. Reddit .json is a public interface. YouTube API is official. Amazon product data is publicly visible.
4. **Terms of Service must include:** Users are responsible for reviewing generated content before publishing. Know24 is a tool, not a publisher.
5. **Store no competitor content.** We store the research *analysis* (structured data), not the raw scraped content. If Amazon changes their product page, our analysis is our own derived work.

### 11.4 — The Collaboration Gap

**Problem:** Digital product businesses often involve more than one person (creator + editor, expert + marketer, freelancer + client). Know24 is currently single-user.

**Decision:** Defer to V2. Single-user for V1. But design the data model with `business_id` isolation (already exists in Supabase schema) so adding team members later doesn't require a rewrite. The Clerk auth already supports organizations.

### 11.5 — The Content Quality Ceiling

**Problem:** Even with research-backed content, AI ebooks have a quality ceiling. The best human-written ebooks have voice, personality, lived experience. AI doesn't have that.

**Decision (the honest one):** Know24 products are **80% products**. They're good enough to sell at $17-27. They're NOT good enough to sell at $97 or compete with a New York Times bestseller. And that's fine.

The positioning should be: "This gives you a head start. You can sell it as-is for $17-27, or invest time editing it into something premium."

For V2: offer a "human polish" add-on where a freelance editor reviews and enhances the AI draft. This could be a marketplace feature or a partnership with editing services.

### 11.6 — The Niche Report Library

**Problem:** If 10 users research "gut health," we pay for 10 research runs. But 90% of the data is the same.

**Decision:** Build a **research cache**. When a research run completes, the anonymized market data (not the user's personal angle) is cached. Future users researching the same or similar niche get instant results + a freshness indicator ("Research data from 3 days ago. Want a fresh run?").

Benefits:
- Reduces API costs by 80%+ for popular niches
- Enables the "Trending Opportunities" gallery for Type B users
- Creates a growing dataset of niche intelligence that compounds over time

**Implementation:** Hash the niche query → check cache → serve cached + offer refresh → charge for fresh run against tier limits.

### 11.7 — The Referral System

**From Pivot Knowledge notes:** Two-level referral system with revenue share.

**Decision:** Defer complex referral mechanics to V2. V1 ships with simple referral:
- Share a referral link → friend signs up → you get 1 free research report
- No revenue share, no multi-level, no complexity

The full referral system (30% L1, 10% L2, milestone unlocks, niche claiming) is interesting but premature. We need users before we need virality mechanics.

### 11.8 — The "What If It's Wrong?" Problem

**Problem:** The research engine recommends "Gut Health for Beginners" at $27. User builds it. Nobody buys. User blames Know24.

**Mitigations:**
1. **Never guarantee outcomes.** The research shows validated demand, not guaranteed sales.
2. **Show confidence scores.** "High confidence (47 validated signals)" vs "Moderate confidence (12 signals)" — let users make informed decisions.
3. **The Proof Card builds trust.** Showing real revenue data from existing products sets realistic expectations.
4. **The Distribution Playbook gives them a path.** If they follow it and still don't sell, the issue is execution or market timing, not the research.
5. **Offer a free research report.** If the first product fails, the user can research another niche for free. Low-cost recovery path.

---

## 12. The V1 Build Sequence (Implementation Order)

**Date:** March 12, 2026

Based on all decisions above, here's the order things should be built. Dependencies flow top-to-bottom.

### Phase 0: Foundation (Week 1-2)
- [ ] Fix the 10 critical build issues from the audit (types, Docker, tsconfig, env validation, etc.)
- [ ] Database migrations (research_runs, niche_cache, blueprints, products_v2, storefronts_v2 tables)
- [ ] Research API integration layer (Firecrawl + Tavily + Perplexity client wrappers)
- [ ] BullMQ job definitions for research + generation + storefront pipelines

### Phase 1: Research Engine (Week 3-4)
- [ ] Pain Mining pipeline (Reddit .json + Amazon via Firecrawl + YouTube Data API)
- [ ] Product Analysis pipeline (Amazon BSR + Gumroad via Firecrawl + pricing synthesis)
- [ ] Blueprint Synthesis (LLM orchestration → structured output)
- [ ] Proof Card generation
- [ ] Research cache (hash + store + freshness)
- [ ] Real-time narration via SSE
- [ ] Research report UI (the free tier deliverable)

### Phase 2: Product Factory (Week 5-7)
- [ ] Ebook content generation (GPT-4o-mini draft → Claude Sonnet polish, chapter by chapter)
- [ ] Cover art generation (GPT Image 1 / Ideogram, template selection)
- [ ] PDF rendering (Puppeteer, professional formatting, cover integration)
- [ ] Lead magnet extraction (auto-select best chapters)
- [ ] Blog post generation (SEO-optimized, from ebook content)
- [ ] Email sequence generation (5-email nurture + sell)
- [ ] Social media post generation (10 posts, platform-specific)
- [ ] All assets → R2 storage
- [ ] Product review/edit UI (user can tweak before launch)

### Phase 3: Storefront (Week 8-9)
- [ ] 6 storefront themes (React components, responsive, Lighthouse 95+)
- [ ] AI theme selection + copy generation
- [ ] Stripe Connect integration (per-user accounts, platform fee)
- [ ] SSR routes for `know24.io/s/{slug}`
- [ ] Lead magnet capture form + email integration
- [ ] OG image generation (auto from cover art)
- [ ] Storefront preview + "Go Live" flow

### Phase 4: Scout + Distribution (Week 10-11)
- [ ] Reddit scanner (find relevant subreddits + threads + draft responses)
- [ ] YouTube scanner (find channels + content gaps)
- [ ] SEO keyword scanner (long-tail opportunities)
- [ ] Community/newsletter scanner
- [ ] Distribution Playbook generator (4-week plan with links and drafts)
- [ ] Scout UI (opportunity cards with action buttons)

### Phase 5: Pricing + Launch (Week 12)
- [ ] Stripe subscription tiers (Free / Starter / Growth / Scale)
- [ ] Usage metering (research runs, products, storefronts per tier)
- [ ] Landing page (research-first, demo reports, pricing)
- [ ] Onboarding flow (text/voice input → research → product → storefront → scout)
- [ ] Basic dashboard (analytics, products, storefronts)
- [ ] Agent decision logging + admin monitoring

### Total Timeline Estimate: 12 weeks (3 months)

This is aggressive but achievable because:
- The existing codebase has Supabase, Clerk, Stripe, BullMQ, R2, Sentry already wired
- No audio/video generation in V1 (biggest cost and complexity items are deferred)
- 6 themes, not 12
- API-first research (no scraping infrastructure to build)
- Multi-model LLM strategy keeps generation costs and complexity low

---

## 13. PIVOT DECISIONS — March 12, 2026 (Session 2)

Three major decisions were made mid-session that override earlier sections. These are documented here as amendments — the sections above should be read with these overrides in mind.

---

### 13.1 — PIVOT: Ebook-Only Focus (Overrides Section 5)

**Previous decision:** V1 ships 5 assets (ebook + lead magnet + blog + emails + social posts).

**New decision:** V1 ships **one thing, done exceptionally well: ebooks.**

**Why the change:** Instead of creating several things half-assed, absolutely crush one format. We're not building a content mill — we're building an Amazon-quality digital product factory. The ebook should be indistinguishable from something a professional would publish on KDP.

**What "crush it" means:**
- **Amazon-grade formatting.** Professional typography, proper page breaks, table of contents, chapter headings, page numbers, clean layout. Not "AI slop" — the kind of ebook you'd see in a Kindle Top 100 list.
- **Cover generation via prompting (not editing).** Like Higgsfield or other AI image generators — the user describes what they want, generates variations, picks their favorite. If they don't like it, they prompt again. No Photoshop-style editor. Just "generate → pick → generate again" until they love it.
- **Editable text.** The user can edit every word of the generated ebook. Full control. The AI gives them a research-backed, professionally structured first draft. They make it theirs.
- **Credit system for generation.** Ebook generation costs credits. When credits run out, buy more. This is how the economics work — generation isn't unlimited, it's metered.

**What's deferred:** Lead magnets, blog posts, email sequences, social posts — all deferred. They may come later, but V1 is ebooks or nothing. The ebook IS the product. Everything else is noise until the ebook is world-class.

**What the user gets from a single generation cycle:**
1. A research report (what's selling, what's missing, validated pain points)
2. A product blueprint (title, TOC, positioning, pricing recommendation)
3. A complete ebook (60-100 pages, professionally formatted PDF)
4. A cover (AI-generated, user-directed via prompting)
5. Their storefront with the ebook listed and purchasable

**The ebook can be used anywhere:**
- Sell directly on Know24 storefront
- Upload to Amazon KDP
- List on Gumroad
- Use as a lead magnet on their own site
- Whatever they want — they own the content

---

### 13.2 — PIVOT: Scout = Live Opportunity Hunter (Overrides Section 7)

**Previous decision:** Scout generates a static 30-day "Distribution Playbook" with links and drafts.

**New decision:** Scout is a **live opportunity hunter** — not a playbook generator.

**The difference:**
- A playbook says "post in r/GutHealth." That's generic advice anyone could write.
- Scout says "Right now, there's a thread in r/GutHealth with 89 upvotes asking 'what's the best beginner guide to gut health?' — here's a draft response that positions your ebook as the answer. Post it within the next 24 hours before the thread ages out."

**What Scout actually does:**
1. **Finds where the target audience hangs out online** — specific subreddits, YouTube channels, Facebook groups, Discord servers, forums, Quora spaces
2. **Identifies LIVE opportunities** — active threads, trending conversations, recent questions, content gaps that exist RIGHT NOW
3. **Creates hyper-specific strategies** — not "post on social media" but:
   - "This podcast in your niche (23K listeners) is actively looking for guest experts. Here's a pitch email."
   - "This blogger (45K monthly readers) just wrote about your topic but missed X. Here's a comment/outreach that adds value and links to your ebook."
   - "This YouTube channel (89K subs) hasn't covered [gap your ebook fills]. Here's a collaboration pitch."
   - "This influencer (12K followers) posts about gut health daily. Here's a DM template for a product review swap."
4. **Helps the user get in front of people who have the problem the book solves** — specific, actionable, time-sensitive opportunities
5. **Updates on each scan** — not a one-time report. Every time the user spends credits on a Scout run, they get fresh, current opportunities

**Why this matters for retention:**
Most people don't have a social presence or customer base. That's why stores fail and people cancel. Scout solves the cold-start problem — it finds the audience for them. Without Scout, the storefront is a ghost town. With Scout, the user has a stream of specific places to show up and specific things to say.

**Scout is credit-based.** Each opportunity scan costs credits. The user decides when and how often to run it.

---

### 13.3 — PIVOT: Single Price + Unified Credits (Overrides Section 8)

**Previous decision:** Three tiers (Starter $29 / Growth $79 / Scale $199) with feature gating.

**New decision:** **One price. $99/month. + 5% transaction fee (sliding). + unified credit system.**

**Why one price:**
- Simpler to communicate. Simpler to build. No feature gating, no "upgrade to unlock."
- Everyone gets the full platform. The limitation is credits, not features.
- $99 is high enough to filter for serious users and maintain margins, low enough to be accessible.

**The transaction fee:**
- Starts at 5% of every sale through Know24 storefronts
- Reduces as the user sells more (incentivizes sales AND loyalty)
- Example sliding scale:

| Monthly Sales | Fee |
|---|---|
| $0 - $500 | 5% |
| $500 - $2,000 | 4% |
| $2,000 - $5,000 | 3% |
| $5,000 - $10,000 | 2% |
| $10,000+ | 1% |

This aligns incentives: Know24 makes more when the user makes more, but the fee becomes negligible as they scale. A user selling $10K/month pays $100 in fees (1%) — they'll happily stay.

**The unified credit system:**

**Principle:** 1 credit = 1 unit of AI generation, standardized across all types.

**The internal cost mapping:**

| Action | Internal Cost | Credits |
|---|---|---|
| Research report (full niche analysis) | ~$0.50 | 10 credits |
| Ebook generation (60-100 pages) | ~$3-5 | 50 credits |
| Cover generation (1 batch of 4-6 variations) | ~$0.50-1 | 10 credits |
| Scout opportunity scan | ~$0.50-2 | 15 credits |
| Text edit/regenerate (single chapter) | ~$0.20-0.50 | 5 credits |

**Monthly allocation with $99 plan:**

**Decision (DRAFT):** 200 credits/month included.

What 200 credits buys:
- **Full product cycle:** Research (10) + Ebook (50) + Cover (10) + Scout (15) = **85 credits** → allows ~2 full products/month
- **Additional Scout scans:** 15 credits each → can do ~8 standalone Scout runs
- **Cover regenerations:** 10 credits each → can regenerate covers ~20 times
- **Chapter rewrites:** 5 credits each → can rewrite ~40 individual chapters

**Additional credits:**
- Purchasable in packs (price TBD — needs to be above our cost but below the monthly per-credit rate)
- Example: $10 for 25 credits, $35 for 100 credits, $80 for 250 credits

**Why NOT "unlimited":**
- Generation costs us real money ($0.50-5 per action)
- "Unlimited" attracts abusers who generate 50 products/month and never sell
- Credits create a natural usage ceiling that protects margins
- Credits also create a natural expansion revenue stream (credit packs)
- The word "unlimited" would be dishonest if there's a credit system

**No free tier.**
- The free tier from Section 8 is replaced by a free research preview on the landing page (the demo)
- To actually use the platform, you pay $99/month
- This filters for serious users who are more likely to succeed and less likely to churn

**Revised margin analysis (single tier):**

| Scenario | Revenue | COGS (credits used) | **Gross Margin** |
|---|---|---|---|
| Light user (1 product, 100 credits) | $99 | ~$5 | **$94 (95%)** |
| Average user (2 products, 180 credits) | $99 | ~$10 | **$89 (90%)** |
| Heavy user (200 credits maxed) | $99 | ~$15 | **$84 (85%)** |
| Heavy user + credit packs ($40 extra) | $139 | ~$25 | **$114 (82%)** |

**Margins are extraordinary.** Even the heaviest user at max credits gives us 85% gross margin. The credit pack revenue is pure upside.

---

### 13.4 — ZHC Competitive Intelligence

**Date:** March 12, 2026

**zhc.company (Zero Human Company)** — researched as a potential competitor.

**Verdict: Not a competitor.** ZHC is a community/movement built on OpenClaw. It's about running entire businesses with AI agents (assigning them CEO, CTO, etc. roles), but:
- No product generation
- No storefronts
- No distribution/scout
- No non-technical user support
- Requires self-hosting, CLI fluency, API key management
- Serious security issues (135K+ exposed instances, 42K exploitable)

**What's worth stealing from ZHC:**
1. **The narrative framing.** "Zero Human Company" is a phenomenal marketing hook. Know24 should have an equally provocative positioning — not "AI ebook generator" but something that makes people talk.
2. **The "effective man-hours" metric.** Showing users "this research would have taken a human analyst 47 hours" is a powerful value demonstration.
3. **Community-first model (for later).** Capped membership with referral gating creates exclusivity. Not V1, but interesting for a future premium tier.
4. **One-time pricing option.** ZHC charges $49-199 lifetime. We're doing $99/mo subscription, but a lifetime deal could be a launch promotion.

**What ZHC gets wrong that we exploit:**
- Requires deep technical skill → Know24 is for non-technical people
- No actual product output → Know24 generates the finished product
- No distribution → Know24 has Scout
- Framework, not product → Know24 is a product

---

### 13.5 — Revised V1 Scope (Supersedes Section 10)

Based on the three pivots above, the V1 non-negotiable list is now:

1. **Research engine** — full niche analysis with real data sources, Proof Card, real-time narration
2. **Ebook generation** — 60-100 pages, Amazon-quality formatting, research-backed content
3. **Cover generation** — prompt-based (generate → pick → regenerate), not an editor
4. **Text editing** — full edit access to generated ebook content
5. **Storefront** — 6 themes, Stripe Connect, `know24.io/s/{slug}`
6. **Scout** — live opportunity hunter, hyper-specific, credit-based
7. **Single pricing** — $99/mo + sliding transaction fee + unified credit system (200 credits/mo)
8. **Agent decision logging** — full observability for quality improvement
9. **Landing page** — research-first demo, single price, no tiers

**Cut from V1 (confirmed):**
- Lead magnets, blog posts, email sequences, social posts (all deferred — ebook focus only)
- Audio narration, video generation, EPUB
- Custom domains, AI Advisor, niche monitoring
- Free tier (replaced by demo on landing page)
- Multi-tier pricing (replaced by single $99/mo)

---

### 13.6 — Revised Build Sequence

### Phase 0: Foundation (Week 1-2)
- [ ] Fix critical build issues from audit
- [ ] Database migrations (research_runs, niche_cache, blueprints, ebooks, covers, storefronts, credits tables)
- [ ] Research API integration (Firecrawl + Tavily + Perplexity)
- [ ] Unified credit system (credit ledger, deduction logic, pack purchases)
- [ ] BullMQ job definitions for research + generation + scout pipelines

### Phase 1: Research Engine (Week 3-4)
- [ ] Pain Mining pipeline (Reddit + Amazon + YouTube)
- [ ] Product Analysis pipeline (pricing + format + gap analysis)
- [ ] Blueprint Synthesis (LLM orchestration → structured output)
- [ ] Proof Card generation
- [ ] Research cache (hash + store + freshness)
- [ ] Real-time narration via SSE
- [ ] Research report UI

### Phase 2: Ebook Factory (Week 5-7)
- [ ] Ebook content generation (multi-model: GPT-4o-mini draft → Claude Sonnet polish)
- [ ] Professional PDF formatting (Puppeteer: typography, page breaks, TOC, headers/footers)
- [ ] Chapter-level text editor UI
- [ ] Cover generation via prompting (GPT Image 1 / Ideogram, batch of 4-6 variations)
- [ ] Cover regeneration flow (new prompt → new batch)
- [ ] All assets → R2 storage
- [ ] Product review/approval UI

### Phase 3: Storefront (Week 8-9)
- [ ] 6 storefront themes (React components, responsive, Lighthouse 95+)
- [ ] AI theme selection + copy generation
- [ ] Stripe Connect integration (per-user accounts, sliding transaction fee)
- [ ] SSR routes for `know24.io/s/{slug}`
- [ ] OG image generation
- [ ] Storefront preview + "Go Live" flow

### Phase 4: Scout (Week 10-11)
- [ ] Reddit opportunity scanner (live threads, engagement signals, draft responses)
- [ ] YouTube gap scanner (channels, content gaps, collaboration opportunities)
- [ ] Podcast/publicity scanner (shows accepting guests, pitch templates)
- [ ] Blog/influencer scanner (relevant creators, outreach templates)
- [ ] Scout results UI (opportunity cards with action buttons, time-sensitivity indicators)
- [ ] Scout credit metering

### Phase 5: Pricing + Launch (Week 12)
- [ ] Stripe subscription ($99/mo single tier)
- [ ] Sliding transaction fee implementation
- [ ] Credit system UI (balance, history, pack purchases)
- [ ] Landing page (research-first demo, single price, "watch it work")
- [ ] Onboarding flow (text/voice → research → ebook → cover → storefront → scout)
- [ ] Basic dashboard (products, storefronts, credits, revenue analytics)

---

## 14. COMPREHENSIVE INFRASTRUCTURE PLAN

**Date:** March 12, 2026
**Purpose:** Turn every decision above into an engineering blueprint. Every system, every table, every API route, every UI component — specified to the level where a developer could build it.

**Design Principles (applied everywhere):**
1. **Frictionless** — Every interaction should require the minimum possible effort from the user
2. **Valuable** — Every screen, every output, every notification must deliver tangible value
3. **Efficient** — No wasted computation, no redundant API calls, no unnecessary steps
4. **Delightful** — The experience should create moments that make people want to share it
5. **Incredibly easy** — If a user has to think about how something works, we've failed

---

### 14.1 — Database Schema (Supabase / PostgreSQL)

All tables include `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`, `created_at TIMESTAMPTZ DEFAULT now()`, `updated_at TIMESTAMPTZ DEFAULT now()`.

#### Core Tables

```sql
-- Credit ledger (the financial backbone)
CREATE TABLE credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES users(clerk_id),
  balance INTEGER NOT NULL DEFAULT 0,
  monthly_allocation INTEGER NOT NULL DEFAULT 200,
  reset_date TIMESTAMPTZ NOT NULL, -- when monthly credits refresh
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Credit transactions (every debit/credit is logged)
CREATE TABLE credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  amount INTEGER NOT NULL, -- positive = credit, negative = debit
  balance_after INTEGER NOT NULL,
  type TEXT NOT NULL, -- 'monthly_reset', 'generation', 'purchase', 'referral_reward', 'refund'
  action TEXT, -- 'research_report', 'ebook_generation', 'cover_generation', 'scout_scan', 'chapter_rewrite'
  reference_id UUID, -- links to the specific research/ebook/cover/scout record
  metadata JSONB DEFAULT '{}', -- extra context
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Research runs
CREATE TABLE research_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  niche_query TEXT NOT NULL,
  niche_hash TEXT NOT NULL, -- for cache lookup
  personal_angle TEXT, -- optional
  status TEXT NOT NULL DEFAULT 'pending', -- pending, running, completed, failed
  phase TEXT, -- pain_mining, product_analysis, blueprint_synthesis

  -- Results (populated as phases complete)
  pain_points JSONB, -- [{point, sources, engagement_score, cross_ref_count}]
  product_analysis JSONB, -- [{title, platform, price, reviews, bsr, format, strengths, weaknesses}]
  blueprint JSONB, -- {title, toc, positioning, price, unique_angle, gaps}
  proof_card JSONB, -- {headline, stat, source, emotional_hook}
  confidence_score INTEGER, -- 0-100

  -- Narration log (for real-time streaming replay)
  narration_events JSONB DEFAULT '[]', -- [{timestamp, icon, message, data}]

  -- Cost tracking
  api_costs JSONB DEFAULT '{}', -- {firecrawl: 0.08, tavily: 0.03, sonar: 0.04, llm: 0.35}
  total_cost NUMERIC(10,4),
  credits_charged INTEGER,

  -- Cache metadata
  cached_from UUID, -- if served from cache, references original run
  expires_at TIMESTAMPTZ, -- cache TTL (7 days default)

  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- Research cache index (for fast lookup)
CREATE TABLE research_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  niche_hash TEXT NOT NULL UNIQUE,
  niche_query TEXT NOT NULL,
  research_run_id UUID NOT NULL REFERENCES research_runs(id),
  result_summary JSONB NOT NULL, -- condensed version for gallery cards
  opportunity_score INTEGER, -- 0-100, for trending gallery ranking
  cached_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL
);

-- Ebooks
CREATE TABLE ebooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  research_run_id UUID REFERENCES research_runs(id),

  -- Content
  title TEXT NOT NULL,
  subtitle TEXT,
  author_name TEXT,
  description TEXT,
  chapters JSONB NOT NULL, -- [{number, title, content_markdown, word_count}]
  total_pages INTEGER,
  total_words INTEGER,

  -- Metadata from research
  target_price NUMERIC(10,2),
  niche TEXT,
  personal_angle TEXT,

  -- Generation tracking
  status TEXT NOT NULL DEFAULT 'draft', -- draft, generating, review, published
  generation_model TEXT, -- which LLM was used
  credits_charged INTEGER,

  -- Files
  pdf_url TEXT, -- R2 signed URL
  pdf_key TEXT, -- R2 object key

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  published_at TIMESTAMPTZ
);

-- Covers
CREATE TABLE covers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ebook_id UUID NOT NULL REFERENCES ebooks(id),
  user_id TEXT NOT NULL,

  -- Generation
  prompt TEXT NOT NULL, -- user's description
  model TEXT NOT NULL, -- 'gpt-image-1' or 'ideogram-v3'
  variations JSONB NOT NULL, -- [{url, r2_key, selected: boolean}]
  selected_variation INTEGER, -- index of chosen cover

  -- Design extraction
  color_palette JSONB, -- [{hex, name, role}] extracted from selected cover

  credits_charged INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Storefronts
CREATE TABLE storefronts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,

  -- Identity
  slug TEXT NOT NULL UNIQUE, -- know24.io/s/{slug}
  name TEXT NOT NULL,
  tagline TEXT,

  -- Design
  theme TEXT NOT NULL DEFAULT 'minimal', -- minimal, bold, editorial, modern, professional, creative
  color_palette JSONB, -- from cover art
  custom_css TEXT, -- V2

  -- Content (AI-generated, user-editable)
  hero_headline TEXT,
  hero_subheadline TEXT,
  benefits JSONB, -- [{icon, title, description}]
  author_bio TEXT,
  faq JSONB, -- [{question, answer}]

  -- Products listed
  -- (linked via storefront_products join table)

  -- Payment
  stripe_account_id TEXT, -- Stripe Connect account
  stripe_onboarded BOOLEAN DEFAULT false,

  -- Settings
  status TEXT NOT NULL DEFAULT 'draft', -- draft, live, paused
  og_image_url TEXT,
  meta_description TEXT,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  published_at TIMESTAMPTZ
);

-- Storefront products (join table)
CREATE TABLE storefront_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  storefront_id UUID NOT NULL REFERENCES storefronts(id),
  ebook_id UUID NOT NULL REFERENCES ebooks(id),
  price NUMERIC(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'usd',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Scout scans
CREATE TABLE scout_scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  ebook_id UUID REFERENCES ebooks(id), -- which product is this for
  niche TEXT NOT NULL,

  status TEXT NOT NULL DEFAULT 'pending', -- pending, scanning, completed, failed

  -- Results
  opportunities JSONB NOT NULL DEFAULT '[]',
  -- Each opportunity:
  -- {
  --   type: 'reddit_thread' | 'youtube_gap' | 'podcast_guest' | 'blog_outreach' | 'influencer',
  --   platform: 'reddit' | 'youtube' | 'podcast' | 'blog' | 'twitter' | 'instagram',
  --   title: string,
  --   url: string,
  --   audience_size: number,
  --   relevance_score: 0-100,
  --   time_sensitivity: 'urgent' | 'this_week' | 'anytime',
  --   draft_response: string, -- ready-to-use outreach text
  --   strategy: string, -- why this opportunity matters
  --   discovered_at: timestamp
  -- }

  total_opportunities INTEGER DEFAULT 0,
  credits_charged INTEGER,

  -- Cost tracking
  api_costs JSONB DEFAULT '{}',
  total_cost NUMERIC(10,4),

  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- Orders (purchases through storefronts)
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  storefront_id UUID NOT NULL REFERENCES storefronts(id),
  ebook_id UUID NOT NULL REFERENCES ebooks(id),

  -- Buyer info
  buyer_email TEXT NOT NULL,
  buyer_name TEXT,

  -- Payment
  stripe_payment_intent_id TEXT NOT NULL UNIQUE,
  stripe_checkout_session_id TEXT,
  amount NUMERIC(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'usd',
  platform_fee NUMERIC(10,2) NOT NULL, -- our cut (sliding %)
  creator_payout NUMERIC(10,2) NOT NULL, -- what the creator gets
  fee_percentage NUMERIC(5,2) NOT NULL, -- the % applied

  -- Delivery
  download_url TEXT, -- signed R2 URL
  download_expires_at TIMESTAMPTZ,
  download_count INTEGER DEFAULT 0,

  -- Status
  status TEXT NOT NULL DEFAULT 'pending', -- pending, completed, refunded
  refunded_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT now()
);

-- Referrals
CREATE TABLE referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_user_id TEXT NOT NULL, -- who shared the link
  referred_user_id TEXT, -- who signed up (null until they do)
  referral_code TEXT NOT NULL UNIQUE, -- the shareable code

  -- Tracking
  status TEXT NOT NULL DEFAULT 'pending', -- pending, signed_up, subscribed, rewarded
  reward_type TEXT, -- 'free_month'
  reward_applied BOOLEAN DEFAULT false,
  reward_applied_at TIMESTAMPTZ,

  -- Attribution
  signup_at TIMESTAMPTZ,
  subscription_at TIMESTAMPTZ, -- when referred user became paying

  created_at TIMESTAMPTZ DEFAULT now()
);

-- User settings / profile extension
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_id TEXT NOT NULL UNIQUE,

  -- Subscription
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  subscription_status TEXT DEFAULT 'none', -- none, active, past_due, canceled
  current_period_end TIMESTAMPTZ,

  -- Referral
  referral_code TEXT NOT NULL UNIQUE, -- auto-generated on signup
  referred_by TEXT, -- referral_code of who referred them

  -- Transaction fee tier (calculated monthly from orders)
  monthly_sales_total NUMERIC(10,2) DEFAULT 0,
  current_fee_percentage NUMERIC(5,2) DEFAULT 5.00,

  -- Preferences
  voice_input_enabled BOOLEAN DEFAULT true,
  default_theme TEXT DEFAULT 'minimal',

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

#### RLS Policies (Applied to All Tables)

```sql
-- Users can only see their own data
ALTER TABLE credits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own credits" ON credits
  FOR ALL USING (user_id = auth.jwt()->>'sub');

-- Same pattern for all user-scoped tables:
-- research_runs, ebooks, covers, storefronts, scout_scans, credit_transactions, referrals, user_profiles

-- Storefronts are publicly readable when status = 'live'
CREATE POLICY "Public can read live storefronts" ON storefronts
  FOR SELECT USING (status = 'live');

-- Orders are readable by storefront owner
CREATE POLICY "Creators see their orders" ON orders
  FOR SELECT USING (
    storefront_id IN (SELECT id FROM storefronts WHERE user_id = auth.jwt()->>'sub')
  );
```

---

### 14.2 — API Routes

All routes follow the existing CLAUDE.md pattern: Zod validation, Clerk auth, consistent JSON responses.

#### Auth & User

| Method | Route | Description | Auth |
|---|---|---|---|
| POST | `/api/auth/signup-complete` | Webhook from Clerk — creates user_profile, generates referral_code, initializes credit balance | Clerk webhook |
| GET | `/api/user/profile` | Returns user profile, credits, subscription status | Clerk |
| PATCH | `/api/user/profile` | Update preferences | Clerk |

#### Credits

| Method | Route | Description | Auth |
|---|---|---|---|
| GET | `/api/credits` | Current balance, monthly allocation, reset date | Clerk |
| GET | `/api/credits/transactions` | Transaction history with pagination | Clerk |
| POST | `/api/credits/purchase` | Buy credit pack — creates Stripe checkout session | Clerk |
| POST | `/api/credits/webhook` | Stripe webhook for credit pack purchase completion | Stripe webhook |

#### Research

| Method | Route | Description | Auth | Credits |
|---|---|---|---|---|
| POST | `/api/research` | Start a research run (checks cache first) | Clerk | 10 credits (0 if cached) |
| GET | `/api/research/:id` | Get research run results | Clerk | — |
| GET | `/api/research/:id/stream` | SSE endpoint for real-time narration | Clerk | — |
| GET | `/api/research/trending` | Get trending opportunities gallery | Public | — |

#### Ebooks

| Method | Route | Description | Auth | Credits |
|---|---|---|---|---|
| POST | `/api/ebooks/generate` | Generate ebook from research run blueprint | Clerk | 50 credits |
| GET | `/api/ebooks/:id` | Get ebook details + chapters | Clerk | — |
| PATCH | `/api/ebooks/:id` | Update ebook metadata (title, subtitle, etc.) | Clerk | — |
| PATCH | `/api/ebooks/:id/chapters/:num` | Edit a specific chapter's content | Clerk | — |
| POST | `/api/ebooks/:id/chapters/:num/regenerate` | AI-regenerate a single chapter | Clerk | 5 credits |
| POST | `/api/ebooks/:id/render-pdf` | Render final PDF from current content | Clerk | — |
| GET | `/api/ebooks/:id/download` | Get signed download URL | Clerk | — |

#### Covers

| Method | Route | Description | Auth | Credits |
|---|---|---|---|---|
| POST | `/api/covers/generate` | Generate cover batch (4-6 variations) from prompt | Clerk | 10 credits |
| POST | `/api/covers/:id/select` | Select a variation as the cover | Clerk | — |
| POST | `/api/covers/regenerate` | New prompt → new batch | Clerk | 10 credits |

#### Storefronts

| Method | Route | Description | Auth |
|---|---|---|---|
| POST | `/api/storefronts` | Create storefront (AI generates copy from ebook) | Clerk |
| GET | `/api/storefronts/:id` | Get storefront details | Clerk |
| PATCH | `/api/storefronts/:id` | Update storefront settings/copy | Clerk |
| POST | `/api/storefronts/:id/publish` | Go live | Clerk |
| POST | `/api/storefronts/:id/pause` | Pause storefront | Clerk |
| GET | `/api/s/:slug` | Public storefront page (SSR) | Public |

#### Scout

| Method | Route | Description | Auth | Credits |
|---|---|---|---|---|
| POST | `/api/scout/scan` | Run a scout scan for a niche/ebook | Clerk | 15 credits |
| GET | `/api/scout/:id` | Get scan results | Clerk | — |
| GET | `/api/scout/:id/stream` | SSE for real-time scout narration | Clerk | — |

#### Checkout (for storefront purchases)

| Method | Route | Description | Auth |
|---|---|---|---|
| POST | `/api/checkout/create` | Create Stripe checkout for a storefront product | Public |
| GET | `/api/checkout/verify` | Verify payment, return download URL | Public (session ID) |
| POST | `/api/stripe/webhook` | Handle checkout.completed, charge.refunded | Stripe webhook |

#### Referrals

| Method | Route | Description | Auth |
|---|---|---|---|
| GET | `/api/referrals` | Get user's referral code + stats | Clerk |
| GET | `/api/referrals/track/:code` | Track referral click (sets cookie) | Public |
| POST | `/api/referrals/convert` | Called during signup if referral cookie exists | Internal |

---

### 14.3 — BullMQ Job Definitions

Each job runs as a worker on Railway. All jobs report progress via SSE for real-time narration.

| Queue Name | Job Type | Concurrency | Timeout | Description |
|---|---|---|---|---|
| `research` | `run-research` | 5 | 3 min | Full research pipeline (3 phases) |
| `ebook-generation` | `generate-ebook` | 3 | 10 min | Multi-model ebook generation |
| `cover-generation` | `generate-cover` | 5 | 2 min | Cover batch generation |
| `pdf-render` | `render-pdf` | 3 | 2 min | Puppeteer PDF rendering |
| `scout` | `run-scout` | 5 | 3 min | Live opportunity scanning |
| `credit-reset` | `monthly-reset` | 1 | 1 min | Monthly credit refresh (cron) |
| `storefront-copy` | `generate-copy` | 3 | 2 min | AI storefront copy generation |

---

### 14.4 — The User Journey (Screen by Screen)

**The Delightful Path — every screen, every interaction:**

#### Screen 1: Landing Page (Public)

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│           Know what sells before you build it.          │
│                                                         │
│  AI researches your market, creates your product,       │
│  builds your store, and finds your customers.           │
│                                                         │
│  ┌─────────────────────────────────────────────┐       │
│  │  What business are you thinking about?   🎤  │       │
│  └─────────────────────────────────────────────┘       │
│              [ See What's Selling → ]                   │
│                                                         │
│  ── or browse trending opportunities ──                 │
│                                                         │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐          │
│  │Gut     │ │Home    │ │AI for  │ │Budget  │          │
│  │Health  │ │Fitness │ │Small   │ │Travel  │          │
│  │$27 avg │ │$34 avg │ │Biz     │ │$19 avg │          │
│  │Low comp│ │Med comp│ │$47 avg │ │Low comp│          │
│  │89 pain │ │34 pain │ │67 pain │ │45 pain │          │
│  │points  │ │points  │ │points  │ │points  │          │
│  └────────┘ └────────┘ └────────┘ └────────┘          │
│                                                         │
│  ── LIVE DEMO: Watch it research "gut health" ──       │
│  [interactive replay of a real research run]            │
│                                                         │
│  ── $99/month. That's it. ──                           │
│  200 credits/mo | Full platform | No hidden fees       │
│  [ Start Building → ]                                   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**Delight moment:** The live demo replay. Visitors see actual research happening — Reddit threads loading, Amazon products being analyzed, the Proof Card appearing. It's a 60-second automated replay that plays on scroll. No signup required to watch.

#### Screen 2: Signup + Onboarding (3 steps max)

```
Step 1: Sign up with Google/email (Clerk)
Step 2: "What business are you thinking about?" (same input as landing page)
        + "Add your personal angle" (optional, with mic button)
Step 3: Stripe checkout for $99/mo
        → Research starts immediately after payment
```

**Delight moment:** Research starts THE SECOND payment completes. No dashboard tour, no settings, no profile setup. They see their market being researched in real-time within 5 seconds of paying.

#### Screen 3: Research Live View

```
┌─────────────────────────────────────────────────────────┐
│  Researching: "gut health for beginners"                │
│  ━━━━━━━━━━━━━━━━━━━━━░░░░░ Phase 2 of 3               │
│                                                         │
│  🔍 Searching Reddit for pain points...                 │
│  📊 Found 47 threads with 10+ upvotes                   │
│     Top pain: "bloating after every meal" (23 mentions) │
│  🛒 Analyzing Amazon's top 15 gut health books...       │
│  💰 Price sweet spot: $19-29                            │
│  🎯 Gap: Nobody covers gut-brain connection for         │
│     beginners                                           │
│  📋 Building your product blueprint...                  │
│                                                         │
│  ┌── PROOF CARD ──────────────────────────────┐        │
│  │  💎 The #1 gut health guide on Amazon has   │        │
│  │  2,400 reviews at $24.99.                   │        │
│  │  Estimated lifetime revenue: $1.2M          │        │
│  └─────────────────────────────────────────────┘        │
│                                                         │
│  Credits used: 10 of 200 remaining                     │
└─────────────────────────────────────────────────────────┘
```

**Delight moment:** The Proof Card appears with a gentle animation. This is the "holy shit" moment where the user sees real revenue potential backed by real data.

#### Screen 4: Research Results + Blueprint

```
┌─────────────────────────────────────────────────────────┐
│  ✅ Research Complete | Confidence: High (87/100)       │
│                                                         │
│  ┌── YOUR BLUEPRINT ──────────────────────────┐        │
│  │  📖 "The Complete Gut Health Reset Guide"   │        │
│  │                                              │        │
│  │  Recommended price: $27                      │        │
│  │  Target length: 85 pages (12 chapters)       │        │
│  │  Unique angle: Gut-brain connection          │        │
│  │                                              │        │
│  │  Table of Contents:                          │        │
│  │  1. Why Your Gut Is Your Second Brain        │        │
│  │  2. The 5 Signs Your Gut Needs Help          │        │
│  │  3. ...                                      │        │
│  │                                              │        │
│  │  [Edit Title] [Reorder Chapters] [Edit TOC]  │        │
│  └──────────────────────────────────────────────┘        │
│                                                         │
│  [ Generate My Ebook → ] (50 credits)                  │
│                                                         │
│  ── Full Research Report ──                             │
│  [Pain Points] [Competitors] [Pricing] [Gaps]          │
│  (expandable sections with full data)                   │
└─────────────────────────────────────────────────────────┘
```

**Delight moment:** The user can edit the blueprint before generation. They feel in control. The TOC isn't a black box — they can reorder chapters, rename them, add/remove topics. But the DEFAULT is good enough that most users just hit "Generate."

#### Screen 5: Ebook Generation (streaming progress)

Similar to research — real-time narration of each chapter being written. Shows word count climbing, chapter titles completing. Takes 3-7 minutes.

#### Screen 6: Ebook Review + Edit

```
┌─────────────────────────────────────────────────────────┐
│  📖 The Complete Gut Health Reset Guide                  │
│  85 pages | 12 chapters | 38,400 words                 │
│                                                         │
│  ┌── Chapter Navigation ──┐  ┌── Editor ──────────────┐│
│  │ 1. Second Brain    ✓   │  │                         ││
│  │ 2. 5 Signs         ✓   │  │ [rich text editor with  ││
│  │ 3. Foods to Eat    ✓   │  │  the selected chapter's ││
│  │ 4. Foods to Avoid  ✓   │  │  content — full edit    ││
│  │ 5. 30-Day Plan     ✓   │  │  access, markdown       ││
│  │ ...                     │  │  rendering, word count] ││
│  │                         │  │                         ││
│  │ [+ Add Chapter]         │  │ [Regenerate Chapter]    ││
│  │                         │  │ (5 credits)             ││
│  └─────────────────────────┘  └─────────────────────────┘│
│                                                         │
│  [ Generate Cover → ] (10 credits)                     │
│  [ Download PDF ]  [ Preview PDF ]                     │
└─────────────────────────────────────────────────────────┘
```

**Delight moment:** The user can download the PDF at any point. They OWN this content. They can take it to Amazon KDP, Gumroad, wherever. Know24 doesn't lock them in. This builds massive trust.

#### Screen 7: Cover Generation

```
┌─────────────────────────────────────────────────────────┐
│  🎨 Design Your Cover                                   │
│                                                         │
│  Describe what you want:                                │
│  ┌──────────────────────────────────────────────┐      │
│  │ Clean, minimalist gut health book cover with  │      │
│  │ soft green tones, modern typography, and a    │      │
│  │ simple illustration of a digestive system     │      │
│  └──────────────────────────────────────────────┘      │
│  [ Generate Covers ] (10 credits)                      │
│                                                         │
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐           │
│  │    │ │    │ │    │ │    │ │    │ │    │           │
│  │ V1 │ │ V2 │ │ V3 │ │ V4 │ │ V5 │ │ V6 │           │
│  │    │ │ ✓  │ │    │ │    │ │    │ │    │           │
│  └────┘ └────┘ └────┘ └────┘ └────┘ └────┘           │
│                                                         │
│  Don't love these? Try a different description.        │
│  [ Regenerate ] (10 credits)                           │
│                                                         │
│  [ Use Selected Cover → Create Storefront ]            │
└─────────────────────────────────────────────────────────┘
```

**Delight moment:** 6 beautiful variations appear simultaneously. The user clicks one, it zooms in with a 3D book mockup preview. Instant gratification.

#### Screen 8: Storefront Setup

```
┌─────────────────────────────────────────────────────────┐
│  🌐 Your Storefront                                     │
│                                                         │
│  URL: know24.io/s/[gut-health-reset]                   │
│  Theme: [Minimal ▾] (AI recommended)                   │
│  Price: [$27.00]                                       │
│                                                         │
│  ┌── Preview ──────────────────────────────────────┐   │
│  │ [live preview of storefront with chosen theme,  │   │
│  │  cover, AI-generated copy, all responsive]      │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  Stripe Connect: [Connect Your Stripe Account →]       │
│  (required before going live)                          │
│                                                         │
│  [ Go Live 🚀 ]                                        │
└─────────────────────────────────────────────────────────┘
```

**Delight moment:** The preview looks REAL. Professional. The user sees their book on a beautiful storefront and thinks "this is a real business." The Go Live button is the climax of the entire journey.

#### Screen 9: Dashboard (Post-Launch Home)

```
┌─────────────────────────────────────────────────────────┐
│  Dashboard                        Credits: 105/200     │
│                                                         │
│  ┌── Products ─────────────────────────────────────┐   │
│  │ 📖 Gut Health Reset Guide | $27 | ⬆ 3 sales   │   │
│  │    know24.io/s/gut-health-reset                  │   │
│  │    Revenue: $81 | Views: 234 | Conv: 1.3%       │   │
│  └──────────────────────────────────────────────────┘   │
│                                                         │
│  ┌── Scout ────────────────────────────────────────┐   │
│  │ 🔴 URGENT: r/GutHealth thread (89↑) asking for  │   │
│  │    beginner guide — post within 24hrs            │   │
│  │ 🟡 Podcast "Gut Talk" accepting guests (12K     │   │
│  │    listeners) — pitch this week                  │   │
│  │ 🟢 Blog gap: "gut health for seniors" — no      │   │
│  │    good content exists yet                       │   │
│  │                                                  │   │
│  │ [ Run Scout Scan ] (15 credits)                 │   │
│  └──────────────────────────────────────────────────┘   │
│                                                         │
│  [ + New Product ] [ Refer a Friend ]                  │
└─────────────────────────────────────────────────────────┘
```

**Delight moment:** Scout opportunities have urgency indicators (red/yellow/green). The user feels like they have a team of researchers working for them, surfacing time-sensitive opportunities they'd never find on their own.

---

### 14.5 — QA Checkpoints

**Every phase of the build has explicit QA gates. Nothing ships without passing these.**

#### Phase 0 QA: Foundation
- [ ] Credit deduction is transactional (no double-charges on race conditions)
- [ ] Credit balance never goes negative
- [ ] Monthly reset cron fires correctly at billing cycle boundary
- [ ] All RLS policies tested (user A cannot see user B's data)
- [ ] Stripe webhook signature verification working

#### Phase 1 QA: Research Engine
- [ ] Research completes in <3 minutes for any niche
- [ ] SSE stream delivers narration events in real-time (no batching delay)
- [ ] Cache hit returns results in <2 seconds
- [ ] Cache miss triggers full research and saves to cache
- [ ] Proof Card is generated for every research run
- [ ] Confidence score is calculated from real signal counts
- [ ] Failed API calls (Firecrawl down, etc.) are handled gracefully with partial results
- [ ] Credits are charged AFTER successful completion, not before

#### Phase 2 QA: Ebook Factory
- [ ] Generated ebook is 60-100 pages with proper chapter structure
- [ ] PDF has professional formatting: TOC, headers, page numbers, proper typography
- [ ] Chapter editor saves changes and re-renders PDF correctly
- [ ] Chapter regeneration produces noticeably different content (not same output)
- [ ] Cover generation produces 4-6 distinct variations (not near-duplicates)
- [ ] Cover prompt → image quality is consistently high
- [ ] PDF download works with signed R2 URLs (24hr expiry)
- [ ] Ebook content references research data (not generic AI filler)

#### Phase 3 QA: Storefront
- [ ] SSR page loads in <1 second
- [ ] All 6 themes render correctly on mobile and desktop
- [ ] Stripe Checkout flow completes end-to-end
- [ ] Buyer receives download link after payment
- [ ] Platform fee is calculated correctly per sliding scale
- [ ] OG image renders correctly when shared on social media
- [ ] Storefront slug uniqueness is enforced

#### Phase 4 QA: Scout
- [ ] Scout returns at least 5 opportunities per scan
- [ ] Opportunities include real, clickable URLs (not hallucinated)
- [ ] Draft responses are specific to the user's ebook (not generic)
- [ ] Time-sensitivity indicators are accurate (based on post/thread age)
- [ ] Podcast/blog opportunities include real contact info where available

#### Phase 5 QA: Pricing + Launch
- [ ] $99/mo subscription creates correctly in Stripe
- [ ] Sliding transaction fee calculates correctly at each tier
- [ ] Credit balance shows in header/nav at all times
- [ ] Credit pack purchase flow works end-to-end
- [ ] Referral code is auto-generated on signup
- [ ] Referral tracking works (click → cookie → signup attribution)
- [ ] Landing page demo replay works without signup

---

### 14.6 — Performance & Reliability Requirements

| Metric | Target | How |
|---|---|---|
| Landing page load | <1.5s | Static generation, CDN |
| Storefront page load | <1s | ISR (Incremental Static Regeneration) |
| Research start to first narration | <3s | Immediate SSE connection, first event from cache check |
| Research total time | <3 min | Parallel API calls in Phase 1 + 2 |
| Ebook generation time | <7 min | Chapter-by-chapter with streaming progress |
| Cover generation time | <30s | Parallel image generation |
| PDF render time | <15s | Puppeteer with pre-warmed browser |
| Scout scan time | <2 min | Parallel platform scanners |
| API error rate | <1% | Retry logic, fallback chains, circuit breakers |
| Uptime | 99.5% | Vercel (frontend) + Railway (workers), health checks |

---

---

## 15. PRODUCT EXCELLENCE FRAMEWORK

**Date:** March 12, 2026

**Directive:** Build this the way the best product managers in history would — Jony Ive's design obsession, Stripe's developer experience, Notion's onboarding, Linear's speed, Apple's attention to detail. Every pixel, every word, every interaction.

---

### 15.1 — Design Philosophy

**The North Star:** Know24 should feel like having a brilliant business partner who does all the research, creates professional deliverables, and finds you customers — not like using a software tool.

**Design Principles (Inspired by the Greats):**

1. **Every screen has ONE job** (Steve Jobs)
   - Landing page: make them believe. Research view: make them excited. Blueprint: make them confident. Ebook: make them proud. Storefront: make them successful.
   - Never show two CTAs competing for attention. Never split focus.

2. **Remove until it breaks** (Dieter Rams)
   - If a field can be auto-filled, remove it. If a setting has an obvious default, hide the option. If a step can be inferred, skip it.
   - The onboarding is: type your idea → pay → watch research happen. Three interactions. Anything more is bloat.

3. **Speed IS the feature** (Linear)
   - Every page loads in <1s. Every interaction responds in <100ms. Progress indicators appear within 200ms of any action.
   - Perceived performance matters more than actual: show skeleton screens, stream partial results, animate transitions. Never show a blank loading state.

4. **Words are design** (Stripe)
   - Every line of copy is intentional. No "Welcome to your dashboard." Instead: "Your gut health guide has 3 new sales this week."
   - Error messages are helpful, not technical. "We couldn't find enough data on 'artisanal sock knitting' — try a broader niche like 'knitting for beginners'" instead of "Research failed: insufficient data sources."
   - Button labels describe outcomes: "Generate My Ebook" not "Submit." "Go Live" not "Publish." "See What's Selling" not "Start Research."

5. **Trust through transparency** (Notion)
   - Show the user what's happening at every moment. Research narration, credit balance visible at all times, cost per action shown before they click.
   - No dark patterns. No hidden fees. No surprise charges. If the credit cost is 50, say 50 before they click.

---

### 15.2 — Copywriting Framework

**Landing Page Copy (The Most Important 200 Words)**

**Headline:** "Know what sells before you build it."

**Subheadline:** "AI researches your market, writes your ebook, designs your cover, builds your store, and finds your customers. All in under 10 minutes."

**Value Props (3 max):**

1. **Research-Backed, Not AI Guesses**
   "We analyze real Amazon sales data, Reddit conversations, and YouTube trends to find validated demand before creating anything. Every product is built on evidence, not prompts."

2. **Amazon-Quality Ebooks, Instantly**
   "Professional formatting, custom covers, full editing control. Download the PDF and sell it anywhere — our store, Amazon KDP, Gumroad, wherever you want."

3. **Your Audience, Found**
   "Scout finds the exact Reddit threads, podcasts, and blogs where your readers hang out. With draft outreach ready to post. No following required."

**CTA:** "Start Building — $99/month"

**Underneath:** "200 credits/month. No contracts. Cancel anytime."

**Social Proof (when available):**
- "2,847 ebooks created" (counter)
- "Average research confidence: 84%" (metric)
- "$127K in creator sales" (revenue counter)

**Anti-copy (what NOT to say):**
- Never say "AI-powered" in the headline. Everyone says that. It's meaningless.
- Never say "unlimited." It's not true and it's a red flag.
- Never say "passive income." It's a scam signal.
- Never say "no experience needed." It implies the product is for amateurs. Say "whether you're a nurse, trainer, or teacher" — specific, relatable, aspirational.

---

### 15.3 — Security Architecture

**OWASP Top 10 Coverage:**

| Risk | Mitigation |
|---|---|
| **Injection (SQL, XSS)** | Supabase parameterized queries. React's default XSS escaping. Zod validation on every input. CSP headers. |
| **Broken Authentication** | Clerk handles auth entirely (JWT, session management, MFA). No custom auth code. |
| **Sensitive Data Exposure** | R2 signed URLs with 24hr expiry. Stripe handles all payment data. No PII stored outside Clerk/Stripe. |
| **Broken Access Control** | Supabase RLS on every table. Every API route checks `auth()` AND ownership. |
| **Security Misconfig** | Strict CORS. HTTPS only. Environment variables validated at startup via `src/lib/env.ts`. |
| **CSRF** | SameSite cookies. Stripe webhook signature verification. |
| **Rate Limiting** | Per-route rate limiting via middleware. Credit system is a natural rate limit. |

**Specific to Know24:**

| Risk | Mitigation |
|---|---|
| **Credit manipulation** | Credit transactions are append-only (ledger pattern). Balance calculated from transaction sum. No direct balance updates. |
| **Download URL leakage** | R2 signed URLs expire in 24 hours. Each download generates a fresh URL. Download count tracked. |
| **Storefront content injection** | User-editable content rendered with sanitized HTML. No raw `dangerouslySetInnerHTML`. |
| **Research data poisoning** | LLM outputs are validated against source data before being stored. Confidence scores flag low-quality research. |
| **Stripe Connect abuse** | Verify account status before enabling Go Live. Monitor for unusual payout patterns. |
| **Referral fraud** | One referral code per user. Self-referral prevention (same email domain check). IP fingerprinting on referral clicks. Rate limit: max 50 referral signups per user per month. |

---

### 15.4 — Accessibility & Performance

**Accessibility (WCAG 2.1 AA):**
- All interactive elements keyboard-navigable
- Color contrast ratios ≥ 4.5:1
- Alt text on all images (cover art, mockups)
- Screen reader support for research narration (aria-live regions)
- Focus management during modal/overlay transitions
- No information conveyed by color alone (red/yellow/green Scout indicators also have text labels)

**Performance Budgets:**
| Page | JS Bundle | LCP | FID | CLS |
|---|---|---|---|---|
| Landing page | <150KB | <1.5s | <100ms | <0.1 |
| Dashboard | <200KB | <1.0s | <100ms | <0.1 |
| Storefront (public) | <100KB | <1.0s | <50ms | <0.05 |
| Ebook editor | <300KB | <2.0s | <100ms | <0.1 |

**Lighthouse target: 95+ on all public pages.**

---

### 15.5 — Error & Edge Case Handling

**The "Empty State" Problem:**
Every screen has a thoughtful empty state. Not "No data" — a specific, helpful message with a clear next action.

| Screen | Empty State |
|---|---|
| Dashboard (no products) | "Your first ebook is one research report away. [Start Researching →]" |
| Scout (no scans run) | "Scout finds where your readers hang out. Run your first scan. [Find My Audience →]" |
| Storefront (no sales) | "Your store is live! Here's what to do next: [Run Scout] to find your first customers." |
| Research (niche too narrow) | "We found limited data on 'artisanal mushroom leather.' Try 'sustainable fashion' or 'mushroom growing' for more validated signals." |
| Credits at zero | "You've used all 200 credits this month. [Buy More Credits] or wait for your monthly reset on [date]." |

**The "Something Went Wrong" Problem:**
- API failures during research → show partial results + "We couldn't reach [Amazon/Reddit]. Here's what we found from other sources. [Retry →]"
- Ebook generation stalls → chapter-level retry. Don't restart the entire generation — retry the failed chapter only.
- Cover generation produces bad results → "Not what you had in mind? Try describing the mood or style: 'professional and trustworthy' or 'vibrant and energetic'" (prompt coaching, not just "try again")
- Payment fails → "Your card was declined. [Update Payment →]. Your ebook and storefront are saved — nothing is lost."

---

### 15.6 — Micro-Interactions & Delight

These are the details that separate "functional" from "magical":

1. **Research Proof Card entrance** — slides up with a subtle glow effect. This is THE moment. Give it drama.

2. **Credit counter** — shows in the header, ticks down with a gentle animation when credits are used. Not alarming — informative.

3. **Cover selection** — clicking a cover variation shows a 3D book mockup rotation. The user sees their book "come alive."

4. **"Go Live" button** — pulses gently when the storefront is ready. When clicked, confetti animation + "Your store is live! Share it: [URL]" with copy-to-clipboard.

5. **Scout urgency badges** — red dot pulses for "urgent" opportunities. Creates FOMO that drives action.

6. **First sale notification** — if the user is logged in when their first sale happens, a full-screen celebration: "🎉 You just made your first sale! $27 from [city]. Your ebook is working."

7. **Research replay** — on the landing page, the research demo auto-plays like a movie. Each narration event appears with typewriter effect. Visitors are captivated.

8. **PDF preview** — before download, show a flip-through animation of the rendered PDF pages. The user sees their professional ebook before they even open it.

---

### 15.7 — The "Effective Effort" Metric (Stolen from ZHC)

**Display on every research report and ebook:**

"This research analyzed 47 Reddit threads, 15 Amazon products, 23 YouTube videos, and 8 Gumroad listings. A human analyst would need approximately **34 hours** to gather and synthesize this data. Know24 did it in **2 minutes and 14 seconds.**"

This is the value justification. It's not about the $99/month — it's about 34 hours of work done in 2 minutes. Show this number prominently on:
- Research results page
- The landing page demo
- Marketing materials
- Invoice/billing pages ("This month: 6 research reports = ~204 hours of analyst work automated")

---

## 16. REFERRAL & VIRALITY SYSTEM

**Date:** March 12, 2026

### The Core Mechanic

**Every user gets a referral link the moment they sign up.** Auto-generated. No action required. It's in their dashboard, in their settings, in their email receipt.

Format: `know24.io/ref/{CODE}` (short, memorable, shareable)

### The Reward Structure

**Simple. One rule. No complexity.**

> **For every friend who signs up AND becomes a paying customer ($99/mo), you get a free month.**

That's it. Not "share and maybe get something." Not a points system. Not a percentage of revenue. A free month. Clear, valuable, immediately understood.

**Why this works at $99/mo:**
- A free month is worth $99. That's a real incentive, not a token gesture.
- Our COGS per user is ~$10-15/month. Giving away $99 in revenue but only $15 in cost means the customer acquisition cost is $15 per referred user. That's exceptional for a $99/mo product.
- The referred user pays $99/mo immediately. We're cash-flow positive from month 1 of the referral.

### The Implementation

```
User A signs up → auto-generates referral code "SARAH2024"
User A shares know24.io/ref/SARAH2024
User B clicks link → cookie set (30-day attribution window)
User B signs up → referral tracked (status: signed_up)
User B pays $99/mo → referral converts (status: subscribed)
User A's next billing cycle → $0 charge (free month applied)
User A notified: "🎉 Your friend [name] just subscribed! You earned a free month."
```

### Stacking

**Free months stack.** If you refer 5 friends who all subscribe, you get 5 free months. No cap. This creates a scenario where power-referrers can use Know24 for free indefinitely — and that's fine, because they're bringing us paying customers.

### The Surprise Element

**Don't tell them about the referral reward during signup.** Let them discover it:

1. After their first "Go Live" moment (storefront published), show:
   "Love Know24? Share it with a friend and get a free month when they subscribe."

2. The timing matters — they're at peak excitement (just launched their store). That's when they're most likely to share.

3. The referral link is also in:
   - Monthly billing email ("Refer a friend, get a free month")
   - Dashboard sidebar (subtle, always visible)
   - Settings page (with stats: "3 friends referred, 1 free month earned")

### Rotational Promotions (Periodic Growth Bursts)

**Every quarter, run a 30-day "Double Reward" promotion:**

"For the next 30 days: refer a friend and you BOTH get a free month."

This creates:
- Urgency (time-limited)
- Two-sided reward (the referred friend also gets value)
- Social proof pressure (people sharing the promo creates FOMO)

**Announce via:**
- Email to all existing users
- Banner on dashboard
- Landing page badge

### Product-Led Virality (Beyond Referral Links)

**The research report is the viral payload.**

When a user gets a research report, they can share it. Not the full report — a teaser:

"I just found out that the gut health ebook market has $1.2M in proven revenue and 47 validated pain points nobody's addressing. [See the full report on Know24 →]"

This is a one-click share to X/LinkedIn/email. The link goes to a landing page showing the Proof Card and a few highlights. The viewer sees real data and thinks "I want this for MY niche."

**Other viral touchpoints:**
1. **Storefront "Powered by Know24" badge** — small, tasteful, links to know24.io. Every buyer who visits a storefront sees it.
2. **"Built with Know24" in PDF metadata** — professional ebooks have creator credits. We add a subtle "Created with Know24" on the copyright page (user can remove it, but most won't).
3. **The "watch it work" experience** — people will screen-record the research narration and share it on social media. This is organic, unforced virality. Design the narration to be visually compelling SPECIFICALLY because people will record it.

### Anti-Fraud

| Risk | Mitigation |
|---|---|
| Self-referral | Block same email, same IP, same payment method |
| Fake accounts for free months | Referral only converts when referred user PAYS (not just signs up) |
| Referral spam | Rate limit: max 50 referral clicks per code per day |
| Gaming with trial/cancel | Referred user must stay subscribed for 30 days before reward applies |

### Referral Dashboard

```
┌── Your Referrals ──────────────────────────┐
│                                              │
│  Your link: know24.io/ref/SARAH2024  [Copy] │
│                                              │
│  Clicks: 47                                  │
│  Signups: 8                                  │
│  Paying customers: 3                         │
│  Free months earned: 3 (2 remaining)         │
│                                              │
│  Share: [Twitter] [LinkedIn] [Email] [Copy]  │
│                                              │
│  🎉 Double Reward active until Apr 12!       │
│  Both you AND your friend get a free month.  │
└──────────────────────────────────────────────┘
```

### Research-Backed Refinements

After analyzing virality strategies from Dropbox (3,900% growth via referrals), Superhuman (waitlist-as-product), Notion (template virality), and dozens of SaaS case studies:

**Refinement 1: Two-Sided Rewards (Non-Negotiable)**
Data shows 65% of users prefer two-sided referral programs. Both referrer AND referred friend get a free month. This removes the "am I being used?" feeling from the referred person and dramatically increases conversion.

**Refinement 2: Credit-Limit Trigger**
When a user's credit balance drops below 25 credits, show a contextual prompt:
> "Running low on credits? Share Know24 with a friend — you both get a free month (200 credits)."

This is the highest-intent moment. They WANT more credits. The referral becomes a solution, not a sales pitch.

**Refinement 3: Founder's Pricing (First 100 Users)**
- $79/mo locked FOREVER (vs $99/mo standard)
- "Founding Member" badge on their profile and storefront
- Creates urgency without fake scarcity — there literally are only 100 spots
- Founders become evangelists because they're getting a deal nobody else can get
- Counter on landing page: "73 of 100 founding spots remaining"

**Refinement 4: Storefront as Viral Loop**
The "Powered by Know24" badge isn't just branding — it's a growth engine:
- Default: badge visible, user gets 10 bonus credits/month
- User can remove it, but they lose the 10 credits
- Most users will keep it (free credits > mild branding)
- Every storefront buyer sees it → curiosity click → landing page
- This is Shopify's exact playbook on free-tier stores

**Refinement 5: Tiered Milestones for Power Referrers**

| Referrals | Reward |
|---|---|
| 1 | Free month for both |
| 3 | "Community Builder" badge |
| 5 | 50 bonus credits |
| 10 | Permanent 10% discount ($89.10/mo forever) |
| 25 | Lifetime founding status (even if they weren't a founder) |

### Failure Modes to Avoid

1. **Launch-and-forget referral program** — Must actively promote it (dashboard banner, email nudges, post-generation prompts). Dropbox's referral only worked because it was deeply integrated into the product flow.
2. **Black hole referrals** — Always show referral status in real-time. "Sarah clicked your link!" → "Sarah signed up!" → "Sarah subscribed — you both earned a free month!" Dopamine at every step.
3. **Generic referral landing pages** — When someone clicks a referral link, they should see a PERSONALIZED page: "Your friend Sarah thinks you'd love Know24. Here's what she built:" + the referrer's best storefront product. Social proof from someone they actually know.
4. **Lifetime deals (LTDs)** — Never. AppSumo-style LTDs attract deal-hunters who never use the product, drain support resources, and create a cohort of users who resent any feature gating. The founder's pricing ($79/mo forever) gives the urgency without the toxicity.

### Growth Timeline

| Phase | Timeline | Strategy | Target |
|---|---|---|---|
| Pre-launch | 4 weeks before | Waitlist with "skip the line" referral mechanic | 500 waitlist signups |
| Founder's launch | Week 1-2 | 100 founding spots at $79/mo, personal onboarding | 100 paying users |
| Referral activation | Week 3+ | Two-sided rewards go live, credit-limit triggers active | 2-3x organic growth |
| Quarterly promos | Every 90 days | Double-reward weeks, seasonal themes | Sustained 15-20% MoM |
| Scale | Month 6+ | Product-led (storefronts, shareable reports, PDF watermarks) | Compound growth |

**The key insight:** Virality isn't a feature — it's a property of the product. The research narration is inherently shareable. The storefronts are inherently visible. The ebooks carry our brand. Every user interaction has a natural outward-facing surface. Our job isn't to CREATE virality — it's to remove friction from the virality that already exists in the product design.

---

## Section 17: Infrastructure Consolidation — 21 Services → 10

*Decision: March 12, 2026*

### The Problem

The original architecture had **21 external service dependencies**. That's 35+ environment variables, 21 potential points of failure, 21 billing relationships, and massive cognitive overhead. For a V1 focused on ebooks, this is over-engineered.

### Final V1 Stack (10 Services)

| Service | Role | Why This One |
|---|---|---|
| **Vercel** | Hosting (frontend + API + background jobs) | Already integrated, serverless, free tier generous |
| **Supabase** | Database + file storage + edge functions | Replaces R2, already has RLS, pgvector, storage with CDN |
| **Clerk** | Authentication | Already integrated, OAuth-first, multi-org |
| **Stripe** | Payments + Connect | Already integrated, handles subscriptions + creator payouts |
| **Google AI (Gemini)** | Primary LLM + image generation | Gemini 2.5 for drafts, Imagen 3 / Nano Banana 2 for covers — superior image quality vs OpenAI |
| **Anthropic (Claude)** | Polish LLM | Claude Sonnet for quality pass, content refinement, structured reasoning |
| **Firecrawl** | Web scraping / research | Autonomous agent for product analysis, competitor research |
| **Tavily** | Search API | Fast, LLM-optimized search results for research pipeline |
| **Resend** | Transactional email | Simple, React Email templates, reliable delivery |
| **Sentry** | Error tracking + performance | Free tier covers V1, captures crashes and slow queries |

### What Was Cut and Why

| Eliminated Service | Replaced By | Savings |
|---|---|---|
| **Railway** ($20+/mo container hosting) | **Inngest on Vercel** — serverless background jobs with retries, concurrency, step functions. Free tier: 25K runs/mo. Eliminates Docker worker deployment entirely. | ~$20/mo + DevOps complexity |
| **Cloudflare R2** (object storage) | **Supabase Storage** — S3-compatible, CDN-backed, already included in Supabase plan. One less service, one less credential set. | ~$5/mo + operational overhead |
| **Upstash Redis** (queue backend + rate limiting) | **Inngest** (replaces BullMQ queues) + **Vercel Edge Middleware** (rate limiting). No Redis dependency needed. | ~$10/mo |
| **BullMQ** (job queue library) | **Inngest** — same concept (background jobs, retries, concurrency controls), but serverless. No Redis required. | Dependency removal |
| **OpenAI** (LLM + images) | **Google AI** — Gemini 2.5 for text generation, Imagen 3 / Nano Banana 2 for cover images. Better image quality, competitive text generation pricing. | Comparable cost, better images |
| **Perplexity Sonar** (~$15-25/mo) | **Firecrawl + Tavily + our LLMs** — the research pipeline can synthesize with Claude/Gemini instead of paying for a third research API. | ~$20/mo |
| **PostHog** (product analytics) | **Vercel Analytics** (free, included) + **Sentry** (performance). Add PostHog later when we need funnels and feature flags at scale. | Complexity reduction |
| **Vercel Speed Insights** | Covered by **Sentry** performance monitoring | Redundancy removal |
| **Svix** (webhook management) | **Direct signature verification** — Clerk and Stripe both provide simple `verify()` functions. No need for a webhook management platform at this scale. | ~$0 savings but one less dependency |
| **ElevenLabs** (TTS audio) | **Dropped** — ebook-only V1, no audio products | ~$64/book saved |
| **HeyGen** (AI video) | **Dropped** — ebook-only V1, no video products | ~$3-5/video saved |

### Multi-Model Strategy (Revised)

| Task | Model | Cost (per 1M tokens) | Why |
|---|---|---|---|
| Ebook draft generation | Gemini 2.5 Flash | ~$0.15 input / $0.60 output | Fast, cheap, good quality drafts |
| Content polish & refinement | Claude Sonnet 4.5 | ~$3 input / $15 output | Best reasoning, catches inconsistencies, elevates prose |
| Cover image generation | Imagen 3 / Nano Banana 2 | ~$0.02-0.04 per image | Superior photorealistic and stylized output vs DALL-E |
| Research synthesis | Gemini 2.5 Pro | ~$1.25 input / $5 output | Strong at multi-source synthesis with long context |
| Voice transcription | Gemini 2.5 Flash (multimodal) | Included in token cost | Handles audio input natively, no separate Whisper API needed |

### Cost Impact

| Metric | Before (21 services) | After (10 services) |
|---|---|---|
| External services | 21 | 10 |
| ENV variables | ~35 | ~18 |
| Monthly hosting | ~$45 (Vercel + Railway) | ~$20 (Vercel only) |
| Monthly database + storage | ~$30 (Supabase + R2) | ~$25 (Supabase only) |
| Monthly queue/cache | ~$10 (Upstash) | $0 (Inngest free tier) |
| Monthly research APIs | ~$110 (Firecrawl + Tavily + Perplexity) | ~$90 (Firecrawl + Tavily) |
| Monthly analytics | ~$0 (free tiers) | ~$0 (free tiers) |
| **Estimated total** | **$300-500+/mo** | **$150-200/mo** |

### Migration Notes

**BullMQ → Inngest:** Each processor in `src/workers/processors/` becomes an Inngest function. Same logic, different wrapper. Example:

```typescript
// Before (BullMQ)
export async function processResearchNiche(job: Job) {
  const { nicheQuery, userId } = job.data;
  // ... research logic
}

// After (Inngest)
export const researchNiche = inngest.createFunction(
  { id: "research-niche", concurrency: { limit: 5 } },
  { event: "research/niche.requested" },
  async ({ event, step }) => {
    const { nicheQuery, userId } = event.data;
    // ... same research logic, but with step functions for durability
  }
);
```

**R2 → Supabase Storage:** Replace `@aws-sdk/client-s3` calls with `supabase.storage.from('bucket').upload()`. Create buckets: `ebooks`, `covers`, `research-exports`.

**OpenAI → Google AI:** Replace `@ai-sdk/openai` with `@ai-sdk/google`. The Vercel AI SDK abstracts the provider — most call sites just change the model string.

### The Inngest Advantage

Inngest isn't just "BullMQ but serverless" — it's fundamentally better for our use case:

1. **Step functions** — Research pipeline becomes: `step.run("scrape") → step.run("analyze") → step.run("synthesize")`. Each step is independently retryable. If step 3 fails, it doesn't re-run steps 1-2.
2. **No infrastructure** — No Redis, no Docker workers, no Railway. It runs on Vercel's infrastructure.
3. **Built-in observability** — Dashboard shows every function run, every step, timing, errors. No custom logging needed.
4. **Event-driven** — `inngest.send({ name: "ebook/generation.requested", data: { ... } })` from any API route. Clean decoupling.
5. **Free tier** — 25,000 runs/month. At our V1 scale, this is more than enough.

---

## Section 18: V1 Build Sequence (Revised for Consolidated Stack)

### Phase 0: Foundation (Days 1-3)

**Goal:** Stripped-down scaffold with consolidated services.

1. Clean out dead code (7 unused generators, audio/video libs, chatbot, advisor)
2. Remove unused dependencies (`elevenlabs`, `heygen`, `bullmq`, `ioredis`, `@aws-sdk/*`, `posthog-*`, `svix`, `@ai-sdk/openai`)
3. Add new dependencies (`inngest`, `@ai-sdk/google`)
4. Replace R2 storage calls with Supabase Storage
5. Set up Inngest client + serve route (`/api/inngest`)
6. Create new DB migration: credits table, credit_transactions, updated ebooks table
7. Verify Clerk + Stripe + Supabase + Sentry still work after cleanup

**QA Checkpoint:** App boots, auth works, database connects, Inngest dashboard accessible.

### Phase 1: Credit System + Research (Days 4-8)

**Goal:** User can sign up, get credits, run research, see results.

1. Credit system (balance, transactions, monthly reset)
2. Research pipeline as Inngest function (Firecrawl + Tavily → Gemini synthesis)
3. Research UI with real-time narration (SSE)
4. Proof Card display
5. Research caching (same niche = cached result)

**QA Checkpoint:** Sign up → 200 credits → enter niche → watch research → see Proof Card. Credits deducted correctly.

### Phase 2: Ebook Generation (Days 9-15)

**Goal:** Research → full ebook with cover → downloadable PDF.

1. Ebook generation as multi-step Inngest function (outline → chapters → polish → PDF)
2. Gemini 2.5 Flash for drafts, Claude Sonnet for polish pass
3. Cover generation with Imagen 3 (generate 4 → pick → regenerate)
4. Full-text chapter editor (edit any chapter post-generation)
5. PDF rendering via Puppeteer (professional formatting, TOC, copyright page)
6. Supabase Storage for PDF + cover files

**QA Checkpoint:** Generate ebook from research → review chapters → edit a chapter → pick cover → download PDF. Professional quality output.

### Phase 3: Storefront + Payments (Days 16-20)

**Goal:** User can sell their ebook through a Know24 storefront.

1. Storefront creation (theme selection, branding, slug)
2. Product listing (ebook → storefront product)
3. Stripe Connect onboarding for creators
4. Checkout flow (buyer → Stripe → creator gets paid)
5. Digital delivery (buyer gets PDF download link)
6. "Powered by Know24" badge with credit incentive

**QA Checkpoint:** Create storefront → list ebook → buy as test customer → creator receives payout → buyer downloads PDF.

### Phase 4: Scout + Distribution (Days 21-25)

**Goal:** Scout finds live opportunities to promote the ebook.

1. Scout as Inngest function (Reddit, X, LinkedIn, podcasts, bloggers)
2. Opportunity cards with relevance scoring
3. Draft outreach messages (Gemini generates contextual pitches)
4. Time-sensitive opportunity alerts
5. Scout scan history + credit tracking

**QA Checkpoint:** Run scout scan → see ranked opportunities → view draft outreach → opportunities feel specific and actionable (not generic).

### Phase 5: Polish + Launch Prep (Days 26-30)

**Goal:** Production-ready, delightful, ready for first 100 founders.

1. Referral system (auto-generated links, two-sided rewards, dashboard)
2. Founder's pricing ($79/mo locked, counter on landing page)
3. Landing page (single input, research teaser, social proof)
4. Onboarding flow polish (micro-interactions, loading states, error handling)
5. Email sequences (welcome, first-ebook celebration, credit-low nudge)
6. Security audit (OWASP top 10, RLS verification, no leaked keys)
7. Performance audit (LCP < 2.5s, FID < 100ms, CLS < 0.1)

**QA Checkpoint:** Full user journey end-to-end. Sign up → research → generate ebook → create storefront → run scout → share referral link. Everything feels fast, professional, and delightful.

