-- Migration: 20260209150000_add_main_bareng_backend.sql
-- Description: Add backend support for Main Bareng activities

-- 1) Settings table for Main Bareng
CREATE TABLE IF NOT EXISTS public.main_bareng_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    community_id UUID REFERENCES public.communities(id) ON DELETE CASCADE,
    min_participants_single INTEGER NOT NULL DEFAULT 1 CHECK (min_participants_single >= 1),
    min_participants_double INTEGER NOT NULL DEFAULT 3 CHECK (min_participants_double >= 1),
    min_participants_mixed INTEGER NOT NULL DEFAULT 3 CHECK (min_participants_mixed >= 1),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS main_bareng_settings_community_unique
ON public.main_bareng_settings(community_id)
WHERE community_id IS NOT NULL;

ALTER TABLE public.main_bareng_settings ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'main_bareng_settings' AND policyname = 'Anyone can view main bareng settings') THEN
        CREATE POLICY "Anyone can view main bareng settings" ON public.main_bareng_settings
            FOR SELECT
            USING (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'main_bareng_settings' AND policyname = 'Admins can manage main bareng settings') THEN
        CREATE POLICY "Admins can manage main bareng settings" ON public.main_bareng_settings
            FOR ALL
            USING (
                public.is_admin() OR
                EXISTS (
                    SELECT 1 FROM public.community_members
                    WHERE community_id = public.main_bareng_settings.community_id
                      AND user_id = auth.uid()
                      AND role = 'admin'
                )
            );
    END IF;
END $$;

-- 2) Allowed hosts table
CREATE TABLE IF NOT EXISTS public.main_bareng_allowed_hosts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_main_bareng_allowed_host UNIQUE (community_id, user_id)
);

ALTER TABLE public.main_bareng_allowed_hosts ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'main_bareng_allowed_hosts' AND policyname = 'Admins can view allowed hosts') THEN
        CREATE POLICY "Admins can view allowed hosts" ON public.main_bareng_allowed_hosts
            FOR SELECT
            USING (
                public.is_admin() OR
                EXISTS (
                    SELECT 1 FROM public.community_members
                    WHERE community_id = public.main_bareng_allowed_hosts.community_id
                      AND user_id = auth.uid()
                      AND role = 'admin'
                )
            );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'main_bareng_allowed_hosts' AND policyname = 'Admins can manage allowed hosts') THEN
        CREATE POLICY "Admins can manage allowed hosts" ON public.main_bareng_allowed_hosts
            FOR ALL
            USING (
                public.is_admin() OR
                EXISTS (
                    SELECT 1 FROM public.community_members
                    WHERE community_id = public.main_bareng_allowed_hosts.community_id
                      AND user_id = auth.uid()
                      AND role = 'admin'
                )
            );
    END IF;
END $$;

-- 3) Extend match_rooms for Main Bareng fields
ALTER TABLE public.match_rooms
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS max_participants INTEGER DEFAULT 8,
ADD COLUMN IF NOT EXISTS min_participants INTEGER DEFAULT 2,
ADD COLUMN IF NOT EXISTS host_counts BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS gender_preference TEXT DEFAULT 'ANY',
ADD COLUMN IF NOT EXISTS host_approval_required BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS coaching_session BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS venue_address TEXT;

-- Update level_requirement constraint to allow ALL
ALTER TABLE public.match_rooms
DROP CONSTRAINT IF EXISTS match_rooms_level_requirement_check;

ALTER TABLE public.match_rooms
ADD CONSTRAINT match_rooms_level_requirement_check
CHECK (level_requirement IN ('ALL', 'BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'PRO'));

-- Add gender preference constraint
ALTER TABLE public.match_rooms
DROP CONSTRAINT IF EXISTS match_rooms_gender_preference_check;

ALTER TABLE public.match_rooms
ADD CONSTRAINT match_rooms_gender_preference_check
CHECK (gender_preference IN ('ANY', 'MALE', 'FEMALE'));

CREATE INDEX IF NOT EXISTS match_rooms_host_date_idx
ON public.match_rooms(host_user_id, match_date);

-- 4) RPC: create play together activity (atomic + validations)
CREATE OR REPLACE FUNCTION public.create_play_together_activity(
    p_community_id UUID,
    p_title TEXT,
    p_description TEXT,
    p_match_date DATE,
    p_start_time TIME,
    p_end_time TIME,
    p_court_name TEXT,
    p_venue_address TEXT,
    p_price_per_person NUMERIC,
    p_city TEXT,
    p_mode TEXT,
    p_level_requirement TEXT,
    p_game_format TEXT,
    p_max_participants INTEGER,
    p_host_counts BOOLEAN,
    p_is_public BOOLEAN,
    p_coaching_session BOOLEAN,
    p_gender_preference TEXT,
    p_host_approval_required BOOLEAN
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_min_base INTEGER;
    v_min_total INTEGER;
    v_room_id UUID;
    v_city TEXT;
    v_settings RECORD;
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '28000';
    END IF;

    IF p_title IS NULL OR length(trim(p_title)) = 0 THEN
        RAISE EXCEPTION 'Title is required' USING ERRCODE = '22023';
    END IF;

    IF p_court_name IS NULL OR length(trim(p_court_name)) = 0 THEN
        RAISE EXCEPTION 'Venue name is required' USING ERRCODE = '22023';
    END IF;

    IF p_match_date IS NULL THEN
        RAISE EXCEPTION 'Match date is required' USING ERRCODE = '22023';
    END IF;

    IF p_start_time IS NULL OR p_end_time IS NULL THEN
        RAISE EXCEPTION 'Start time and end time are required' USING ERRCODE = '22023';
    END IF;

    IF p_end_time <= p_start_time THEN
        RAISE EXCEPTION 'End time must be after start time' USING ERRCODE = '22023';
    END IF;

    -- Host authorization: community admin or explicitly allowed host
    IF p_community_id IS NOT NULL THEN
        IF NOT (
            public.is_admin() OR
            EXISTS (
                SELECT 1 FROM public.community_members
                WHERE community_id = p_community_id
                  AND user_id = v_user_id
                  AND role = 'admin'
            ) OR
            EXISTS (
                SELECT 1 FROM public.main_bareng_allowed_hosts
                WHERE community_id = p_community_id
                  AND user_id = v_user_id
            )
        ) THEN
            RAISE EXCEPTION 'Host is not allowed to create this activity' USING ERRCODE = '42501';
        END IF;
    END IF;

    -- Resolve settings for minimum participants
    SELECT min_participants_single, min_participants_double, min_participants_mixed
    INTO v_settings
    FROM public.main_bareng_settings
    WHERE community_id = p_community_id
    LIMIT 1;

    IF p_game_format = 'SINGLE' THEN
        v_min_base := COALESCE(v_settings.min_participants_single, 1);
    ELSIF p_game_format = 'DOUBLE' THEN
        v_min_base := COALESCE(v_settings.min_participants_double, 3);
    ELSE
        v_min_base := COALESCE(v_settings.min_participants_mixed, 3);
    END IF;

    v_min_total := v_min_base + CASE WHEN COALESCE(p_host_counts, true) THEN 1 ELSE 0 END;

    IF p_max_participants IS NULL THEN
        RAISE EXCEPTION 'Max participants is required' USING ERRCODE = '22023';
    END IF;

    IF p_max_participants < v_min_total THEN
        RAISE EXCEPTION 'Max participants must be at least %', v_min_total USING ERRCODE = '22023';
    END IF;

    -- Prevent schedule conflicts for the host
    IF EXISTS (
        SELECT 1 FROM public.match_rooms mr
        WHERE mr.host_user_id = v_user_id
          AND mr.status IN ('OPEN', 'PLAYING')
          AND mr.match_date::date = p_match_date
          AND mr.start_time IS NOT NULL
          AND mr.end_time IS NOT NULL
          AND (mr.start_time < p_end_time AND mr.end_time > p_start_time)
    ) THEN
        RAISE EXCEPTION 'Schedule conflict for host' USING ERRCODE = '23505';
    END IF;

    -- Resolve city fallback from community if needed
    IF p_city IS NOT NULL AND length(trim(p_city)) > 0 THEN
        v_city := p_city;
    ELSIF p_community_id IS NOT NULL THEN
        SELECT city INTO v_city FROM public.communities WHERE id = p_community_id;
    ELSE
        v_city := NULL;
    END IF;

    INSERT INTO public.match_rooms (
        host_user_id,
        title,
        description,
        court_name,
        venue_address,
        match_date,
        start_time,
        end_time,
        price_per_person,
        city,
        mode,
        level_requirement,
        game_format,
        status,
        community_id,
        max_participants,
        min_participants,
        host_counts,
        is_public,
        coaching_session,
        gender_preference,
        host_approval_required
    ) VALUES (
        v_user_id,
        p_title,
        p_description,
        p_court_name,
        p_venue_address,
        p_match_date::timestamptz,
        p_start_time,
        p_end_time,
        COALESCE(p_price_per_person, 0),
        v_city,
        p_mode,
        p_level_requirement,
        p_game_format,
        'OPEN',
        p_community_id,
        p_max_participants,
        v_min_total,
        COALESCE(p_host_counts, true),
        COALESCE(p_is_public, true),
        COALESCE(p_coaching_session, false),
        COALESCE(p_gender_preference, 'ANY'),
        COALESCE(p_host_approval_required, false)
    ) RETURNING id INTO v_room_id;

    INSERT INTO public.room_participants (room_id, user_id, status)
    VALUES (v_room_id, v_user_id, 'APPROVED');

    RETURN v_room_id;
END;
$$;

-- Ensure updated_at trigger is present for main_bareng_settings
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at_main_bareng_settings') THEN
        CREATE TRIGGER set_updated_at_main_bareng_settings BEFORE UPDATE ON public.main_bareng_settings
        FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
    END IF;
END $$;