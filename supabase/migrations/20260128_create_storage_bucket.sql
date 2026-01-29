-- Create storage bucket for exam request documents

INSERT INTO storage.buckets (id, name, public)
VALUES ('exam-requests', 'exam-requests', false)
ON CONFLICT (id) DO NOTHING;

-- Set up RLS policies for the bucket

-- Allow authenticated users to upload their own files
CREATE POLICY "Users can upload their own exam requests"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'exam-requests' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to read their own files
CREATE POLICY "Users can view their own exam requests"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'exam-requests' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow service role full access
CREATE POLICY "Service role has full access to exam requests"
ON storage.objects FOR ALL
TO service_role
USING (bucket_id = 'exam-requests')
WITH CHECK (bucket_id = 'exam-requests');
