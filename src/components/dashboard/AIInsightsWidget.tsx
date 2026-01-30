import { useMemo } from 'react';
import { ExamResult, ExamHistory } from '@/types/exam';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Brain, Sparkles, Activity, TrendingUp, TrendingDown, Minus, AlertTriangle, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { differenceInDays, parseISO } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface AIInsightsWidgetProps {
    exams: ExamResult[];
    histories?: ExamHistory[];
}

interface TrendAnalysis {
    examName: string;
    unit: string;
    currentValue: number;
    percentChange: number;
    trend: 'up' | 'down' | 'stable';
    status: 'healthy' | 'warning' | 'danger';
    isImproving: boolean;
    daysSinceLastExam: number;
    referenceMin: number;
    referenceMax: number;
}

export const AIInsightsWidget = ({ exams, histories = [] }: AIInsightsWidgetProps) => {
    const alteredExams = exams.filter(e => ['warning', 'danger', 'abnormal'].includes(e.status));
    const healthyExams = exams.filter(e => ['healthy', 'normal'].includes(e.status));

    // Calculate trends
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

            const isInRange = current.value >= history.referenceMin &&
                current.value <= history.referenceMax;
            const wasInRange = previous.value >= history.referenceMin &&
                previous.value <= history.referenceMax;

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
                percentChange,
                trend,
                status: current.status,
                isImproving,
                daysSinceLastExam,
                referenceMin: history.referenceMin,
                referenceMax: history.referenceMax,
            });
        });

        return analysedTrends
            .sort((a, b) => {
                const statusOrder = { danger: 0, warning: 1, healthy: 2 };
                if (statusOrder[a.status] !== statusOrder[b.status]) {
                    return statusOrder[a.status] - statusOrder[b.status];
                }
                return Math.abs(b.percentChange) - Math.abs(a.percentChange);
            })
            .slice(0, 5);
    }, [histories]);

    const trendSummary = useMemo(() => {
        const improving = trends.filter(t => t.isImproving).length;
        const needsAttention = trends.filter(t => t.status !== 'healthy').length;
        return { improving, needsAttention };
    }, [trends]);

    const insights = [
        {
            title: "Destaque do Mês",
            description: alteredExams.length > 0
                ? `Atenção ao indicador ${alteredExams[0].name}. Recomendamos acompanhamento.`
                : "Continue mantendo seus hábitos saudáveis para preservar os ótimos resultados.",
            icon: Sparkles,
            color: "text-primary",
            bg: "bg-primary/10"
        }
    ];

    const getTrendIcon = (trend: TrendAnalysis) => {
        if (trend.trend === 'stable') {
            return <Minus className="h-4 w-4 text-muted-foreground" />;
        }
        const Icon = trend.trend === 'up' ? ArrowUpRight : ArrowDownRight;
        const colorClass = trend.isImproving ? 'text-status-healthy' : 'text-status-danger';
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

    if (exams.length === 0) return null;

    return (
        <Card className="glass-card border-none overflow-hidden">
            <CardHeader className="pb-2 px-4 sm:px-6">
                <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                    <Brain className="h-4 w-4 sm:h-5 sm:w-5 text-primary animate-pulse-slow" />
                    Insights da IA
                </CardTitle>
            </CardHeader>
            <CardContent className="px-4 sm:px-6">
                <Tabs defaultValue="insights" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 mb-4">
                        <TabsTrigger value="insights">Destaques</TabsTrigger>
                        <TabsTrigger value="trends" className="relative">
                            Tendências
                            {trendSummary.needsAttention > 0 && (
                                <Badge variant="destructive" className="ml-2 h-5 px-1.5 text-[10px]">
                                    {trendSummary.needsAttention}
                                </Badge>
                            )}
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="insights" className="space-y-3 sm:space-y-4 mt-0">
                        {insights.map((insight, idx) => (
                            <div
                                key={idx}
                                className={cn(
                                    "p-3 sm:p-4 rounded-xl flex items-start gap-3 transition-all hover:scale-[1.02]",
                                    insight.bg
                                )}
                            >
                                <div className={cn("mt-0.5 p-1.5 sm:p-2 rounded-lg bg-background/50", insight.color)}>
                                    <insight.icon className="h-4 w-4 sm:h-5 sm:w-5" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <h4 className="text-sm font-bold text-foreground">{insight.title}</h4>
                                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed mt-0.5 sm:mt-1">
                                        {insight.description}
                                    </p>
                                </div>
                            </div>
                        ))}

                        <div className="pt-2 border-t border-border/50">
                            <p className="text-[10px] sm:text-xs text-muted-foreground text-center italic">
                                Informações geradas automaticamente com base nos seus últimos exames.
                            </p>
                        </div>
                    </TabsContent>

                    <TabsContent value="trends" className="space-y-3 mt-0">
                        {trends.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-8">
                                Faça o upload de mais exames para ver as tendências dos seus marcadores de saúde.
                            </p>
                        ) : (
                            <>
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
                                                {trend.daysSinceLastExam === 0 ? 'Hoje' : `${trend.daysSinceLastExam}d atrás`}
                                            </span>
                                        </div>
                                    </div>
                                ))}

                                {trendSummary.improving > 0 && (
                                    <div className="pt-3 border-t border-border/50 flex items-center justify-center">
                                        <span className="text-xs text-status-healthy flex items-center gap-1">
                                            <TrendingUp className="h-3.5 w-3.5" />
                                            {trendSummary.improving} indicador(es) melhorando
                                        </span>
                                    </div>
                                )}
                            </>
                        )}
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    );
};
