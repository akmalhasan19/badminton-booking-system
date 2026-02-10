CREATE TABLE IF NOT EXISTS public.coaches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  
  name TEXT NOT NULL,
  bio TEXT,
  avatar_url TEXT,
  
  specialization TEXT[] DEFAULT '{}',
  level TEXT NOT NULL CHECK (level IN ('beginner', 'intermediate', 'advanced', 'professional')),
  experience_years INTEGER DEFAULT 0,
  certifications TEXT[] DEFAULT '{}',
  
  city TEXT NOT NULL,
  district TEXT,
  address TEXT,
  
  price_per_hour DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'IDR' NOT NULL,
  
  is_active BOOLEAN DEFAULT true NOT NULL,
  accepts_online_booking BOOLEAN DEFAULT true NOT NULL,
  
  average_rating DECIMAL(3, 2) DEFAULT 0.00,
  total_sessions INTEGER DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.coach_availability_slots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  coach_id UUID NOT NULL REFERENCES public.coaches(id) ON DELETE CASCADE,
  
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Sunday, 6=Saturday
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  
  is_available BOOLEAN DEFAULT true NOT NULL,
  max_bookings_per_slot INTEGER DEFAULT 1,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  
  CONSTRAINT valid_time_range CHECK (end_time > start_time),
  CONSTRAINT unique_coach_slot UNIQUE (coach_id, day_of_week, start_time)
);

CREATE TABLE IF NOT EXISTS public.coach_bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- References
  coach_id UUID NOT NULL REFERENCES public.coaches(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  availability_slot_id UUID REFERENCES public.coach_availability_slots(id) ON DELETE SET NULL,
  
  -- Booking Details
  booking_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  duration_hours DECIMAL(4, 2) NOT NULL,
  
  -- Pricing
  price_per_hour DECIMAL(10, 2) NOT NULL,
  total_price DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'IDR' NOT NULL,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  
  -- Additional Information
  notes TEXT,
  session_type TEXT, -- e.g., 'private', 'group', 'clinic'
  attendees_count INTEGER DEFAULT 1,
  
  -- Payment
  payment_method TEXT,
  payment_proof_url TEXT,
  payment_confirmed_at TIMESTAMP WITH TIME ZONE,
  
  -- Cancellation
  cancelled_at TIMESTAMP WITH TIME ZONE,
  cancellation_reason TEXT,
  cancelled_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  
  -- Constraints
  CONSTRAINT valid_booking_time CHECK (end_time > start_time),
  CONSTRAINT unique_coach_booking UNIQUE (coach_id, booking_date, start_time)
);

-- ============================================
-- Indexes for Performance
-- ============================================

-- Coaches indexes
CREATE INDEX IF NOT EXISTS idx_coaches_user_id ON public.coaches(user_id);
CREATE INDEX IF NOT EXISTS idx_coaches_city ON public.coaches(city);
CREATE INDEX IF NOT EXISTS idx_coaches_level ON public.coaches(level);
CREATE INDEX IF NOT EXISTS idx_coaches_active ON public.coaches(is_active);
CREATE INDEX IF NOT EXISTS idx_coaches_specialization ON public.coaches USING GIN (specialization);

-- Coach availability slots indexes
CREATE INDEX IF NOT EXISTS idx_availability_coach_id ON public.coach_availability_slots(coach_id);
CREATE INDEX IF NOT EXISTS idx_availability_day ON public.coach_availability_slots(day_of_week);
CREATE INDEX IF NOT EXISTS idx_availability_active ON public.coach_availability_slots(is_available);

-- Coach bookings indexes
CREATE INDEX IF NOT EXISTS idx_bookings_coach_id ON public.coach_bookings(coach_id);
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON public.coach_bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_date ON public.coach_bookings(booking_date);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.coach_bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_coach_date_status ON public.coach_bookings(coach_id, booking_date, status);

-- ============================================
-- Triggers for updated_at
-- ============================================

CREATE TRIGGER set_updated_at_coaches 
  BEFORE UPDATE ON public.coaches
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_coach_availability_slots 
  BEFORE UPDATE ON public.coach_availability_slots
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_coach_bookings 
  BEFORE UPDATE ON public.coach_bookings
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================
-- Row Level Security (RLS)
-- ============================================

ALTER TABLE public.coaches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coach_availability_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coach_bookings ENABLE ROW LEVEL SECURITY;

-- Coaches policies
CREATE POLICY "Anyone can view active coaches" 
  ON public.coaches
  FOR SELECT 
  USING (is_active = true OR is_admin());

CREATE POLICY "Coaches can update their own profile" 
  ON public.coaches
  FOR UPDATE 
  USING (auth.uid() = user_id OR is_admin());

CREATE POLICY "Admins can insert coaches" 
  ON public.coaches
  FOR INSERT 
  WITH CHECK (is_admin());

CREATE POLICY "Admins can delete coaches" 
  ON public.coaches
  FOR DELETE 
  USING (is_admin());

-- Coach availability slots policies
CREATE POLICY "Anyone can view available slots" 
  ON public.coach_availability_slots
  FOR SELECT 
  USING (is_available = true OR is_admin() OR EXISTS (
    SELECT 1 FROM public.coaches 
    WHERE coaches.id = coach_availability_slots.coach_id 
    AND coaches.user_id = auth.uid()
  ));

CREATE POLICY "Coaches can manage their own slots" 
  ON public.coach_availability_slots
  FOR ALL 
  USING (EXISTS (
    SELECT 1 FROM public.coaches 
    WHERE coaches.id = coach_availability_slots.coach_id 
    AND coaches.user_id = auth.uid()
  ) OR is_admin());

-- Coach bookings policies
CREATE POLICY "Users can view their own coach bookings" 
  ON public.coach_bookings
  FOR SELECT 
  USING (auth.uid() = user_id OR is_admin() OR EXISTS (
    SELECT 1 FROM public.coaches 
    WHERE coaches.id = coach_bookings.coach_id 
    AND coaches.user_id = auth.uid()
  ));

CREATE POLICY "Authenticated users can create coach bookings" 
  ON public.coach_bookings
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own pending coach bookings" 
  ON public.coach_bookings
  FOR UPDATE 
  USING (auth.uid() = user_id AND status = 'pending');

CREATE POLICY "Coaches can update their bookings" 
  ON public.coach_bookings
  FOR UPDATE 
  USING (EXISTS (
    SELECT 1 FROM public.coaches 
    WHERE coaches.id = coach_bookings.coach_id 
    AND coaches.user_id = auth.uid()
  ) OR is_admin());

CREATE POLICY "Users can cancel their own pending coach bookings" 
  ON public.coach_bookings
  FOR DELETE 
  USING (auth.uid() = user_id AND status = 'pending');

CREATE POLICY "Admins can delete any coach booking" 
  ON public.coach_bookings
  FOR DELETE 
  USING (is_admin());

-- ============================================
-- Helper Functions
-- ============================================

-- Function to check coach booking conflicts
CREATE OR REPLACE FUNCTION public.check_coach_booking_conflict(
  p_coach_id UUID,
  p_booking_date DATE,
  p_start_time TIME,
  p_end_time TIME,
  p_exclude_booking_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.coach_bookings
    WHERE coach_id = p_coach_id
      AND booking_date = p_booking_date
      AND status NOT IN ('cancelled')
      AND (p_exclude_booking_id IS NULL OR id != p_exclude_booking_id)
      AND (
        (start_time, end_time) OVERLAPS (p_start_time, p_end_time)
      )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update coach statistics
CREATE OR REPLACE FUNCTION public.update_coach_statistics()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    UPDATE public.coaches
    SET 
      total_sessions = (
        SELECT COUNT(*) 
        FROM public.coach_bookings 
        WHERE coach_id = NEW.coach_id 
        AND status = 'completed'
      )
    WHERE id = NEW.coach_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_coach_stats_on_booking
  AFTER INSERT OR UPDATE OF status ON public.coach_bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_coach_statistics();
