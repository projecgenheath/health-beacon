import { useState } from 'react';
import { ExamResult, ExamHistory } from '@/types/exam';
import { ChevronDown, TrendingUp, TrendingDown, Minus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ExamChart } from './ExamChart';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';

interface ExamCardProps {
  exam: ExamResult;
  history?: ExamHistory;
  index: number;
  onDelete?: () => void;
}

export const ExamCard = ({ exam, history, index, onDelete }: ExamCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const statusConfig = {
    healthy: {
      bg: 'bg-status-healthy-bg',
      text: 'text-status-healthy',
      border: 'border-status-healthy/20',
      glow: 'shadow-glow-healthy',
      gradient: 'gradient-healthy',
      label: 'Normal',
    },
    warning: {
      bg: 'bg-status-warning-bg',
      text: 'text-status-warning',
      border: 'border-status-warning/20',
      glow: 'shadow-glow-warning',
      gradient: 'gradient-warning',
      label: 'Atenção',
    },
    danger: {
      bg: 'bg-status-danger-bg',
      text: 'text-status-danger',
      border: 'border-status-danger/20',
      glow: 'shadow-glow-danger',
      gradient: 'gradient-danger',
      label: 'Alterado',
    },
  };

  const config = statusConfig[exam.status];

  const getTrend = () => {
    if (!history || history.history.length < 2) return null;
    const lastTwo = history.history.slice(-2);
    const diff = lastTwo[1].value - lastTwo[0].value;
    if (Math.abs(diff) < 0.1) return 'stable';
    return diff > 0 ? 'up' : 'down';
  };

  const trend = getTrend();

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('exam_results')
        .delete()
        .eq('id', exam.id);

      if (error) throw error;

      toast({
        title: 'Exame excluído',
        description: `O resultado de ${exam.name} foi removido com sucesso.`,
      });

      onDelete?.();
    } catch (error) {
      console.error('Error deleting exam:', error);
      toast({
        title: 'Erro ao excluir',
        description: 'Não foi possível excluir o resultado do exame.',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-2xl bg-card border transition-all duration-300 cursor-pointer',
        config.border,
        isExpanded ? config.glow : 'shadow-sm hover:shadow-md',
        'animate-slide-up'
      )}
      style={{ animationDelay: `${index * 50}ms` }}
      onClick={() => setIsExpanded(!isExpanded)}
    >
      {/* Status indicator bar */}
      <div className={cn('absolute left-0 top-0 h-full w-1', config.gradient)} />

      <div className="p-4 pl-5">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-medium text-foreground">{exam.name}</h3>
              {trend && (
                <div className={cn('p-1 rounded-full', config.bg)}>
                  {trend === 'up' && <TrendingUp className={cn('h-3 w-3', config.text)} />}
                  {trend === 'down' && <TrendingDown className={cn('h-3 w-3', config.text)} />}
                  {trend === 'stable' && <Minus className={cn('h-3 w-3', config.text)} />}
                </div>
              )}
            </div>
            <p className="text-sm text-muted-foreground">{exam.category}</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className={cn('text-xl font-bold', config.text)}>
                {exam.value} <span className="text-sm font-normal text-muted-foreground">{exam.unit}</span>
              </p>
              <p className="text-xs text-muted-foreground">
                Ref: {exam.referenceMin}-{exam.referenceMax}
              </p>
            </div>

            <div className={cn('px-3 py-1.5 rounded-full text-xs font-medium', config.bg, config.text)}>
              {config.label}
            </div>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                <AlertDialogHeader>
                  <AlertDialogTitle>Excluir resultado?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Tem certeza que deseja excluir o resultado de <strong>{exam.name}</strong>? 
                    Esta ação não pode ser desfeita.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel onClick={(e) => e.stopPropagation()}>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {isDeleting ? 'Excluindo...' : 'Excluir'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <ChevronDown
              className={cn(
                'h-5 w-5 text-muted-foreground transition-transform duration-300',
                isExpanded && 'rotate-180'
              )}
            />
          </div>
        </div>
      </div>

      {/* Expanded content with chart */}
      <div
        className={cn(
          'overflow-hidden transition-all duration-300 ease-in-out',
          isExpanded ? 'max-h-80 opacity-100' : 'max-h-0 opacity-0'
        )}
      >
        <div className="px-5 pb-4 pt-2 border-t border-border/50">
          {history ? (
            <ExamChart history={history} />
          ) : (
            <p className="text-center text-sm text-muted-foreground py-8">
              Sem histórico disponível para este exame
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
