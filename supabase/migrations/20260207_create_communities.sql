CREATE TABLE IF NOT EXISTS public.communities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  sport TEXT DEFAULT 'Badminton',
  logo_url TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.community_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  community_id UUID REFERENCES public.communities(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  
  CONSTRAINT unique_community_member UNIQUE (community_id, user_id)
);

ALTER TABLE public.communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Communities are viewable by everyone" 
ON public.communities FOR SELECT 
USING (true);

CREATE POLICY "Users can create communities" 
ON public.communities FOR INSERT 
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Admins can update their communities" 
ON public.communities FOR UPDATE 
USING (auth.uid() = created_by OR EXISTS (
  SELECT 1 FROM public.community_members 
  WHERE community_id = id AND user_id = auth.uid() AND role = 'admin'
));

CREATE POLICY "Members are viewable by everyone" 
ON public.community_members FOR SELECT 
USING (true);

CREATE POLICY "Users can join communities" 
ON public.community_members FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage members" 
ON public.community_members FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.community_members 
  WHERE community_id = public.community_members.community_id AND user_id = auth.uid() AND role = 'admin'
));

CREATE POLICY "Users can leave communities" 
ON public.community_members FOR DELETE 
USING (auth.uid() = user_id);

CREATE TRIGGER set_updated_at_communities BEFORE UPDATE ON public.communities
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE FUNCTION public.handle_new_community()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.community_members (community_id, user_id, role)
  VALUES (NEW.id, NEW.created_by, 'admin');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_community_created
  AFTER INSERT ON public.communities
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_community();