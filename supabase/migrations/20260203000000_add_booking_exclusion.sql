CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE public.bookings
ADD CONSTRAINT no_overlapping_bookings
EXCLUDE USING gist (
  court_id WITH =,
  tsrange(booking_date + start_time, booking_date + end_time) WITH &&
);