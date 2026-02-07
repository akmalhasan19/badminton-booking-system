DROP POLICY IF EXISTS "Admins can manage members" ON public.community_members;

CREATE POLICY "Users can manage own membership" 
ON public.community_members FOR ALL 
USING (auth.uid() = user_id);

CREATE POLICY "Community creators can manage members" 
ON public.community_members FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.communities 
  WHERE id = community_members.community_id AND created_by = auth.uid()
));