CREATE TABLE IF NOT EXISTS public.activity_images (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    is_active BOOLEAN DEFAULT true
);

ALTER TABLE public.activity_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON public.activity_images
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for admins only" ON public.activity_images
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    );

CREATE POLICY "Enable update for admins only" ON public.activity_images
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    );

CREATE POLICY "Enable delete for admins only" ON public.activity_images
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    );

INSERT INTO storage.buckets (id, name, public)
VALUES ('activity_images', 'activity_images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'activity_images' );

CREATE POLICY "Admin Upload Access"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'activity_images'
    AND (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    )
);

CREATE POLICY "Admin Delete Access"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'activity_images'
    AND (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    )
);