INSERT INTO storage.buckets (id, name, public)
VALUES ('court-images', 'court-images', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('payment-proofs', 'payment-proofs', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Anyone can view court images" ON storage.objects
  FOR SELECT USING (bucket_id = 'court-images');

CREATE POLICY "Admins can upload court images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'court-images' AND
    (SELECT is_admin())
  );

CREATE POLICY "Admins can update court images" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'court-images' AND
    (SELECT is_admin())
  );

CREATE POLICY "Admins can delete court images" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'court-images' AND
    (SELECT is_admin())
  );

CREATE POLICY "Users can view their own payment proofs" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'payment-proofs' AND
    (
      (storage.foldername(name))[1] = auth.uid()::text OR
      (SELECT is_admin())
    )
  );

CREATE POLICY "Authenticated users can upload payment proofs" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'payment-proofs' AND
    auth.role() = 'authenticated' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can update their own payment proofs" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'payment-proofs' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can delete their own payment proofs" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'payment-proofs' AND
    (
      (storage.foldername(name))[1] = auth.uid()::text OR
      (SELECT is_admin())
    )
  );
