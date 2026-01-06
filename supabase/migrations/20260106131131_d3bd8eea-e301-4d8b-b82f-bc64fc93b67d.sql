-- Create health_goals table for tracking user health targets
CREATE TABLE public.health_goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  exam_name TEXT NOT NULL,
  target_value NUMERIC NOT NULL,
  target_type TEXT NOT NULL DEFAULT 'range', -- 'range', 'above', 'below'
  target_min NUMERIC,
  target_max NUMERIC,
  current_value NUMERIC,
  unit TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  deadline DATE,
  status TEXT NOT NULL DEFAULT 'active' -- 'active', 'achieved', 'paused'
);

-- Enable RLS
ALTER TABLE public.health_goals ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own goals" 
ON public.health_goals 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own goals" 
ON public.health_goals 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own goals" 
ON public.health_goals 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own goals" 
ON public.health_goals 
FOR DELETE 
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_health_goals_updated_at
BEFORE UPDATE ON public.health_goals
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();