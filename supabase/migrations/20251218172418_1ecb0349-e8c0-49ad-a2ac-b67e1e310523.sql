-- Create storage bucket for exam files
INSERT INTO storage.buckets (id, name, public)
VALUES ('exam-files', 'exam-files', false);

-- Allow authenticated users to upload their own files
CREATE POLICY "Users can upload own exam files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'exam-files' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to view their own files
CREATE POLICY "Users can view own exam files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'exam-files' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to delete their own files
CREATE POLICY "Users can delete own exam files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'exam-files' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);