import { useNavigate } from 'react-router-dom';
import { HealthSummary } from '@/types/exam';
import { Activity, CheckCircle2, AlertTriangle, AlertCircle, ArrowLeftRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface HealthSummaryCardProps {
  summary: HealthSummary;
  onStatusClick?: (status: string) => void;
  activeStatuses?: string[];
}

export const HealthSummaryCard = ({ summary, onStatusClick, activeStatuses = [] }: HealthSummaryCardProps) => {
  const navigate = useNavigate();
  const healthPercentage = summary.totalExams > 0 ? Math.round((summary.healthy / summary.totalExams) * 100) : 0;

  const getHealthMessage = () => {
    if (healthPercentage >= 90) return { text: 'Excelente!', emoji: '🎉' };
    if (healthPercentage >= 70) return { text: 'Muito bom!', emoji: '😊' };
    if (healthPercentage >= 50) return { text: 'Atenção', emoji: '⚠️' };
    return { text: 'Cuide-se', emoji: '🏥' };
  };

  const healthMessage = getHealthMessage();

  return (
    <div className="relative overflow-hidden rounded-2xl p-6 animate-slide-up hover-lift glass-card border-none">
      {/* Animated background decorations */}
      <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-primary/20 blur-3xl animate-pulse-slow" />
      <div className="absolute -bottom-8 -left-8 h-24 w-24 rounded-full bg-status-healthy/20 blur-3xl animate-float" />
      <div className="absolute top-1/2 right-4 h-16 w-16 rounded-full bg-accent/20 blur-xl animate-pulse-slow" style={{ animationDelay: '1s' }} />

      <div className="relative">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl gradient-primary text-primary-foreground shadow-glow-primary transition-spring hover:scale-105">
            <Activity className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              Visão Geral da Saúde
              <Sparkles className="h-4 w-4 text-primary animate-pulse-slow" />
            </h2>
            <p className="text-sm text-muted-foreground">Atualizado em {summary.lastUpdate}</p>
          </div>
        </div>

        {/* Health Score Circle */}
        <div className="flex items-center justify-center mb-6">
          <div className="relative group">
            <svg className="h-36 w-36 -rotate-90 transform transition-transform duration-500 group-hover:scale-105">
              <circle
                cx="72"
                cy="72"
                r="60"
                fill="none"
                stroke="hsl(var(--muted))"
                strokeWidth="12"
                className="opacity-50"
              />
              <circle
                cx="72"
                cy="72"
                r="60"
                fill="none"
                stroke="url(#healthGradient)"
                strokeWidth="12"
                strokeLinecap="round"
                strokeDasharray={`${healthPercentage * 3.77} 377`}
                className="transition-all duration-1000 ease-out drop-shadow-lg"
                style={{ filter: 'drop-shadow(0 0 8px hsl(var(--status-healthy) / 0.5))' }}
              />
              <defs>
                <linearGradient id="healthGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="hsl(var(--status-healthy))" />
                  <stop offset="100%" stopColor="hsl(var(--primary))" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl font-bold text-foreground transition-all duration-300 group-hover:scale-110">
                {healthPercentage}%
              </span>
              <span className="text-sm text-muted-foreground">{healthMessage.text} {healthMessage.emoji}</span>
            </div>
          </div>
        </div>

        {/* Status Summary */}
        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={() => onStatusClick?.('healthy')}
            className={cn(
              "flex flex-col items-center rounded-xl bg-status-healthy-bg p-3 card-interactive stagger-1 transition-all border-2 border-transparent",
              summary.healthy > 0 && "shadow-glow-healthy/30",
              activeStatuses.includes('healthy') && "border-status-healthy bg-status-healthy/10"
            )}
          >
            <CheckCircle2 className="h-5 w-5 text-status-healthy mb-1" />
            <span className="text-2xl font-bold text-status-healthy">{summary.healthy}</span>
            <span className="text-xs text-muted-foreground">Normal</span>
          </button>

          <button
            onClick={() => onStatusClick?.('warning')}
            className={cn(
              "flex flex-col items-center rounded-xl bg-status-warning-bg p-3 card-interactive stagger-2 transition-all border-2 border-transparent",
              summary.warning > 0 && "shadow-glow-warning/30",
              activeStatuses.includes('warning') && "border-status-warning bg-status-warning/10"
            )}
          >
            <AlertTriangle className="h-5 w-5 text-status-warning mb-1" />
            <span className="text-2xl font-bold text-status-warning">{summary.warning}</span>
            <span className="text-xs text-muted-foreground">Atenção</span>
          </button>

          <button
            onClick={() => onStatusClick?.('danger')}
            className={cn(
              "flex flex-col items-center rounded-xl bg-status-danger-bg p-3 card-interactive stagger-3 transition-all border-2 border-transparent",
              summary.danger > 0 && "shadow-glow-danger/30",
              activeStatuses.includes('danger') && "border-status-danger bg-status-danger/10"
            )}
          >
            <AlertCircle className="h-5 w-5 text-status-danger mb-1" />
            <span className="text-2xl font-bold text-status-danger">{summary.danger}</span>
            <span className="text-xs text-muted-foreground">Alterado</span>
          </button>
        </div>

        {summary.totalExams > 0 && (
          <Button
            variant="outline"
            className="w-full mt-4 btn-press hover-glow transition-smooth"
            onClick={() => navigate('/compare')}
          >
            <ArrowLeftRight className="h-4 w-4 mr-2" />
            Comparar Exames
          </Button>
        )}
      </div>
    </div>
  );
};
