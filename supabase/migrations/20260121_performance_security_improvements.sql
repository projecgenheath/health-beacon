-- =====================================================
-- Migration: Performance and Security Improvements
-- Date: 2026-01-21
-- Description: Add missing indexes for foreign keys and
--              fix overly permissive RLS policies
-- =====================================================

-- ===================
-- PERFORMANCE INDEXES
-- ===================

-- Index for bmi_history.exam_id
CREATE INDEX IF NOT EXISTS idx_bmi_history_exam_id 
ON public.bmi_history(exam_id);

-- Index for bmi_history.user_id
CREATE INDEX IF NOT EXISTS idx_bmi_history_user_id 
ON public.bmi_history(user_id);

-- Index for exam_results.exam_id
CREATE INDEX IF NOT EXISTS idx_exam_results_exam_id 
ON public.exam_results(exam_id);

-- Index for exam_results.user_id
CREATE INDEX IF NOT EXISTS idx_exam_results_user_id 
ON public.exam_results(user_id);

-- Index for exams.user_id
CREATE INDEX IF NOT EXISTS idx_exams_user_id 
ON public.exams(user_id);

-- Index for health_goals.user_id
CREATE INDEX IF NOT EXISTS idx_health_goals_user_id 
ON public.health_goals(user_id);

-- Index for medications.user_id
CREATE INDEX IF NOT EXISTS idx_medications_user_id 
ON public.medications(user_id);

-- Index for access_logs.user_id
CREATE INDEX IF NOT EXISTS idx_access_logs_user_id 
ON public.access_logs(user_id);

-- Index for shared_links.exam_id
CREATE INDEX IF NOT EXISTS idx_shared_links_exam_id 
ON public.shared_links(exam_id);

-- Index for shared_links.user_id
CREATE INDEX IF NOT EXISTS idx_shared_links_user_id 
ON public.shared_links(user_id);

-- Index for profiles.user_id
CREATE INDEX IF NOT EXISTS idx_profiles_user_id 
ON public.profiles(user_id);

-- Index for push_subscriptions.user_id
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id 
ON public.push_subscriptions(user_id);

-- Index for exam_reminders.user_id
CREATE INDEX IF NOT EXISTS idx_exam_reminders_user_id 
ON public.exam_reminders(user_id);

-- Index for achievements.user_id
CREATE INDEX IF NOT EXISTS idx_achievements_user_id 
ON public.achievements(user_id);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_exams_user_id_exam_date 
ON public.exams(user_id, exam_date DESC);

CREATE INDEX IF NOT EXISTS idx_exam_results_exam_id_status 
ON public.exam_results(exam_id, status);

CREATE INDEX IF NOT EXISTS idx_shared_links_token 
ON public.shared_links(token);

CREATE INDEX IF NOT EXISTS idx_shared_links_expires_at 
ON public.shared_links(expires_at) WHERE expires_at IS NOT NULL;


-- =====================
-- SECURITY RLS FIXES
-- =====================

-- Fix access_logs insert policy (was too permissive)
DROP POLICY IF EXISTS "Service can insert access logs" ON public.access_logs;

-- Create a more secure policy
CREATE POLICY "Secure insert access logs" ON public.access_logs
FOR INSERT
WITH CHECK (
  user_id IS NULL  -- Allow anonymous access logging
  OR
  user_id = auth.uid()  -- Or authenticated user logs their own access
);

-- Ensure users can only see their own access logs
DROP POLICY IF EXISTS "Users can view their own access logs" ON public.access_logs;

CREATE POLICY "Users can view their own access logs" ON public.access_logs
FOR SELECT
USING (user_id = auth.uid());


-- Consolidate shared_links policies (multiple permissive policies hurt performance)
DROP POLICY IF EXISTS "Anyone can view unexpired shared links by token" ON public.shared_links;
DROP POLICY IF EXISTS "Users can manage their shared links" ON public.shared_links;

-- Consolidated SELECT policy
CREATE POLICY "shared_links_select_policy" ON public.shared_links
FOR SELECT
USING (
  user_id = auth.uid()
  OR
  (expires_at IS NULL OR expires_at > now())
);

-- Insert policy
CREATE POLICY "shared_links_insert_policy" ON public.shared_links
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND user_id = auth.uid()
);

-- Update policy
CREATE POLICY "shared_links_update_policy" ON public.shared_links
FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Delete policy
CREATE POLICY "shared_links_delete_policy" ON public.shared_links
FOR DELETE
USING (user_id = auth.uid());


-- =====================
-- COMMENTS FOR DOCUMENTATION
-- =====================

COMMENT ON INDEX idx_exams_user_id_exam_date IS 'Optimizes queries fetching user exams ordered by date';
COMMENT ON INDEX idx_exam_results_exam_id_status IS 'Optimizes filtering results by status';
COMMENT ON INDEX idx_shared_links_token IS 'Optimizes token lookups for sharing';
