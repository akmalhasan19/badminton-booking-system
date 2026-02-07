-- Fix foreign key relationship: community_members should reference public.users, not auth.users
-- This allows PostgREST to properly join the tables

-- Drop existing foreign key constraint
ALTER TABLE public.community_members 
DROP CONSTRAINT IF EXISTS community_members_user_id_fkey;

-- Add new foreign key constraint to public.users instead of auth.users
ALTER TABLE public.community_members 
ADD CONSTRAINT community_members_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
