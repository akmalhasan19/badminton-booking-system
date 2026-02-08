CREATE POLICY "Profiles are viewable by everyone" ON public.users
  FOR SELECT USING (true);