-- =====================================================
-- Migration: Add Family Profiles System
-- Permite gerenciar exames de familiares
-- =====================================================

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
CREATE INDEX IF NOT EXISTS idx_family_members_owner_id 
ON public.family_members(owner_id);

CREATE INDEX IF NOT EXISTS idx_family_members_active 
ON public.family_members(owner_id, is_active) WHERE is_active = true;

-- RLS para family_members
ALTER TABLE public.family_members ENABLE ROW LEVEL SECURITY;

-- Política: usuários só podem ver/gerenciar seus próprios membros
CREATE POLICY "Users can manage their family members" ON public.family_members
FOR ALL
USING (owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid());

-- Adicionar coluna family_member_id na tabela exams
ALTER TABLE public.exams 
ADD COLUMN IF NOT EXISTS family_member_id UUID REFERENCES public.family_members(id) ON DELETE SET NULL;

-- Índice para busca de exames por membro da família
CREATE INDEX IF NOT EXISTS idx_exams_family_member_id 
ON public.exams(family_member_id) WHERE family_member_id IS NOT NULL;

-- Adicionar coluna family_member_id na tabela exam_results
ALTER TABLE public.exam_results 
ADD COLUMN IF NOT EXISTS family_member_id UUID REFERENCES public.family_members(id) ON DELETE SET NULL;

-- Comentários
COMMENT ON TABLE public.family_members IS 'Membros da família para gerenciamento de exames de familiares';
COMMENT ON COLUMN public.family_members.relationship IS 'Relação com o titular: self, spouse, child, parent, sibling, other';
COMMENT ON COLUMN public.exams.family_member_id IS 'Membro da família ao qual este exame pertence (null = titular)';
