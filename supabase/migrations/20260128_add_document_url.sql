-- Add document_url column to exam_requests table to store the uploaded medical request

ALTER TABLE public.exam_requests
ADD COLUMN IF NOT EXISTS document_url TEXT;

COMMENT ON COLUMN public.exam_requests.document_url IS 'Path to the uploaded medical request document in Supabase Storage';
