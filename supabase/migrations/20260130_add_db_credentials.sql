
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS db_codigo_apoiado text,
ADD COLUMN IF NOT EXISTS db_senha_integracao text;
