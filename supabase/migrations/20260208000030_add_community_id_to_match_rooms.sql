ALTER TABLE public.match_rooms
ADD COLUMN IF NOT EXISTS community_id UUID REFERENCES public.communities(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS match_rooms_community_id_idx ON public.match_rooms(community_id);