import { useMemo } from 'react';
import { ExamHistory, ExamResult } from '@/types/exam';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    TrendingUp,
    TrendingDown,
    Minus,
    Activity,
    AlertTriangle,
    CheckCircle2,
    ArrowUpRight,
    ArrowDownRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, parseISO, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';

interface TrendAnalysis {
    examName: string;
    unit: string;
    currentValue: number;
    previousValue: number | null;
    percentChange: number;
    trend: 'up' | 'down' | 'stable';
    status: 'healthy' | 'warning' | 'danger';
    isImproving: boolean;
    daysSinceLastExam: number;
    referenceMin: number;
    referenceMax: number;
    lastDate: string;
}

interface HealthTrendsWidgetProps {
    histories: ExamHistory[];
    exams: ExamResult[];
    maxItems?: number;
}

/**
 * Widget que mostra tendências de saúde dos marcadores
 * Analisa se os valores estão melhorando ou piorando
 */
export const HealthTrendsWidget = ({
    histories,
    exams,
    maxItems = 5
}: HealthTrendsWidgetProps) => {
    const trends = useMemo((): TrendAnalysis[] => {
        if (!histories || histories.length === 0) return [];

        const analysedTrends: TrendAnalysis[] = [];

        histories.forEach(history => {
            if (history.history.length < 2) return;

            const sortedHistory = [...history.history].sort(
                (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
            );

            const current = sortedHistory[0];
            const previous = sortedHistory[1];

            const percentChange = ((current.value - previous.value) / previous.value) * 100;

            let trend: 'up' | 'down' | 'stable' = 'stable';
            if (Math.abs(percentChange) >= 2) {
                trend = percentChange > 0 ? 'up' : 'down';
            }

            // Determine if the trend is improving
            // For most markers, being within reference range is good
            const isInRange = current.value >= history.referenceMin &&
                current.value <= history.referenceMax;
            const wasInRange = previous.value >= history.referenceMin &&
                previous.value <= history.referenceMax;

            // Improving if: entering range, staying in range, or moving toward range
            let isImproving = false;
            if (isInRange && !wasInRange) {
                isImproving = true;
            } else if (isInRange && wasInRange) {
                isImproving = true;
            } else if (!isInRange) {
                const midRange = (history.referenceMin + history.referenceMax) / 2;
                const currentDistance = Math.abs(current.value - midRange);
                const previousDistance = Math.abs(previous.value - midRange);
                isImproving = currentDistance < previousDistance;
            }

            const daysSinceLastExam = differenceInDays(new Date(), parseISO(current.date));

            analysedTrends.push({
                examName: history.examName,
                unit: history.unit,
                currentValue: current.value,
                previousValue: previous.value,
                percentChange,
                trend,
                status: current.status,
                isImproving,
                daysSinceLastExam,
                referenceMin: history.referenceMin,
                referenceMax: history.referenceMax,
                lastDate: current.date,
            });
        });

        // Sort by importance: danger first, then warning, with most changed at top
        return analysedTrends
            .sort((a, b) => {
                const statusOrder = { danger: 0, warning: 1, healthy: 2 };
                if (statusOrder[a.status] !== statusOrder[b.status]) {
                    return statusOrder[a.status] - statusOrder[b.status];
                }
                return Math.abs(b.percentChange) - Math.abs(a.percentChange);
            })
            .slice(0, maxItems);
    }, [histories, maxItems]);

    const summary = useMemo(() => {
        const improving = trends.filter(t => t.isImproving).length;
        const worsening = trends.filter(t => !t.isImproving && t.trend !== 'stable').length;
        const stable = trends.filter(t => t.trend === 'stable').length;
        const needsAttention = trends.filter(t => t.status !== 'healthy').length;

        return { improving, worsening, stable, needsAttention };
    }, [trends]);

    if (trends.length === 0) {
        return (
            <Card className="glass-card">
                <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <Activity className="h-5 w-5 text-primary" />
                        Tendências de Saúde
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground text-center py-8">
                        Faça o upload de mais exames para ver as tendências dos seus marcadores de saúde.
                    </p>
                </CardContent>
            </Card>
        );
    }

    const getTrendIcon = (trend: TrendAnalysis) => {
        if (trend.trend === 'stable') {
            return <Minus className="h-4 w-4 text-muted-foreground" />;
        }

        const Icon = trend.trend === 'up' ? ArrowUpRight : ArrowDownRight;
        const colorClass = trend.isImproving
            ? 'text-status-healthy'
            : 'text-status-danger';

        return <Icon className={cn('h-4 w-4', colorClass)} />;
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'healthy': return 'text-status-healthy';
            case 'warning': return 'text-status-warning';
            case 'danger': return 'text-status-danger';
            default: return 'text-muted-foreground';
        }
    };

    return (
        <Card className="glass-card">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <Activity className="h-5 w-5 text-primary" />
                        Tendências de Saúde
                    </CardTitle>
                    <TooltipProvider>
                        <div className="flex items-center gap-1.5">
                            {summary.needsAttention > 0 && (
                                <Tooltip>
                                    <TooltipTrigger>
                                        <Badge variant="destructive" className="text-xs px-2">
                                            <AlertTriangle className="h-3 w-3 mr-1" />
                                            {summary.needsAttention}
                                        </Badge>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        {summary.needsAttention} marcador(es) precisam de atenção
                                    </TooltipContent>
                                </Tooltip>
                            )}
                            {summary.improving > 0 && (
                                <Tooltip>
                                    <TooltipTrigger>
                                        <Badge className="bg-status-healthy/10 text-status-healthy border-status-healthy/20 text-xs px-2">
                                            <TrendingUp className="h-3 w-3 mr-1" />
                                            {summary.improving}
                                        </Badge>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        {summary.improving} marcador(es) melhorando
                                    </TooltipContent>
                                </Tooltip>
                            )}
                        </div>
                    </TooltipProvider>
                </div>
            </CardHeader>
            <CardContent className="space-y-3">
                {trends.map((trend, index) => (
                    <div
                        key={trend.examName}
                        className={cn(
                            'flex items-center justify-between p-3 rounded-xl transition-colors',
                            'bg-muted/30 hover:bg-muted/50',
                            index === 0 && trend.status !== 'healthy' && 'ring-1 ring-status-danger/20'
                        )}
                    >
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                                <span className="font-medium text-sm truncate">
                                    {trend.examName}
                                </span>
                                <span className={cn(
                                    'text-xs px-1.5 py-0.5 rounded-full',
                                    trend.status === 'healthy' && 'bg-status-healthy/10 text-status-healthy',
                                    trend.status === 'warning' && 'bg-status-warning/10 text-status-warning',
                                    trend.status === 'danger' && 'bg-status-danger/10 text-status-danger',
                                )}>
                                    {trend.status === 'healthy' ? 'Normal' :
                                        trend.status === 'warning' ? 'Atenção' : 'Alterado'}
                                </span>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                                <span className={cn('text-lg font-bold', getStatusColor(trend.status))}>
                                    {trend.currentValue.toFixed(1)}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                    {trend.unit}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                    · Ref: {trend.referenceMin}-{trend.referenceMax}
                                </span>
                            </div>
                        </div>

                        <div className="flex flex-col items-end">
                            <div className="flex items-center gap-1">
                                {getTrendIcon(trend)}
                                <span className={cn(
                                    'text-sm font-medium',
                                    trend.trend === 'stable' ? 'text-muted-foreground' :
                                        trend.isImproving ? 'text-status-healthy' : 'text-status-danger'
                                )}>
                                    {trend.trend === 'stable' ? 'Estável' :
                                        `${trend.percentChange > 0 ? '+' : ''}${trend.percentChange.toFixed(1)}%`}
                                </span>
                            </div>
                            <span className="text-xs text-muted-foreground mt-0.5">
                                {trend.daysSinceLastExam === 0
                                    ? 'Hoje'
                                    : `${trend.daysSinceLastExam}d atrás`}
                            </span>
                        </div>
                    </div>
                ))}

                {/* Summary footer */}
                <div className="pt-3 border-t border-border">
                    <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
                        {summary.improving > 0 && (
                            <span className="flex items-center gap-1">
                                <CheckCircle2 className="h-3.5 w-3.5 text-status-healthy" />
                                {summary.improving} melhorando
                            </span>
                        )}
                        {summary.worsening > 0 && (
                            <span className="flex items-center gap-1">
                                <TrendingDown className="h-3.5 w-3.5 text-status-danger" />
                                {summary.worsening} piorando
                            </span>
                        )}
                        {summary.stable > 0 && (
                            <span className="flex items-center gap-1">
                                <Minus className="h-3.5 w-3.5" />
                                {summary.stable} estável
                            </span>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};
