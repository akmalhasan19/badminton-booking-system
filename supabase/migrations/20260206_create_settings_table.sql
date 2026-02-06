-- Migration: 20260206_create_settings_table.sql
-- Description: Create settings table for global configuration

CREATE TABLE IF NOT EXISTS "settings" (
    "key" TEXT PRIMARY KEY,
    "value" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE "settings" ENABLE ROW LEVEL SECURITY;

-- Policies
-- Admin can view and edit settings
CREATE POLICY "Admins can view settings" ON "settings"
    FOR SELECT
    USING (auth.role() = 'service_role' OR auth.uid() IN (SELECT id FROM users WHERE role = 'admin'));

CREATE POLICY "Admins can update settings" ON "settings"
    FOR UPDATE
    USING (auth.uid() IN (SELECT id FROM users WHERE role = 'admin'));

CREATE POLICY "Service Role can do everything" ON "settings"
    FOR ALL
    USING (auth.role() = 'service_role');

-- Insert default fees if not exists
INSERT INTO "settings" ("key", "value", "description")
VALUES 
    ('application_fee', '2000', 'Fee charged by the booking platform (SmashCourts)'),
    ('xendit_fee', '2000', 'Fee charged by Payment Gateway (Xendit)')
ON CONFLICT ("key") DO NOTHING;
