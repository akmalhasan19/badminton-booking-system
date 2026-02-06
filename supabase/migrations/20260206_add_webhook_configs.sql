
CREATE TABLE IF NOT EXISTS public.webhook_configs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider TEXT NOT NULL, -- e.g., 'xendit'
  account_id TEXT NOT NULL, -- The sub-account ID (user_id)
  verification_token TEXT NOT NULL, -- The callback token
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,

  CONSTRAINT unique_provider_account UNIQUE (provider, account_id)
);

CREATE TRIGGER set_updated_at_webhook_configs BEFORE UPDATE ON public.webhook_configs
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.webhook_configs ENABLE ROW LEVEL SECURITY;

-- Allow admins full access
CREATE POLICY "Admins can manage webhook configs" ON public.webhook_configs
  FOR ALL USING (is_admin());

-- Allow read access for service role (webhook handler) - implicitly allowed, but explicit policy for clarity if needed
-- Actually, service role bypasses RLS, so this is fine.
