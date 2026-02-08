ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS payment_method TEXT;

COMMENT ON COLUMN public.bookings.payment_method IS 'Payment method used (e.g., OVO, DANA, BCA_VA)';