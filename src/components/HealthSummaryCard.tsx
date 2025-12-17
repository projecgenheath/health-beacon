import { HealthSummary } from '@/types/exam';
import { Activity, CheckCircle2, AlertTriangle, AlertCircle } from 'lucide-react';

interface HealthSummaryCardProps {
  summary: HealthSummary;
}

export const HealthSummaryCard = ({ summary }: HealthSummaryCardProps) => {
  const healthPercentage = Math.round((summary.healthy / summary.totalExams) * 100);
  
  return (
    <div className="relative overflow-hidden rounded-2xl bg-card p-6 shadow-md animate-slide-up">
      {/* Background gradient decoration */}
      <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-primary/10 blur-2xl" />
      <div className="absolute -bottom-8 -left-8 h-24 w-24 rounded-full bg-status-healthy/10 blur-2xl" />
      
      <div className="relative">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl gradient-primary text-primary-foreground">
            <Activity className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">Visão Geral da Saúde</h2>
            <p className="text-sm text-muted-foreground">Atualizado em {summary.lastUpdate}</p>
          </div>
        </div>

        {/* Health Score Circle */}
        <div className="flex items-center justify-center mb-6">
          <div className="relative">
            <svg className="h-36 w-36 -rotate-90 transform">
              <circle
                cx="72"
                cy="72"
                r="60"
                fill="none"
                stroke="hsl(var(--muted))"
                strokeWidth="12"
              />
              <circle
                cx="72"
                cy="72"
                r="60"
                fill="none"
                stroke="hsl(var(--status-healthy))"
                strokeWidth="12"
                strokeLinecap="round"
                strokeDasharray={`${healthPercentage * 3.77} 377`}
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl font-bold text-foreground">{healthPercentage}%</span>
              <span className="text-sm text-muted-foreground">Saudável</span>
            </div>
          </div>
        </div>

        {/* Status Summary */}
        <div className="grid grid-cols-3 gap-3">
          <div className="flex flex-col items-center rounded-xl bg-status-healthy-bg p-3 transition-transform hover:scale-105">
            <CheckCircle2 className="h-5 w-5 text-status-healthy mb-1" />
            <span className="text-2xl font-bold text-status-healthy">{summary.healthy}</span>
            <span className="text-xs text-muted-foreground">Normal</span>
          </div>
          <div className="flex flex-col items-center rounded-xl bg-status-warning-bg p-3 transition-transform hover:scale-105">
            <AlertTriangle className="h-5 w-5 text-status-warning mb-1" />
            <span className="text-2xl font-bold text-status-warning">{summary.warning}</span>
            <span className="text-xs text-muted-foreground">Atenção</span>
          </div>
          <div className="flex flex-col items-center rounded-xl bg-status-danger-bg p-3 transition-transform hover:scale-105">
            <AlertCircle className="h-5 w-5 text-status-danger mb-1" />
            <span className="text-2xl font-bold text-status-danger">{summary.danger}</span>
            <span className="text-xs text-muted-foreground">Alterado</span>
          </div>
        </div>
      </div>
    </div>
  );
};
