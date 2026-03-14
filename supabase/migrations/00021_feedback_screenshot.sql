-- Add screenshot column to feedback table
ALTER TABLE feedback ADD COLUMN IF NOT EXISTS screenshot_base64 TEXT;
