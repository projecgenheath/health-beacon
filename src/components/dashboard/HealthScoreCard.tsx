import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
    Heart,
    TrendingUp,
    TrendingDown,
    AlertTriangle,
    CheckCircle2,
    Clock,
    Calendar,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { useExamAnalysis } from '@/hooks/useExamAnalysis';
import { ExamResult, ExamHistory } from '@/types/exam';

interface HealthScoreCardProps {
    exams: ExamResult[];
    histories: ExamHistory[];
    showDetails?: boolean;
}

/**
 * Card visual mostrando o score de saúde do usuário
 * Inclui análise de tendências e recomendações
 */
export const HealthScoreCard = ({
    exams,
    histories,
    showDetails = true
}: HealthScoreCardProps) => {
    const analysis = useExamAnalysis(exams, histories);

    const scoreColor = useMemo(() => {
        if (analysis.healthScore >= 80) return 'text-status-healthy';
        if (analysis.healthScore >= 60) return 'text-blue-500';
        if (analysis.healthScore >= 40) return 'text-status-warning';
        return 'text-status-danger';
    }, [analysis.healthScore]);

    const progressColor = useMemo(() => {
        if (analysis.healthScore >= 80) return 'bg-status-healthy';
        if (analysis.healthScore >= 60) return 'bg-blue-500';
        if (analysis.healthScore >= 40) return 'bg-status-warning';
        return 'bg-status-danger';
    }, [analysis.healthScore]);

    if (exams.length === 0) {
        return (
            <Card className="glass-card">
                <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <Heart className="h-5 w-5 text-primary" />
                        Score de Saúde
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground text-center py-8">
                        Faça o upload de exames para ver seu score de saúde.
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="glass-card overflow-hidden">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <Heart className="h-5 w-5 text-primary" />
                        Score de Saúde
                    </CardTitle>
                    <Badge
                        variant="outline"
                        className={cn(
                            'font-medium',
                            analysis.healthScoreLabel === 'Excelente' && 'border-status-healthy text-status-healthy',
                            analysis.healthScoreLabel === 'Bom' && 'border-blue-500 text-blue-500',
                            analysis.healthScoreLabel === 'Atenção' && 'border-status-warning text-status-warning',
                            analysis.healthScoreLabel === 'Crítico' && 'border-status-danger text-status-danger',
                        )}
                    >
                        {analysis.healthScoreLabel}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Score display */}
                <div className="flex items-center justify-center">
                    <motion.div
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.5, ease: 'easeOut' }}
                        className="relative"
                    >
                        <div className={cn(
                            'text-6xl font-bold tracking-tight',
                            scoreColor
                        )}>
                            {analysis.healthScore}
                        </div>
                        <div className="absolute -top-1 -right-4 text-lg text-muted-foreground">
                            /100
                        </div>
                    </motion.div>
                </div>

                {/* Progress bars */}
                <div className="space-y-3">
                    <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground flex items-center gap-1">
                                <CheckCircle2 className="h-3 w-3 text-status-healthy" />
                                Normal
                            </span>
                            <span className="font-medium">{analysis.healthyPercentage.toFixed(0)}%</span>
                        </div>
                        <Progress
                            value={analysis.healthyPercentage}
                            className="h-2"
                        />
                    </div>

                    <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground flex items-center gap-1">
                                <AlertTriangle className="h-3 w-3 text-status-warning" />
                                Atenção
                            </span>
                            <span className="font-medium">{analysis.warningPercentage.toFixed(0)}%</span>
                        </div>
                        <Progress
                            value={analysis.warningPercentage}
                            className="h-2 [&>div]:bg-status-warning"
                        />
                    </div>

                    <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground flex items-center gap-1">
                                <AlertTriangle className="h-3 w-3 text-status-danger" />
                                Alterado
                            </span>
                            <span className="font-medium">{analysis.dangerPercentage.toFixed(0)}%</span>
                        </div>
                        <Progress
                            value={analysis.dangerPercentage}
                            className="h-2 [&>div]:bg-status-danger"
                        />
                    </div>
                </div>

                {showDetails && (
                    <>
                        {/* Trends summary */}
                        <div className="grid grid-cols-3 gap-3 pt-3 border-t border-border">
                            <div className="text-center">
                                <div className="flex items-center justify-center gap-1 text-status-healthy">
                                    <TrendingUp className="h-4 w-4" />
                                    <span className="text-lg font-bold">{analysis.improvingMarkers.length}</span>
                                </div>
                                <p className="text-xs text-muted-foreground">Melhorando</p>
                            </div>

                            <div className="text-center">
                                <div className="flex items-center justify-center gap-1 text-muted-foreground">
                                    <Clock className="h-4 w-4" />
                                    <span className="text-lg font-bold">{analysis.stableMarkers.length}</span>
                                </div>
                                <p className="text-xs text-muted-foreground">Estáveis</p>
                            </div>

                            <div className="text-center">
                                <div className="flex items-center justify-center gap-1 text-status-danger">
                                    <TrendingDown className="h-4 w-4" />
                                    <span className="text-lg font-bold">{analysis.worseningMarkers.length}</span>
                                </div>
                                <p className="text-xs text-muted-foreground">Piorando</p>
                            </div>
                        </div>

                        {/* Next exam recommendation */}
                        {analysis.daysSinceLastExam > 0 && (
                            <div className={cn(
                                'flex items-center gap-3 p-3 rounded-xl',
                                analysis.examFrequency === 'regular'
                                    ? 'bg-status-healthy/10 border border-status-healthy/20'
                                    : analysis.examFrequency === 'irregular'
                                        ? 'bg-status-warning/10 border border-status-warning/20'
                                        : 'bg-status-danger/10 border border-status-danger/20'
                            )}>
                                <Calendar className={cn(
                                    'h-5 w-5 flex-shrink-0',
                                    analysis.examFrequency === 'regular'
                                        ? 'text-status-healthy'
                                        : analysis.examFrequency === 'irregular'
                                            ? 'text-status-warning'
                                            : 'text-status-danger'
                                )} />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium">
                                        {analysis.daysSinceLastExam === 1
                                            ? 'Último exame há 1 dia'
                                            : `Último exame há ${analysis.daysSinceLastExam} dias`}
                                    </p>
                                    <p className="text-xs text-muted-foreground truncate">
                                        Próximo recomendado: {analysis.recommendedNextExam}
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Critical alerts */}
                        {analysis.criticalAlerts.length > 0 && (
                            <div className="space-y-2 pt-3 border-t border-border">
                                <p className="text-xs font-medium text-status-danger flex items-center gap-1">
                                    <AlertTriangle className="h-3 w-3" />
                                    Alertas Críticos
                                </p>
                                {analysis.criticalAlerts.slice(0, 2).map((alert, index) => (
                                    <div
                                        key={index}
                                        className="bg-status-danger/5 border border-status-danger/10 rounded-lg p-3"
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium">{alert.examName}</span>
                                            <span className="text-sm text-status-danger font-bold">
                                                {alert.value} {alert.unit}
                                            </span>
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {alert.recommendation}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </CardContent>
        </Card>
    );
};
