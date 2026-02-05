-- Add venue_id to bookings table to support Partner Sync
ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS venue_id TEXT;
-- Note: venue_id is TEXT because it comes from external API (Smash API), not necessarily a UUID FK in our local db yet (courts might use UUID but venue_id is top level)
