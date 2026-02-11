-- Add challenge mode setting to global settings table
-- This enables/disables the challenge mode feature globally

INSERT INTO settings (key, value, description)
VALUES (
  'challenge_mode_enabled',
  'false',
  'Enable/disable challenge mode feature globally. When enabled, users can participate in skill-based challenges.'
)
ON CONFLICT (key) DO NOTHING;
