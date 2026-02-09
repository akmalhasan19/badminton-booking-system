ALTER TABLE public.communities
ADD COLUMN IF NOT EXISTS timezone TEXT;

UPDATE public.communities
SET timezone = 'Asia/Jakarta'
WHERE timezone IS NULL;

ALTER TABLE public.communities
ALTER COLUMN timezone SET DEFAULT 'Asia/Jakarta';

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'communities_timezone_check'
    ) THEN
        ALTER TABLE public.communities
        ADD CONSTRAINT communities_timezone_check
        CHECK (timezone IN ('Asia/Jakarta', 'Asia/Makassar', 'Asia/Jayapura'));
    END IF;
END
$$;