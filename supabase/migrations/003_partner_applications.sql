-- =============================================
-- PARTNER APPLICATIONS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.partner_applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  social_media TEXT NOT NULL,
  website TEXT,
  flooring_material TEXT NOT NULL,
  routine_clubs TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- =============================================
-- TRIGGERS
-- =============================================
CREATE TRIGGER set_updated_at_partner_applications BEFORE UPDATE ON public.partner_applications
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- =============================================
-- RLS POLICIES
-- =============================================
ALTER TABLE public.partner_applications ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert (public registration)
CREATE POLICY "Anyone can submit partner application" ON public.partner_applications
  FOR INSERT WITH CHECK (true);

-- Only admins can view applications
CREATE POLICY "Admins can view partner applications" ON public.partner_applications
  FOR SELECT USING (is_admin());

-- Only admins can update applications
CREATE POLICY "Admins can update partner applications" ON public.partner_applications
  FOR UPDATE USING (is_admin());
