-- ============================================
-- FIX WEBHOOK TOKEN UNTUK SUB-ACCOUNT
-- ============================================
-- Sub-account ID: 69832705b66786ebbbbd36ba
-- Token prefix: Gcq4W...

-- LANGKAH 1: Cek apakah config sudah ada
SELECT * FROM webhook_configs 
WHERE account_id = '69832705b66786ebbbbd36ba' 
AND provider = 'xendit';

-- LANGKAH 2A: Jika TIDAK ADA, insert config baru
-- GANTI 'TOKEN_LENGKAP_DARI_XENDIT_DASHBOARD' dengan token yang benar
INSERT INTO webhook_configs (
    provider,
    account_id,
    verification_token,
    webhook_url,
    created_at,
    updated_at
) VALUES (
    'xendit',
    '69832705b66786ebbbbd36ba',
    'TOKEN_LENGKAP_DARI_XENDIT_DASHBOARD',  -- <-- GANTI INI!
    'https://smashcourts.online/api/webhooks/xendit',
    NOW(),
    NOW()
)
ON CONFLICT (provider, account_id) 
DO NOTHING;

-- LANGKAH 2B: Jika SUDAH ADA, update token yang ada
-- GANTI 'TOKEN_LENGKAP_DARI_XENDIT_DASHBOARD' dengan token yang benar
UPDATE webhook_configs
SET 
    verification_token = 'TOKEN_LENGKAP_DARI_XENDIT_DASHBOARD',  -- <-- GANTI INI!
    updated_at = NOW()
WHERE 
    account_id = '69832705b66786ebbbbd36ba' 
    AND provider = 'xendit';

-- LANGKAH 3: Verifikasi update berhasil
SELECT 
    provider,
    account_id,
    LEFT(verification_token, 5) || '...' as token_prefix,
    webhook_url,
    updated_at
FROM webhook_configs 
WHERE account_id = '69832705b66786ebbbbd36ba';
