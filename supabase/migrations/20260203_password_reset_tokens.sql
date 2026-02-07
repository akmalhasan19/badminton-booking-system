CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    token TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_email 
ON password_reset_tokens(email);

CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expires 
ON password_reset_tokens(expires_at);

ALTER TABLE password_reset_tokens ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'password_reset_tokens' 
        AND policyname = 'Service role only'
    ) THEN
        CREATE POLICY "Service role only" ON password_reset_tokens
            FOR ALL
            USING (auth.role() = 'service_role');
    END IF;
END
$$;