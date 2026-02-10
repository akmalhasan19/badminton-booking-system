CREATE TABLE IF NOT EXISTS public.community_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  reviewer_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  rating NUMERIC(3, 2) NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Unique constraint: One review per user per community
CREATE UNIQUE INDEX IF NOT EXISTS community_reviews_unique_idx
  ON public.community_reviews(community_id, reviewer_user_id);

CREATE INDEX IF NOT EXISTS community_reviews_community_idx
  ON public.community_reviews(community_id);

ALTER TABLE public.community_reviews ENABLE ROW LEVEL SECURITY;

-- Policies

-- Everyone can view reviews
CREATE POLICY "Community reviews are viewable by everyone"
  ON public.community_reviews FOR SELECT USING (true);

-- Only approved members can insert reviews
CREATE POLICY "Approved members can insert reviews"
  ON public.community_reviews FOR INSERT WITH CHECK (
    auth.uid() = reviewer_user_id
    AND EXISTS (
      SELECT 1 FROM public.community_members cm
      WHERE cm.community_id = community_id
        AND cm.user_id = auth.uid()
        AND cm.status = 'approved'
    )
  );

-- Users can update/delete their own reviews
CREATE POLICY "Users can update their own reviews"
  ON public.community_reviews FOR UPDATE
  USING (auth.uid() = reviewer_user_id)
  WITH CHECK (auth.uid() = reviewer_user_id);

CREATE POLICY "Users can delete their own reviews"
  ON public.community_reviews FOR DELETE
  USING (auth.uid() = reviewer_user_id);

-- Optional: Aggregate stats table or view could be added here, 
-- but for now we will calculate on fly or use a separate migration if performance demands it.
