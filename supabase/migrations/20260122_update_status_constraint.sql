-- Update status check constraint to include 'normal' and 'abnormal' for imaging/pathology exams

-- Drop the old constraint
ALTER TABLE exam_results DROP CONSTRAINT IF EXISTS exam_results_status_check;

-- Add new constraint with all valid status values
ALTER TABLE exam_results ADD CONSTRAINT exam_results_status_check 
CHECK (status = ANY (ARRAY['healthy'::text, 'warning'::text, 'danger'::text, 'normal'::text, 'abnormal'::text]));
