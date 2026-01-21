-- ==============================================================================
-- MIGRAÇÃO CONSOLIDADA DATE: 2026-01-21
-- INSTRUÇÕES: Copie todo o conteúdo abaixo e execute no SQL Editor do Supabase Dashboard
-- ==============================================================================

-- 1. MELHORIAS DE PERFORMANCE E SEGURANÇA
-- =======================================

-- Index for bmi_history.exam_id
CREATE INDEX IF NOT EXISTS idx_bmi_history_exam_id ON public.bmi_history(exam_id);

-- Index for bmi_history.user_id
CREATE INDEX IF NOT EXISTS idx_bmi_history_user_id ON public.bmi_history(user_id);

-- Index for exam_results.exam_id
CREATE INDEX IF NOT EXISTS idx_exam_results_exam_id ON public.exam_results(exam_id);

-- Index for exam_results.user_id
CREATE INDEX IF NOT EXISTS idx_exam_results_user_id ON public.exam_results(user_id);

-- Index for exams.user_id
CREATE INDEX IF NOT EXISTS idx_exams_user_id ON public.exams(user_id);

-- Index for health_goals.user_id
CREATE INDEX IF NOT EXISTS idx_health_goals_user_id ON public.health_goals(user_id);

-- Index for medications.user_id
CREATE INDEX IF NOT EXISTS idx_medications_user_id ON public.medications(user_id);

-- Index for access_logs.user_id
CREATE INDEX IF NOT EXISTS idx_access_logs_user_id ON public.access_logs(user_id);

-- Index for shared_links.exam_id
CREATE INDEX IF NOT EXISTS idx_shared_links_exam_id ON public.shared_links(exam_id);

-- Index for shared_links.user_id
CREATE INDEX IF NOT EXISTS idx_shared_links_user_id ON public.shared_links(user_id);

-- Index for profiles.user_id
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);

-- Index for push_subscriptions.user_id
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id ON public.push_subscriptions(user_id);

-- Index for exam_reminders.user_id
CREATE INDEX IF NOT EXISTS idx_exam_reminders_user_id ON public.exam_reminders(user_id);

-- Index for achievements.user_id
CREATE INDEX IF NOT EXISTS idx_achievements_user_id ON public.achievements(user_id);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_exams_user_id_exam_date ON public.exams(user_id, exam_date DESC);
CREATE INDEX IF NOT EXISTS idx_exam_results_exam_id_status ON public.exam_results(exam_id, status);
CREATE INDEX IF NOT EXISTS idx_shared_links_token ON public.shared_links(token);
CREATE INDEX IF NOT EXISTS idx_shared_links_expires_at ON public.shared_links(expires_at) WHERE expires_at IS NOT NULL;

-- Security RLS Fixes
DROP POLICY IF EXISTS "Service can insert access logs" ON public.access_logs;

CREATE POLICY "Secure insert access logs" ON public.access_logs
FOR INSERT WITH CHECK (
  user_id IS NULL OR user_id = auth.uid()
);

DROP POLICY IF EXISTS "Users can view their own access logs" ON public.access_logs;
CREATE POLICY "Users can view their own access logs" ON public.access_logs
FOR SELECT USING (user_id = auth.uid());

-- Consolidate shared_links policies
DROP POLICY IF EXISTS "Anyone can view unexpired shared links by token" ON public.shared_links;
DROP POLICY IF EXISTS "Users can manage their shared links" ON public.shared_links;

CREATE POLICY "shared_links_select_policy" ON public.shared_links
FOR SELECT USING (
  user_id = auth.uid() OR (expires_at IS NULL OR expires_at > now())
);

CREATE POLICY "shared_links_insert_policy" ON public.shared_links
FOR INSERT WITH CHECK (
  auth.uid() IS NOT NULL AND user_id = auth.uid()
);

CREATE POLICY "shared_links_update_policy" ON public.shared_links
FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "shared_links_delete_policy" ON public.shared_links
FOR DELETE USING (user_id = auth.uid());


-- 2. SISTEMA DE PERFIS FAMILIARES
-- ===============================

-- Tabela para membros da família
CREATE TABLE IF NOT EXISTS public.family_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  birth_date DATE,
  sex TEXT CHECK (sex IN ('M', 'F', 'O')),
  relationship TEXT NOT NULL, -- 'self', 'spouse', 'child', 'parent', 'sibling', 'other'
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  CONSTRAINT family_members_owner_id_fkey FOREIGN KEY (owner_id) 
    REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Índices para family_members
CREATE INDEX IF NOT EXISTS idx_family_members_owner_id ON public.family_members(owner_id);
CREATE INDEX IF NOT EXISTS idx_family_members_active ON public.family_members(owner_id, is_active) WHERE is_active = true;

-- RLS para family_members
ALTER TABLE public.family_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their family members" ON public.family_members
FOR ALL USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());

-- Adicionar colunas nas tabelas de exames
ALTER TABLE public.exams 
ADD COLUMN IF NOT EXISTS family_member_id UUID REFERENCES public.family_members(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_exams_family_member_id ON public.exams(family_member_id) WHERE family_member_id IS NOT NULL;

ALTER TABLE public.exam_results 
ADD COLUMN IF NOT EXISTS family_member_id UUID REFERENCES public.family_members(id) ON DELETE SET NULL;

-- Comentários finais
COMMENT ON TABLE public.family_members IS 'Membros da família para gerenciamento de exames de familiares';
COMMENT ON COLUMN public.family_members.relationship IS 'Relação com o titular: self, spouse, child, parent, sibling, other';
COMMENT ON COLUMN public.exams.family_member_id IS 'Membro da família ao qual este exame pertence (null = titular)';
