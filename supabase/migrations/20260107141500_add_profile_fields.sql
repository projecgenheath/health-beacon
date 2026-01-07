-- Add new columns to profiles table

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS cpf text,
ADD COLUMN IF NOT EXISTS gender text,
ADD COLUMN IF NOT EXISTS ethnicity text,
ADD COLUMN IF NOT EXISTS marital_status text,
ADD COLUMN IF NOT EXISTS address_country text,
ADD COLUMN IF NOT EXISTS address_state text,
ADD COLUMN IF NOT EXISTS address_city text,
ADD COLUMN IF NOT EXISTS address_neighborhood text,
ADD COLUMN IF NOT EXISTS address_street text,
ADD COLUMN IF NOT EXISTS address_number text,
ADD COLUMN IF NOT EXISTS address_complement text,
ADD COLUMN IF NOT EXISTS phone text,
ADD COLUMN IF NOT EXISTS emergency_phone text,
ADD COLUMN IF NOT EXISTS allergies text,
ADD COLUMN IF NOT EXISTS weight numeric,
ADD COLUMN IF NOT EXISTS height numeric,
ADD COLUMN IF NOT EXISTS chronic_diseases text;
