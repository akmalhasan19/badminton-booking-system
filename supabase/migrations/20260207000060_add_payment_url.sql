ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS payment_url TEXT;

COMMENT ON COLUMN public.bookings.payment_url IS 'Xendit invoice URL for payment redirect';