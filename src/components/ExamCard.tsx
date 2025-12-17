import { useState } from 'react';
import { ExamResult, ExamHistory } from '@/types/exam';
import { ChevronDown, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ExamChart } from './ExamChart';

interface ExamCardProps {
  exam: ExamResult;
  history?: ExamHistory;
  index: number;
}

export const ExamCard = ({ exam, history, index }: ExamCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

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

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl bg-card border transition-all duration-300 cursor-pointer',
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
