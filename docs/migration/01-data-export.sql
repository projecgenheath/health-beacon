-- =====================================================
-- MEUEXAME - EXPORTAÇÃO DE DADOS ATUAIS
-- Execute no SQL Editor do novo Supabase após criar as tabelas
-- =====================================================

-- =====================================================
-- PROFILES (1 registro)
-- =====================================================
INSERT INTO profiles (id, user_id, full_name, birth_date, sex, avatar_url, email_notifications, digest_frequency, created_at, updated_at)
VALUES (
  'd37a2d16-9ea0-4459-bc77-407868ddea69',
  '9a458a30-bab4-47e6-8cbe-fb2d797a0563',
  'Alisson',
  NULL,
  NULL,
  NULL,
  true,
  'none',
  '2025-12-17 18:47:33.008812+00',
  '2025-12-17 18:47:33.008812+00'
);

-- =====================================================
-- EXAMS (2 registros)
-- =====================================================
INSERT INTO exams (id, user_id, file_name, file_url, lab_name, exam_date, upload_date, processed, created_at)
VALUES
  (
    '0264ede0-a684-42b8-ba1c-c036d5484055',
    '9a458a30-bab4-47e6-8cbe-fb2d797a0563',
    '6390045044300000009629122025091914.pdf',
    '9a458a30-bab4-47e6-8cbe-fb2d797a0563/0264ede0-a684-42b8-ba1c-c036d5484055/6390045044300000009629122025091914.pdf',
    'DB DIAGNOSTICOS',
    '2025-12-05',
    '2025-12-30 11:02:56.275+00',
    true,
    '2025-12-30 11:02:56.517617+00'
  ),
  (
    '327a10b1-ace8-4228-bc02-172af0402015',
    '9a458a30-bab4-47e6-8cbe-fb2d797a0563',
    'Arquivo (4).pdf',
    '9a458a30-bab4-47e6-8cbe-fb2d797a0563/327a10b1-ace8-4228-bc02-172af0402015/Arquivo (4).pdf',
    'DB DIAGNÓSTICOS',
    '2025-12-15',
    '2026-01-09 19:18:59.715+00',
    true,
    '2026-01-09 19:18:59.828363+00'
  );

-- =====================================================
-- EXAM_RESULTS (múltiplos registros)
-- =====================================================
INSERT INTO exam_results (id, exam_id, user_id, name, category, value, unit, reference_min, reference_max, status, exam_date, created_at)
VALUES
  ('f475ba4d-50bd-46fa-b458-e234e0029e32', '0264ede0-a684-42b8-ba1c-c036d5484055', '9a458a30-bab4-47e6-8cbe-fb2d797a0563', 'HIV 1 e 2 - ANTÍGENO E ANTICORPOS - TESTE DE TRIAGEM', 'Imunologia', 0.05, '-', NULL, 1, 'healthy', '2025-12-05', '2025-12-30 11:03:07.718401+00'),
  ('7e6b3927-ad1f-4327-88cf-1133964eedda', '327a10b1-ace8-4228-bc02-172af0402015', '9a458a30-bab4-47e6-8cbe-fb2d797a0563', 'Bilirrubina Direta', 'Bioquímica', 0.06, 'mg/dL', NULL, 0.2, 'healthy', '2025-12-15', '2026-01-09 19:19:20.417842+00'),
  ('15c15ec7-548c-4f9f-a261-6b03ab9a0291', '327a10b1-ace8-4228-bc02-172af0402015', '9a458a30-bab4-47e6-8cbe-fb2d797a0563', 'Bilirrubina Indireta', 'Bioquímica', 0.17, 'mg/dL', NULL, 1.1, 'healthy', '2025-12-15', '2026-01-09 19:19:20.417842+00'),
  ('f4af0785-db9f-4788-8d41-1be1fb98023e', '327a10b1-ace8-4228-bc02-172af0402015', '9a458a30-bab4-47e6-8cbe-fb2d797a0563', 'Bilirrubina Total', 'Bioquímica', 0.23, 'mg/dL', 0.3, 1.2, 'warning', '2025-12-15', '2026-01-09 19:19:20.417842+00'),
  ('85ea2ede-a637-4391-bbcc-738dd6b1c781', '327a10b1-ace8-4228-bc02-172af0402015', '9a458a30-bab4-47e6-8cbe-fb2d797a0563', 'Ureia', 'Bioquímica', 22, 'mg/dL', 13, 43, 'healthy', '2025-12-15', '2026-01-09 19:19:20.417842+00'),
  ('9950e84e-78ad-47ab-811c-48d7f1d8621f', '327a10b1-ace8-4228-bc02-172af0402015', '9a458a30-bab4-47e6-8cbe-fb2d797a0563', 'Creatinina', 'Bioquímica', 0.75, 'mg/dL', 0.6, 1.1, 'healthy', '2025-12-15', '2026-01-09 19:19:20.417842+00'),
  ('07f87566-157b-4101-bc9c-742830c99edc', '327a10b1-ace8-4228-bc02-172af0402015', '9a458a30-bab4-47e6-8cbe-fb2d797a0563', 'Gama Glutamil Transferase (GGT)', 'Bioquímica', 13, 'U/L', NULL, 38, 'healthy', '2025-12-15', '2026-01-09 19:19:20.417842+00'),
  ('ab3a4b6d-054e-44f0-b347-035155c3e482', '327a10b1-ace8-4228-bc02-172af0402015', '9a458a30-bab4-47e6-8cbe-fb2d797a0563', 'Alanina Aminotransferase (TGP)', 'Bioquímica', 18, 'U/L', NULL, 34, 'healthy', '2025-12-15', '2026-01-09 19:19:20.417842+00'),
  ('be4a1c97-e0bf-4234-b049-0ad60a8d42a0', '327a10b1-ace8-4228-bc02-172af0402015', '9a458a30-bab4-47e6-8cbe-fb2d797a0563', 'Aspartato Aminotransferase (TGO)', 'Bioquímica', 19, 'U/L', NULL, 31, 'healthy', '2025-12-15', '2026-01-09 19:19:20.417842+00'),
  ('9859571d-452e-40b4-bf7d-9232d6cf8438', '327a10b1-ace8-4228-bc02-172af0402015', '9a458a30-bab4-47e6-8cbe-fb2d797a0563', 'Fosfatase Alcalina', 'Bioquímica', 75, 'U/L', 30, 120, 'healthy', '2025-12-15', '2026-01-09 19:19:20.417842+00'),
  ('84adb4fe-6269-4a5c-9544-ee0206a2fd7f', '327a10b1-ace8-4228-bc02-172af0402015', '9a458a30-bab4-47e6-8cbe-fb2d797a0563', 'Glicose de Jejum', 'Bioquímica', 108, 'mg/dL', 70, 99, 'warning', '2025-12-15', '2026-01-09 19:19:20.417842+00'),
  ('ed51a920-be4e-4554-ad32-552872c0a25c', '327a10b1-ace8-4228-bc02-172af0402015', '9a458a30-bab4-47e6-8cbe-fb2d797a0563', 'Colesterol Total', 'Bioquímica', 183, 'mg/dL', NULL, 190, 'healthy', '2025-12-15', '2026-01-09 19:19:20.417842+00'),
  ('f391dad1-21e9-4463-bac4-ca07c0cc1077', '327a10b1-ace8-4228-bc02-172af0402015', '9a458a30-bab4-47e6-8cbe-fb2d797a0563', 'HDL - Colesterol', 'Bioquímica', 50, 'mg/dL', 40, NULL, 'healthy', '2025-12-15', '2026-01-09 19:19:20.417842+00'),
  ('6f373dc7-46f9-4855-9b30-ec7de68256ad', '327a10b1-ace8-4228-bc02-172af0402015', '9a458a30-bab4-47e6-8cbe-fb2d797a0563', 'LDL - Colesterol', 'Bioquímica', 111, 'mg/dL', NULL, 130, 'healthy', '2025-12-15', '2026-01-09 19:19:20.417842+00'),
  ('1b7b7566-0edc-41ae-8197-19fdc19ee2b0', '327a10b1-ace8-4228-bc02-172af0402015', '9a458a30-bab4-47e6-8cbe-fb2d797a0563', 'Colesterol Não-HDL', 'Bioquímica', 133, 'mg/dL', NULL, 160, 'healthy', '2025-12-15', '2026-01-09 19:19:20.417842+00');

-- =====================================================
-- BMI_HISTORY (3 registros)
-- =====================================================
INSERT INTO bmi_history (id, user_id, weight, height, bmi, recorded_at, exam_id, created_at)
VALUES
  ('bd40f059-2874-4852-96be-d0327110678d', '9a458a30-bab4-47e6-8cbe-fb2d797a0563', 76, 175, 24.82, '2026-01-08', NULL, '2026-01-08 13:06:30.390175+00'),
  ('aef633b6-4465-4dcf-8eba-44d007d7217b', '9a458a30-bab4-47e6-8cbe-fb2d797a0563', 75, 175, 24.49, '2026-01-08', NULL, '2026-01-08 18:52:04.304358+00'),
  ('b648aec2-7585-43d5-97ee-bf8d7fbcc2be', '9a458a30-bab4-47e6-8cbe-fb2d797a0563', 75, 175, 24.49, '2026-01-09', NULL, '2026-01-09 19:19:30.334416+00');

-- =====================================================
-- HEALTH_GOALS (nenhum registro)
-- =====================================================
-- Nenhuma meta de saúde cadastrada no momento
