CREATE TYPE report_target_type AS ENUM ('community', 'message', 'review', 'user');
CREATE TYPE report_status AS ENUM ('pending', 'resolved', 'dismissed');

CREATE TABLE IF NOT EXISTS public.reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    target_type report_target_type NOT NULL,
    target_id UUID NOT NULL, -- Generic ID, application validation required
    reason TEXT NOT NULL,
    description TEXT,
    status report_status NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for filtering by status and type
CREATE INDEX IF NOT EXISTS reports_status_idx ON public.reports(status);
CREATE INDEX IF NOT EXISTS reports_target_idx ON public.reports(target_type, target_id);

CREATE TABLE IF NOT EXISTS public.report_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
    admin_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL, -- e.g., 'ban', 'delete_content', 'dismiss', 'warning'
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS report_actions_report_idx ON public.report_actions(report_id);

-- RLS Policies

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_actions ENABLE ROW LEVEL SECURITY;

-- Reports:
-- Authenticated users can insert reports.
CREATE POLICY "Authenticated users can submit reports"
  ON public.reports FOR INSERT
  WITH CHECK (auth.uid() = reporter_user_id);

-- Only admins/moderators should view generic reports.
-- For P1, we assume a specific role or just check app metadata? 
-- Let's assume a simplified checking for now or maybe we just rely on application logic + strict RLS if 'admin' role exists in users table or separate.
-- Existing 'users' table structure isn't fully visible but let's assume public.users doesn't verify admin status easily without extra lookup.
-- For now, allow reporter to view their own reports.
CREATE POLICY "Users can view their own reports"
  ON public.reports FOR SELECT
  USING (auth.uid() = reporter_user_id);

-- Report Actions:
-- Only admins can insert/view.
-- (TODO: We need a secure way to identify admins. For P1 MVP without complex RBAC,
-- we might either have an 'is_admin' flag on users or use a hardcoded list/superuser check.
-- For SAFETY now: disable public access, only allow via service_role/dashboard context if possible, 
-- or if we implement 'role' in users table.
-- Let's assume for now we might add a policy IF we had an admin check function. 
-- Example: 
-- CREATE POLICY "Admins can view all reports" ON public.reports FOR SELECT USING (is_admin(auth.uid()));
-- Since we don't have that yet, be careful. Actions will need to use service_role or we add an admin check if 'role' exists in 'users' or 'profiles'.)

-- Let's check `users` table schema if possible? I'll assume current standard Supabase auth + potentially `public.users` sync.
-- If `public.users` has a role column, we use it.

-- Attempting a generic admin policy if public.users has 'role':
-- CREATE POLICY "Admins can manage reports"
--   ON public.reports
--   USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

-- For this migration, I will just enable RLS and add the basic user policies.
-- Admin access will likely be done via Service Role in API for now to ensure security until RBAC is solid.
