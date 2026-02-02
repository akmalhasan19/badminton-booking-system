-- Add profile fields to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS gender TEXT CHECK (gender IN ('Laki-laki', 'Perempuan')),
ADD COLUMN IF NOT EXISTS date_of_birth DATE,
ADD COLUMN IF NOT EXISTS city TEXT;

-- Update RLS policies (optional, but good practice to ensure they cover new columns if explicit)
-- Note: Existing policies use "FOR UPDATE" which covers all columns usually, so no change needed typically.
-- But we can verify.
