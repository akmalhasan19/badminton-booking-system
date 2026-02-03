-- Enable btree_gist extension for UUID support in GIST indexes
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Add exclusion constraint to bookings table
-- This prevents any two bookings for the same court from overlapping in time
ALTER TABLE public.bookings
ADD CONSTRAINT no_overlapping_bookings
EXCLUDE USING gist (
  court_id WITH =,
  tsrange(booking_date + start_time, booking_date + end_time) WITH &&
);