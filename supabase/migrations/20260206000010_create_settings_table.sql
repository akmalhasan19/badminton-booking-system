-- Migration: 20260206_create_settings_table.sql
-- Description: Create settings table for global configuration

CREATE TABLE IF NOT EXISTS "settings" (
    "key" TEXT PRIMARY KEY,
    "value" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure description column exists if table was created without it
ALTER TABLE "settings" ADD COLUMN IF NOT EXISTS "description" TEXT;


-- Enable RLS
ALTER TABLE "settings" ENABLE ROW LEVEL SECURITY;

-- Policies
-- Admin can view and edit settings
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'settings' AND policyname = 'Admins can view settings') THEN
        CREATE POLICY "Admins can view settings" ON "settings"
            FOR SELECT
            USING (auth.role() = 'service_role' OR auth.uid() IN (SELECT id FROM users WHERE role = 'admin'));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'settings' AND policyname = 'Admins can update settings') THEN
        CREATE POLICY "Admins can update settings" ON "settings"
            FOR UPDATE
            USING (auth.uid() IN (SELECT id FROM users WHERE role = 'admin'));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'settings' AND policyname = 'Service Role can do everything') THEN
        CREATE POLICY "Service Role can do everything" ON "settings"
            FOR ALL
            USING (auth.role() = 'service_role');
    END IF;
END
$$;

-- Insert default fees if not exists
INSERT INTO "settings" ("key", "value", "description")
VALUES 
    ('application_fee', '2000', 'Fee charged by the booking platform (SmashCourts)'),
    ('xendit_fee', '2000', 'Fee charged by Payment Gateway (Xendit)')
ON CONFLICT ("key") DO NOTHING;


-- Merged from 20260206_add_revenue_strategy_settings.sql because of ordering issues
INSERT INTO "settings" ("key", "value", "description")
VALUES 
    ('service_fee_user', '3000', 'Fee charged to the user (displayed as Biaya Layanan)'),
    ('application_fee_partner', '2000', 'Fee deducted from partner revenue (Application Fee)')
ON CONFLICT ("key") DO UPDATE 
SET 
    "value" = EXCLUDED.value,
    "description" = EXCLUDED.description,
    "updated_at" = NOW();
