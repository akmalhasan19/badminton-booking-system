-- Add status column to community_members table to support approval workflow
-- 'approved' = member is active in the community
-- 'pending' = member is waiting for admin approval (private communities)

ALTER TABLE public.community_members 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'approved' CHECK (status IN ('approved', 'pending'));

-- Update all existing members to 'approved' status
UPDATE public.community_members 
SET status = 'approved' 
WHERE status IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.community_members.status IS 'Member status: approved (active member) or pending (waiting for admin approval in private communities)';
