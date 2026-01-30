import { ExamResult } from '@/types/exam';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Brain, Sparkles, TrendingUp, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface AIInsightsWidgetProps {
    exams: ExamResult[];
}

export const AIInsightsWidget = ({ exams }: AIInsightsWidgetProps) => {
    // Basic logic to generate "mock" insights based on data
    const alteredExams = exams.filter(e => ['warning', 'danger', 'abnormal'].includes(e.status));
    const healthyExams = exams.filter(e => ['healthy', 'normal'].includes(e.status));

    const insights = [
        {
            title: "Tendência de Saúde",
            description: healthyExams.length > alteredExams.length
                ? "Sua saúde geral está estável. A maioria dos indicadores está dentro da meta."
                : "Alguns indicadores requerem atenção. Recomendamos rever sua rotina de saúde.",
            icon: healthyExams.length > alteredExams.length ? CheckCircle2 : AlertCircle,
            color: healthyExams.length > alteredExams.length ? "text-status-healthy" : "text-status-warning",
            bg: healthyExams.length > alteredExams.length ? "bg-status-healthy/10" : "bg-status-warning/10"
        },
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

    if (exams.length === 0) return null;

    return (
        <Card className="glass-card border-none overflow-hidden">
            <CardHeader className="pb-2 px-4 sm:px-6">
                <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                    <Brain className="h-4 w-4 sm:h-5 sm:w-5 text-primary animate-pulse-slow" />
                    Insights da IA
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4 px-4 sm:px-6">
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
            </CardContent>
        </Card>
    );
};
