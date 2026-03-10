-- Add missing activity event types for onboarding tracking
ALTER TYPE activity_event_type ADD VALUE IF NOT EXISTS 'business_created';
ALTER TYPE activity_event_type ADD VALUE IF NOT EXISTS 'onboarding_completed';
