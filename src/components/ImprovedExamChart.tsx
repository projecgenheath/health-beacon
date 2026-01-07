import { ExamHistory } from '@/types/exam';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceArea,
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { TrendingUp, TrendingDown, Minus, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImprovedExamChartProps {
  history: ExamHistory;
  showDetails?: boolean;
}

export const ImprovedExamChart = ({ history, showDetails = true }: ImprovedExamChartProps) => {
  const data = history.history.map((item) => ({
    ...item,
    dateFormatted: format(parseISO(item.date), 'dd/MM/yy', { locale: ptBR }),
    fullDate: format(parseISO(item.date), "d 'de' MMMM, yyyy", { locale: ptBR }),
  }));

  const allValues = history.history.map((h) => h.value);
  const minValue = Math.min(...allValues, history.referenceMin);
  const maxValue = Math.max(...allValues, history.referenceMax);
  const padding = (maxValue - minValue) * 0.25;

  // Calculate statistics
  const latestValue = allValues[allValues.length - 1];
  const previousValue = allValues.length > 1 ? allValues[allValues.length - 2] : null;
  const avgValue = allValues.reduce((a, b) => a + b, 0) / allValues.length;
  const variation = previousValue ? ((latestValue - previousValue) / previousValue) * 100 : 0;

  const getTrendIcon = () => {
    if (!previousValue) return <Minus className="h-4 w-4" />;
    if (Math.abs(variation) < 1) return <Minus className="h-4 w-4 text-muted-foreground" />;
    if (variation > 0) return <TrendingUp className="h-4 w-4 text-status-warning" />;
    return <TrendingDown className="h-4 w-4 text-status-healthy" />;
  };

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: { payload: { status: string; value: number; fullDate: string } }[] }) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      const statusConfig = {
        healthy: { bg: 'bg-status-healthy-bg', text: 'text-status-healthy', label: 'Normal' },
        warning: { bg: 'bg-status-warning-bg', text: 'text-status-warning', label: 'Atenção' },
        danger: { bg: 'bg-status-danger-bg', text: 'text-status-danger', label: 'Alterado' },
      };
      const config = statusConfig[item.status as keyof typeof statusConfig];

      return (
        <div className="bg-card rounded-xl shadow-lg border border-border p-4 min-w-[180px]">
          <p className="text-xs text-muted-foreground mb-2">{item.fullDate}</p>
          <div className="flex items-center justify-between gap-4">
            <p className={cn('text-2xl font-bold', config.text)}>
              {item.value}
            </p>
            <span className={cn('text-xs font-medium px-2 py-1 rounded-full', config.bg, config.text)}>
              {config.label}
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {history.unit}
          </p>
          <div className="mt-3 pt-3 border-t border-border">
            <p className="text-xs text-muted-foreground">
              Faixa de referência: <span className="font-medium">{history.referenceMin} - {history.referenceMax}</span>
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  const gradientId = `gradient-${history.examName.replace(/\s/g, '')}`;
  const latestStatus = data[data.length - 1]?.status || 'healthy';
  const gradientColor = {
    healthy: 'var(--status-healthy)',
    warning: 'var(--status-warning)',
    danger: 'var(--status-danger)',
  }[latestStatus];

  return (
    <div className="space-y-4">
      {showDetails && (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-muted/30 rounded-xl p-3 text-center">
            <p className="text-xs text-muted-foreground mb-1">Último valor</p>
            <p className="text-lg font-bold text-foreground">{latestValue.toFixed(1)}</p>
            <p className="text-xs text-muted-foreground">{history.unit}</p>
          </div>
          <div className="bg-muted/30 rounded-xl p-3 text-center">
            <p className="text-xs text-muted-foreground mb-1">Média</p>
            <p className="text-lg font-bold text-foreground">{avgValue.toFixed(1)}</p>
            <p className="text-xs text-muted-foreground">{history.unit}</p>
          </div>
          <div className="bg-muted/30 rounded-xl p-3 text-center">
            <p className="text-xs text-muted-foreground mb-1">Variação</p>
            <div className="flex items-center justify-center gap-1">
              {getTrendIcon()}
              <p className={cn(
                'text-lg font-bold',
                Math.abs(variation) < 1 ? 'text-muted-foreground' :
                  variation > 0 ? 'text-status-warning' : 'text-status-healthy'
              )}>
                {previousValue ? `${variation > 0 ? '+' : ''}${variation.toFixed(1)}%` : '—'}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={`hsl(${gradientColor})`} stopOpacity={0.4} />
                <stop offset="100%" stopColor={`hsl(${gradientColor})`} stopOpacity={0.05} />
              </linearGradient>
            </defs>

            <CartesianGrid
              strokeDasharray="3 3"
              stroke="hsl(var(--border))"
              vertical={false}
              strokeOpacity={0.5}
            />

            {/* Healthy zone shading */}
            <ReferenceArea
              y1={history.referenceMin}
              y2={history.referenceMax}
              fill="hsl(var(--status-healthy))"
              fillOpacity={0.08}
              strokeOpacity={0}
            />

            {/* Reference lines */}
            <ReferenceLine
              y={history.referenceMax}
              stroke="hsl(var(--status-healthy))"
              strokeDasharray="6 4"
              strokeOpacity={0.5}
              label={{
                value: 'Máx',
                position: 'right',
                fill: 'hsl(var(--muted-foreground))',
                fontSize: 10
              }}
            />
            <ReferenceLine
              y={history.referenceMin}
              stroke="hsl(var(--status-healthy))"
              strokeDasharray="6 4"
              strokeOpacity={0.5}
              label={{
                value: 'Mín',
                position: 'right',
                fill: 'hsl(var(--muted-foreground))',
                fontSize: 10
              }}
            />

            <XAxis
              dataKey="dateFormatted"
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              dy={5}
            />
            <YAxis
              domain={[minValue - padding, maxValue + padding]}
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={45}
              tickFormatter={(value) => value.toFixed(0)}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="value"
              stroke={`hsl(${gradientColor})`}
              strokeWidth={3}
              fill={`url(#${gradientId})`}
              dot={(props: { cx: number; cy: number; payload: { status: string } }) => {
                const { cx, cy, payload } = props;
                const statusColors = {
                  healthy: 'hsl(var(--status-healthy))',
                  warning: 'hsl(var(--status-warning))',
                  danger: 'hsl(var(--status-danger))',
                };
                return (
                  <circle
                    key={props.index}
                    cx={cx}
                    cy={cy}
                    r={6}
                    fill={statusColors[payload.status as keyof typeof statusColors]}
                    stroke="hsl(var(--card))"
                    strokeWidth={3}
                  />
                );
              }}
              activeDot={{
                r: 10,
                strokeWidth: 3,
                stroke: 'hsl(var(--card))',
                fill: `hsl(${gradientColor})`
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {showDetails && data.length >= 3 && (
        <div className="flex items-start gap-2 p-3 rounded-xl bg-primary/5 border border-primary/10">
          <Info className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
          <p className="text-xs text-muted-foreground">
            {latestStatus === 'healthy' && 'Seus valores estão dentro da faixa de referência. Continue mantendo hábitos saudáveis!'}
            {latestStatus === 'warning' && 'Seus valores estão próximos do limite. Considere conversar com seu médico sobre possíveis ajustes.'}
            {latestStatus === 'danger' && 'Seus valores estão fora da faixa de referência. Recomendamos consultar seu médico o quanto antes.'}
          </p>
        </div>
      )}
    </div>
  );
};
