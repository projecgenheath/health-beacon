import { ExamHistory } from '@/types/exam';
import {
  LineChart,
  Line,
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

interface ExamChartProps {
  history: ExamHistory;
}

export const ExamChart = ({ history }: ExamChartProps) => {
  const data = history.history.map((item) => ({
    ...item,
    dateFormatted: format(parseISO(item.date), 'MMM/yy', { locale: ptBR }),
  }));

  const allValues = history.history.map((h) => h.value);
  const minValue = Math.min(...allValues, history.referenceMin);
  const maxValue = Math.max(...allValues, history.referenceMax);
  const padding = (maxValue - minValue) * 0.2;

  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { payload: { status: string; value: number } }[]; label?: string }) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      const statusColors = {
        healthy: 'text-status-healthy',
        warning: 'text-status-warning',
        danger: 'text-status-danger',
      };

      return (
        <div className="bg-card rounded-lg shadow-lg border border-border p-3">
          <p className="text-sm font-medium text-foreground mb-1">{label}</p>
          <p className={`text-lg font-bold ${statusColors[item.status as keyof typeof statusColors]}`}>
            {item.value} {history.unit}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Referência: {history.referenceMin}-{history.referenceMax}
          </p>
        </div>
      );
    }
    return null;
  };

  const CustomDot = (props: { cx?: number; cy?: number; payload?: { status: string } }) => {
    const { cx, cy, payload } = props;
    if (cx === undefined || cy === undefined || !payload) return null;
    
    const statusColors = {
      healthy: 'hsl(var(--status-healthy))',
      warning: 'hsl(var(--status-warning))',
      danger: 'hsl(var(--status-danger))',
    };

    return (
      <circle
        cx={cx}
        cy={cy}
        r={6}
        fill={statusColors[payload.status as keyof typeof statusColors]}
        stroke="hsl(var(--card))"
        strokeWidth={2}
      />
    );
  };

  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />

          {/* Healthy zone shading */}
          <ReferenceArea
            y1={history.referenceMin}
            y2={history.referenceMax}
            fill="hsl(var(--status-healthy))"
            fillOpacity={0.1}
          />

          {/* Reference lines */}
          <ReferenceLine
            y={history.referenceMax}
            stroke="hsl(var(--status-healthy))"
            strokeDasharray="4 4"
            strokeOpacity={0.6}
          />
          <ReferenceLine
            y={history.referenceMin}
            stroke="hsl(var(--status-healthy))"
            strokeDasharray="4 4"
            strokeOpacity={0.6}
          />

          <XAxis
            dataKey="dateFormatted"
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            domain={[minValue - padding, maxValue + padding]}
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            width={40}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey="value"
            stroke="hsl(var(--primary))"
            strokeWidth={3}
            dot={<CustomDot />}
            activeDot={{ r: 8, strokeWidth: 2, stroke: 'hsl(var(--card))' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
