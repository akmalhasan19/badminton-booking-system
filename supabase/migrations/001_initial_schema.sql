CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('admin', 'customer')),
  full_name TEXT NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.courts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  court_id UUID NOT NULL REFERENCES public.courts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  booking_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  duration_hours INTEGER NOT NULL,
  total_price DECIMAL(10, 2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  payment_proof_url TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  
  CONSTRAINT unique_booking UNIQUE (court_id, booking_date, start_time)
);

CREATE TABLE IF NOT EXISTS public.settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.operational_hours (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  open_time TIME NOT NULL,
  close_time TIME NOT NULL,
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  
  CONSTRAINT unique_day_hours UNIQUE (day_of_week)
);

CREATE TABLE IF NOT EXISTS public.pricing (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  court_id UUID REFERENCES public.courts(id) ON DELETE CASCADE,
  day_type TEXT NOT NULL CHECK (day_type IN ('weekday', 'weekend')),
  price_per_hour DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,

  CONSTRAINT unique_pricing UNIQUE (court_id, day_type)
);

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at_users BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_courts BEFORE UPDATE ON public.courts
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_bookings BEFORE UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_settings BEFORE UPDATE ON public.settings
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_operational_hours BEFORE UPDATE ON public.operational_hours
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_pricing BEFORE UPDATE ON public.pricing
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- =============================================
-- FUNCTION TO SYNC AUTH.USERS WITH PUBLIC.USERS
-- =============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'customer')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create user profile when auth user is created
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- ROW LEVEL SECURITY POLICIES
-- =============================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operational_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pricing ENABLE ROW LEVEL SECURITY;

-- USERS POLICIES
CREATE POLICY "Users can view their own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all users" ON public.users
  FOR SELECT USING (is_admin());

CREATE POLICY "Admins can update all users" ON public.users
  FOR UPDATE USING (is_admin());

-- COURTS POLICIES
CREATE POLICY "Anyone can view active courts" ON public.courts
  FOR SELECT USING (is_active = true OR is_admin());

CREATE POLICY "Admins can insert courts" ON public.courts
  FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "Admins can update courts" ON public.courts
  FOR UPDATE USING (is_admin());

CREATE POLICY "Admins can delete courts" ON public.courts
  FOR DELETE USING (is_admin());

-- BOOKINGS POLICIES
CREATE POLICY "Users can view their own bookings" ON public.bookings
  FOR SELECT USING (auth.uid() = user_id OR is_admin());

CREATE POLICY "Authenticated users can create bookings" ON public.bookings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own pending bookings" ON public.bookings
  FOR UPDATE USING (auth.uid() = user_id AND status = 'pending');

CREATE POLICY "Admins can update all bookings" ON public.bookings
  FOR UPDATE USING (is_admin());

CREATE POLICY "Users can cancel their own bookings" ON public.bookings
  FOR DELETE USING (auth.uid() = user_id AND status = 'pending');

CREATE POLICY "Admins can delete any booking" ON public.bookings
  FOR DELETE USING (is_admin());

-- SETTINGS POLICIES
CREATE POLICY "Anyone can view settings" ON public.settings
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage settings" ON public.settings
  FOR ALL USING (is_admin());

-- OPERATIONAL HOURS POLICIES
CREATE POLICY "Anyone can view operational hours" ON public.operational_hours
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage operational hours" ON public.operational_hours
  FOR ALL USING (is_admin());

-- PRICING POLICIES
CREATE POLICY "Anyone can view pricing" ON public.pricing
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage pricing" ON public.pricing
  FOR ALL USING (is_admin());

-- =============================================
-- SEED DATA (Optional - Default operational hours & pricing)
-- =============================================

-- Default operational hours (8 AM to 10 PM, all days)
INSERT INTO public.operational_hours (day_of_week, open_time, close_time) VALUES
  (0, '08:00', '22:00'), -- Sunday
  (1, '08:00', '22:00'), -- Monday
  (2, '08:00', '22:00'), -- Tuesday
  (3, '08:00', '22:00'), -- Wednesday
  (4, '08:00', '22:00'), -- Thursday
  (5, '08:00', '22:00'), -- Friday
  (6, '08:00', '22:00')  -- Saturday
ON CONFLICT (day_of_week) DO NOTHING;

-- Default pricing (NULL court_id means applies to all courts)
INSERT INTO public.pricing (court_id, day_type, price_per_hour) VALUES
  (NULL, 'weekday', 50.00),
  (NULL, 'weekend', 75.00)
ON CONFLICT (court_id, day_type) DO NOTHING;
