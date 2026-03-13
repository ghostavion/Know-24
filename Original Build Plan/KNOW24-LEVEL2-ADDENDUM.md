# Know24 Production Build Plan — Level 2 Addendum
# AI ADVISOR SYSTEM: Proactive Intelligence Layer

> **Document Type:** Addendum to KNOW24-PRODUCTION-BUILD-PLAN.md
> **Prerequisite:** Implement the main build plan FIRST. This addendum supplements it.
> **Audience:** AI coding assistants (Claude Code, Cursor) and senior developers.
> Every SQL block is executable. Every TypeScript interface is complete. Every prompt is production-grade.

---

## What Level 2 Means

The main build plan specifies a **Level 1 (Reactive)** AI system: the creator asks, the AI answers. The AI Workspace responds to commands. Scout finds opportunities when triggered. Blog posts generate on schedule.

This addendum upgrades Know24 to **Level 2 (Proactive Advisor)**:

- The AI **observes** the business continuously — sales trends, content performance, engagement patterns, knowledge gaps
- The AI **notices** things the creator might miss — milestones, declining metrics, untapped opportunities, stale content
- The AI **surfaces recommendations** via a smart inbox — not buried in data, but presented as actionable cards
- The AI **pre-drafts actions** — celebration emails, blog posts, pricing suggestions, product ideas
- The AI **NEVER acts autonomously** — every action requires the creator's explicit approval

The creator's experience shifts from "I need to go check things" to "My AI tells me what needs attention and has already started working on it."

---

## Table of Contents

- [A. AI Advisor Inbox — Concept](#a-ai-advisor-inbox--concept)
- [B. Database Changes](#b-database-changes)
- [C. AI Observation Engine](#c-ai-observation-engine)
- [D. Frontend: AI Advisor Inbox UI](#d-frontend-ai-advisor-inbox-ui)
- [E. Additional Optimizations](#e-additional-optimizations)
- [F. Milestone Impact](#f-milestone-impact)
- [G. CLAUDE.md and .cursorrules Additions](#g-claudemd-and-cursorrules-additions)

---

## A. AI Advisor Inbox — Concept

### What It Is

The AI Advisor Inbox is a **new core feature** added to the dashboard. It replaces the passive "Activity" sidebar item with an active, intelligent feed. Think of it as a daily briefing from a smart marketing strategist who has been watching your business overnight and prepared a set of recommendations.

**It is NOT a chat.** It is a feed of cards, each representing something the AI noticed, drafted, or recommends. The creator scrolls through, reviews, and acts.

### How It Differs from Activity

| Aspect | Old Activity Page | AI Advisor Inbox |
|--------|-------------------|------------------|
| Content | Chronological event log | Prioritized, categorized recommendations |
| Intelligence | None — raw events | AI-analyzed with context and reasoning |
| Actionability | "This happened" | "This happened, here's what to do, I already drafted it" |
| Drafts | None | Pre-written emails, posts, product tweaks |
| Priority | All equal | High / Medium / Low with visual hierarchy |
| Dismissal | Can't dismiss | Approve / Edit / Dismiss / Snooze |

### Card Anatomy

Every card in the Advisor Inbox has:

```
┌─────────────────────────────────────────────────────────────┐
│ [Category Icon]  HEADLINE                        [Priority] │
│                  Context sentence with relevant data         │
│                                                             │
│  ▸ Show full context & draft                                │
│                                                             │
│  [Approve]  [Edit]  [Dismiss]  [Snooze ▾]      2 hours ago │
└─────────────────────────────────────────────────────────────┘
```

- **Category icon**: Color-coded by type (sales, content, scout, product, alert, reminder)
- **Headline**: One sentence, action-oriented ("Your Playbook hit 50 sales — here's a celebration email draft")
- **Context**: Why this matters, with supporting data
- **Pre-drafted action**: The AI's suggested response (email, blog post, social post, product tweak, etc.)
- **Action buttons**: Approve (executes the draft), Edit (opens editor with draft pre-loaded), Dismiss (removes with optional reason), Snooze (re-surfaces later)
- **Timestamp and priority level**: High (red dot), Medium (amber dot), Low (gray dot)

### Seven Card Categories

| Category | Icon | Accent Color | Examples |
|----------|------|-------------|----------|
| `sales_insight` | TrendingUp | Green (#10b981) | Milestone reached, revenue trend change, conversion rate shift |
| `content_draft` | FileEdit | Blue (#3b82f6) | Blog post draft, social post draft, email draft |
| `scout_opportunity` | Radar | Orange (#f97316) | Top Scout results auto-surfaced, trending topic match |
| `product_idea` | Lightbulb | Purple (#8b5cf6) | New product suggestion based on demand signals |
| `performance_alert` | AlertTriangle | Red (#ef4444) | Metric drop, email open rate decline, traffic anomaly |
| `reminder` | Clock | Gray (#6b7280) | No new content in 7+ days, incomplete onboarding, stale knowledge base |
| `engagement_prompt` | Sparkles | Teal (#0891b2) | Suggested actions to boost engagement, re-engage dormant customers |

### Inbox Behavior Rules

1. **Maximum 10 pending items per business at any time.** If new items would exceed this, the lowest-priority items are auto-expired.
2. **Items expire after 14 days** if not acted upon (status changes to `expired`).
3. **Snoozed items re-appear** at the specified time.
4. **High-priority items** (performance alerts, time-sensitive opportunities) trigger a notification badge on the sidebar and optionally an email.
5. **Approved items** execute immediately: blog posts publish, emails send, product changes apply.
6. **The old Activity feed is preserved** as a tab within the Advisor Inbox ("Activity Log").

---

## B. Database Changes

### Custom Types

```sql
-- New ENUMs for the Advisor system
CREATE TYPE advisor_category AS ENUM (
  'sales_insight',
  'content_draft',
  'scout_opportunity',
  'product_idea',
  'performance_alert',
  'reminder',
  'engagement_prompt'
);

CREATE TYPE advisor_priority AS ENUM (
  'high', 'medium', 'low'
);

CREATE TYPE advisor_action_type AS ENUM (
  'send_email',
  'publish_blog',
  'publish_social',
  'update_product',
  'update_storefront',
  'trigger_scout',
  'create_product',
  'custom'
);

CREATE TYPE advisor_item_status AS ENUM (
  'pending', 'approved', 'dismissed', 'snoozed', 'expired'
);

CREATE TYPE advisor_rule_type AS ENUM (
  'content_frequency',
  'sales_milestone',
  'engagement_drop',
  'scout_auto',
  'product_suggestion',
  'pricing_review',
  'knowledge_gap'
);
```

---

### Table: `advisor_items`

```sql
-- Core table for the AI Advisor Inbox. Each row is one card in the feed.
CREATE TABLE public.advisor_items (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id       UUID NOT NULL REFERENCES public.businesses (id) ON DELETE CASCADE,
  -- Classification
  category          advisor_category NOT NULL,
  priority          advisor_priority NOT NULL DEFAULT 'medium',
  -- Content
  headline          TEXT NOT NULL,                    -- "Your Playbook hit 50 sales — here's a celebration email draft"
  context_summary   TEXT,                             -- Short summary shown on collapsed card
  context_data      JSONB NOT NULL DEFAULT '{}',      -- Structured data: metrics, chart data, links
  -- Pre-drafted action
  action_type       advisor_action_type,              -- What happens on Approve
  draft_content     JSONB NOT NULL DEFAULT '{}',      -- The pre-drafted action content
                                                      -- For send_email: { subject, body, recipient_list_id }
                                                      -- For publish_blog: { title, slug, body, cover_image_prompt }
                                                      -- For publish_social: { text, image_prompt, platform_hints }
                                                      -- For update_product: { product_id, changes: { price_cents, title, ... } }
                                                      -- For create_product: { product_type, title, description, suggested_price }
                                                      -- For trigger_scout: { scan_type, focus_keywords }
                                                      -- For custom: { instruction, display_text }
  -- Status
  status            advisor_item_status NOT NULL DEFAULT 'pending',
  snoozed_until     TIMESTAMPTZ,                     -- When to re-surface if snoozed
  -- Action timestamps
  approved_at       TIMESTAMPTZ,
  approved_result   JSONB,                           -- Result of the approved action (e.g., blog post ID, email send count)
  dismissed_at      TIMESTAMPTZ,
  dismissed_reason  TEXT,                             -- Optional reason for dismissal
  expired_at        TIMESTAMPTZ,
  -- Source tracking
  source_job_id     TEXT,                             -- BullMQ job ID that generated this item
  source_type       TEXT NOT NULL DEFAULT 'daily_analysis'
                      CHECK (source_type IN (
                        'daily_analysis', 'event_trigger', 'scout_auto',
                        'milestone_check', 'manual', 'weekly_digest'
                      )),
  -- Metadata
  metadata          JSONB NOT NULL DEFAULT '{}',      -- Arbitrary metadata for extensibility
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at        TIMESTAMPTZ
);

COMMENT ON TABLE public.advisor_items IS 'AI Advisor Inbox items. Each row is a proactive recommendation, draft, or alert surfaced by the observation engine.';

-- Primary query: pending items for a business, newest first
CREATE INDEX idx_advisor_items_business_status ON public.advisor_items (business_id, status)
  WHERE deleted_at IS NULL;

-- For dashboard count badge
CREATE INDEX idx_advisor_items_business_pending ON public.advisor_items (business_id)
  WHERE status = 'pending' AND deleted_at IS NULL;

-- For time-based queries (expiration, snooze re-surfacing)
CREATE INDEX idx_advisor_items_created_at ON public.advisor_items (created_at DESC);
CREATE INDEX idx_advisor_items_snoozed_until ON public.advisor_items (snoozed_until)
  WHERE status = 'snoozed' AND snoozed_until IS NOT NULL;

-- For filtering by category
CREATE INDEX idx_advisor_items_category ON public.advisor_items (business_id, category)
  WHERE deleted_at IS NULL;

-- Soft delete
CREATE INDEX idx_advisor_items_deleted_at ON public.advisor_items (deleted_at)
  WHERE deleted_at IS NULL;

CREATE TRIGGER trg_advisor_items_updated_at
  BEFORE UPDATE ON public.advisor_items
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE public.advisor_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "advisor_items_rw_business_member" ON public.advisor_items
  FOR ALL USING (business_id IN (SELECT auth.user_business_ids()));
```

---

### Table: `advisor_rules`

```sql
-- Creator-configurable rules for what the advisor monitors and how aggressively.
CREATE TABLE public.advisor_rules (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id     UUID NOT NULL REFERENCES public.businesses (id) ON DELETE CASCADE,
  -- Rule definition
  rule_type       advisor_rule_type NOT NULL,
  enabled         BOOLEAN NOT NULL DEFAULT true,
  -- Configuration (type-specific)
  config          JSONB NOT NULL DEFAULT '{}',
                  -- content_frequency:    { min_posts_per_week: 2, min_emails_per_month: 4 }
                  -- sales_milestone:      { milestones: [10, 25, 50, 100, 250, 500, 1000] }
                  -- engagement_drop:      { email_open_rate_floor: 20, traffic_drop_percent: 30 }
                  -- scout_auto:           { auto_surface_above_relevance: 0.80, max_auto_items: 5 }
                  -- product_suggestion:   { enabled: true, min_knowledge_gap_queries: 10 }
                  -- pricing_review:       { review_interval_days: 30, conversion_rate_floor: 5 }
                  -- knowledge_gap:        { min_unanswered_queries: 5, lookback_days: 30 }
  -- Metadata
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (business_id, rule_type)
);

COMMENT ON TABLE public.advisor_rules IS 'Per-business configuration for AI Advisor observation rules. Controls thresholds, frequency, and what gets surfaced.';

CREATE INDEX idx_advisor_rules_business_id ON public.advisor_rules (business_id);
CREATE INDEX idx_advisor_rules_enabled ON public.advisor_rules (business_id, enabled)
  WHERE enabled = true;

CREATE TRIGGER trg_advisor_rules_updated_at
  BEFORE UPDATE ON public.advisor_rules
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE public.advisor_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "advisor_rules_rw_business_member" ON public.advisor_rules
  FOR ALL USING (business_id IN (SELECT auth.user_business_ids()));

-- Seed default rules when a business is created (via trigger)
CREATE OR REPLACE FUNCTION create_default_advisor_rules()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO public.advisor_rules (business_id, rule_type, config) VALUES
    (NEW.id, 'content_frequency',  '{"min_posts_per_week": 1, "min_emails_per_month": 2, "reminder_after_days": 7}'),
    (NEW.id, 'sales_milestone',    '{"milestones": [10, 25, 50, 100, 250, 500, 1000]}'),
    (NEW.id, 'engagement_drop',    '{"email_open_rate_floor": 20, "traffic_drop_percent": 30, "lookback_days": 7}'),
    (NEW.id, 'scout_auto',         '{"auto_surface_above_relevance": 0.80, "max_auto_items": 5}'),
    (NEW.id, 'product_suggestion', '{"enabled": true, "min_knowledge_gap_queries": 10}'),
    (NEW.id, 'pricing_review',     '{"review_interval_days": 30, "conversion_rate_floor": 5}'),
    (NEW.id, 'knowledge_gap',      '{"min_unanswered_queries": 5, "lookback_days": 30}');
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_business_create_advisor_rules
  AFTER INSERT ON public.businesses
  FOR EACH ROW EXECUTE FUNCTION create_default_advisor_rules();
```

---

### Table: `advisor_daily_analysis`

```sql
-- Cached daily business analysis. One per business per day.
-- Prevents re-running expensive AI analysis if the creator checks multiple times.
CREATE TABLE public.advisor_daily_analysis (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id       UUID NOT NULL REFERENCES public.businesses (id) ON DELETE CASCADE,
  analysis_date     DATE NOT NULL,
  -- Snapshot of key metrics at analysis time
  metrics_snapshot  JSONB NOT NULL DEFAULT '{}',
                    -- {
                    --   sales_7d: { count, revenue_cents, avg_order_cents },
                    --   sales_30d: { count, revenue_cents, avg_order_cents },
                    --   sales_trend: "accelerating" | "stable" | "decelerating",
                    --   traffic_7d: { page_views, unique_visitors },
                    --   email_list_size: number,
                    --   email_list_growth_7d: number,
                    --   blog_views_7d: number,
                    --   chatbot_queries_7d: number,
                    --   social_posts_generated: number,
                    --   scout_opportunities_pending: number,
                    --   last_content_published_at: timestamp,
                    --   last_login_at: timestamp
                    -- }
  -- AI-generated insights
  insights          JSONB NOT NULL DEFAULT '[]',
                    -- Array of insight objects:
                    -- [
                    --   {
                    --     category: "sales_insight",
                    --     priority: "high",
                    --     headline: "...",
                    --     context: "...",
                    --     suggested_action: { ... },
                    --     confidence: 0.85
                    --   }
                    -- ]
  -- Generation metadata
  model_used        TEXT,                            -- e.g. "claude-sonnet-4-5"
  tokens_used       INT,
  generation_cost_cents INT,
  generated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Metadata
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (business_id, analysis_date)
);

COMMENT ON TABLE public.advisor_daily_analysis IS 'Cached daily AI analysis per business. Generated by the daily observation job, consumed by advisor item creation.';

CREATE INDEX idx_advisor_daily_analysis_business_date ON public.advisor_daily_analysis (business_id, analysis_date DESC);

ALTER TABLE public.advisor_daily_analysis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "advisor_daily_analysis_rw_business_member" ON public.advisor_daily_analysis
  FOR ALL USING (business_id IN (SELECT auth.user_business_ids()));
```

---

### Table: `onboarding_progress` (Optimization E.1)

```sql
-- Tracks step-by-step onboarding completion for recovery emails.
CREATE TABLE public.onboarding_progress (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           UUID NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  business_id       UUID REFERENCES public.businesses (id) ON DELETE CASCADE,
  -- Step tracking
  current_step      INT NOT NULL DEFAULT 1 CHECK (current_step BETWEEN 1 AND 5),
  steps_completed   JSONB NOT NULL DEFAULT '{}',
                    -- { "1": { completed_at, data_summary }, "2": { ... } }
  -- Recovery
  abandoned_at      TIMESTAMPTZ,                     -- Set when no progress for 24h
  recovery_emails_sent INT NOT NULL DEFAULT 0,
  last_recovery_email_at TIMESTAMPTZ,
  -- Completion
  completed_at      TIMESTAMPTZ,
  -- Metadata
  started_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_activity_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.onboarding_progress IS 'Tracks onboarding completion step-by-step for recovery emails and admin visibility.';

CREATE INDEX idx_onboarding_progress_user_id ON public.onboarding_progress (user_id);
CREATE INDEX idx_onboarding_progress_abandoned ON public.onboarding_progress (abandoned_at)
  WHERE completed_at IS NULL AND abandoned_at IS NOT NULL;

CREATE TRIGGER trg_onboarding_progress_updated_at
  BEFORE UPDATE ON public.onboarding_progress
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE public.onboarding_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "onboarding_progress_own" ON public.onboarding_progress
  FOR ALL USING (
    user_id IN (SELECT id FROM public.users WHERE clerk_user_id = auth.jwt()->>'sub')
  );
```

---

### Table: `product_health_scores` (Optimization E.2)

```sql
-- AI-generated health score per product, recalculated daily.
CREATE TABLE public.product_health_scores (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id        UUID NOT NULL REFERENCES public.products (id) ON DELETE CASCADE,
  business_id       UUID NOT NULL REFERENCES public.businesses (id) ON DELETE CASCADE,
  score_date        DATE NOT NULL,
  -- Component scores (0.0 – 1.0)
  sales_velocity_score    FLOAT NOT NULL DEFAULT 0.5,
  conversion_rate_score   FLOAT NOT NULL DEFAULT 0.5,
  satisfaction_score      FLOAT NOT NULL DEFAULT 0.5,  -- based on reviews, if any
  relative_performance    FLOAT NOT NULL DEFAULT 0.5,  -- vs. similar products on platform
  -- Composite
  overall_score           FLOAT NOT NULL GENERATED ALWAYS AS (
    (sales_velocity_score * 0.35 +
     conversion_rate_score * 0.30 +
     satisfaction_score * 0.15 +
     relative_performance * 0.20)
  ) STORED,
  -- Supporting data
  metrics_data      JSONB NOT NULL DEFAULT '{}',
                    -- {
                    --   views_7d, views_30d, sales_7d, sales_30d,
                    --   conversion_rate_7d, conversion_rate_30d,
                    --   avg_rating, review_count,
                    --   velocity_trend: "accelerating" | "stable" | "decelerating"
                    -- }
  ai_summary        TEXT,                             -- "This product is converting well but sales are slowing"
  -- Metadata
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (product_id, score_date)
);

COMMENT ON TABLE public.product_health_scores IS 'Daily AI-generated health score per product. Feeds into advisor insights.';

CREATE INDEX idx_product_health_scores_product_date ON public.product_health_scores (product_id, score_date DESC);
CREATE INDEX idx_product_health_scores_business_date ON public.product_health_scores (business_id, score_date DESC);
CREATE INDEX idx_product_health_scores_low ON public.product_health_scores (business_id, score_date)
  WHERE overall_score < 0.4;

ALTER TABLE public.product_health_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "product_health_scores_rw_business_member" ON public.product_health_scores
  FOR ALL USING (business_id IN (SELECT auth.user_business_ids()));
```

---

### Table: `chatbot_unanswered_queries` (Optimization E.4)

```sql
-- Tracks questions the chatbot couldn't answer from the knowledge base.
-- Used for knowledge gap detection.
CREATE TABLE public.chatbot_unanswered_queries (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id       UUID NOT NULL REFERENCES public.businesses (id) ON DELETE CASCADE,
  -- Query details
  query_text        TEXT NOT NULL,
  query_topic       TEXT,                             -- AI-classified topic
  -- Context
  session_id        UUID,                             -- chatbot conversation session
  best_match_similarity FLOAT,                        -- highest cosine similarity found
  response_given    TEXT,                             -- what the chatbot actually said
  -- Classification
  is_in_scope       BOOLEAN NOT NULL DEFAULT true,    -- false if clearly outside creator's domain
  knowledge_area    TEXT,                             -- e.g. "pediatric nursing"
  -- Status
  addressed         BOOLEAN NOT NULL DEFAULT false,   -- true after knowledge base is updated
  addressed_at      TIMESTAMPTZ,
  -- Metadata
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.chatbot_unanswered_queries IS 'Questions the chatbot could not confidently answer. Feeds knowledge gap detection and product idea generation.';

CREATE INDEX idx_chatbot_unanswered_business ON public.chatbot_unanswered_queries (business_id, created_at DESC);
CREATE INDEX idx_chatbot_unanswered_topic ON public.chatbot_unanswered_queries (business_id, knowledge_area)
  WHERE addressed = false AND is_in_scope = true;

ALTER TABLE public.chatbot_unanswered_queries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "chatbot_unanswered_rw_business_member" ON public.chatbot_unanswered_queries
  FOR ALL USING (business_id IN (SELECT auth.user_business_ids()));
```

---

### Table: `creator_engagement_metrics` (Optimization E.5)

```sql
-- Tracks creator platform engagement for health monitoring and digest cadence.
CREATE TABLE public.creator_engagement_metrics (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           UUID NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  metric_date       DATE NOT NULL,
  -- Activity counts
  login_count       INT NOT NULL DEFAULT 0,
  advisor_items_reviewed INT NOT NULL DEFAULT 0,
  advisor_items_approved INT NOT NULL DEFAULT 0,
  advisor_items_dismissed INT NOT NULL DEFAULT 0,
  products_edited   INT NOT NULL DEFAULT 0,
  workspace_messages INT NOT NULL DEFAULT 0,
  posts_generated   INT NOT NULL DEFAULT 0,
  -- Session data
  total_session_seconds INT NOT NULL DEFAULT 0,
  -- Engagement score (0.0–1.0, calculated)
  engagement_score  FLOAT NOT NULL DEFAULT 0.0,
  -- Metadata
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, metric_date)
);

COMMENT ON TABLE public.creator_engagement_metrics IS 'Daily creator engagement tracking. Used for digest email cadence and engagement health alerts.';

CREATE INDEX idx_creator_engagement_user_date ON public.creator_engagement_metrics (user_id, metric_date DESC);

CREATE TRIGGER trg_creator_engagement_updated_at
  BEFORE UPDATE ON public.creator_engagement_metrics
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE public.creator_engagement_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "creator_engagement_own" ON public.creator_engagement_metrics
  FOR ALL USING (
    user_id IN (SELECT id FROM public.users WHERE clerk_user_id = auth.jwt()->>'sub')
  );
```

---

### Migration: Add `activity_event_type` Values

```sql
-- Extend the existing activity_event_type enum for advisor actions
ALTER TYPE activity_event_type ADD VALUE IF NOT EXISTS 'advisor_item_created';
ALTER TYPE activity_event_type ADD VALUE IF NOT EXISTS 'advisor_item_approved';
ALTER TYPE activity_event_type ADD VALUE IF NOT EXISTS 'advisor_item_dismissed';
ALTER TYPE activity_event_type ADD VALUE IF NOT EXISTS 'weekly_digest_sent';
```

---

## C. AI Observation Engine

The Observation Engine is the background job system that powers Level 2. It consists of a daily analysis job, event-triggered observers, and the item generation pipeline.

### C.1 Queue Configuration

Add to the existing `/lib/queue/config.ts`:

```typescript
// Append to existing QUEUES constant
export const QUEUES = {
  // ... existing queues from main build plan ...
  ADVISOR_DAILY_ANALYSIS: 'advisor:daily-analysis',
  ADVISOR_EVENT_OBSERVATION: 'advisor:event-observation',
  ADVISOR_ITEM_EXECUTION: 'advisor:item-execution',
  ADVISOR_WEEKLY_DIGEST: 'advisor:weekly-digest',
  ADVISOR_ONBOARDING_RECOVERY: 'advisor:onboarding-recovery',
  ADVISOR_PRODUCT_HEALTH: 'advisor:product-health',
} as const;
```

| Queue | Priority | Concurrency | Timeout | Retry Attempts | Retry Backoff | Dead Letter |
|-------|---------|-------------|---------|---------------|---------------|-------------|
| `advisor:daily-analysis` | Low (3) | 3 | 120s | 2 | Exp. 15s | ✓ |
| `advisor:event-observation` | Medium (2) | 10 | 30s | 3 | Exp. 5s | ✓ |
| `advisor:item-execution` | High (1) | 5 | 60s | 3 | Exp. 5s | ✓ |
| `advisor:weekly-digest` | Low (3) | 5 | 30s | 3 | Exp. 10s | ✓ |
| `advisor:onboarding-recovery` | Low (3) | 5 | 15s | 3 | Exp. 5s | ✓ |
| `advisor:product-health` | Low (3) | 3 | 60s | 2 | Exp. 10s | ✓ |

---

### C.2 Daily Business Analysis Job

Runs once per day per active business. Scheduled at 7 AM UTC (2 AM EST). The worker fetches all active businesses and creates one job per business, staggered by 2 seconds to avoid thundering herd.

#### Scheduler Registration

Add to existing `/lib/queue/scheduler.ts`:

```typescript
// Daily business analysis — 7 AM UTC every day
await advisorDailyAnalysisQueue.add(
  'daily-analysis-trigger',
  { type: 'scheduled', triggerAll: true },
  {
    repeat: { pattern: '0 7 * * *' },
    priority: 3,
  }
);

// Weekly digest — Monday 8 AM UTC (3 AM EST)
await advisorWeeklyDigestQueue.add(
  'weekly-digest-trigger',
  { type: 'scheduled', triggerAll: true },
  {
    repeat: { pattern: '0 8 * * 1' },
    priority: 3,
  }
);

// Onboarding recovery check — every 6 hours
await advisorOnboardingRecoveryQueue.add(
  'onboarding-recovery-check',
  { type: 'scheduled' },
  {
    repeat: { pattern: '0 */6 * * *' },
    priority: 3,
  }
);

// Product health scoring — daily at 6 AM UTC (before daily analysis)
await advisorProductHealthQueue.add(
  'product-health-scoring',
  { type: 'scheduled', triggerAll: true },
  {
    repeat: { pattern: '0 6 * * *' },
    priority: 3,
  }
);

// Snooze re-surfacing — every 15 minutes
await advisorEventObservationQueue.add(
  'snooze-resurface',
  { type: 'snooze_check' },
  {
    repeat: { pattern: '*/15 * * * *' },
    priority: 3,
  }
);

// Advisor item expiration — nightly at 2 AM UTC
await advisorEventObservationQueue.add(
  'expire-stale-items',
  { type: 'expiration_check' },
  {
    repeat: { pattern: '0 2 * * *' },
    priority: 3,
  }
);
```

#### Worker Implementation

```typescript
// /workers/advisor-daily-analysis-worker.ts

import { Worker, Job } from 'bullmq';
import { connection, QUEUES, createQueue } from '../lib/queue/config';
import { createServiceClient } from '../lib/supabase/service';
import { generateStructuredOutput } from '../lib/ai/generate';
import { z } from 'zod';

const advisorItemQueue = createQueue(QUEUES.ADVISOR_EVENT_OBSERVATION);

// Job data schemas
const DailyAnalysisTriggerSchema = z.object({
  type: z.literal('scheduled'),
  triggerAll: z.literal(true),
});

const DailyAnalysisBusinessSchema = z.object({
  type: z.literal('analyze_business'),
  businessId: z.string().uuid(),
});

const worker = new Worker(
  QUEUES.ADVISOR_DAILY_ANALYSIS,
  async (job: Job) => {
    if (job.data.type === 'scheduled') {
      // Trigger phase: create one job per active business
      const supabase = createServiceClient();
      const { data: businesses } = await supabase
        .from('businesses')
        .select('id')
        .eq('status', 'active')
        .is('deleted_at', null);

      if (!businesses?.length) return;

      const queue = createQueue(QUEUES.ADVISOR_DAILY_ANALYSIS);
      for (let i = 0; i < businesses.length; i++) {
        await queue.add(
          'analyze-business',
          { type: 'analyze_business', businessId: businesses[i].id },
          {
            priority: 3,
            delay: i * 2000, // Stagger by 2 seconds
          }
        );
      }

      return { businessesQueued: businesses.length };
    }

    if (job.data.type === 'analyze_business') {
      const { businessId } = DailyAnalysisBusinessSchema.parse(job.data);
      const supabase = createServiceClient();

      await job.updateProgress(10);

      // ── Step 1: Pull metrics ──────────────────────────────────

      const today = new Date();
      const sevenDaysAgo = new Date(today.getTime() - 7 * 86400000);
      const thirtyDaysAgo = new Date(today.getTime() - 30 * 86400000);
      const prevSevenDaysAgo = new Date(today.getTime() - 14 * 86400000);
      const prevThirtyDaysAgo = new Date(today.getTime() - 60 * 86400000);

      // Sales metrics (current vs. previous period)
      const [sales7d, salesPrev7d, sales30d, salesPrev30d] = await Promise.all([
        supabase.from('orders')
          .select('total_cents')
          .eq('business_id', businessId)
          .eq('status', 'completed')
          .gte('created_at', sevenDaysAgo.toISOString()),
        supabase.from('orders')
          .select('total_cents')
          .eq('business_id', businessId)
          .eq('status', 'completed')
          .gte('created_at', prevSevenDaysAgo.toISOString())
          .lt('created_at', sevenDaysAgo.toISOString()),
        supabase.from('orders')
          .select('total_cents')
          .eq('business_id', businessId)
          .eq('status', 'completed')
          .gte('created_at', thirtyDaysAgo.toISOString()),
        supabase.from('orders')
          .select('total_cents')
          .eq('business_id', businessId)
          .eq('status', 'completed')
          .gte('created_at', prevThirtyDaysAgo.toISOString())
          .lt('created_at', thirtyDaysAgo.toISOString()),
      ]);

      // Blog, email, product, and chatbot metrics
      const [blogPosts, emailListResult, products, recentChatbotQueries, lastBlogPost, unansweredQueries] = await Promise.all([
        supabase.from('blog_posts')
          .select('id, view_count, published_at')
          .eq('business_id', businessId)
          .eq('status', 'published')
          .gte('published_at', thirtyDaysAgo.toISOString()),
        supabase.from('email_subscribers')
          .select('id', { count: 'exact' })
          .eq('business_id', businessId),
        supabase.from('products')
          .select('id, title, price_cents, status')
          .eq('business_id', businessId)
          .eq('status', 'active')
          .is('deleted_at', null),
        supabase.from('chatbot_conversations')
          .select('id', { count: 'exact' })
          .eq('business_id', businessId)
          .gte('created_at', sevenDaysAgo.toISOString()),
        supabase.from('blog_posts')
          .select('published_at')
          .eq('business_id', businessId)
          .eq('status', 'published')
          .order('published_at', { ascending: false })
          .limit(1),
        supabase.from('chatbot_unanswered_queries')
          .select('query_topic, knowledge_area', { count: 'exact' })
          .eq('business_id', businessId)
          .eq('addressed', false)
          .eq('is_in_scope', true)
          .gte('created_at', thirtyDaysAgo.toISOString()),
      ]);

      await job.updateProgress(30);

      // ── Step 2: Assemble metrics snapshot ─────────────────────

      const salesCount7d = sales7d.data?.length ?? 0;
      const salesRevenue7d = sales7d.data?.reduce((sum, o) => sum + o.total_cents, 0) ?? 0;
      const salesCountPrev7d = salesPrev7d.data?.length ?? 0;
      const salesRevenuePrev7d = salesPrev7d.data?.reduce((sum, o) => sum + o.total_cents, 0) ?? 0;

      const salesCount30d = sales30d.data?.length ?? 0;
      const salesRevenue30d = sales30d.data?.reduce((sum, o) => sum + o.total_cents, 0) ?? 0;
      const salesCountPrev30d = salesPrev30d.data?.length ?? 0;
      const salesRevenuePrev30d = salesPrev30d.data?.reduce((sum, o) => sum + o.total_cents, 0) ?? 0;

      const metricsSnapshot = {
        sales_7d: {
          count: salesCount7d,
          revenue_cents: salesRevenue7d,
          avg_order_cents: salesCount7d > 0 ? Math.round(salesRevenue7d / salesCount7d) : 0,
        },
        sales_30d: {
          count: salesCount30d,
          revenue_cents: salesRevenue30d,
          avg_order_cents: salesCount30d > 0 ? Math.round(salesRevenue30d / salesCount30d) : 0,
        },
        sales_wow: {
          count_change: salesCountPrev7d > 0 ? ((salesCount7d - salesCountPrev7d) / salesCountPrev7d * 100) : 0,
          revenue_change: salesRevenuePrev7d > 0 ? ((salesRevenue7d - salesRevenuePrev7d) / salesRevenuePrev7d * 100) : 0,
        },
        sales_mom: {
          count_change: salesCountPrev30d > 0 ? ((salesCount30d - salesCountPrev30d) / salesCountPrev30d * 100) : 0,
          revenue_change: salesRevenuePrev30d > 0 ? ((salesRevenue30d - salesRevenuePrev30d) / salesRevenuePrev30d * 100) : 0,
        },
        blog_posts_30d: blogPosts.data?.length ?? 0,
        blog_views_30d: blogPosts.data?.reduce((sum, p) => sum + (p.view_count ?? 0), 0) ?? 0,
        email_list_size: emailListResult.count ?? 0,
        active_products: products.data?.length ?? 0,
        chatbot_queries_7d: recentChatbotQueries.count ?? 0,
        days_since_last_content: lastBlogPost.data?.[0]?.published_at
          ? Math.floor((today.getTime() - new Date(lastBlogPost.data[0].published_at).getTime()) / 86400000)
          : 999,
        unanswered_chatbot_queries_30d: unansweredQueries.count ?? 0,
      };

      await job.updateProgress(50);

      // ── Step 3: AI Analysis ───────────────────────────────────

      // Fetch the business info for context
      const { data: business } = await supabase
        .from('businesses')
        .select('name, niche, tagline')
        .eq('id', businessId)
        .single();

      // Fetch product health scores for today
      const { data: healthScores } = await supabase
        .from('product_health_scores')
        .select('product_id, overall_score, ai_summary, metrics_data')
        .eq('business_id', businessId)
        .eq('score_date', today.toISOString().split('T')[0]);

      // Fetch advisor rules for this business
      const { data: rules } = await supabase
        .from('advisor_rules')
        .select('rule_type, enabled, config')
        .eq('business_id', businessId)
        .eq('enabled', true);

      const InsightSchema = z.object({
        insights: z.array(z.object({
          category: z.enum([
            'sales_insight', 'content_draft', 'scout_opportunity',
            'product_idea', 'performance_alert', 'reminder', 'engagement_prompt'
          ]),
          priority: z.enum(['high', 'medium', 'low']),
          headline: z.string(),
          context_summary: z.string(),
          context_data: z.record(z.unknown()).optional(),
          suggested_action: z.object({
            action_type: z.enum([
              'send_email', 'publish_blog', 'publish_social',
              'update_product', 'update_storefront', 'trigger_scout',
              'create_product', 'custom'
            ]),
            draft: z.record(z.unknown()),
          }).optional(),
          confidence: z.number().min(0).max(1),
        })),
      });

      const analysisResult = await generateStructuredOutput(
        InsightSchema,
        DAILY_ANALYSIS_SYSTEM_PROMPT,
        buildDailyAnalysisUserPrompt(business, metricsSnapshot, healthScores, rules),
        'heavy'
      );

      await job.updateProgress(80);

      // ── Step 4: Store analysis and create advisor items ────────

      // Store the daily analysis
      await supabase.from('advisor_daily_analysis').upsert({
        business_id: businessId,
        analysis_date: today.toISOString().split('T')[0],
        metrics_snapshot: metricsSnapshot,
        insights: analysisResult.insights,
        model_used: 'claude-sonnet-4-5',
        generated_at: new Date().toISOString(),
      }, {
        onConflict: 'business_id,analysis_date',
      });

      // Check current pending count
      const { count: pendingCount } = await supabase
        .from('advisor_items')
        .select('id', { count: 'exact' })
        .eq('business_id', businessId)
        .eq('status', 'pending')
        .is('deleted_at', null);

      const maxPending = 10;
      const availableSlots = Math.max(0, maxPending - (pendingCount ?? 0));

      // Create advisor items from insights (respect the max-pending cap)
      const insightsToCreate = analysisResult.insights
        .filter(i => i.confidence >= 0.6) // Only surface confident insights
        .slice(0, availableSlots);

      for (const insight of insightsToCreate) {
        await supabase.from('advisor_items').insert({
          business_id: businessId,
          category: insight.category,
          priority: insight.priority,
          headline: insight.headline,
          context_summary: insight.context_summary,
          context_data: insight.context_data ?? {},
          action_type: insight.suggested_action?.action_type ?? null,
          draft_content: insight.suggested_action?.draft ?? {},
          source_type: 'daily_analysis',
          source_job_id: job.id,
        });
      }

      await job.updateProgress(100);

      return {
        businessId,
        metricsSnapshot,
        insightsGenerated: analysisResult.insights.length,
        itemsCreated: insightsToCreate.length,
      };
    }
  },
  {
    connection,
    concurrency: 3,
    limiter: { max: 10, duration: 60000 },
  }
);

worker.on('failed', async (job, err) => {
  console.error(`[ADVISOR_DAILY] Job ${job?.id} failed:`, err);
  // Don't alert Sentry for individual business failures unless persistent
});
```

---

### C.3 Daily Analysis System Prompt

```
SYSTEM: You are a business intelligence analyst for Know24, an AI-powered knowledge business platform. Your job is to analyze a creator's business metrics and generate actionable insights with pre-drafted responses.

## Creator Context
Business name: [BUSINESS_NAME]
Niche: [NICHE]

## Your Analysis Framework

Analyze the provided metrics and generate insights in these categories:

### 1. Sales Insights
- Look for: milestones (round numbers), acceleration/deceleration, unusual spikes/drops
- If revenue grew >20% WoW → high priority celebration + suggest amplification
- If revenue dropped >15% WoW → high priority alert + diagnose likely causes
- If a product hits a milestone (10, 25, 50, 100 sales) → medium priority + draft celebration email

### 2. Content Recommendations
- If no blog post in 7+ days → medium priority reminder with 3 topic suggestions
- If a blog post got >2x average views → suggest social amplification
- Draft blog posts should be 400-600 words, SEO-optimized, in the creator's domain
- Draft social posts should be platform-ready with hashtag suggestions

### 3. Product Ideas
- Cross-reference chatbot unanswered queries with existing products
- If 5+ queries in an uncovered topic → suggest a new product
- If a product type the creator doesn't have is popular in their niche → suggest it
- Include suggested title, type, and price point

### 4. Performance Alerts
- Email open rate below 20% → suggest subject line refresh with examples
- Traffic drop >30% WoW → diagnose and suggest fixes
- Product conversion rate below 3% → suggest pricing or description changes

### 5. Engagement Prompts
- If creator hasn't logged in for 3+ days → generate a summary of what they missed
- If Scout opportunities are pending → remind with top-3 list
- If email list grew but no nurture email was sent → prompt action

### 6. Reminders
- No new content in 7+ days → content reminder
- Products with no updates in 30+ days → suggest refresh
- Knowledge base not updated in 60+ days → suggest adding new content

## Quality Rules
- Maximum 5 insights per analysis. Prioritize the most impactful ones.
- Every insight must be specific to THIS business with THIS data — no generic advice.
- Headlines must be action-oriented and include specific numbers: "Your Playbook hit 50 sales" not "Sales are doing well."
- Draft content must be ready to publish with minimal editing.
- Confidence score: 0.9+ for data-driven insights (milestones, metrics), 0.7-0.9 for pattern-based (trends), 0.5-0.7 for speculative (product ideas). Never surface below 0.5.
- Do NOT generate insights for metrics that have insufficient data (e.g., a business with 0 sales shouldn't get sales trend analysis).

## Output Format
Return a JSON object with an "insights" array. Each insight follows the schema provided.
For draft content, include complete, ready-to-use text — not placeholders.
```

#### User Prompt Builder

```typescript
// /lib/ai/prompts/daily-analysis.ts

export function buildDailyAnalysisUserPrompt(
  business: { name: string; niche: string; tagline: string },
  metrics: Record<string, unknown>,
  healthScores: Array<{
    product_id: string;
    overall_score: number;
    ai_summary: string;
    metrics_data: Record<string, unknown>;
  }> | null,
  rules: Array<{
    rule_type: string;
    enabled: boolean;
    config: Record<string, unknown>;
  }> | null
): string {
  return `## Business
Name: ${business.name}
Niche: ${business.niche ?? 'Not specified'}
Tagline: ${business.tagline ?? 'Not specified'}

## Current Metrics Snapshot
${JSON.stringify(metrics, null, 2)}

## Product Health Scores
${healthScores?.length
  ? healthScores.map(h => `- Product ${h.product_id}: Score ${h.overall_score.toFixed(2)} — ${h.ai_summary}`).join('\n')
  : 'No product health data available yet.'
}

## Active Advisor Rules
${rules?.length
  ? rules.map(r => `- ${r.rule_type}: ${JSON.stringify(r.config)}`).join('\n')
  : 'Using defaults.'
}

## Instructions
Analyze the above data and generate up to 5 prioritized insights. Focus on the most impactful, actionable items. If there is insufficient data for a category (e.g., zero sales), skip it rather than generating generic advice.`;
}
```

---

### C.4 Event-Triggered Observations

These run in real-time in response to specific business events. Implemented as event listeners that enqueue jobs on the `advisor:event-observation` queue.

#### Event Listener Configuration

```typescript
// /lib/advisor/event-listeners.ts

import { createQueue } from '../queue/config';

const observationQueue = createQueue('advisor:event-observation');

// ── Trigger: New Sale ────────────────────────────────────────

export async function onNewSale(
  businessId: string,
  orderId: string,
  productId: string,
  totalCents: number
) {
  await observationQueue.add('sale-observation', {
    type: 'new_sale',
    businessId,
    orderId,
    productId,
    totalCents,
  }, { priority: 2 });
}

// ── Trigger: Scout Scan Completes ────────────────────────────

export async function onScoutScanComplete(
  businessId: string,
  scanId: string,
  opportunityCount: number
) {
  await observationQueue.add('scout-observation', {
    type: 'scout_complete',
    businessId,
    scanId,
    opportunityCount,
  }, { priority: 2 });
}

// ── Trigger: Blog Post Published ─────────────────────────────

export async function onBlogPostPublished(
  businessId: string,
  postId: string
) {
  // Schedule a traffic check 48 hours later
  await observationQueue.add('blog-traffic-check', {
    type: 'blog_traffic_check',
    businessId,
    postId,
  }, { priority: 3, delay: 48 * 60 * 60 * 1000 }); // 48h delay
}

// ── Trigger: Email Sequence Metrics ──────────────────────────

export async function onEmailMetricsUpdate(
  businessId: string,
  sequenceId: string,
  openRate: number,
  clickRate: number
) {
  if (openRate < 20) {
    await observationQueue.add('email-alert', {
      type: 'email_open_rate_drop',
      businessId,
      sequenceId,
      openRate,
      clickRate,
    }, { priority: 2 });
  }
}

// ── Trigger: Chatbot Unanswered Query ────────────────────────

export async function onChatbotUnansweredQuery(
  businessId: string,
  queryText: string,
  bestSimilarity: number,
  classifiedTopic: string
) {
  // Store the unanswered query
  const supabase = createServiceClient();
  await supabase.from('chatbot_unanswered_queries').insert({
    business_id: businessId,
    query_text: queryText,
    query_topic: classifiedTopic,
    best_match_similarity: bestSimilarity,
    is_in_scope: bestSimilarity > 0.3, // Very low similarity suggests out of scope
    knowledge_area: classifiedTopic,
  });

  // Check if we've hit the threshold for a knowledge gap alert
  const { count } = await supabase
    .from('chatbot_unanswered_queries')
    .select('id', { count: 'exact' })
    .eq('business_id', businessId)
    .eq('knowledge_area', classifiedTopic)
    .eq('addressed', false)
    .eq('is_in_scope', true)
    .gte('created_at', new Date(Date.now() - 30 * 86400000).toISOString());

  const { data: rule } = await supabase
    .from('advisor_rules')
    .select('config')
    .eq('business_id', businessId)
    .eq('rule_type', 'knowledge_gap')
    .eq('enabled', true)
    .single();

  const threshold = (rule?.config as Record<string, number>)?.min_unanswered_queries ?? 5;

  if ((count ?? 0) >= threshold) {
    await observationQueue.add('knowledge-gap-alert', {
      type: 'knowledge_gap_detected',
      businessId,
      knowledgeArea: classifiedTopic,
      queryCount: count,
    }, { priority: 2 });
  }
}
```

#### Event Observation Worker

```typescript
// /workers/advisor-event-observation-worker.ts

import { Worker, Job } from 'bullmq';
import { connection, QUEUES } from '../lib/queue/config';
import { createServiceClient } from '../lib/supabase/service';
import { generateStructuredOutput, streamAIResponse } from '../lib/ai/generate';
import { z } from 'zod';

const worker = new Worker(
  QUEUES.ADVISOR_EVENT_OBSERVATION,
  async (job: Job) => {
    const supabase = createServiceClient();

    switch (job.data.type) {

      // ── New Sale → Milestone Check ─────────────────────────
      case 'new_sale': {
        const { businessId, productId, totalCents } = job.data;

        // Get total sales count for this product
        const { count: totalSales } = await supabase
          .from('order_items')
          .select('id', { count: 'exact' })
          .eq('product_id', productId);

        // Get the product info
        const { data: product } = await supabase
          .from('products')
          .select('title, price_cents')
          .eq('id', productId)
          .single();

        // Get milestone rules
        const { data: rule } = await supabase
          .from('advisor_rules')
          .select('config')
          .eq('business_id', businessId)
          .eq('rule_type', 'sales_milestone')
          .eq('enabled', true)
          .single();

        const milestones = (rule?.config as { milestones: number[] })?.milestones
          ?? [10, 25, 50, 100, 250, 500, 1000];

        if (milestones.includes(totalSales ?? 0)) {
          const milestone = totalSales!;
          const productTitle = product?.title ?? 'your product';

          // Generate celebration email draft
          const CelebrationSchema = z.object({
            email_subject: z.string(),
            email_body: z.string(),
            social_post: z.string(),
          });

          const celebration = await generateStructuredOutput(
            CelebrationSchema,
            MILESTONE_CELEBRATION_PROMPT,
            `Product "${productTitle}" just hit ${milestone} sales. Total revenue: $${((product?.price_cents ?? 0) * milestone / 100).toFixed(0)}. Generate a celebration email to send to the email list and a social media post.`,
            'light'
          );

          await supabase.from('advisor_items').insert({
            business_id: businessId,
            category: 'sales_insight',
            priority: milestone >= 100 ? 'high' : 'medium',
            headline: `${productTitle} hit ${milestone} sales! Here's a celebration email draft.`,
            context_summary: `Your product has reached a milestone. Total estimated revenue: $${((product?.price_cents ?? 0) * milestone / 100).toFixed(0)}.`,
            context_data: {
              product_id: productId,
              product_title: productTitle,
              milestone,
              total_sales: totalSales,
            },
            action_type: 'send_email',
            draft_content: {
              email_subject: celebration.email_subject,
              email_body: celebration.email_body,
              social_post_bonus: celebration.social_post,
            },
            source_type: 'milestone_check',
            source_job_id: job.id,
          });
        }

        return { checked: true, milestone: milestones.includes(totalSales ?? 0) };
      }

      // ── Scout Scan Complete → Auto-surface Top Opportunities ─
      case 'scout_complete': {
        const { businessId, scanId, opportunityCount } = job.data;

        if (opportunityCount === 0) return { surfaced: 0 };

        const { data: rule } = await supabase
          .from('advisor_rules')
          .select('config')
          .eq('business_id', businessId)
          .eq('rule_type', 'scout_auto')
          .eq('enabled', true)
          .single();

        const minRelevance = (rule?.config as Record<string, number>)?.auto_surface_above_relevance ?? 0.80;
        const maxItems = (rule?.config as Record<string, number>)?.max_auto_items ?? 5;

        // Get top opportunities from this scan
        const { data: opportunities } = await supabase
          .from('scout_opportunities')
          .select('id, platform, title, relevance_score, opportunity_type, draft_content')
          .eq('scan_id', scanId)
          .eq('status', 'pending')
          .gte('relevance_score', minRelevance)
          .order('relevance_score', { ascending: false })
          .limit(maxItems);

        if (!opportunities?.length) return { surfaced: 0 };

        // Create one advisor item summarizing the top opportunities
        await supabase.from('advisor_items').insert({
          business_id: businessId,
          category: 'scout_opportunity',
          priority: 'medium',
          headline: `Scout found ${opportunities.length} high-relevance opportunities`,
          context_summary: `Your latest scan surfaced ${opportunityCount} total opportunities. ${opportunities.length} scored above ${(minRelevance * 100).toFixed(0)}% relevance.`,
          context_data: {
            scan_id: scanId,
            top_opportunities: opportunities.map(o => ({
              id: o.id,
              platform: o.platform,
              title: o.title,
              relevance_score: o.relevance_score,
              type: o.opportunity_type,
            })),
          },
          action_type: 'custom',
          draft_content: {
            instruction: 'Review Scout opportunities',
            display_text: 'Open Scout to review and approve responses',
          },
          source_type: 'scout_auto',
          source_job_id: job.id,
        });

        return { surfaced: opportunities.length };
      }

      // ── Blog Traffic Check (48h after publish) ──────────────
      case 'blog_traffic_check': {
        const { businessId, postId } = job.data;

        const { data: post } = await supabase
          .from('blog_posts')
          .select('title, view_count')
          .eq('id', postId)
          .single();

        // Get average views for this business's posts
        const { data: avgResult } = await supabase
          .from('blog_posts')
          .select('view_count')
          .eq('business_id', businessId)
          .eq('status', 'published')
          .neq('id', postId);

        const avgViews = avgResult?.length
          ? avgResult.reduce((sum, p) => sum + (p.view_count ?? 0), 0) / avgResult.length
          : 0;

        if (post && post.view_count > avgViews * 2 && avgViews > 0) {
          // This post is outperforming — suggest amplification
          await supabase.from('advisor_items').insert({
            business_id: businessId,
            category: 'content_draft',
            priority: 'medium',
            headline: `"${post.title}" is getting 2x your average views — amplify it`,
            context_summary: `This post has ${post.view_count} views in 48 hours, vs. your average of ${Math.round(avgViews)} views per post. A social media push could drive more traffic.`,
            context_data: {
              post_id: postId,
              post_title: post.title,
              view_count: post.view_count,
              average_views: Math.round(avgViews),
            },
            action_type: 'publish_social',
            draft_content: {
              text: `Generated on approval — social post amplifying "${post.title}"`,
              generate_on_approve: true,
              source_post_id: postId,
            },
            source_type: 'event_trigger',
            source_job_id: job.id,
          });
        }

        return { checked: true, outperforming: post ? post.view_count > avgViews * 2 : false };
      }

      // ── Email Open Rate Drop ────────────────────────────────
      case 'email_open_rate_drop': {
        const { businessId, sequenceId, openRate } = job.data;

        const SubjectLineSchema = z.object({
          suggestions: z.array(z.object({
            subject: z.string(),
            rationale: z.string(),
          })),
        });

        const suggestions = await generateStructuredOutput(
          SubjectLineSchema,
          'You are an email marketing expert. Generate 3 alternative subject lines that are likely to improve open rates. Each should use a different psychological trigger: curiosity, urgency, or personalization.',
          `The current email sequence has a ${openRate}% open rate (below the 20% threshold). Suggest 3 alternative subject line strategies.`,
          'light'
        );

        await supabase.from('advisor_items').insert({
          business_id: businessId,
          category: 'performance_alert',
          priority: 'high',
          headline: `Email open rate dropped to ${openRate}% — try these subject line refreshes`,
          context_summary: `Your email sequence open rate is ${openRate}%, below the 20% healthy threshold. Fresh subject lines could bring this back up.`,
          context_data: {
            sequence_id: sequenceId,
            open_rate: openRate,
          },
          action_type: 'custom',
          draft_content: {
            suggestions: suggestions.suggestions,
            instruction: 'Review and apply subject line changes to email sequences',
          },
          source_type: 'event_trigger',
          source_job_id: job.id,
        });

        return { alerted: true };
      }

      // ── Knowledge Gap Detected ──────────────────────────────
      case 'knowledge_gap_detected': {
        const { businessId, knowledgeArea, queryCount } = job.data;

        // Get sample queries for context
        const { data: sampleQueries } = await supabase
          .from('chatbot_unanswered_queries')
          .select('query_text')
          .eq('business_id', businessId)
          .eq('knowledge_area', knowledgeArea)
          .eq('addressed', false)
          .order('created_at', { ascending: false })
          .limit(5);

        const ProductIdeaSchema = z.object({
          product_type: z.string(),
          title: z.string(),
          description: z.string(),
          suggested_price: z.number(),
        });

        const productIdea = await generateStructuredOutput(
          ProductIdeaSchema,
          'Based on the demand signal from chatbot queries, suggest a digital product that would address this knowledge gap. Be specific with title and pricing.',
          `There have been ${queryCount} unanswered chatbot queries about "${knowledgeArea}" in the last 30 days. Sample queries: ${sampleQueries?.map(q => `"${q.query_text}"`).join(', ')}`,
          'light'
        );

        await supabase.from('advisor_items').insert({
          business_id: businessId,
          category: 'product_idea',
          priority: 'medium',
          headline: `${queryCount} chatbot questions about "${knowledgeArea}" — your knowledge base doesn't cover it`,
          context_summary: `Your chatbot received ${queryCount} questions about ${knowledgeArea} this month but couldn't answer confidently. This suggests demand for content in this area.`,
          context_data: {
            knowledge_area: knowledgeArea,
            query_count: queryCount,
            sample_queries: sampleQueries?.map(q => q.query_text) ?? [],
          },
          action_type: 'create_product',
          draft_content: {
            product_type: productIdea.product_type,
            title: productIdea.title,
            description: productIdea.description,
            suggested_price: productIdea.suggested_price,
          },
          source_type: 'event_trigger',
          source_job_id: job.id,
        });

        return { alerted: true, productSuggested: productIdea.title };
      }

      // ── Snooze Re-surfacing ─────────────────────────────────
      case 'snooze_check': {
        const now = new Date().toISOString();
        const { data: snoozedItems } = await supabase
          .from('advisor_items')
          .select('id')
          .eq('status', 'snoozed')
          .lte('snoozed_until', now)
          .is('deleted_at', null);

        if (snoozedItems?.length) {
          for (const item of snoozedItems) {
            await supabase
              .from('advisor_items')
              .update({ status: 'pending', snoozed_until: null })
              .eq('id', item.id);
          }
        }

        return { resurfaced: snoozedItems?.length ?? 0 };
      }

      // ── Expiration Check ────────────────────────────────────
      case 'expiration_check': {
        const fourteenDaysAgo = new Date(Date.now() - 14 * 86400000).toISOString();
        const { data: expiredItems } = await supabase
          .from('advisor_items')
          .select('id')
          .eq('status', 'pending')
          .lte('created_at', fourteenDaysAgo)
          .is('deleted_at', null);

        if (expiredItems?.length) {
          for (const item of expiredItems) {
            await supabase
              .from('advisor_items')
              .update({ status: 'expired', expired_at: new Date().toISOString() })
              .eq('id', item.id);
          }
        }

        return { expired: expiredItems?.length ?? 0 };
      }

      default:
        throw new Error(`Unknown observation type: ${job.data.type}`);
    }
  },
  {
    connection,
    concurrency: 10,
    limiter: { max: 30, duration: 60000 },
  }
);
```

---

### C.5 Milestone Celebration Prompt

```
SYSTEM: You are a marketing copywriter for a knowledge business platform. A creator's product just hit a sales milestone. Write a celebration email to their subscriber list and a social media post.

## Rules
- Email should be warm, celebratory, and brief (150-250 words)
- Include the milestone number prominently
- Subtly encourage the reader to check out the product if they haven't bought it
- Social post should be 140-280 characters, energetic, with 3-5 relevant hashtags
- Do NOT use hyperbolic language ("AMAZING!!!") — keep it professional but warm
- Do NOT make up fake testimonials or statistics

## Output
Return JSON with: email_subject, email_body (markdown), social_post
```

---

### C.6 Advisor Item Execution Worker

When a creator clicks "Approve" on an advisor item, this worker executes the drafted action:

```typescript
// /workers/advisor-item-execution-worker.ts

import { Worker, Job } from 'bullmq';
import { connection, QUEUES, createQueue } from '../lib/queue/config';
import { createServiceClient } from '../lib/supabase/service';

const blogQueue = createQueue(QUEUES.BLOG_GENERATION);
const emailQueue = createQueue(QUEUES.EMAIL_SEND);
const socialQueue = createQueue(QUEUES.SOCIAL_POST_GENERATION);
const productQueue = createQueue(QUEUES.PRODUCT_GENERATION);

const worker = new Worker(
  QUEUES.ADVISOR_ITEM_EXECUTION,
  async (job: Job) => {
    const { advisorItemId, businessId } = job.data;
    const supabase = createServiceClient();

    const { data: item } = await supabase
      .from('advisor_items')
      .select('*')
      .eq('id', advisorItemId)
      .single();

    if (!item || item.status !== 'approved') {
      throw new Error(`Advisor item ${advisorItemId} not found or not approved`);
    }

    let result: Record<string, unknown> = {};

    switch (item.action_type) {
      case 'send_email': {
        const draft = item.draft_content as {
          email_subject: string;
          email_body: string;
          recipient_list_id?: string;
        };

        // Queue the email send
        const emailJob = await emailQueue.add('advisor-email', {
          businessId,
          subject: draft.email_subject,
          body: draft.email_body,
          recipientListId: draft.recipient_list_id ?? 'all_subscribers',
          source: 'advisor',
          advisorItemId,
        });

        result = { emailJobId: emailJob.id };
        break;
      }

      case 'publish_blog': {
        const draft = item.draft_content as {
          title: string;
          slug?: string;
          body: string;
          cover_image_prompt?: string;
        };

        const blogJob = await blogQueue.add('advisor-blog', {
          businessId,
          title: draft.title,
          body: draft.body,
          coverImagePrompt: draft.cover_image_prompt,
          publishImmediately: true,
          source: 'advisor',
          advisorItemId,
        });

        result = { blogJobId: blogJob.id };
        break;
      }

      case 'publish_social': {
        const draft = item.draft_content as {
          text: string;
          image_prompt?: string;
          generate_on_approve?: boolean;
          source_post_id?: string;
        };

        const socialJob = await socialQueue.add('advisor-social', {
          businessId,
          text: draft.text,
          imagePrompt: draft.image_prompt,
          generateOnApprove: draft.generate_on_approve,
          sourcePostId: draft.source_post_id,
          source: 'advisor',
          advisorItemId,
        });

        result = { socialJobId: socialJob.id };
        break;
      }

      case 'update_product': {
        const draft = item.draft_content as {
          product_id: string;
          changes: Record<string, unknown>;
        };

        await supabase
          .from('products')
          .update(draft.changes)
          .eq('id', draft.product_id)
          .eq('business_id', businessId);

        result = { productUpdated: draft.product_id };
        break;
      }

      case 'create_product': {
        const draft = item.draft_content as {
          product_type: string;
          title: string;
          description: string;
          suggested_price: number;
        };

        const productJob = await productQueue.add('advisor-product', {
          businessId,
          productType: draft.product_type,
          title: draft.title,
          topic: draft.description,
          triggeredBy: 'advisor',
          advisorItemId,
        });

        result = { productJobId: productJob.id };
        break;
      }

      case 'trigger_scout': {
        const scoutQueue = createQueue(QUEUES.SCOUT_SCAN);
        const scoutJob = await scoutQueue.add('advisor-scout', {
          businessId,
          scanType: 'full',
          triggeredBy: 'advisor',
        });

        result = { scoutJobId: scoutJob.id };
        break;
      }

      case 'custom':
      default:
        // No automated execution — just mark as approved
        result = { manualAction: true };
        break;
    }

    // Update the advisor item with result
    await supabase
      .from('advisor_items')
      .update({ approved_result: result })
      .eq('id', advisorItemId);

    return result;
  },
  {
    connection,
    concurrency: 5,
  }
);
```

---

### C.7 Railway Worker Deployment

Add to the existing `railway.json`:

```json
{
  "name": "worker-advisor",
  "startCommand": "node dist/workers/advisor-worker.js",
  "autoscaling": {
    "minInstances": 1,
    "maxInstances": 2,
    "scaleUpThreshold": 15,
    "scaleDownThreshold": 3
  }
}
```

The advisor worker file (`/workers/advisor-worker.js`) imports and starts all three advisor workers:
- `advisor-daily-analysis-worker`
- `advisor-event-observation-worker`
- `advisor-item-execution-worker`

---

## D. Frontend: AI Advisor Inbox UI

### D.1 Route & Directory Changes

**Updated sidebar navigation:**
```
Dashboard
Advisor       ← replaces "Activity" — shows count badge
Settings
```

**New directory structure:**
```
src/
├── app/
│   ├── (dashboard)/
│   │   ├── advisor/
│   │   │   └── page.tsx              # /advisor — AI Advisor Inbox
│   │   ├── activity/
│   │   │   └── page.tsx              # /activity — preserved as legacy redirect → /advisor?tab=activity
├── components/
│   ├── advisor/                      # AI Advisor Inbox components
│   │   ├── AdvisorInbox.tsx          # Main inbox container
│   │   ├── AdvisorSummaryBar.tsx     # Top summary bar
│   │   ├── AdvisorFilterTabs.tsx     # Filter tab bar
│   │   ├── AdvisorCard.tsx           # Base card component (expandable)
│   │   ├── ContentDraftCard.tsx      # Blue accent card
│   │   ├── SalesInsightCard.tsx      # Green accent card
│   │   ├── ScoutOpportunityCard.tsx  # Orange accent card
│   │   ├── ProductIdeaCard.tsx       # Purple accent card
│   │   ├── PerformanceAlertCard.tsx  # Red accent card
│   │   ├── ReminderCard.tsx          # Gray accent card
│   │   ├── AdvisorBadge.tsx          # Sidebar notification badge
│   │   ├── AdvisorSnoozeMenu.tsx     # Snooze duration picker
│   │   ├── AdvisorBulkActions.tsx    # Bulk approve/dismiss bar
│   │   └── ActivityLogTab.tsx        # Legacy activity feed in a tab
│   ├── layout/
│   │   └── DashboardSidebar.tsx      # Updated with Advisor nav item + badge
├── hooks/
│   ├── useAdvisorItems.ts            # Fetch + realtime advisor items
│   ├── useAdvisorActions.ts          # Approve/dismiss/snooze mutations
│   └── useAdvisorCount.ts            # Pending count for badge
├── types/
│   └── advisor.ts                    # TypeScript types
```

**New API routes:**
```
src/app/api/
├── advisor/
│   ├── items/
│   │   ├── route.ts                  # GET (list), POST (not used — items are AI-generated)
│   │   └── [id]/
│   │       ├── route.ts              # PATCH (approve/dismiss/snooze)
│   │       └── execute/
│   │           └── route.ts          # POST (execute approved item)
│   ├── rules/
│   │   └── route.ts                  # GET, PATCH (advisor rule configuration)
│   ├── count/
│   │   └── route.ts                  # GET (pending count for badge)
│   └── digest/
│       └── preview/
│           └── route.ts              # GET (preview weekly digest)
```

---

### D.2 TypeScript Interfaces

```typescript
// /types/advisor.ts

export type AdvisorCategory =
  | 'sales_insight'
  | 'content_draft'
  | 'scout_opportunity'
  | 'product_idea'
  | 'performance_alert'
  | 'reminder'
  | 'engagement_prompt';

export type AdvisorPriority = 'high' | 'medium' | 'low';

export type AdvisorActionType =
  | 'send_email'
  | 'publish_blog'
  | 'publish_social'
  | 'update_product'
  | 'update_storefront'
  | 'trigger_scout'
  | 'create_product'
  | 'custom';

export type AdvisorItemStatus =
  | 'pending'
  | 'approved'
  | 'dismissed'
  | 'snoozed'
  | 'expired';

export interface AdvisorItem {
  id: string;
  businessId: string;
  category: AdvisorCategory;
  priority: AdvisorPriority;
  headline: string;
  contextSummary: string | null;
  contextData: Record<string, unknown>;
  actionType: AdvisorActionType | null;
  draftContent: Record<string, unknown>;
  status: AdvisorItemStatus;
  snoozedUntil: string | null;
  approvedAt: string | null;
  approvedResult: Record<string, unknown> | null;
  dismissedAt: string | null;
  dismissedReason: string | null;
  sourceType: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdvisorRule {
  id: string;
  businessId: string;
  ruleType: string;
  enabled: boolean;
  config: Record<string, unknown>;
}

export interface AdvisorSummary {
  pendingCount: number;
  draftsReadyCount: number;
  alertsCount: number;
  categories: Record<AdvisorCategory, number>;
}

export type AdvisorFilterTab = 'all' | 'drafts' | 'insights' | 'alerts' | 'snoozed' | 'activity';

export type SnoozeDuration = '1h' | '4h' | 'tomorrow' | 'next_week';

// ── Card Category Config ─────────────────────────────────────

export interface AdvisorCategoryConfig {
  label: string;
  icon: string;          // lucide-react icon name
  accentColor: string;   // Tailwind color class
  bgColor: string;       // Light background tint
  borderColor: string;   // Left border accent
}

export const ADVISOR_CATEGORY_CONFIG: Record<AdvisorCategory, AdvisorCategoryConfig> = {
  sales_insight: {
    label: 'Sales Insight',
    icon: 'TrendingUp',
    accentColor: 'text-emerald-600',
    bgColor: 'bg-emerald-50 dark:bg-emerald-950/20',
    borderColor: 'border-l-emerald-500',
  },
  content_draft: {
    label: 'Content Draft',
    icon: 'FileEdit',
    accentColor: 'text-blue-600',
    bgColor: 'bg-blue-50 dark:bg-blue-950/20',
    borderColor: 'border-l-blue-500',
  },
  scout_opportunity: {
    label: 'Scout Opportunity',
    icon: 'Radar',
    accentColor: 'text-orange-600',
    bgColor: 'bg-orange-50 dark:bg-orange-950/20',
    borderColor: 'border-l-orange-500',
  },
  product_idea: {
    label: 'Product Idea',
    icon: 'Lightbulb',
    accentColor: 'text-purple-600',
    bgColor: 'bg-purple-50 dark:bg-purple-950/20',
    borderColor: 'border-l-purple-500',
  },
  performance_alert: {
    label: 'Performance Alert',
    icon: 'AlertTriangle',
    accentColor: 'text-red-600',
    bgColor: 'bg-red-50 dark:bg-red-950/20',
    borderColor: 'border-l-red-500',
  },
  reminder: {
    label: 'Reminder',
    icon: 'Clock',
    accentColor: 'text-gray-600',
    bgColor: 'bg-gray-50 dark:bg-gray-800/20',
    borderColor: 'border-l-gray-400',
  },
  engagement_prompt: {
    label: 'Engagement',
    icon: 'Sparkles',
    accentColor: 'text-teal-600',
    bgColor: 'bg-teal-50 dark:bg-teal-950/20',
    borderColor: 'border-l-teal-500',
  },
};
```

---

### D.3 Page Specification

#### `(dashboard)/advisor/page.tsx` — AI Advisor Inbox

- **Rendering**: Dynamic server component
- **Auth guard**: Clerk `auth()` — redirect to `/sign-in`
- **Data fetching**: `getAdvisorItems(businessId, { status, category, limit: 50 })`, `getAdvisorSummary(businessId)`
- **Client state**: Active filter tab in URL search params (`?tab=all`)
- **Realtime**: Client component subscribes to `advisor_items` channel for new items
- **Loading**: Skeleton `AdvisorCard` components while data loads
- **Empty state**: "All caught up! Your AI advisor is watching your business and will surface items when there's something noteworthy."

---

### D.4 Component Specifications

#### `AdvisorInbox` — Main Container

```typescript
interface AdvisorInboxProps {
  businessId: string;
  initialItems: AdvisorItem[];
  initialSummary: AdvisorSummary;
}
```

**Layout:**
```
┌─────────────────────────────────────────────────────────────────────┐
│ AdvisorSummaryBar                                                   │
│ "3 items need attention · 2 drafts ready · 1 alert"                │
├─────────────────────────────────────────────────────────────────────┤
│ AdvisorFilterTabs                                                   │
│ [ All | Drafts | Insights | Alerts | Snoozed | Activity Log ]     │
├─────────────────────────────────────────────────────────────────────┤
│ AdvisorBulkActions (if applicable)                                  │
│ "Approve All Low-Risk Drafts" button                               │
├─────────────────────────────────────────────────────────────────────┤
│ Card Feed (scrollable, newest first)                                │
│ ┌─ AdvisorCard ──────────────────────────────────────────────────┐ │
│ │ [Icon] Headline                                    [Priority]  │ │
│ │        Context summary...                                      │ │
│ │        ▸ Show full context & draft                             │ │
│ │        [Approve] [Edit] [Dismiss] [Snooze ▾]     2 hours ago  │ │
│ └────────────────────────────────────────────────────────────────┘ │
│ ┌─ AdvisorCard ──────────────────────────────────────────────────┐ │
│ │ ...                                                            │ │
│ └────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

**Visual description**: Full page content area (matching existing dashboard page layout). Top bar is a `rounded-xl border bg-surface-1 p-4 mb-4` with summary stats in `text-sm font-medium`. Filter tabs use shadcn `Tabs` component. Cards are stacked with `gap-3` between them.

---

#### `AdvisorSummaryBar`

```typescript
interface AdvisorSummaryBarProps {
  summary: AdvisorSummary;
  isLoading?: boolean;
}
```

**Visual description**: `rounded-xl border bg-white dark:bg-surface-1 p-4 flex items-center justify-between`. Left side: summary text ("3 items need attention · 2 drafts ready · 1 alert") with dot separators. Numbers are `font-semibold` in their category color. Right side: "Configure Rules" link (`text-sm text-teal-600`).

---

#### `AdvisorCard` — Base Expandable Card

```typescript
interface AdvisorCardProps {
  item: AdvisorItem;
  onApprove: (id: string) => Promise<void>;
  onEdit: (id: string) => void;
  onDismiss: (id: string, reason?: string) => Promise<void>;
  onSnooze: (id: string, duration: SnoozeDuration) => Promise<void>;
  isExpanded?: boolean;
  onToggleExpand: (id: string) => void;
}
```

**Visual description**: `rounded-xl border bg-white dark:bg-surface-1 shadow-card hover:shadow-card-hover transition-shadow border-l-4` with left border color from `ADVISOR_CATEGORY_CONFIG`. Collapsed state shows: category icon (in colored circle), headline (`text-sm font-semibold`), context summary (`text-sm text-muted truncate`), priority dot, relative timestamp. Expand trigger: chevron or click on card body. Expanded state adds: full context data (formatted), draft content preview (in a `bg-surface-2 rounded-lg p-4 font-mono text-sm` block for emails/text, or structured display for product ideas), action buttons at bottom. Action buttons: `Approve` (green primary button), `Edit` (ghost button), `Dismiss` (ghost button), `Snooze` (dropdown button with duration options: 1 hour, 4 hours, Tomorrow 9 AM, Next Monday).

**Priority indicator**: High = small red dot, Medium = amber dot, Low = no dot (implicit).

**Animation**: Expand/collapse uses `max-height` transition with `overflow-hidden`, 200ms ease-out.

---

#### `AdvisorBadge` — Sidebar Notification Badge

```typescript
interface AdvisorBadgeProps {
  count: number;
}
```

**Visual description**: Red circle badge on the "Advisor" sidebar nav item. Uses shadcn `Badge` variant with `absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center`. Only renders if `count > 0`. If `count > 9`, displays "9+".

---

#### `AdvisorSnoozeMenu`

```typescript
interface AdvisorSnoozeMenuProps {
  onSnooze: (duration: SnoozeDuration) => void;
}
```

Uses shadcn `DropdownMenu` with options:
- "1 hour" → 1h from now
- "4 hours" → 4h from now
- "Tomorrow morning" → next day 9 AM in creator's timezone
- "Next week" → next Monday 9 AM in creator's timezone

---

### D.5 AI Workspace Integration

Update the AI Workspace greeting to reference advisor items. In `/lib/ai/prompts/workspace.ts`, modify the workspace system prompt to include:

```typescript
export function buildWorkspaceGreeting(
  business: BusinessSummary,
  advisorSummary: AdvisorSummary
): string {
  const parts: string[] = [];

  parts.push(`Good ${getTimeOfDay()}! Here's what's happening with ${business.name}.`);

  if (advisorSummary.pendingCount > 0) {
    parts.push(`You have ${advisorSummary.pendingCount} items in your Advisor inbox.`);

    if (advisorSummary.draftsReadyCount > 0) {
      parts.push(`${advisorSummary.draftsReadyCount} drafts are ready for your review.`);
    }

    if (advisorSummary.alertsCount > 0) {
      parts.push(`${advisorSummary.alertsCount} alert${advisorSummary.alertsCount > 1 ? 's' : ''} need attention.`);
    }
  } else {
    parts.push('All clear — no advisor items need your attention right now.');
  }

  parts.push('What would you like to work on?');

  return parts.join(' ');
}
```

Add a new AI Workspace tool for interacting with advisor items:

```typescript
// /lib/ai/tools/advisor-tools.ts

export const advisorTools = {
  getAdvisorItems: {
    description: 'Get pending advisor inbox items for this business',
    parameters: z.object({
      category: z.enum([
        'sales_insight', 'content_draft', 'scout_opportunity',
        'product_idea', 'performance_alert', 'reminder', 'engagement_prompt'
      ]).optional(),
      limit: z.number().default(5),
    }),
    execute: async ({ category, limit }, { businessId, supabase }) => {
      let query = supabase
        .from('advisor_items')
        .select('id, category, priority, headline, context_summary, action_type')
        .eq('business_id', businessId)
        .eq('status', 'pending')
        .is('deleted_at', null)
        .order('priority', { ascending: true }) // high first
        .order('created_at', { ascending: false })
        .limit(limit);

      if (category) query = query.eq('category', category);

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  },

  approveAdvisorItem: {
    description: 'Approve an advisor item to execute its drafted action',
    parameters: z.object({
      itemId: z.string().uuid(),
    }),
    execute: async ({ itemId }, { businessId, supabase }) => {
      const { error } = await supabase
        .from('advisor_items')
        .update({
          status: 'approved',
          approved_at: new Date().toISOString(),
        })
        .eq('id', itemId)
        .eq('business_id', businessId)
        .eq('status', 'pending');

      if (error) throw error;

      // Queue execution
      const executionQueue = createQueue(QUEUES.ADVISOR_ITEM_EXECUTION);
      await executionQueue.add('execute', { advisorItemId: itemId, businessId });

      return { approved: true, itemId };
    },
  },
};
```

---

### D.6 API Route: Advisor Items

```typescript
// /app/api/advisor/items/route.ts

import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerClient } from '@/lib/supabase/server';

const QuerySchema = z.object({
  businessId: z.string().uuid(),
  status: z.enum(['pending', 'approved', 'dismissed', 'snoozed', 'expired']).optional(),
  category: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(50),
  offset: z.coerce.number().min(0).default(0),
});

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const searchParams = Object.fromEntries(req.nextUrl.searchParams);
    const parsed = QuerySchema.safeParse(searchParams);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid parameters', details: parsed.error.flatten() }, { status: 400 });
    }

    const { businessId, status, category, limit, offset } = parsed.data;
    const supabase = await createServerClient();

    let query = supabase
      .from('advisor_items')
      .select('*', { count: 'exact' })
      .eq('business_id', businessId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) query = query.eq('status', status);
    if (category) query = query.eq('category', category);

    const { data, error, count } = await query;
    if (error) throw new Error(error.message);

    // Also get summary counts
    const { data: summaryData } = await supabase
      .from('advisor_items')
      .select('category, status')
      .eq('business_id', businessId)
      .eq('status', 'pending')
      .is('deleted_at', null);

    const summary: Record<string, number> = {};
    let draftsCount = 0;
    let alertsCount = 0;

    for (const item of summaryData ?? []) {
      summary[item.category] = (summary[item.category] ?? 0) + 1;
      if (item.category === 'content_draft') draftsCount++;
      if (item.category === 'performance_alert') alertsCount++;
    }

    return NextResponse.json({
      data,
      total: count,
      summary: {
        pendingCount: summaryData?.length ?? 0,
        draftsReadyCount: draftsCount,
        alertsCount,
        categories: summary,
      },
    });
  } catch (err) {
    console.error('[ADVISOR_ITEMS_GET]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

```typescript
// /app/api/advisor/items/[id]/route.ts

import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerClient } from '@/lib/supabase/server';
import { createQueue, QUEUES } from '@/lib/queue/config';

const PatchSchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('approve'),
  }),
  z.object({
    action: z.literal('dismiss'),
    reason: z.string().optional(),
  }),
  z.object({
    action: z.literal('snooze'),
    duration: z.enum(['1h', '4h', 'tomorrow', 'next_week']),
    timezone: z.string().default('UTC'),
  }),
]);

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const parsed = PatchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 });
    }

    const supabase = await createServerClient();
    const itemId = params.id;

    switch (parsed.data.action) {
      case 'approve': {
        const { error } = await supabase
          .from('advisor_items')
          .update({
            status: 'approved',
            approved_at: new Date().toISOString(),
          })
          .eq('id', itemId)
          .eq('status', 'pending');

        if (error) throw new Error(error.message);

        // Get business_id for the execution job
        const { data: item } = await supabase
          .from('advisor_items')
          .select('business_id, action_type')
          .eq('id', itemId)
          .single();

        if (item?.action_type && item.action_type !== 'custom') {
          const executionQueue = createQueue(QUEUES.ADVISOR_ITEM_EXECUTION);
          await executionQueue.add('execute', {
            advisorItemId: itemId,
            businessId: item.business_id,
          });
        }

        return NextResponse.json({ status: 'approved' });
      }

      case 'dismiss': {
        const { error } = await supabase
          .from('advisor_items')
          .update({
            status: 'dismissed',
            dismissed_at: new Date().toISOString(),
            dismissed_reason: parsed.data.reason ?? null,
          })
          .eq('id', itemId)
          .eq('status', 'pending');

        if (error) throw new Error(error.message);
        return NextResponse.json({ status: 'dismissed' });
      }

      case 'snooze': {
        const snoozedUntil = calculateSnoozeTime(parsed.data.duration, parsed.data.timezone);
        const { error } = await supabase
          .from('advisor_items')
          .update({
            status: 'snoozed',
            snoozed_until: snoozedUntil.toISOString(),
          })
          .eq('id', itemId)
          .eq('status', 'pending');

        if (error) throw new Error(error.message);
        return NextResponse.json({ status: 'snoozed', snoozedUntil: snoozedUntil.toISOString() });
      }
    }
  } catch (err) {
    console.error('[ADVISOR_ITEM_PATCH]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function calculateSnoozeTime(duration: string, timezone: string): Date {
  const now = new Date();
  switch (duration) {
    case '1h': return new Date(now.getTime() + 60 * 60 * 1000);
    case '4h': return new Date(now.getTime() + 4 * 60 * 60 * 1000);
    case 'tomorrow': {
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(9, 0, 0, 0); // 9 AM
      return tomorrow;
    }
    case 'next_week': {
      const nextMonday = new Date(now);
      const daysUntilMonday = ((1 - nextMonday.getDay()) + 7) % 7 || 7;
      nextMonday.setDate(nextMonday.getDate() + daysUntilMonday);
      nextMonday.setHours(9, 0, 0, 0); // 9 AM
      return nextMonday;
    }
    default: return new Date(now.getTime() + 60 * 60 * 1000);
  }
}
```

---

## E. Additional Optimizations

### E.1 Onboarding Completion Tracking & Recovery

**Problem:** Most SaaS platforms lose 40-60% of users during onboarding. A creator who uploaded their knowledge but never completed "Go Live" represents a high-value lead that can be recovered.

**Database:** `onboarding_progress` table (defined in Section B above).

**Background Job:** Add to the scheduler in `/lib/queue/scheduler.ts`:

```typescript
// Onboarding recovery — runs every 6 hours
// Checks for users who started onboarding but haven't progressed in 24h
```

**Worker logic:**
1. Query `onboarding_progress` where `completed_at IS NULL` and `last_activity_at < NOW() - INTERVAL '24 hours'` and `recovery_emails_sent < 3`
2. For each abandoned onboarding:
   - Send a recovery email via Resend: "You're [X]% done — your [Business Name] is waiting"
   - Include a direct link back to their current step
   - Increment `recovery_emails_sent`
3. Cadence: 1st email at 24h, 2nd at 72h, 3rd at 7 days

**Email template variables:**
```typescript
interface OnboardingRecoveryEmail {
  userName: string;
  currentStep: number;       // 1-5
  totalSteps: number;        // 5
  percentComplete: number;   // e.g., 60
  businessName?: string;     // if they got far enough to name it
  resumeUrl: string;         // direct link to /setup/step/[currentStep]
}
```

**API endpoint:** None new — recovery is fully background-driven.

**UI placement:** Platform admin dashboard (future) sees a table of incomplete onboardings. For the creator, no UI change — they just receive recovery emails.

---

### E.2 Product Performance Scoring

**Problem:** Creators don't know which products need attention until sales have already dropped significantly.

**Database:** `product_health_scores` table (defined in Section B above).

**Background Job:** `advisor:product-health` queue, runs daily at 6 AM UTC (before the daily analysis job so scores are available).

**Worker logic:**
```typescript
// For each active product in each active business:
// 1. Calculate sales_velocity_score:
//    - sales_7d vs sales_prev_7d: accelerating (>20% growth) = 0.9, stable = 0.5, decelerating = 0.2
// 2. Calculate conversion_rate_score:
//    - page_views_7d / sales_7d: >10% = 0.9, 5-10% = 0.7, 3-5% = 0.5, <3% = 0.2
// 3. Calculate satisfaction_score:
//    - average rating >= 4.5 = 0.9, 4.0 = 0.7, 3.5 = 0.5, <3.5 = 0.3, no reviews = 0.5
// 4. Calculate relative_performance:
//    - Compare conversion rate to platform average for same product type
// 5. Generate ai_summary via light model call
// 6. Upsert into product_health_scores
```

**Advisor integration:** The daily analysis job reads product health scores and generates advisor items for products with `overall_score < 0.4` (needs attention) or where velocity is decelerating.

**UI placement:** Product health score appears as a small colored indicator on each product card in the Product slide-over:
- Green circle (0.7+): Healthy
- Amber circle (0.4–0.7): Needs attention
- Red circle (<0.4): Underperforming

Clicking the indicator opens a tooltip with the AI summary and a link to the advisor item.

---

### E.3 Smart Pricing Suggestions

**Problem:** Creators set prices once and rarely revisit them, leaving money on the table or pricing themselves out of conversions.

**Implementation:** This is generated as part of the daily analysis job. No separate table needed — pricing suggestions appear as `product_idea` category advisor items.

**Logic in daily analysis prompt:**
```
If a product has:
- Conversion rate below 5% AND price is above platform median for that type → suggest lower price
- Conversion rate above 15% AND price is below platform median → suggest higher price
- No price changes in 30+ days → suggest a pricing review

Format: "Your Assessment is converting at 8% — similar assessments priced $5 lower convert at 14%. Consider testing $14 instead of $19."
```

**Advisor card:**
- Category: `product_idea`
- Action type: `update_product`
- Draft content: `{ product_id, changes: { price_cents: 1400 } }`
- Approve button updates the price immediately

**Safety:** The advisor NEVER auto-changes prices. The card always shows the current price, suggested price, and reasoning. The creator must click Approve.

---

### E.4 Knowledge Gap Detection

**Problem:** When the chatbot can't answer questions, that's a demand signal the creator is missing.

**Database:** `chatbot_unanswered_queries` table (defined in Section B above).

**Integration point:** Modify the existing chatbot API route (`/api/chat/[businessId]/route.ts`). After RAG retrieval, if the highest similarity score is below 0.50, log the query:

```typescript
// In the chatbot response handler, after RAG retrieval:
if (bestChunkSimilarity < 0.50) {
  // Classify the topic
  const topicClassification = await generateStructuredOutput(
    z.object({ topic: z.string(), is_in_scope: z.boolean() }),
    'Classify this chatbot query into a knowledge topic. Return the topic name and whether it is in scope for a knowledge business about [CREATOR_DOMAIN].',
    `Query: "${userMessage}"`,
    'light'
  );

  await onChatbotUnansweredQuery(
    businessId,
    userMessage,
    bestChunkSimilarity,
    topicClassification.topic
  );
}
```

**Advisor items generated:** See `knowledge_gap_detected` event handler in Section C.4.

**UI:** Knowledge gap items appear as `product_idea` cards: "Your chatbot got 12 questions about pediatric nursing this month but your knowledge base doesn't cover it. Want to add this topic?"

---

### E.5 Creator Engagement Health

**Problem:** Creators who stop logging in miss opportunities. Need progressive re-engagement.

**Database:** `creator_engagement_metrics` table (defined in Section B above).

**Tracking implementation:** Add middleware to the dashboard layout that records activity:

```typescript
// /app/(dashboard)/layout.tsx — add to existing layout
// On each authenticated page load, fire an event:
await recordCreatorActivity(userId, 'page_view');

// In each advisor action handler:
await recordCreatorActivity(userId, 'advisor_review');
await recordCreatorActivity(userId, 'advisor_approve');
```

```typescript
// /lib/engagement/tracker.ts
export async function recordCreatorActivity(
  userId: string,
  activityType: 'page_view' | 'advisor_review' | 'advisor_approve' | 'advisor_dismiss' | 'product_edit' | 'workspace_message' | 'post_generated'
) {
  const supabase = createServiceClient();
  const today = new Date().toISOString().split('T')[0];

  // Upsert today's row, incrementing the relevant counter
  const columnMap: Record<string, string> = {
    page_view: 'login_count',
    advisor_review: 'advisor_items_reviewed',
    advisor_approve: 'advisor_items_approved',
    advisor_dismiss: 'advisor_items_dismissed',
    product_edit: 'products_edited',
    workspace_message: 'workspace_messages',
    post_generated: 'posts_generated',
  };

  const column = columnMap[activityType] ?? 'login_count';

  await supabase.rpc('increment_engagement_metric', {
    p_user_id: userId,
    p_date: today,
    p_column: column,
  });
}
```

```sql
-- RPC function for atomic increment
CREATE OR REPLACE FUNCTION increment_engagement_metric(
  p_user_id UUID,
  p_date DATE,
  p_column TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.creator_engagement_metrics (user_id, metric_date)
  VALUES (p_user_id, p_date)
  ON CONFLICT (user_id, metric_date) DO NOTHING;

  EXECUTE format(
    'UPDATE public.creator_engagement_metrics SET %I = %I + 1, updated_at = NOW() WHERE user_id = $1 AND metric_date = $2',
    p_column, p_column
  ) USING p_user_id, p_date;
END;
$$;
```

**Digest email cadence logic:**
- Active creator (logged in 3+ days/week): No digest email (they see the inbox directly)
- Moderately active (1-2 days/week): Monday digest email
- Inactive (0 days in past week): Monday + Thursday digest email
- Disengaged (0 days in past 2 weeks): Monday + Wednesday + Friday email with increasing urgency

---

### E.6 Weekly Digest Email

**Schedule:** Monday 8 AM UTC (handled by `advisor:weekly-digest` scheduled job).

**Content:**

```typescript
interface WeeklyDigestData {
  creatorName: string;
  businessName: string;
  // Revenue
  revenueThisWeek: number;       // cents
  revenueLastWeek: number;       // cents
  revenueChange: number;         // percentage
  // Performance
  topProduct: { name: string; sales: number; revenue: number };
  totalOrders: number;
  newSubscribers: number;
  // Advisor
  pendingAdvisorItems: number;
  topAdvisorItem: { headline: string; category: string } | null;
  // Big opportunity
  bigOpportunity: string;         // AI-generated one-liner
  // Quick links
  approveAllUrl: string;          // Direct link to /advisor?action=approve-all
  dashboardUrl: string;
}
```

**Email template:** Clean, minimal, mobile-friendly. Sent via Resend.

**One-click approve from email:** Include signed URLs that directly approve low-risk advisor items (content drafts only) when clicked. URL format: `/api/advisor/items/[id]/quick-approve?token=[signed_token]&redirect=/advisor`

**Database:** No new table — uses existing `advisor_items`, `orders`, `email_subscribers`, and `creator_engagement_metrics`.

**Background job:**
```typescript
// In weekly digest worker:
// 1. Get all active users
// 2. For each user, check engagement cadence (see E.5)
// 3. If eligible for digest, assemble data
// 4. Generate big_opportunity one-liner via light model call
// 5. Render and send email via Resend
// 6. Log activity_event: weekly_digest_sent
```

---

## F. Milestone Impact

### New Milestone: M5.5 — AI Advisor System (Week 8–10)

This milestone is inserted **between Milestone 5 (AI Workspace)** and **Milestone 6 (Marketing Suite)**. It depends on the AI Workspace and product management being functional, since the Advisor references products, uses AI tools, and integrates with the workspace greeting.

The Marketing Suite (M6) benefits from the Advisor being in place, since Scout auto-surfacing and content draft cards enhance the marketing experience.

---

### Milestone 5.5 Sprint — AI Advisor System (10 days)

**Day 45a–45b: Database & Queue Setup**
- [ ] Run advisor migrations: `advisor_items`, `advisor_rules`, `advisor_daily_analysis` — 1h
- [ ] Run optimization migrations: `onboarding_progress`, `product_health_scores`, `chatbot_unanswered_queries`, `creator_engagement_metrics` — 1h
- [ ] Add advisor queues to BullMQ config — 30min
- [ ] Register scheduled jobs (daily analysis, weekly digest, snooze check, expiration) — 1h
- [ ] Seed default advisor rules trigger — 30min
- **Files created:** `supabase/migrations/0006_advisor.sql`, updates to `/lib/queue/config.ts`, `/lib/queue/scheduler.ts`

**Day 45c–45d: Daily Analysis Worker**
- [ ] Implement metrics snapshot collection — 2h
- [ ] Write daily analysis system prompt — 1h
- [ ] Implement AI analysis call with structured output — 2h
- [ ] Implement advisor item creation from insights — 1h
- [ ] Test with mock business data — 1h
- [ ] Product health scoring worker — 2h
- **Files created:** `/workers/advisor-daily-analysis-worker.ts`, `/lib/ai/prompts/daily-analysis.ts`, `/workers/advisor-product-health-worker.ts`

**Day 45e–45f: Event Observation System**
- [ ] Implement event listener functions (sale, scout, blog, email, chatbot) — 3h
- [ ] Wire event listeners into existing code paths — 2h
- [ ] Implement event observation worker (all event types) — 3h
- [ ] Implement snooze re-surfacing and expiration — 1h
- [ ] Test milestone celebration draft generation — 1h
- **Files created:** `/lib/advisor/event-listeners.ts`, `/workers/advisor-event-observation-worker.ts`

**Day 45g–45h: Advisor Item Execution**
- [ ] Implement execution worker (all action types) — 3h
- [ ] Wire approve → queue execution → update result — 1h
- [ ] Test: approve email draft → email sends — 1h
- [ ] Test: approve product idea → product generation starts — 1h
- [ ] Test: approve product update → price changes — 30min
- **Files created:** `/workers/advisor-item-execution-worker.ts`

**Day 45i–45j: Frontend — Advisor Inbox**
- [ ] TypeScript types and category config — 30min
- [ ] `AdvisorInbox` page component — 2h
- [ ] `AdvisorSummaryBar` component — 30min
- [ ] `AdvisorFilterTabs` component — 30min
- [ ] `AdvisorCard` base component (expand/collapse, actions) — 2h
- [ ] Six category-specific card variants — 2h
- [ ] `AdvisorBadge` for sidebar — 30min
- [ ] `AdvisorSnoozeMenu` dropdown — 30min
- [ ] API routes: GET items, PATCH item, GET count — 2h
- [ ] `useAdvisorItems` hook with Supabase realtime — 1h
- [ ] AI Workspace greeting integration — 30min
- [ ] AI Workspace advisor tools — 1h
- **Files created:** `src/app/(dashboard)/advisor/page.tsx`, `src/components/advisor/` (12 components), `src/hooks/useAdvisorItems.ts`, `src/hooks/useAdvisorActions.ts`, `src/hooks/useAdvisorCount.ts`, `src/types/advisor.ts`, `src/app/api/advisor/` (5 route files)

**Day 45k: Optimizations & Polish**
- [ ] Onboarding progress tracking + recovery worker — 2h
- [ ] Creator engagement tracking middleware — 1h
- [ ] Weekly digest worker + email template — 2h
- [ ] Knowledge gap detection integration in chatbot route — 1h
- [ ] End-to-end test: daily analysis → items appear → approve → action executes — 2h

**Milestone 5.5 DoD Check:**
- [ ] Daily analysis generates advisor items for a test business
- [ ] Milestone celebration card appears after Nth sale
- [ ] Approve on content draft card triggers blog publish
- [ ] Snooze re-surfaces item at correct time
- [ ] Sidebar badge shows correct pending count
- [ ] AI Workspace greeting references advisor items
- [ ] Weekly digest email renders with correct data

---

### Adjusted Total Timeline

| Original Milestone | Original Weeks | Adjusted Weeks | Change |
|-------------------|---------------|----------------|--------|
| M0 — Foundation | Week 1 | Week 1 | — |
| M1 — Landing Pages | Week 1–2 | Week 1–2 | — |
| M2 — Dashboard Shell | Week 2–3 | Week 2–3 | — |
| M3 — Setup My Business | Week 3–5 | Week 3–5 | — |
| M4 — Storefront & E-Commerce | Week 5–7 | Week 5–7 | — |
| M5 — AI Workspace | Week 7–8 | Week 7–8 | — |
| **M5.5 — AI Advisor System** | — | **Week 8–10** | **+2 weeks** |
| M6 — Marketing Suite | Week 8–10 | Week 10–12 | Shifted +2 |
| M7 — Scout | Week 10–12 | Week 12–14 | Shifted +2 |
| M8 — Operations & Analytics | Week 12–13 | Week 14–15 | Shifted +2 |
| M9 — Chatbot Product | Week 13–14 | Week 15–16 | Shifted +2 |
| M10 — Production Hardening | Week 14–16 | Week 16–18 | Shifted +2 |

**New total: ~18 weeks** (up from ~16 weeks).

### Dependencies

```
M5 (AI Workspace) ──→ M5.5 (AI Advisor) ──→ M6 (Marketing Suite)
                          │
                          ├── Requires: products table, AI workspace tools, Supabase realtime
                          ├── Requires: BullMQ infrastructure from M3
                          └── Enhances: M6 (Scout auto-surface), M8 (analytics integration)
```

**Note:** Some M5.5 features (chatbot knowledge gap detection, product health scoring) reference tables and code from later milestones (M9 for chatbot, M8 for analytics). These should be implemented as stubs in M5.5 and fully wired in the later milestones. The database tables and workers can be created in M5.5; the integration hooks are added when the dependent feature is built.

---

## G. CLAUDE.md and .cursorrules Additions

### Append to CLAUDE.md

```markdown

---

## AI Advisor System (Level 2)

### What It Is
The AI Advisor Inbox is a proactive intelligence layer. The AI observes the business (sales,
content, engagement, chatbot queries, Scout results) and surfaces recommendations as cards
in a smart inbox. Each card includes context, reasoning, and a pre-drafted action.

**Critical rule: The AI NEVER acts without explicit creator approval.** Every action requires
clicking "Approve" on an advisor card.

### Advisor Tables
- `advisor_items` — One row per inbox card. Status flow: pending → approved/dismissed/snoozed/expired
- `advisor_rules` — Per-business configuration for observation thresholds
- `advisor_daily_analysis` — Cached daily metrics snapshot + AI analysis
- `product_health_scores` — Daily health score per product (0.0–1.0)
- `chatbot_unanswered_queries` — Demand signal tracking for knowledge gap detection
- `creator_engagement_metrics` — Daily creator activity tracking
- `onboarding_progress` — Step-by-step onboarding tracking for recovery

### Advisor Queues
- `advisor:daily-analysis` — Runs 7 AM UTC daily, one job per active business
- `advisor:event-observation` — Real-time event-triggered observations
- `advisor:item-execution` — Executes approved advisor item actions
- `advisor:weekly-digest` — Monday 8 AM UTC digest email
- `advisor:onboarding-recovery` — Every 6 hours, checks for abandoned onboardings
- `advisor:product-health` — Daily 6 AM UTC, scores each product

### Advisor Patterns
Always use the `ADVISOR_CATEGORY_CONFIG` constant for card styling.
Always respect the 10-item pending cap per business.
Always check `advisor_rules` before generating items — the creator may have disabled a rule.
Draft content in `advisor_items.draft_content` is JSONB with action-type-specific schemas.

### Event Listeners
When adding new business events, check if an advisor observation should fire:
```typescript
import { onNewSale, onBlogPostPublished, onEmailMetricsUpdate, onChatbotUnansweredQuery } from '@/lib/advisor/event-listeners';
```

### Advisor Item Status Flow
```
pending → approved (executes action) → has approved_result
pending → dismissed (with optional reason)
pending → snoozed (re-surfaces at snoozed_until)
pending → expired (after 14 days of no action)
```

### Key User Journeys (Never Break These)
6. **Advisor Inbox**: Creator opens Advisor → sees prioritized cards → expands one → reviews draft → clicks Approve → action executes
7. **Weekly Digest**: Creator receives Monday email → sees revenue + opportunities → clicks link → lands on Advisor inbox
8. **Milestone Celebration**: Product hits 50 sales → advisor card appears → creator approves → celebration email sends to list
```

---

### Append to .cursorrules

```

## AI Advisor System

### Advisor Card Component Template
```tsx
import { cn } from '@/lib/utils'
import { ADVISOR_CATEGORY_CONFIG } from '@/types/advisor'

interface AdvisorCardProps {
  item: AdvisorItem
  onApprove: (id: string) => Promise<void>
  onDismiss: (id: string) => Promise<void>
  onSnooze: (id: string, duration: SnoozeDuration) => Promise<void>
}

export function AdvisorCard({ item, onApprove, onDismiss, onSnooze }: AdvisorCardProps) {
  const config = ADVISOR_CATEGORY_CONFIG[item.category]
  return (
    <div className={cn(
      'rounded-xl border bg-white dark:bg-surface-1 shadow-card border-l-4 p-5',
      config.borderColor
    )}>
      {/* ... */}
    </div>
  )
}
```

### Advisor API Route Pattern
All advisor API routes follow the standard pattern but additionally:
- Always filter by business_id (RLS handles this, but be explicit)
- Always check item status before mutations (e.g., can't approve a dismissed item)
- Always queue execution after approval (don't execute inline)

### Advisor Event Listener Pattern
When a business event happens that should trigger an observation:
```typescript
// In the event handler (e.g., Stripe webhook for new sale):
import { onNewSale } from '@/lib/advisor/event-listeners'
await onNewSale(businessId, orderId, productId, totalCents)
// The listener queues a BullMQ job — do NOT do AI calls inline
```

### Advisor Rules
Never generate advisor items without checking if the relevant rule is enabled:
```typescript
const { data: rule } = await supabase
  .from('advisor_rules')
  .select('config')
  .eq('business_id', businessId)
  .eq('rule_type', 'sales_milestone')
  .eq('enabled', true)
  .single()
// If no rule or not enabled, skip
```

### Common Advisor Mistakes to Avoid
- Do NOT execute actions inline when approving — always queue via advisor:item-execution
- Do NOT exceed 10 pending items per business — check before inserting
- Do NOT generate advisor items with confidence < 0.6
- Do NOT surface Scout opportunities below the business's configured relevance threshold
- Do NOT send weekly digest to creators who logged in 3+ days that week
- Do NOT auto-expire snoozed items — they should re-surface, not expire
```

---

*End of Level 2 Addendum*

---

**Implementation Notes for AI Coding Assistants:**

1. Install no additional packages — the advisor system uses the same Vercel AI SDK, BullMQ, Supabase, and Resend already in the main plan.

2. The advisor worker runs as part of the existing Railway worker fleet. Add it as a new service or combine with the content worker (similar resource profile).

3. The daily analysis job is the most expensive advisor operation at ~$0.045/business/day (heavy model). For 100 businesses, that's $4.50/day or ~$135/month — well within margins on $99/mo subscriptions.

4. All advisor-related types should be auto-generated from Supabase using `npm run db:types` after running the migration.

5. The `ADVISOR_CATEGORY_CONFIG` constant is the single source of truth for card styling. Never hard-code category colors elsewhere.

6. The old Activity page (`/activity`) should redirect to `/advisor?tab=activity` to preserve any bookmarks.
