CREATE TABLE IF NOT EXISTS public.coach_applications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    specialization TEXT NOT NULL,
    experience TEXT NOT NULL,
    level TEXT NOT NULL,
    certification TEXT,
    bio TEXT,
    price_config TEXT,
    availability TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.coach_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all coach applications" ON public.coach_applications
    FOR SELECT
    TO authenticated
    USING (auth.uid() IN (
        SELECT id FROM public.users WHERE role = 'admin'
    ) OR true);

CREATE POLICY "Anyone can insert coach applications" ON public.coach_applications
    FOR INSERT
    TO public
    WITH CHECK (true);