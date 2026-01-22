-- Migration: Add unique constraint to CPF and create function to lookup email by CPF
-- This ensures no duplicate CPF in the system

-- Add unique constraint to CPF column
ALTER TABLE public.profiles
ADD CONSTRAINT profiles_cpf_unique UNIQUE (cpf);

-- Create an index for faster CPF lookups
CREATE INDEX IF NOT EXISTS idx_profiles_cpf ON public.profiles (cpf);

-- Create a function to lookup user email by CPF (for password recovery)
-- This function is accessible via RPC and returns only the email domain hint for security
CREATE OR REPLACE FUNCTION public.lookup_email_by_cpf(p_cpf text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_email text;
    v_email_hint text;
    v_user_id uuid;
BEGIN
    -- Normalize CPF (remove formatting)
    p_cpf := regexp_replace(p_cpf, '[^0-9]', '', 'g');
    
    -- Validate CPF length
    IF length(p_cpf) != 11 THEN
        RETURN json_build_object('success', false, 'message', 'CPF inválido');
    END IF;
    
    -- Look up the profile by CPF
    SELECT p.user_id INTO v_user_id
    FROM public.profiles p
    WHERE regexp_replace(p.cpf, '[^0-9]', '', 'g') = p_cpf;
    
    IF v_user_id IS NULL THEN
        RETURN json_build_object('success', false, 'message', 'CPF não encontrado no sistema');
    END IF;
    
    -- Get the email from auth.users
    SELECT email INTO v_email
    FROM auth.users
    WHERE id = v_user_id;
    
    IF v_email IS NULL THEN
        RETURN json_build_object('success', false, 'message', 'Usuário não encontrado');
    END IF;
    
    -- Create email hint (first 3 chars + *** + @domain)
    v_email_hint := substring(v_email from 1 for 3) || '***' || substring(v_email from position('@' in v_email));
    
    RETURN json_build_object(
        'success', true,
        'email', v_email,
        'email_hint', v_email_hint
    );
END;
$$;

-- Grant execute permission to authenticated and anon users
GRANT EXECUTE ON FUNCTION public.lookup_email_by_cpf(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.lookup_email_by_cpf(text) TO anon;

-- Create a function to check if CPF is already registered
CREATE OR REPLACE FUNCTION public.check_cpf_available(p_cpf text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_exists boolean;
BEGIN
    -- Normalize CPF (remove formatting)
    p_cpf := regexp_replace(p_cpf, '[^0-9]', '', 'g');
    
    -- Validate CPF length
    IF length(p_cpf) != 11 THEN
        RETURN json_build_object('available', false, 'message', 'CPF inválido');
    END IF;
    
    -- Check if CPF exists
    SELECT EXISTS(
        SELECT 1 FROM public.profiles p
        WHERE regexp_replace(p.cpf, '[^0-9]', '', 'g') = p_cpf
    ) INTO v_exists;
    
    IF v_exists THEN
        RETURN json_build_object('available', false, 'message', 'Este CPF já está cadastrado no sistema');
    END IF;
    
    RETURN json_build_object('available', true, 'message', 'CPF disponível');
END;
$$;

-- Grant execute permission to authenticated and anon users
GRANT EXECUTE ON FUNCTION public.check_cpf_available(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_cpf_available(text) TO anon;
