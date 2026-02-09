ALTER TABLE public.community_members 
ADD COLUMN IF NOT EXISTS last_read_at TIMESTAMPTZ DEFAULT now();

UPDATE public.community_members SET last_read_at = joined_at WHERE last_read_at IS NULL;