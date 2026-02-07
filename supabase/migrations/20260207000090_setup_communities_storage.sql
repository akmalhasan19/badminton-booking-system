INSERT INTO storage.buckets (id, name, public)
VALUES ('communities', 'communities', true)
ON CONFLICT (id) DO NOTHING;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' 
        AND schemaname = 'storage'
        AND policyname = 'Anyone can view community images'
    ) THEN
        CREATE POLICY "Anyone can view community images" ON storage.objects FOR SELECT USING (bucket_id = 'communities');
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' 
        AND schemaname = 'storage'
        AND policyname = 'Community admins can upload images'
    ) THEN
        CREATE POLICY "Community admins can upload images" ON storage.objects FOR INSERT WITH CHECK (
          bucket_id = 'communities' AND
          auth.role() = 'authenticated' AND
          EXISTS (
            SELECT 1 FROM public.community_members
            WHERE community_id = (storage.foldername(name))[1]::uuid
            AND user_id = auth.uid()
            AND role = 'admin'
          )
        );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' 
        AND schemaname = 'storage'
        AND policyname = 'Community admins can update images'
    ) THEN
        CREATE POLICY "Community admins can update images" ON storage.objects FOR UPDATE USING (
          bucket_id = 'communities' AND
          auth.role() = 'authenticated' AND
          EXISTS (
            SELECT 1 FROM public.community_members
            WHERE community_id = (storage.foldername(name))[1]::uuid
            AND user_id = auth.uid()
            AND role = 'admin'
          )
        );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' 
        AND schemaname = 'storage'
        AND policyname = 'Community admins can delete images'
    ) THEN
        CREATE POLICY "Community admins can delete images" ON storage.objects FOR DELETE USING (
          bucket_id = 'communities' AND
          auth.role() = 'authenticated' AND
          EXISTS (
            SELECT 1 FROM public.community_members
            WHERE community_id = (storage.foldername(name))[1]::uuid
            AND user_id = auth.uid()
            AND role = 'admin'
          )
        );
    END IF;
END
$$;