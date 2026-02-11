CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL UNIQUE REFERENCES public.bookings(id) ON DELETE CASCADE,
  provider TEXT NOT NULL DEFAULT 'xendit',
  reference_id TEXT NOT NULL UNIQUE,
  payment_request_id TEXT NOT NULL UNIQUE,
  channel_code TEXT,
  amount NUMERIC(12, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'IDR',
  status TEXT NOT NULL DEFAULT 'PENDING_USER_ACTION' CHECK (status IN ('PENDING_USER_ACTION', 'PAID', 'FAILED', 'EXPIRED')),
  provider_status TEXT,
  actions_json JSONB,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_payments_order_id ON public.payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_payment_request_id ON public.payments(payment_request_id);
CREATE INDEX IF NOT EXISTS idx_payments_reference_id ON public.payments(reference_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at_payments') THEN
    CREATE TRIGGER set_updated_at_payments
      BEFORE UPDATE ON public.payments
      FOR EACH ROW
      EXECUTE FUNCTION public.handle_updated_at();
  END IF;
END $$;

ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS payment_state TEXT NOT NULL DEFAULT 'PENDING_USER_ACTION';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'bookings_payment_state_check'
  ) THEN
    ALTER TABLE public.bookings
    ADD CONSTRAINT bookings_payment_state_check
    CHECK (payment_state IN ('PENDING_USER_ACTION', 'PAID', 'FAILED', 'EXPIRED'));
  END IF;
END $$;

COMMENT ON COLUMN public.bookings.payment_state IS 'Internal payment state derived from Xendit payment request status';

CREATE TABLE IF NOT EXISTS public.webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL DEFAULT 'xendit',
  dedupe_key TEXT NOT NULL UNIQUE,
  provider_event_id TEXT,
  webhook_id TEXT,
  payment_request_id TEXT,
  reference_id TEXT,
  status TEXT,
  payload_json JSONB NOT NULL,
  received_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_webhook_events_provider ON public.webhook_events(provider);
CREATE INDEX IF NOT EXISTS idx_webhook_events_payment_request_id ON public.webhook_events(payment_request_id);
CREATE INDEX IF NOT EXISTS idx_webhook_events_reference_id ON public.webhook_events(reference_id);
CREATE INDEX IF NOT EXISTS idx_webhook_events_received_at ON public.webhook_events(received_at DESC);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'payments' AND policyname = 'Service role can manage payments'
  ) THEN
    CREATE POLICY "Service role can manage payments"
      ON public.payments
      FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'payments' AND policyname = 'Users can view own payments'
  ) THEN
    CREATE POLICY "Users can view own payments"
      ON public.payments
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1
          FROM public.bookings b
          WHERE b.id = payments.order_id
            AND b.user_id = auth.uid()
        ) OR public.is_admin()
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'webhook_events' AND policyname = 'Service role can manage webhook events'
  ) THEN
    CREATE POLICY "Service role can manage webhook events"
      ON public.webhook_events
      FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;
