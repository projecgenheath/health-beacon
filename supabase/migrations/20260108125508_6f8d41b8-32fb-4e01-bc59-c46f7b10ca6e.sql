-- Create table for BMI history tracking
CREATE TABLE public.bmi_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  weight NUMERIC NOT NULL,
  height NUMERIC NOT NULL,
  bmi NUMERIC GENERATED ALWAYS AS (weight / (height / 100) ^ 2) STORED,
  recorded_at DATE NOT NULL DEFAULT CURRENT_DATE,
  exam_id UUID REFERENCES public.exams(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.bmi_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own BMI history"
ON public.bmi_history
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own BMI records"
ON public.bmi_history
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own BMI records"
ON public.bmi_history
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own BMI records"
ON public.bmi_history
FOR DELETE
USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_bmi_history_user_date ON public.bmi_history(user_id, recorded_at DESC);