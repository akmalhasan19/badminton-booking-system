ALTER TABLE IF EXISTS "bookings"
ADD COLUMN IF NOT EXISTS "application_fee" NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS "xendit_fee" NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS "service_fee" NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS "net_venue_price" NUMERIC DEFAULT 0;

COMMENT ON COLUMN "bookings"."application_fee" IS 'Fee charged by the booking platform (SmashCourts)';
COMMENT ON COLUMN "bookings"."xendit_fee" IS 'Fee charged by Payment Gateway (Xendit)';
COMMENT ON COLUMN "bookings"."service_fee" IS 'Fee charged to the user (Service Fee)';
COMMENT ON COLUMN "bookings"."net_venue_price" IS 'Net amount received by the venue (Total - App Fee)';