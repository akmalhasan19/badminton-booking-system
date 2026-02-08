CREATE TABLE IF NOT EXISTS public.venues (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  address TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE public.venues ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view venues" ON public.venues
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage venues" ON public.venues
  FOR ALL USING (is_admin());

-- Trigger for updated_at
CREATE TRIGGER set_updated_at_venues BEFORE UPDATE ON public.venues
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Insert the known venue
INSERT INTO public.venues (id, name, address, description)
VALUES (
  '4d3551d2-c416-420e-b781-e0827e2eecf3',
  'GOR Smash Juara',
  'Jl. Raya Badminton No. 1, Jakarta Selatan',
  'GOR Badminton standar internasional dengan lantai karpet vinyl berkualitas.'
) ON CONFLICT (id) DO NOTHING;
