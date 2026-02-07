-- Fix for infinite recursion in community_members RLS

-- 1. Create a security definer function to check admin status without triggering RLS
-- This function bypasses RLS because it is SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.is_community_admin(_community_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.community_members 
    WHERE community_id = _community_id 
    AND user_id = _user_id 
    AND role = 'admin'
  ) OR EXISTS (
    SELECT 1 
    FROM public.communities 
    WHERE id = _community_id 
    AND created_by = _user_id
  );
END;
$$;

-- 2. Drop existing problematic policies to clean up
DROP POLICY IF EXISTS "Admins can manage members" ON public.community_members;
DROP POLICY IF EXISTS "Community creators can manage members" ON public.community_members;
DROP POLICY IF EXISTS "Users can manage own membership" ON public.community_members;

-- 3. Re-create policies using the safe function

-- Policy: Admin/Creator can do ALL operations on members of their community
CREATE POLICY "Admins can manage members" 
ON public.community_members 
FOR ALL 
USING (
  public.is_community_admin(community_id, auth.uid())
);

-- Policy: Users can manage their own membership (Leave/Update self)
-- Note: Limiting to DELETE and UPDATE for "manage own". INSERT is "Join" which is separate usually.
-- But standard "manage" usually implies all. Let's keep it specific or consistent with previous.
-- Previous was "Users can manage own membership" FOR ALL. Let's stick to that but ensure no recursion.
CREATE POLICY "Users can manage own membership" 
ON public.community_members 
FOR ALL 
USING (
  auth.uid() = user_id
);

-- Note: "Users can join communities" (INSERT) and "Members are viewable by everyone" (SELECT) 
-- should already exist from previous migrations and don't typically cause recursion 
-- unless they have complex EXISTS checks.
-- We leave them as is unless they are missing.

-- Ensure "Users can join communities" exists and is simple
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'community_members' AND policyname = 'Users can join communities') THEN
        CREATE POLICY "Users can join communities" ON public.community_members FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
END
$$;
