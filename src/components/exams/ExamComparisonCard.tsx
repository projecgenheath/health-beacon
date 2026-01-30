import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    ArrowUp,
    ArrowDown,
    Minus,
    TrendingUp,
    TrendingDown,
    TriangleAlert,
    CheckCircle2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ExamValue {
    name: string;
    value: number;
    unit: string;
    status: 'healthy' | 'warning' | 'danger';
    referenceMin?: number;
    referenceMax?: number;
}

interface ExamData {
    id: string;
    date: string;
    values: ExamValue[];
}

interface ComparisonResult {
    name: string;
    unit: string;
    valueA: number;
    valueB: number;
    statusA: ExamValue['status'];
    statusB: ExamValue['status'];
    percentChange: number;
    absoluteChange: number;
    trend: 'improving' | 'worsening' | 'stable' | 'unknown';
    referenceMin?: number;
    referenceMax?: number;
}

interface ExamComparisonCardProps {
    examA: ExamData;
    examB: ExamData;
    showOnlyChanged?: boolean;
}

const getStatusIcon = (status: ExamValue['status']) => {
    switch (status) {
        case 'healthy':
            return <CheckCircle2 className="h-4 w-4 text-status-healthy" />;
        case 'warning':
            return <TriangleAlert className="h-4 w-4 text-status-warning" />;
        case 'danger':
            return <TriangleAlert className="h-4 w-4 text-status-danger" />;
    }
};

const getTrendIcon = (trend: ComparisonResult['trend'], percentChange: number) => {
    const absChange = Math.abs(percentChange);

    if (trend === 'stable' || absChange < 1) {
        return <Minus className="h-4 w-4 text-muted-foreground" />;
    }

    if (trend === 'improving') {
        return percentChange > 0
            ? <ArrowUp className="h-4 w-4 text-status-healthy" />
            : <ArrowDown className="h-4 w-4 text-status-healthy" />;
    }

    if (trend === 'worsening') {
        return percentChange > 0
            ? <ArrowUp className="h-4 w-4 text-status-danger" />
            : <ArrowDown className="h-4 w-4 text-status-danger" />;
    }

    return percentChange > 0
        ? <ArrowUp className="h-4 w-4 text-muted-foreground" />
        : <ArrowDown className="h-4 w-4 text-muted-foreground" />;
};

/**
 * Determina a tendência baseada no status e mudança de valor
 */
const determineTrend = (
    statusA: ExamValue['status'],
    statusB: ExamValue['status'],
    percentChange: number
): ComparisonResult['trend'] => {
    // Se estava fora do normal e voltou ao normal, está melhorando
    if ((statusA === 'danger' || statusA === 'warning') && statusB === 'healthy') {
        return 'improving';
    }

    // Se estava normal e saiu do normal, está piorando
    if (statusA === 'healthy' && (statusB === 'danger' || statusB === 'warning')) {
        return 'worsening';
    }

    // Se ambos são normais e mudança é pequena, está estável
    if (statusA === 'healthy' && statusB === 'healthy' && Math.abs(percentChange) < 5) {
        return 'stable';
    }

    // Se ambos são anormais e ficou mais anormal
    if (statusB === 'danger' && statusA !== 'danger') {
        return 'worsening';
    }

    if (statusA === 'danger' && statusB !== 'danger') {
        return 'improving';
    }

    return 'unknown';
};

/**
 * Card de comparação visual entre dois exames
 */
export const ExamComparisonCard = ({
    examA,
    examB,
    showOnlyChanged = false
}: ExamComparisonCardProps) => {
    const comparisons = useMemo<ComparisonResult[]>(() => {
        const results: ComparisonResult[] = [];

        examA.values.forEach(valueA => {
            const valueB = examB.values.find(v => v.name === valueA.name);
            if (!valueB) return;

            const percentChange = ((valueB.value - valueA.value) / valueA.value) * 100;
            const absoluteChange = valueB.value - valueA.value;
            const trend = determineTrend(valueA.status, valueB.status, percentChange);

            results.push({
                name: valueA.name,
                unit: valueA.unit,
                valueA: valueA.value,
                valueB: valueB.value,
                statusA: valueA.status,
                statusB: valueB.status,
                percentChange,
                absoluteChange,
                trend,
                referenceMin: valueA.referenceMin || valueB.referenceMin,
                referenceMax: valueA.referenceMax || valueB.referenceMax,
            });
        });

        if (showOnlyChanged) {
            return results.filter(r => Math.abs(r.percentChange) >= 1 || r.statusA !== r.statusB);
        }

        return results;
    }, [examA, examB, showOnlyChanged]);

    const summary = useMemo(() => {
        const improving = comparisons.filter(c => c.trend === 'improving').length;
        const worsening = comparisons.filter(c => c.trend === 'worsening').length;
        const stable = comparisons.filter(c => c.trend === 'stable').length;

        return { improving, worsening, stable, total: comparisons.length };
    }, [comparisons]);

    const formatDate = (date: string) => {
        return format(parseISO(date), "d 'de' MMM, yyyy", { locale: ptBR });
    };

    if (comparisons.length === 0) {
        return (
            <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                    Nenhum exame em comum encontrado para comparação.
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="overflow-hidden">
            <CardHeader className="pb-4">
                <CardTitle className="text-lg">Comparação de Exames</CardTitle>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>{formatDate(examA.date)}</span>
                    <span className="text-primary font-medium">→</span>
                    <span>{formatDate(examB.date)}</span>
                </div>
            </CardHeader>

            {/* Summary */}
            <div className="px-6 pb-4 flex items-center gap-4">
                <Badge variant="outline" className="gap-1 border-status-healthy text-status-healthy">
                    <TrendingUp className="h-3 w-3" />
                    {summary.improving} melhorando
                </Badge>
                <Badge variant="outline" className="gap-1 border-status-danger text-status-danger">
                    <TrendingDown className="h-3 w-3" />
                    {summary.worsening} piorando
                </Badge>
                <Badge variant="outline" className="gap-1">
                    <Minus className="h-3 w-3" />
                    {summary.stable} estáveis
                </Badge>
            </div>

            <CardContent className="p-0">
                {/* Table header */}
                <div className="grid grid-cols-5 gap-4 px-6 py-3 bg-muted/50 text-xs font-medium text-muted-foreground border-y border-border">
                    <div className="col-span-2">Exame</div>
                    <div className="text-right">Anterior</div>
                    <div className="text-right">Atual</div>
                    <div className="text-right">Variação</div>
                </div>

                {/* Comparison rows */}
                <div className="divide-y divide-border">
                    {comparisons.map((comparison) => (
                        <div
                            key={comparison.name}
                            className={cn(
                                'grid grid-cols-5 gap-4 px-6 py-4 items-center transition-colors',
                                comparison.trend === 'improving' && 'bg-status-healthy/5',
                                comparison.trend === 'worsening' && 'bg-status-danger/5',
                            )}
                        >
                            {/* Name */}
                            <div className="col-span-2">
                                <div className="font-medium text-sm">{comparison.name}</div>
                                {comparison.referenceMin !== undefined && comparison.referenceMax !== undefined && (
                                    <div className="text-xs text-muted-foreground mt-0.5">
                                        Ref: {comparison.referenceMin} - {comparison.referenceMax} {comparison.unit}
                                    </div>
                                )}
                            </div>

                            {/* Previous value */}
                            <div className="text-right">
                                <div className="flex items-center justify-end gap-1">
                                    {getStatusIcon(comparison.statusA)}
                                    <span className="text-sm font-medium">{comparison.valueA}</span>
                                </div>
                                <div className="text-xs text-muted-foreground">{comparison.unit}</div>
                            </div>

                            {/* Current value */}
                            <div className="text-right">
                                <div className="flex items-center justify-end gap-1">
                                    {getStatusIcon(comparison.statusB)}
                                    <span className="text-sm font-medium">{comparison.valueB}</span>
                                </div>
                                <div className="text-xs text-muted-foreground">{comparison.unit}</div>
                            </div>

                            {/* Change */}
                            <div className="text-right">
                                <div className={cn(
                                    'flex items-center justify-end gap-1 text-sm font-medium',
                                    comparison.trend === 'improving' && 'text-status-healthy',
                                    comparison.trend === 'worsening' && 'text-status-danger',
                                    comparison.trend === 'stable' && 'text-muted-foreground',
                                )}>
                                    {getTrendIcon(comparison.trend, comparison.percentChange)}
                                    <span>
                                        {comparison.percentChange > 0 ? '+' : ''}
                                        {comparison.percentChange.toFixed(1)}%
                                    </span>
                                </div>
                                <div className="text-xs text-muted-foreground">
                                    {comparison.absoluteChange > 0 ? '+' : ''}
                                    {comparison.absoluteChange.toFixed(2)}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
};
