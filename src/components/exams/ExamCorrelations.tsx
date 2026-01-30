import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ExamResult } from '@/types/exam';
import { findCorrelations, ExamCorrelation } from '@/data/correlations';
import { Link2, TrendingUp, TrendingDown, Minus, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';

interface ExamCorrelationsProps {
    exams: ExamResult[];
}

export const ExamCorrelations = ({ exams }: ExamCorrelationsProps) => {
    const { t, i18n } = useTranslation();

    const correlations = useMemo(() => {
        const examNames = exams.map((e) => e.name);
        const found: { correlation: ExamCorrelation; exam1: ExamResult | undefined; exam2: ExamResult | undefined }[] = [];
        const seen = new Set<string>();

        examNames.forEach((name) => {
            const corrs = findCorrelations(name);
            corrs.forEach((corr) => {
                const key = [corr.exam1, corr.exam2].sort().join('|');
                if (!seen.has(key)) {
                    seen.add(key);
                    const exam1 = exams.find((e) => e.name.toUpperCase().includes(corr.exam1) || corr.exam1.includes(e.name.toUpperCase()));
                    const exam2 = exams.find((e) => e.name.toUpperCase().includes(corr.exam2) || corr.exam2.includes(e.name.toUpperCase()));
                    if (exam1 && exam2) {
                        found.push({ correlation: corr, exam1, exam2 });
                    }
                }
            });
        });

        return found;
    }, [exams]);

    if (correlations.length === 0) {
        return null;
    }

    const getRelationshipIcon = (rel: 'positive' | 'negative' | 'related') => {
        switch (rel) {
            case 'positive':
                return <TrendingUp className="h-4 w-4 text-blue-500" />;
            case 'negative':
                return <TrendingDown className="h-4 w-4 text-orange-500" />;
            default:
                return <Minus className="h-4 w-4 text-gray-500" />;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'healthy':
                return 'bg-status-healthy/20 text-status-healthy border-status-healthy/30';
            case 'warning':
                return 'bg-status-warning/20 text-status-warning border-status-warning/30';
            case 'danger':
                return 'bg-status-danger/20 text-status-danger border-status-danger/30';
            default:
                return 'bg-muted text-muted-foreground';
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Link2 className="h-5 w-5 text-primary" />
                    Correlações entre Exames
                </CardTitle>
                <CardDescription>
                    Relações conhecidas entre seus exames que podem indicar padrões de saúde
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {correlations.map(({ correlation, exam1, exam2 }, idx) => (
                        <div
                            key={idx}
                            className="p-4 rounded-xl bg-muted/30 border border-border/50"
                        >
                            <div className="flex items-center gap-3 mb-3">
                                <div className="flex items-center gap-2 flex-1">
                                    <Badge
                                        variant="outline"
                                        className={cn('text-xs', getStatusColor(exam1?.status || ''))}
                                    >
                                        {exam1?.name}
                                    </Badge>
                                    {getRelationshipIcon(correlation.relationship)}
                                    <Badge
                                        variant="outline"
                                        className={cn('text-xs', getStatusColor(exam2?.status || ''))}
                                    >
                                        {exam2?.name}
                                    </Badge>
                                </div>
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger>
                                            <Info className="h-4 w-4 text-muted-foreground" />
                                        </TooltipTrigger>
                                        <TooltipContent className="max-w-xs">
                                            <p>{correlation.description[i18n.language as keyof typeof correlation.description] || correlation.description['pt-BR']}</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                {correlation.description[i18n.language as keyof typeof correlation.description] || correlation.description['pt-BR']}
                            </p>
                            <div className="flex gap-4 mt-3 text-sm">
                                <span>
                                    <strong>{exam1?.name}:</strong> {exam1?.value} {exam1?.unit}
                                </span>
                                <span>
                                    <strong>{exam2?.name}:</strong> {exam2?.value} {exam2?.unit}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
};
