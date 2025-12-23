-- Add digest frequency preference to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS digest_frequency text DEFAULT 'none' CHECK (digest_frequency IN ('none', 'weekly', 'monthly'));