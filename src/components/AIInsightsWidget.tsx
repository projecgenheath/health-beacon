import { ExamsList } from '@/types/exam';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Brain, Sparkles, TrendingUp, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface AIInsightsWidgetProps {
    exams: any[];
}

export const AIInsightsWidget = ({ exams }: AIInsightsWidgetProps) => {
    // Basic logic to generate "mock" insights based on data
    const alteredExams = exams.filter(e => e.status !== 'healthy');
    const healthyExams = exams.filter(e => e.status === 'healthy');

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
                ? `Foco em monitorar seu ${alteredExams[0].name}, que apresentou variação.`
                : "Continue mantendo seus hábitos saudáveis para preservar os ótimos resultados.",
            icon: Sparkles,
            color: "text-primary",
            bg: "bg-primary/10"
        }
    ];

    if (exams.length === 0) return null;

    return (
        <Card className="glass-card border-none overflow-hidden">
            <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                    <Brain className="h-5 w-5 text-primary animate-pulse-slow" />
                    Insights da IA
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {insights.map((insight, idx) => (
                    <div
                        key={idx}
                        className={cn(
                            "p-4 rounded-xl flex items-start gap-3 transition-all hover:scale-[1.02]",
                            insight.bg
                        )}
                    >
                        <div className={cn("mt-1 p-2 rounded-lg bg-background/50", insight.color)}>
                            <insight.icon className="h-5 w-5" />
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-foreground">{insight.title}</h4>
                            <p className="text-xs text-muted-foreground leading-relaxed mt-1">
                                {insight.description}
                            </p>
                        </div>
                    </div>
                ))}

                <div className="pt-2 border-t border-border/50">
                    <p className="text-[10px] text-muted-foreground text-center italic">
                        Informações geradas automaticamente com base nos seus últimos exames.
                    </p>
                </div>
            </CardContent>
        </Card>
    );
};
