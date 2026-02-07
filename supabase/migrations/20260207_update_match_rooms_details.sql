ALTER TABLE match_rooms
ADD COLUMN start_time TIME,
ADD COLUMN end_time TIME,
ADD COLUMN price_per_person NUMERIC DEFAULT 0,
ADD COLUMN city TEXT DEFAULT 'Jakarta';