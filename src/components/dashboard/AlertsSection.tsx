import { ExamResult } from '@/types/exam';
import { AlertTriangle, TrendingDown, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AlertsSectionProps {
  exams: ExamResult[];
}

interface Alert {
  type: 'danger' | 'warning' | 'info';
  title: string;
  description: string;
  icon: typeof AlertTriangle;
}

export const AlertsSection = ({ exams }: AlertsSectionProps) => {
  const alerts: Alert[] = [];

  // Generate alerts based on exam results
  const dangerExams = exams.filter((e) => e.status === 'danger');
  const warningExams = exams.filter((e) => e.status === 'warning');

  dangerExams.forEach((exam) => {
    alerts.push({
      type: 'danger',
      title: `${exam.name} alterado`,
      description: `Resultado de ${exam.value} ${exam.unit} está fora da faixa de referência (${exam.referenceMin}-${exam.referenceMax}). Consulte seu médico.`,
      icon: AlertTriangle,
    });
  });

  warningExams.forEach((exam) => {
    alerts.push({
      type: 'warning',
      title: `${exam.name} limítrofe`,
      description: `Resultado de ${exam.value} ${exam.unit} está próximo do limite de referência. Fique atento.`,
      icon: TrendingDown,
    });
  });

  if (alerts.length === 0) {
    alerts.push({
      type: 'info',
      title: 'Tudo em ordem!',
      description: 'Seus exames estão dentro dos valores de referência. Continue cuidando da sua saúde!',
      icon: Info,
    });
  }

  const alertStyles = {
    danger: {
      bg: 'bg-status-danger-bg',
      border: 'border-status-danger/30',
      icon: 'bg-status-danger text-primary-foreground',
      title: 'text-status-danger',
    },
    warning: {
      bg: 'bg-status-warning-bg',
      border: 'border-status-warning/30',
      icon: 'bg-status-warning text-primary-foreground',
      title: 'text-status-warning',
    },
    info: {
      bg: 'bg-status-healthy-bg',
      border: 'border-status-healthy/30',
      icon: 'bg-status-healthy text-primary-foreground',
      title: 'text-status-healthy',
    },
  };

  return (
    <div className="rounded-2xl bg-card p-6 shadow-md animate-slide-up" style={{ animationDelay: '150ms' }}>
      <h2 className="text-lg font-semibold text-foreground mb-4">Alertas e Insights</h2>
      
      <div className="space-y-3">
        {alerts.map((alert, index) => {
          const style = alertStyles[alert.type];
          const Icon = alert.icon;
          
          return (
            <div
              key={index}
              className={cn(
                'flex gap-4 p-4 rounded-xl border animate-scale-in',
                style.bg,
                style.border
              )}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className={cn('h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0', style.icon)}>
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <h3 className={cn('font-medium', style.title)}>{alert.title}</h3>
                <p className="text-sm text-muted-foreground mt-1">{alert.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
