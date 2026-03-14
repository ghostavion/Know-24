-- Migration: 00014_agenttv_core_schema
-- Description: AgentTV platform core schema — all new tables, RLS, triggers, indexes
-- Date: 2026-03-14

-- ============================================================================
-- 1. AGENTS — Agent registry
-- ============================================================================
CREATE TABLE agents (
    id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id                text NOT NULL,
    slug                    text UNIQUE NOT NULL,
    name                    text NOT NULL,
    description             text,
    status                  text NOT NULL DEFAULT 'offline'
                            CHECK (status IN ('offline','starting','running','paused','stopped','error')),
    framework               text NOT NULL
                            CHECK (framework IN ('langgraph','crewai','openai-agents','raw-python','nodejs')),
    fly_machine_id          text,
    config                  jsonb DEFAULT '{}',
    byok_provider           text
                            CHECK (byok_provider IS NULL OR byok_provider IN ('anthropic','openai','google','openai-compatible')),
    byok_key_hash           text,
    total_revenue_cents     bigint DEFAULT 0,
    total_spend_cents       bigint DEFAULT 0,
    follower_count          integer DEFAULT 0,
    tier                    text DEFAULT 'rookie'
                            CHECK (tier IN ('rookie','operator','strategist','veteran','legend')),
    personality_fingerprint jsonb,
    strategy_pivots_count   integer DEFAULT 0,
    days_alive              integer DEFAULT 0,
    created_at              timestamptz DEFAULT now(),
    updated_at              timestamptz DEFAULT now()
);

CREATE INDEX idx_agents_owner_id ON agents (owner_id);
CREATE INDEX idx_agents_status ON agents (status);
CREATE INDEX idx_agents_tier ON agents (tier);
CREATE INDEX idx_agents_slug ON agents USING btree (slug);
CREATE INDEX idx_agents_created_at ON agents (created_at DESC);

ALTER TABLE agents ENABLE ROW LEVEL SECURITY;

CREATE POLICY agents_select_public ON agents
    FOR SELECT USING (true);

CREATE POLICY agents_insert_owner ON agents
    FOR INSERT WITH CHECK (owner_id = (auth.jwt()->>'sub'));

CREATE POLICY agents_update_owner ON agents
    FOR UPDATE USING (owner_id = (auth.jwt()->>'sub'))
    WITH CHECK (owner_id = (auth.jwt()->>'sub'));

CREATE POLICY agents_delete_owner ON agents
    FOR DELETE USING (owner_id = (auth.jwt()->>'sub'));

-- ============================================================================
-- 2. AGENT_RUNS — Streaming sessions
-- ============================================================================
CREATE TABLE agent_runs (
    id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id         uuid NOT NULL REFERENCES agents (id) ON DELETE CASCADE,
    started_at       timestamptz DEFAULT now(),
    ended_at         timestamptz,
    status           text DEFAULT 'running'
                     CHECK (status IN ('running','completed','crashed','stopped')),
    revenue_cents    bigint DEFAULT 0,
    spend_cents      bigint DEFAULT 0,
    peak_viewers     integer DEFAULT 0,
    current_viewers  integer DEFAULT 0,
    actions_count    integer DEFAULT 0,
    checkpoint_data  jsonb,
    error_message    text
);

CREATE INDEX idx_agent_runs_agent_id ON agent_runs (agent_id, started_at DESC);
CREATE INDEX idx_agent_runs_status ON agent_runs (status);

ALTER TABLE agent_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY agent_runs_select_public ON agent_runs
    FOR SELECT USING (true);

CREATE POLICY agent_runs_insert_service ON agent_runs
    FOR INSERT WITH CHECK ((auth.jwt()->>'role') = 'service_role');

CREATE POLICY agent_runs_update_service ON agent_runs
    FOR UPDATE USING ((auth.jwt()->>'role') = 'service_role');

CREATE POLICY agent_runs_delete_service ON agent_runs
    FOR DELETE USING ((auth.jwt()->>'role') = 'service_role');

-- ============================================================================
-- 3. EVENTS — All agent events
-- ============================================================================
CREATE TABLE events (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id    uuid NOT NULL REFERENCES agents (id) ON DELETE CASCADE,
    run_id      uuid REFERENCES agent_runs (id) ON DELETE SET NULL,
    event_type  text NOT NULL
                CHECK (event_type IN ('action','revenue','status','error')),
    event_name  text NOT NULL,
    data        jsonb NOT NULL DEFAULT '{}',
    created_at  timestamptz DEFAULT now()
);

CREATE INDEX idx_events_agent_created ON events (agent_id, created_at DESC);
CREATE INDEX idx_events_run_created ON events (run_id, created_at DESC);
CREATE INDEX idx_events_type ON events (event_type);

ALTER TABLE events ENABLE ROW LEVEL SECURITY;

CREATE POLICY events_select_public ON events
    FOR SELECT USING (true);

CREATE POLICY events_insert_service ON events
    FOR INSERT WITH CHECK ((auth.jwt()->>'role') = 'service_role');

CREATE POLICY events_update_service ON events
    FOR UPDATE USING ((auth.jwt()->>'role') = 'service_role');

CREATE POLICY events_delete_service ON events
    FOR DELETE USING ((auth.jwt()->>'role') = 'service_role');

-- ============================================================================
-- 4. AGENT_STATS — Aggregated metrics (hourly/daily)
-- ============================================================================
CREATE TABLE agent_stats (
    id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id       uuid NOT NULL REFERENCES agents (id) ON DELETE CASCADE,
    period         text NOT NULL CHECK (period IN ('hourly','daily')),
    period_start   timestamptz NOT NULL,
    revenue_cents  bigint DEFAULT 0,
    spend_cents    bigint DEFAULT 0,
    actions_count  integer DEFAULT 0,
    avg_viewers    numeric DEFAULT 0,
    peak_viewers   integer DEFAULT 0,
    UNIQUE (agent_id, period, period_start)
);

CREATE INDEX idx_agent_stats_agent_period ON agent_stats (agent_id, period, period_start DESC);

ALTER TABLE agent_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY agent_stats_select_public ON agent_stats
    FOR SELECT USING (true);

CREATE POLICY agent_stats_insert_service ON agent_stats
    FOR INSERT WITH CHECK ((auth.jwt()->>'role') = 'service_role');

CREATE POLICY agent_stats_update_service ON agent_stats
    FOR UPDATE USING ((auth.jwt()->>'role') = 'service_role');

CREATE POLICY agent_stats_delete_service ON agent_stats
    FOR DELETE USING ((auth.jwt()->>'role') = 'service_role');

-- ============================================================================
-- 5. STAKES — Fractional ownership
-- ============================================================================
CREATE TABLE stakes (
    id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             text NOT NULL,
    agent_id            uuid NOT NULL REFERENCES agents (id) ON DELETE CASCADE,
    pct_owned           numeric NOT NULL CHECK (pct_owned > 0 AND pct_owned <= 100),
    purchase_price_cents bigint NOT NULL,
    current_value_cents bigint NOT NULL,
    purchased_at        timestamptz DEFAULT now(),
    transferable        boolean DEFAULT false,
    listed_price_cents  bigint,
    parent_clone_id     uuid
);

CREATE INDEX idx_stakes_user_id ON stakes (user_id);
CREATE INDEX idx_stakes_agent_id ON stakes (agent_id);

ALTER TABLE stakes ENABLE ROW LEVEL SECURITY;

CREATE POLICY stakes_select_own ON stakes
    FOR SELECT USING (user_id = (auth.jwt()->>'sub'));

CREATE POLICY stakes_insert_own ON stakes
    FOR INSERT WITH CHECK (user_id = (auth.jwt()->>'sub'));

-- ============================================================================
-- 6. FOLLOWS — Viewer follows agent
-- ============================================================================
CREATE TABLE follows (
    user_id        text NOT NULL,
    agent_id       uuid NOT NULL REFERENCES agents (id) ON DELETE CASCADE,
    notify_on_live boolean DEFAULT true,
    created_at     timestamptz DEFAULT now(),
    PRIMARY KEY (user_id, agent_id)
);

CREATE INDEX idx_follows_agent_id ON follows (agent_id);

ALTER TABLE follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY follows_select_own ON follows
    FOR SELECT USING (user_id = (auth.jwt()->>'sub'));

CREATE POLICY follows_insert_own ON follows
    FOR INSERT WITH CHECK (user_id = (auth.jwt()->>'sub'));

CREATE POLICY follows_delete_own ON follows
    FOR DELETE USING (user_id = (auth.jwt()->>'sub'));

-- ============================================================================
-- 7. REACTIONS — Emoji reactions on events
-- ============================================================================
CREATE TABLE reactions (
    id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id   uuid NOT NULL REFERENCES events (id) ON DELETE CASCADE,
    user_id    text NOT NULL,
    reaction   text NOT NULL CHECK (reaction IN ('fire','facepalm','money','eyes')),
    created_at timestamptz DEFAULT now(),
    UNIQUE (event_id, user_id, reaction)
);

CREATE INDEX idx_reactions_event_id ON reactions (event_id);

ALTER TABLE reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY reactions_select_public ON reactions
    FOR SELECT USING (true);

CREATE POLICY reactions_insert_authenticated ON reactions
    FOR INSERT WITH CHECK (auth.jwt() IS NOT NULL);

CREATE POLICY reactions_delete_own ON reactions
    FOR DELETE USING (user_id = (auth.jwt()->>'sub'));

-- ============================================================================
-- 8. AGENT_SUBSCRIPTIONS — Platform tier subscriptions
-- ============================================================================
CREATE TABLE agent_subscriptions (
    id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id                text NOT NULL UNIQUE,
    tier                   text NOT NULL DEFAULT 'free'
                           CHECK (tier IN ('free','pro','creator')),
    stripe_subscription_id text,
    current_period_end     timestamptz,
    created_at             timestamptz DEFAULT now(),
    updated_at             timestamptz DEFAULT now()
);

ALTER TABLE agent_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY agent_subscriptions_select_own ON agent_subscriptions
    FOR SELECT USING (user_id = (auth.jwt()->>'sub'));

CREATE POLICY agent_subscriptions_insert_service ON agent_subscriptions
    FOR INSERT WITH CHECK ((auth.jwt()->>'role') = 'service_role');

CREATE POLICY agent_subscriptions_update_service ON agent_subscriptions
    FOR UPDATE USING ((auth.jwt()->>'role') = 'service_role');

-- ============================================================================
-- 9. RIVALRIES — Agent rivalry arcs
-- ============================================================================
CREATE TABLE rivalries (
    id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_a_id     uuid NOT NULL REFERENCES agents (id) ON DELETE CASCADE,
    agent_b_id     uuid NOT NULL REFERENCES agents (id) ON DELETE CASCADE,
    established_at timestamptz DEFAULT now(),
    score_a        integer DEFAULT 0,
    score_b        integer DEFAULT 0,
    status         text DEFAULT 'active'
                   CHECK (status IN ('active','resolved','dormant')),
    CHECK (agent_a_id <> agent_b_id)
);

CREATE INDEX idx_rivalries_agent_a ON rivalries (agent_a_id);
CREATE INDEX idx_rivalries_agent_b ON rivalries (agent_b_id);

ALTER TABLE rivalries ENABLE ROW LEVEL SECURITY;

CREATE POLICY rivalries_select_public ON rivalries
    FOR SELECT USING (true);

CREATE POLICY rivalries_insert_service ON rivalries
    FOR INSERT WITH CHECK ((auth.jwt()->>'role') = 'service_role');

CREATE POLICY rivalries_update_service ON rivalries
    FOR UPDATE USING ((auth.jwt()->>'role') = 'service_role');

CREATE POLICY rivalries_delete_service ON rivalries
    FOR DELETE USING ((auth.jwt()->>'role') = 'service_role');

-- ============================================================================
-- 10. MARKETPLACE_ITEMS — Marketplace listings
-- ============================================================================
CREATE TABLE marketplace_items (
    id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    seller_id        text NOT NULL,
    item_type        text NOT NULL
                     CHECK (item_type IN ('template','strategy_pack','clone')),
    agent_id         uuid REFERENCES agents (id) ON DELETE SET NULL,
    title            text NOT NULL,
    description      text,
    price_cents      integer NOT NULL,
    stripe_price_id  text,
    sales_count      integer DEFAULT 0,
    is_active        boolean DEFAULT true,
    config_snapshot  jsonb,
    created_at       timestamptz DEFAULT now(),
    updated_at       timestamptz DEFAULT now()
);

CREATE INDEX idx_marketplace_items_seller ON marketplace_items (seller_id);
CREATE INDEX idx_marketplace_items_type ON marketplace_items (item_type);
CREATE INDEX idx_marketplace_items_active ON marketplace_items (is_active) WHERE is_active = true;

ALTER TABLE marketplace_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY marketplace_items_select_active ON marketplace_items
    FOR SELECT USING (is_active = true);

CREATE POLICY marketplace_items_insert_owner ON marketplace_items
    FOR INSERT WITH CHECK (seller_id = (auth.jwt()->>'sub'));

CREATE POLICY marketplace_items_update_owner ON marketplace_items
    FOR UPDATE USING (seller_id = (auth.jwt()->>'sub'))
    WITH CHECK (seller_id = (auth.jwt()->>'sub'));

-- ============================================================================
-- 11. MARKETPLACE_PURCHASES — Purchase records
-- ============================================================================
CREATE TABLE marketplace_purchases (
    id                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    buyer_id                 text NOT NULL,
    item_id                  uuid NOT NULL REFERENCES marketplace_items (id) ON DELETE RESTRICT,
    stripe_payment_intent_id text,
    amount_cents             integer NOT NULL,
    platform_fee_cents       integer NOT NULL,
    seller_payout_cents      integer NOT NULL,
    status                   text DEFAULT 'pending'
                             CHECK (status IN ('pending','completed','refunded')),
    created_at               timestamptz DEFAULT now()
);

CREATE INDEX idx_marketplace_purchases_buyer ON marketplace_purchases (buyer_id);
CREATE INDEX idx_marketplace_purchases_item ON marketplace_purchases (item_id);

ALTER TABLE marketplace_purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY marketplace_purchases_select_own ON marketplace_purchases
    FOR SELECT USING (buyer_id = (auth.jwt()->>'sub'));

CREATE POLICY marketplace_purchases_insert_authenticated ON marketplace_purchases
    FOR INSERT WITH CHECK (auth.jwt() IS NOT NULL);

-- ============================================================================
-- TRIGGERS & FUNCTIONS
-- ============================================================================

-- updated_at auto-touch for tables that have it
CREATE OR REPLACE FUNCTION agenttv_set_updated_at()
RETURNS trigger AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_agents_updated_at
    BEFORE UPDATE ON agents
    FOR EACH ROW EXECUTE FUNCTION agenttv_set_updated_at();

CREATE TRIGGER trg_agent_subscriptions_updated_at
    BEFORE UPDATE ON agent_subscriptions
    FOR EACH ROW EXECUTE FUNCTION agenttv_set_updated_at();

CREATE TRIGGER trg_marketplace_items_updated_at
    BEFORE UPDATE ON marketplace_items
    FOR EACH ROW EXECUTE FUNCTION agenttv_set_updated_at();

-- Follower count increment/decrement on follows insert/delete
CREATE OR REPLACE FUNCTION agenttv_update_follower_count()
RETURNS trigger AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE agents
        SET follower_count = follower_count + 1,
            updated_at = now()
        WHERE id = NEW.agent_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE agents
        SET follower_count = GREATEST(follower_count - 1, 0),
            updated_at = now()
        WHERE id = OLD.agent_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_follows_increment
    AFTER INSERT ON follows
    FOR EACH ROW EXECUTE FUNCTION agenttv_update_follower_count();

CREATE TRIGGER trg_follows_decrement
    AFTER DELETE ON follows
    FOR EACH ROW EXECUTE FUNCTION agenttv_update_follower_count();

-- Update agent total_revenue_cents when a revenue event is inserted
CREATE OR REPLACE FUNCTION agenttv_accumulate_revenue()
RETURNS trigger AS $$
DECLARE
    revenue_amount bigint;
BEGIN
    IF NEW.event_type = 'revenue' THEN
        revenue_amount := COALESCE((NEW.data->>'amount_cents')::bigint, 0);
        IF revenue_amount > 0 THEN
            UPDATE agents
            SET total_revenue_cents = total_revenue_cents + revenue_amount,
                updated_at = now()
            WHERE id = NEW.agent_id;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_events_revenue
    AFTER INSERT ON events
    FOR EACH ROW EXECUTE FUNCTION agenttv_accumulate_revenue();

-- ============================================================================
-- REALTIME
-- ============================================================================
ALTER PUBLICATION supabase_realtime ADD TABLE events;

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
