import { HealthSummary } from '@/types/exam';
import { Heart, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HealthSummaryCardProps {
  summary: HealthSummary;
  onStatusClick?: (status: string) => void;
  activeStatuses?: string[];
}

export const HealthSummaryCard = ({ summary, onStatusClick, activeStatuses = [] }: HealthSummaryCardProps) => {
  // Mock health score logic based on summary
  const score = summary.totalExams > 0 ? Math.round((summary.healthy / summary.totalExams) * 100) : 100;

  // Determine status text and color
  let statusText = 'Estável';
  let statusColor = 'bg-emerald-500/20 text-emerald-500'; // Green
  let statusIcon = <Activity className="w-3 h-3 mr-1" />;

  if (score < 70) {
    statusText = 'Atenção';
    statusColor = 'bg-amber-500/20 text-amber-500';
  }
  if (score < 50) {
    statusText = 'Crítico';
    statusColor = 'bg-red-500/20 text-red-500';
  }

  return (
    <div className="relative w-full overflow-hidden rounded-[2rem] bg-card/[0.5] backdrop-blur-md border border-white/5 p-6 shadow-xl transition-all duration-300 hover:shadow-2xl group">
      {/* Background Gradient Effect */}
      <div className="absolute top-0 right-0 -mt-10 -mr-10 w-48 h-48 bg-primary/20 rounded-full blur-[60px]" />
      <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-40 h-40 bg-emerald-500/10 rounded-full blur-[50px]" />

      <div className="relative z-10 flex justify-between items-center">
        <div className="space-y-4">
          <div className="flex items-center space-x-2 text-xs font-bold tracking-wider text-muted-foreground uppercase">
            <Heart className="w-3.5 h-3.5 text-primary fill-primary" />
            <span>Health Score</span>
          </div>

          <div>
            <h2 className="text-3xl font-bold text-white tracking-tight leading-tight">
              Bem-estar <br /> Geral
            </h2>
          </div>

          <div className={cn("inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium transition-colors duration-200 cursor-pointer hover:bg-opacity-80 backdrop-blur-sm border border-white/5 shadow-sm", statusColor)}>
            <div className="w-2 h-2 rounded-full bg-current mr-2 animate-pulse" />
            {statusText}
          </div>
        </div>

        {/* 3D Heart Representation */}
        <div className="relative w-32 h-32 flex items-center justify-center transform group-hover:scale-105 transition-transform duration-500 ease-in-out">
          <div className="absolute inset-0 bg-gradient-to-br from-red-500/20 to-pink-600/20 rounded-full blur-2xl animate-pulse-slow" />
          <div className="relative drop-shadow-[0_10px_10px_rgba(0,0,0,0.3)]">
            <Heart className="w-24 h-24 text-red-500 fill-red-500 drop-shadow-2xl"
              style={{
                filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.2))',
                background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                animation: 'pulseSlow 3s ease-in-out infinite'
              }}
            />
            {/* Reflection/Shine effect simulation */}
            <div className="absolute top-4 left-4 w-6 h-6 bg-white/30 rounded-full blur-sm" />
          </div>
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between text-xs text-muted-foreground/60 font-medium">
        <span>Última atualização: Hoje, 09:00</span>
      </div>
    </div>
  );
};
