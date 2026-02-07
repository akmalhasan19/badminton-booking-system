DO $$
BEGIN
    -- Drop old policy if it exists (safe to run multiple times)
    DROP POLICY IF EXISTS "Admins can manage members" ON public.community_members;

    -- Create "Users can manage own membership" if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'community_members' 
        AND policyname = 'Users can manage own membership'
    ) THEN
        CREATE POLICY "Users can manage own membership" 
        ON public.community_members FOR ALL 
        USING (auth.uid() = user_id);
    END IF;

    -- Create "Community creators can manage members" if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'community_members' 
        AND policyname = 'Community creators can manage members'
    ) THEN
        CREATE POLICY "Community creators can manage members" 
        ON public.community_members FOR ALL 
        USING (EXISTS (
          SELECT 1 FROM public.communities 
          WHERE id = community_members.community_id AND created_by = auth.uid()
        ));
    END IF;
END
$$;