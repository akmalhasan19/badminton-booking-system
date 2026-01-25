-- =============================================
-- STORAGE BUCKETS SETUP
-- =============================================

-- Create storage bucket for court images (public)
INSERT INTO storage.buckets (id, name, public)
VALUES ('court-images', 'court-images', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage bucket for payment proofs (private)
INSERT INTO storage.buckets (id, name, public)
VALUES ('payment-proofs', 'payment-proofs', false)
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- STORAGE POLICIES
-- =============================================

-- Court Images Policies (Public Bucket)
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

-- Payment Proofs Policies (Private Bucket)
CREATE POLICY "Users can view their own payment proofs" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'payment-proofs' AND
    (
      -- Extract user_id from path (format: user_id/booking_id/filename)
      (storage.foldername(name))[1] = auth.uid()::text OR
      (SELECT is_admin())
    )
  );

CREATE POLICY "Authenticated users can upload payment proofs" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'payment-proofs' AND
    auth.role() = 'authenticated' AND
    -- Ensure they're uploading to their own folder
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
