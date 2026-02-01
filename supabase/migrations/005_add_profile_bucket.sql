INSERT INTO storage.buckets (id, name, public)
VALUES ('user-profile-picture', 'user-profile-picture', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Anyone can view profile pictures" ON storage.objects
  FOR SELECT USING (bucket_id = 'user-profile-picture');

CREATE POLICY "Authenticated users can upload own avatar" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'user-profile-picture' AND
    auth.role() = 'authenticated' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Authenticated users can update own avatar" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'user-profile-picture' AND
    auth.role() = 'authenticated' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Authenticated users can delete own avatar" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'user-profile-picture' AND
    auth.role() = 'authenticated' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );
