import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Target, Plus, Trash2, CheckCircle2, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { toast } from 'sonner';
import { AddGoalDialog } from './AddGoalDialog';

interface HealthGoal {
  id: string;
  exam_name: string;
  target_value: number;
  target_type: string;
  target_min: number | null;
  target_max: number | null;
  current_value: number | null;
  unit: string;
  notes: string | null;
  deadline: string | null;
  status: string;
}

export const HealthGoals = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: goals = [], isLoading } = useQuery({
    queryKey: ['health-goals', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('health_goals')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as HealthGoal[];
    },
    enabled: !!user,
  });

  const deleteGoal = useMutation({
    mutationFn: async (goalId: string) => {
      const { error } = await supabase
        .from('health_goals')
        .delete()
        .eq('id', goalId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['health-goals'] });
      toast.success('Meta removida com sucesso');
    },
    onError: () => {
      toast.error('Erro ao remover meta');
    },
  });

  const updateGoalStatus = useMutation({
    mutationFn: async ({ goalId, status }: { goalId: string; status: string }) => {
      const { error } = await supabase
        .from('health_goals')
        .update({ status })
        .eq('id', goalId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['health-goals'] });
      toast.success('Status atualizado');
    },
  });

  const calculateProgress = (goal: HealthGoal): number => {
    if (!goal.current_value) return 0;
    
    if (goal.target_type === 'range' && goal.target_min !== null && goal.target_max !== null) {
      const mid = (goal.target_min + goal.target_max) / 2;
      const range = goal.target_max - goal.target_min;
      const diff = Math.abs(goal.current_value - mid);
      return Math.max(0, Math.min(100, 100 - (diff / range) * 100));
    }
    
    if (goal.target_type === 'below') {
      if (goal.current_value <= goal.target_value) return 100;
      const excess = goal.current_value - goal.target_value;
      return Math.max(0, 100 - (excess / goal.target_value) * 100);
    }
    
    if (goal.target_type === 'above') {
      if (goal.current_value >= goal.target_value) return 100;
      return Math.max(0, (goal.current_value / goal.target_value) * 100);
    }
    
    return 0;
  };

  const getStatusBadge = (goal: HealthGoal) => {
    const progress = calculateProgress(goal);
    
    if (goal.status === 'achieved') {
      return <Badge className="bg-green-500/20 text-green-600 border-green-500/30">Alcançada</Badge>;
    }
    if (goal.status === 'paused') {
      return <Badge variant="secondary">Pausada</Badge>;
    }
    if (progress >= 90) {
      return <Badge className="bg-green-500/20 text-green-600 border-green-500/30">Quase lá!</Badge>;
    }
    if (progress >= 50) {
      return <Badge className="bg-yellow-500/20 text-yellow-600 border-yellow-500/30">Em progresso</Badge>;
    }
    return <Badge className="bg-orange-500/20 text-orange-600 border-orange-500/30">Iniciando</Badge>;
  };

  const getTrendIcon = (goal: HealthGoal) => {
    if (!goal.current_value) return <Minus className="h-4 w-4 text-muted-foreground" />;
    
    const progress = calculateProgress(goal);
    if (progress >= 70) return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (progress >= 40) return <Minus className="h-4 w-4 text-yellow-500" />;
    return <TrendingDown className="h-4 w-4 text-red-500" />;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Metas de Saúde
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-20 bg-muted rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div id="health-goals-section">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Metas de Saúde
          </CardTitle>
          <Button size="sm" onClick={() => setIsDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Nova Meta
          </Button>
        </CardHeader>
        <CardContent>
          {goals.length === 0 ? (
            <div className="text-center py-8">
              <Target className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <h3 className="font-medium mb-1">Nenhuma meta definida</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Defina metas para acompanhar sua evolução
              </p>
              <Button variant="outline" onClick={() => setIsDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-1" />
                Criar primeira meta
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {goals.map((goal) => {
                const progress = calculateProgress(goal);
                
                return (
                  <div
                    key={goal.id}
                    className="p-4 rounded-lg border bg-card hover:shadow-sm transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {getTrendIcon(goal)}
                        <div>
                          <h4 className="font-medium">{goal.exam_name}</h4>
                          <p className="text-xs text-muted-foreground">
                            {goal.target_type === 'range' 
                              ? `Meta: ${goal.target_min} - ${goal.target_max} ${goal.unit}`
                              : goal.target_type === 'below'
                              ? `Meta: abaixo de ${goal.target_value} ${goal.unit}`
                              : `Meta: acima de ${goal.target_value} ${goal.unit}`
                            }
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(goal)}
                        {goal.status === 'active' && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                            onClick={() => updateGoalStatus.mutate({ goalId: goal.id, status: 'achieved' })}
                          >
                            <CheckCircle2 className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => deleteGoal.mutate(goal.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Progresso</span>
                        <span className="font-medium">
                          {goal.current_value !== null 
                            ? `${goal.current_value} ${goal.unit}` 
                            : 'Sem dados'
                          }
                        </span>
                      </div>
                      <Progress value={progress} className="h-2" />
                      <p className="text-xs text-muted-foreground text-right">
                        {progress.toFixed(0)}% concluído
                      </p>
                    </div>
                    
                    {goal.notes && (
                      <p className="text-xs text-muted-foreground mt-2 italic">
                        {goal.notes}
                      </p>
                    )}
                    
                    {goal.deadline && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Prazo: {new Date(goal.deadline).toLocaleDateString('pt-BR')}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
      
      <AddGoalDialog 
        open={isDialogOpen} 
        onOpenChange={setIsDialogOpen}
      />
    </div>
  );
};
