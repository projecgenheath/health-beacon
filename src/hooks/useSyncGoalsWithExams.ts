import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export const useSyncGoalsWithExams = () => {
  const { user } = useAuth();

  const syncGoals = useCallback(async () => {
    if (!user) return;

    try {
      // Fetch all health goals
      const { data: goals, error: goalsError } = await supabase
        .from('health_goals')
        .select('*')
        .eq('status', 'active');

      if (goalsError) throw goalsError;
      if (!goals || goals.length === 0) return;

      // Fetch latest exam results for each unique exam name
      const { data: examResults, error: examsError } = await supabase
        .from('exam_results')
        .select('name, value, exam_date')
        .eq('user_id', user.id)
        .order('exam_date', { ascending: false });

      if (examsError) throw examsError;
      if (!examResults || examResults.length === 0) return;

      // Get latest value for each exam name
      const latestValues = new Map<string, number>();
      examResults.forEach((result) => {
        if (!latestValues.has(result.name)) {
          latestValues.set(result.name, result.value);
        }
      });

      // Update goals with current values
      let updatedCount = 0;
      for (const goal of goals) {
        const currentValue = latestValues.get(goal.exam_name);
        
        if (currentValue !== undefined && currentValue !== goal.current_value) {
          const { error: updateError } = await supabase
            .from('health_goals')
            .update({ current_value: currentValue })
            .eq('id', goal.id);

          if (!updateError) {
            updatedCount++;
            
            // Check if goal achieved
            let achieved = false;
            if (goal.target_type === 'range' && goal.target_min !== null && goal.target_max !== null) {
              achieved = currentValue >= goal.target_min && currentValue <= goal.target_max;
            } else if (goal.target_type === 'below') {
              achieved = currentValue <= goal.target_value;
            } else if (goal.target_type === 'above') {
              achieved = currentValue >= goal.target_value;
            }

            if (achieved && goal.status === 'active') {
              await supabase
                .from('health_goals')
                .update({ status: 'achieved' })
                .eq('id', goal.id);
              
              toast.success(`🎉 Meta alcançada: ${goal.exam_name}!`);
            }
          }
        }
      }

      if (updatedCount > 0) {
        toast.info(`${updatedCount} meta(s) atualizada(s) com novos valores`);
      }
    } catch (error) {
      console.error('Error syncing goals:', error);
    }
  }, [user]);

  return { syncGoals };
};
