-- =====================================================
-- MEUEXAME - SCHEMA COMPLETO PARA SUPABASE EXTERNO
-- Execute este arquivo PRIMEIRO no SQL Editor
-- =====================================================

-- =====================================================
-- FUNÇÕES UTILITÁRIAS
-- =====================================================

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- =====================================================
-- TABELA: profiles
-- Armazena dados adicionais do usuário
-- =====================================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  full_name TEXT,
  birth_date DATE,
  sex TEXT,
  avatar_url TEXT,
  email_notifications BOOLEAN DEFAULT true,
  digest_frequency TEXT DEFAULT 'none',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.profiles 
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles 
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles 
  FOR UPDATE USING (auth.uid() = user_id);

CREATE TRIGGER update_profiles_updated_at 
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Função para criar perfil automaticamente no signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (new.id, new.raw_user_meta_data ->> 'full_name');
  RETURN new;
END;
$$;

CREATE TRIGGER on_auth_user_created 
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- TABELA: exams
-- Armazena metadados dos arquivos de exame
-- =====================================================
CREATE TABLE public.exams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  file_name TEXT NOT NULL,
  file_url TEXT,
  lab_name TEXT,
  exam_date DATE,
  upload_date TIMESTAMPTZ DEFAULT now(),
  processed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own exams" ON public.exams 
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own exams" ON public.exams 
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own exams" ON public.exams 
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own exams" ON public.exams 
  FOR DELETE USING (auth.uid() = user_id);

-- Índices para performance
CREATE INDEX idx_exams_user_id ON public.exams(user_id);
CREATE INDEX idx_exams_exam_date ON public.exams(exam_date DESC);

-- =====================================================
-- TABELA: exam_results
-- Armazena resultados individuais extraídos
-- =====================================================
CREATE TABLE public.exam_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id UUID NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  category TEXT,
  value NUMERIC NOT NULL,
  unit TEXT NOT NULL,
  reference_min NUMERIC,
  reference_max NUMERIC,
  status TEXT NOT NULL DEFAULT 'healthy',
  exam_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.exam_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own results" ON public.exam_results 
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own results" ON public.exam_results 
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own results" ON public.exam_results 
  FOR DELETE USING (auth.uid() = user_id);

-- Índices para performance
CREATE INDEX idx_exam_results_user_id ON public.exam_results(user_id);
CREATE INDEX idx_exam_results_exam_id ON public.exam_results(exam_id);
CREATE INDEX idx_exam_results_name ON public.exam_results(name);
CREATE INDEX idx_exam_results_exam_date ON public.exam_results(exam_date DESC);

-- =====================================================
-- TABELA: health_goals
-- Metas de saúde do usuário
-- =====================================================
CREATE TABLE public.health_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  exam_name TEXT NOT NULL,
  target_value NUMERIC NOT NULL,
  target_type TEXT NOT NULL DEFAULT 'range',
  target_min NUMERIC,
  target_max NUMERIC,
  current_value NUMERIC,
  unit TEXT NOT NULL,
  notes TEXT,
  deadline DATE,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.health_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own goals" ON public.health_goals 
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own goals" ON public.health_goals 
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own goals" ON public.health_goals 
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own goals" ON public.health_goals 
  FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_health_goals_updated_at 
  BEFORE UPDATE ON public.health_goals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Índice para performance
CREATE INDEX idx_health_goals_user_id ON public.health_goals(user_id);

-- =====================================================
-- TABELA: bmi_history
-- Histórico de IMC do usuário
-- =====================================================
CREATE TABLE public.bmi_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  weight NUMERIC NOT NULL,
  height NUMERIC NOT NULL,
  bmi NUMERIC,
  recorded_at DATE NOT NULL DEFAULT CURRENT_DATE,
  exam_id UUID REFERENCES public.exams(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.bmi_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own BMI history" ON public.bmi_history 
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own BMI records" ON public.bmi_history 
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own BMI records" ON public.bmi_history 
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own BMI records" ON public.bmi_history 
  FOR DELETE USING (auth.uid() = user_id);

-- Índices para performance
CREATE INDEX idx_bmi_history_user_id ON public.bmi_history(user_id);
CREATE INDEX idx_bmi_history_recorded_at ON public.bmi_history(recorded_at DESC);

-- =====================================================
-- STORAGE: Buckets
-- =====================================================

-- Bucket para arquivos de exames (privado)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('exam-files', 'exam-files', false)
ON CONFLICT (id) DO NOTHING;

-- Bucket para avatares (público)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- STORAGE: Políticas de acesso
-- =====================================================

-- Políticas para exam-files
CREATE POLICY "Users can upload own exam files" ON storage.objects 
  FOR INSERT WITH CHECK (
    bucket_id = 'exam-files' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view own exam files" ON storage.objects 
  FOR SELECT USING (
    bucket_id = 'exam-files' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete own exam files" ON storage.objects 
  FOR DELETE USING (
    bucket_id = 'exam-files' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Políticas para avatars
CREATE POLICY "Anyone can view avatars" ON storage.objects 
  FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload own avatar" ON storage.objects 
  FOR INSERT WITH CHECK (
    bucket_id = 'avatars' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update own avatar" ON storage.objects 
  FOR UPDATE USING (
    bucket_id = 'avatars' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- =====================================================
-- CONFIGURAÇÕES FINAIS
-- =====================================================

-- Habilitar extensões úteis (se ainda não estiverem)
CREATE EXTENSION IF NOT EXISTS "pg_cron";  -- Para agendar tarefas
CREATE EXTENSION IF NOT EXISTS "pg_net";   -- Para HTTP requests

-- =====================================================
-- FIM DO SCHEMA
-- =====================================================
