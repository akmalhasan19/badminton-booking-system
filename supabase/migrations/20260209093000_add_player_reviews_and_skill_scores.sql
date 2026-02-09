CREATE TABLE IF NOT EXISTS public.player_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES public.match_rooms(id) ON DELETE CASCADE,
  reviewer_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  reviewee_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  rating NUMERIC(3, 2) NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS player_reviews_unique
  ON public.player_reviews(room_id, reviewer_user_id, reviewee_user_id);

CREATE INDEX IF NOT EXISTS player_reviews_reviewee_idx
  ON public.player_reviews(reviewee_user_id);

CREATE INDEX IF NOT EXISTS player_reviews_room_idx
  ON public.player_reviews(room_id);

CREATE TABLE IF NOT EXISTS public.player_skill_scores (
  user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  average_score NUMERIC(3, 2) NOT NULL DEFAULT 0,
  review_count INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.player_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_skill_scores ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'player_reviews'
          AND policyname = 'Player reviews are viewable by everyone'
    ) THEN
        CREATE POLICY "Player reviews are viewable by everyone"
        ON public.player_reviews FOR SELECT USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'player_reviews'
          AND policyname = 'Users can insert reviews for completed matches'
    ) THEN
        CREATE POLICY "Users can insert reviews for completed matches"
        ON public.player_reviews FOR INSERT WITH CHECK (
          auth.uid() = reviewer_user_id
          AND reviewer_user_id <> reviewee_user_id
          AND EXISTS (
            SELECT 1 FROM public.match_rooms mr
            WHERE mr.id = room_id AND mr.status = 'COMPLETED'
          )
          AND EXISTS (
            SELECT 1 FROM public.room_participants rp
            WHERE rp.room_id = room_id
              AND rp.user_id = reviewer_user_id
              AND rp.status = 'APPROVED'
          )
          AND EXISTS (
            SELECT 1 FROM public.room_participants rp
            WHERE rp.room_id = room_id
              AND rp.user_id = reviewee_user_id
              AND rp.status = 'APPROVED'
          )
        );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'player_reviews'
          AND policyname = 'Users can update their own reviews'
    ) THEN
        CREATE POLICY "Users can update their own reviews"
        ON public.player_reviews FOR UPDATE
        USING (auth.uid() = reviewer_user_id)
        WITH CHECK (auth.uid() = reviewer_user_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'player_reviews'
          AND policyname = 'Users can delete their own reviews'
    ) THEN
        CREATE POLICY "Users can delete their own reviews"
        ON public.player_reviews FOR DELETE
        USING (auth.uid() = reviewer_user_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'player_skill_scores'
          AND policyname = 'Skill scores are viewable by everyone'
    ) THEN
        CREATE POLICY "Skill scores are viewable by everyone"
        ON public.player_skill_scores FOR SELECT USING (true);
    END IF;
END
$$;

CREATE OR REPLACE FUNCTION public.refresh_player_skill_score(target_user UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF target_user IS NULL THEN
        RETURN;
    END IF;

    INSERT INTO public.player_skill_scores AS scores (user_id, average_score, review_count, updated_at)
    SELECT
        reviewee_user_id,
        ROUND(AVG(rating)::numeric, 2) AS average_score,
        COUNT(*)::int AS review_count,
        NOW()
    FROM public.player_reviews
    WHERE reviewee_user_id = target_user
    GROUP BY reviewee_user_id
    ON CONFLICT (user_id) DO UPDATE SET
        average_score = EXCLUDED.average_score,
        review_count = EXCLUDED.review_count,
        updated_at = NOW();

    IF NOT EXISTS (
        SELECT 1 FROM public.player_reviews WHERE reviewee_user_id = target_user
    ) THEN
        DELETE FROM public.player_skill_scores WHERE user_id = target_user;
    END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_player_review_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        PERFORM public.refresh_player_skill_score(OLD.reviewee_user_id);
        RETURN OLD;
    ELSIF TG_OP = 'UPDATE' THEN
        PERFORM public.refresh_player_skill_score(NEW.reviewee_user_id);
        IF OLD.reviewee_user_id IS DISTINCT FROM NEW.reviewee_user_id THEN
            PERFORM public.refresh_player_skill_score(OLD.reviewee_user_id);
        END IF;
        RETURN NEW;
    END IF;

    PERFORM public.refresh_player_skill_score(NEW.reviewee_user_id);
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS player_reviews_refresh_score ON public.player_reviews;

CREATE TRIGGER player_reviews_refresh_score
AFTER INSERT OR UPDATE OR DELETE ON public.player_reviews
FOR EACH ROW EXECUTE PROCEDURE public.handle_player_review_change();