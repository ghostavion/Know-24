-- Migration: 00018_notifications_and_daily_stats
-- Description: Add notifications table and agent_daily_stats view
-- Date: 2026-03-14

-- ============================================================================
-- 1. NOTIFICATIONS — User notification inbox
-- ============================================================================
CREATE TABLE notifications (
    id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    text NOT NULL,
    type       text NOT NULL
               CHECK (type IN (
                   'agent_started', 'agent_stopped', 'agent_error',
                   'revenue_milestone', 'tier_upgrade',
                   'new_follower', 'stake_payout',
                   'marketplace_sale', 'system'
               )),
    title      text NOT NULL,
    body       text,
    data       jsonb,
    read       boolean DEFAULT false,
    created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_notifications_user_id ON notifications (user_id, created_at DESC);
CREATE INDEX idx_notifications_user_unread ON notifications (user_id) WHERE read = false;

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY notifications_select_own ON notifications
    FOR SELECT USING (user_id = (auth.jwt()->>'sub'));

CREATE POLICY notifications_update_own ON notifications
    FOR UPDATE USING (user_id = (auth.jwt()->>'sub'));

CREATE POLICY notifications_insert_service ON notifications
    FOR INSERT WITH CHECK ((auth.jwt()->>'role') = 'service_role');

CREATE POLICY notifications_delete_own ON notifications
    FOR DELETE USING (user_id = (auth.jwt()->>'sub'));

-- ============================================================================
-- 2. AGENT_DAILY_STATS — Materialized daily view for analytics
-- ============================================================================
CREATE TABLE agent_daily_stats (
    agent_id       uuid NOT NULL REFERENCES agents (id) ON DELETE CASCADE,
    date           date NOT NULL,
    revenue_cents  bigint DEFAULT 0,
    actions_count  integer DEFAULT 0,
    follower_count integer DEFAULT 0,
    peak_viewers   integer DEFAULT 0,
    PRIMARY KEY (agent_id, date)
);

CREATE INDEX idx_agent_daily_stats_date ON agent_daily_stats (date DESC);

ALTER TABLE agent_daily_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY agent_daily_stats_select_public ON agent_daily_stats
    FOR SELECT USING (true);

CREATE POLICY agent_daily_stats_insert_service ON agent_daily_stats
    FOR INSERT WITH CHECK ((auth.jwt()->>'role') = 'service_role');

CREATE POLICY agent_daily_stats_update_service ON agent_daily_stats
    FOR UPDATE USING ((auth.jwt()->>'role') = 'service_role');

-- ============================================================================
-- 3. FUNCTION: Create notification for agent events
-- ============================================================================
CREATE OR REPLACE FUNCTION agenttv_notify_on_tier_change()
RETURNS trigger AS $$
BEGIN
    IF NEW.tier IS DISTINCT FROM OLD.tier THEN
        INSERT INTO notifications (user_id, type, title, body, data)
        VALUES (
            NEW.owner_id,
            'tier_upgrade',
            NEW.name || ' reached ' || NEW.tier || ' tier!',
            'Your agent has been promoted based on its performance.',
            jsonb_build_object('agent_id', NEW.id, 'agent_slug', NEW.slug, 'old_tier', OLD.tier, 'new_tier', NEW.tier)
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_agents_tier_notification
    AFTER UPDATE OF tier ON agents
    FOR EACH ROW EXECUTE FUNCTION agenttv_notify_on_tier_change();

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
