-- Migration: 20260206_add_revenue_strategy_settings.sql
-- Description: Add service_fee_user and application_fee_partner to settings

INSERT INTO "settings" ("key", "value", "description")
VALUES 
    ('service_fee_user', '3000', 'Fee charged to the user (displayed as Biaya Layanan)'),
    ('application_fee_partner', '2000', 'Fee deducted from partner revenue (Application Fee)')
ON CONFLICT ("key") DO UPDATE 
SET 
    "value" = EXCLUDED.value,
    "description" = EXCLUDED.description,
    "updated_at" = NOW();
