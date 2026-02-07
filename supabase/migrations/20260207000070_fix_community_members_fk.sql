-- Fix foreign key relationship: community_members should reference public.users, not auth.users
-- This allows PostgREST to properly join the tables

DO $$
BEGIN
    -- Only proceed if the new constraint doesn't exist yet
    -- Note: We check specifically for the constraint on the table
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'community_members_user_id_fkey'
        AND table_name = 'community_members'
    ) THEN
        -- Drop existing foreign key constraint if it exists (might be the old one pointing to auth.users)
        -- We try to drop it by name. If the name is standard, this works.
        -- Use generic ALTER TABLE DROP CONSTRAINT IF EXISTS just in case.
        BEGIN
            ALTER TABLE public.community_members 
            DROP CONSTRAINT IF EXISTS community_members_user_id_fkey;
        EXCEPTION WHEN OTHERS THEN
            -- Ignore errors if constraint doesn't exist or other issues, attempting to add new one below
            NULL;
        END;

        -- Add new foreign key constraint to public.users instead of auth.users
        ALTER TABLE public.community_members 
        ADD CONSTRAINT community_members_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
    END IF;
END
$$;
