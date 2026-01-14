import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Activity, Calendar, Shield, AlertTriangle, Clock, User } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface SharedExam {
    id: string;
    name: string;
    value: number;
    unit: string;
    status: string;
    category: string;
    exam_date: string;
    reference_min: number;
    reference_max: number;
}

interface ShareData {
    exams: SharedExam[];
    expires_at: string;
    is_expired: boolean;
}

export const SharedExamView = () => {
    const { token } = useParams<{ token: string }>();
    const { t } = useTranslation();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [data, setData] = useState<ShareData | null>(null);

    useEffect(() => {
        const fetchSharedData = async () => {
            if (!token) {
                setError('Token inválido');
                setLoading(false);
                return;
            }

            try {
                const { data: linkData, error: linkError } = await supabase
                    .from('shared_links')
                    .select('user_id, exam_id, expires_at, views')
                    .eq('token', token)
                    .single();

                if (linkError || !linkData) {
                    setError('Link não encontrado ou expirado');
                    setLoading(false);
                    return;
                }

                // Check if expired
                if (new Date(linkData.expires_at) < new Date()) {
                    setData({
                        exams: [],
                        expires_at: linkData.expires_at,
                        is_expired: true,
                    });
                    setLoading(false);
                    return;
                }

                // Update view count
                await supabase
                    .from('shared_links')
                    .update({ views: (linkData.views || 0) + 1 })
                    .eq('token', token);

                // Fetch exams based on whether it's a single exam or all exams
                let query = supabase
                    .from('exam_results')
                    .select('id, name, value, unit, status, category, exam_date, reference_min, reference_max')
                    .eq('user_id', linkData.user_id)
                    .order('exam_date', { ascending: false });

                if (linkData.exam_id) {
                    query = query.eq('exam_id', linkData.exam_id);
                }

                const { data: examsData, error: examsError } = await query.limit(50);

                if (examsError) {
                    setError('Erro ao carregar exames');
                    setLoading(false);
                    return;
                }

                setData({
                    exams: (examsData || []) as SharedExam[],
                    expires_at: linkData.expires_at,
                    is_expired: false,
                });
            } catch (err) {
                console.error('Error fetching shared data:', err);
                setError('Erro ao carregar dados');
            } finally {
                setLoading(false);
            }
        };

        fetchSharedData();
    }, [token]);

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

    const getStatusText = (status: string) => {
        switch (status) {
            case 'healthy':
                return 'Saudável';
            case 'warning':
                return 'Atenção';
            case 'danger':
                return 'Crítico';
            default:
                return 'Normal';
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background p-4 md:p-8">
                <div className="max-w-4xl mx-auto space-y-6">
                    <Skeleton className="h-32 w-full rounded-2xl" />
                    <div className="grid gap-4 md:grid-cols-2">
                        {[1, 2, 3, 4].map((i) => (
                            <Skeleton key={i} className="h-24 rounded-xl" />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center p-4">
                <Card className="max-w-md w-full">
                    <CardContent className="pt-6 text-center">
                        <AlertTriangle className="h-16 w-16 mx-auto mb-4 text-status-danger" />
                        <h2 className="text-xl font-bold mb-2">Link Inválido</h2>
                        <p className="text-muted-foreground">
                            {error || 'Este link de compartilhamento não existe ou expirou.'}
                        </p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (data.is_expired) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center p-4">
                <Card className="max-w-md w-full">
                    <CardContent className="pt-6 text-center">
                        <Clock className="h-16 w-16 mx-auto mb-4 text-status-warning" />
                        <h2 className="text-xl font-bold mb-2">Link Expirado</h2>
                        <p className="text-muted-foreground">
                            Este link de compartilhamento expirou em{' '}
                            {format(new Date(data.expires_at), "d 'de' MMMM 'às' HH:mm", { locale: ptBR })}.
                        </p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // Group exams by category
    const examsByCategory = data.exams.reduce((acc, exam) => {
        const cat = exam.category || 'Geral';
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(exam);
        return acc;
    }, {} as Record<string, SharedExam[]>);

    return (
        <div className="min-h-screen bg-gradient-to-br from-background to-muted/30 p-4 md:p-8">
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header */}
                <Card className="border-primary/20">
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <div className="h-12 w-12 rounded-xl gradient-primary flex items-center justify-center">
                                <Activity className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    Resultados de Exames
                                    <Badge variant="outline" className="ml-2">
                                        <Shield className="h-3 w-3 mr-1" />
                                        Compartilhamento seguro
                                    </Badge>
                                </CardTitle>
                                <CardDescription className="flex items-center gap-2 mt-1">
                                    <Clock className="h-3.5 w-3.5" />
                                    Expira em {format(new Date(data.expires_at), "d 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                </Card>

                {/* Summary */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card>
                        <CardContent className="pt-4 text-center">
                            <p className="text-2xl font-bold">{data.exams.length}</p>
                            <p className="text-xs text-muted-foreground">Total de Exames</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-4 text-center">
                            <p className="text-2xl font-bold text-status-healthy">
                                {data.exams.filter((e) => e.status === 'healthy').length}
                            </p>
                            <p className="text-xs text-muted-foreground">Saudáveis</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-4 text-center">
                            <p className="text-2xl font-bold text-status-warning">
                                {data.exams.filter((e) => e.status === 'warning').length}
                            </p>
                            <p className="text-xs text-muted-foreground">Atenção</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-4 text-center">
                            <p className="text-2xl font-bold text-status-danger">
                                {data.exams.filter((e) => e.status === 'danger').length}
                            </p>
                            <p className="text-xs text-muted-foreground">Críticos</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Exams by category */}
                {Object.entries(examsByCategory).map(([category, exams]) => (
                    <Card key={category}>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-lg">{category}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {exams.map((exam) => (
                                    <div
                                        key={exam.id}
                                        className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                                    >
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium">{exam.name}</span>
                                                <Badge variant="outline" className={cn('text-[10px]', getStatusColor(exam.status))}>
                                                    {getStatusText(exam.status)}
                                                </Badge>
                                            </div>
                                            <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                                                <Calendar className="h-3 w-3" />
                                                {format(new Date(exam.exam_date), 'dd/MM/yyyy', { locale: ptBR })}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-lg font-semibold">{exam.value}</span>
                                            <span className="text-sm text-muted-foreground ml-1">{exam.unit}</span>
                                            <p className="text-xs text-muted-foreground">
                                                Ref: {exam.reference_min} - {exam.reference_max}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                ))}

                {/* Footer */}
                <div className="text-center text-sm text-muted-foreground py-4">
                    <p>
                        Gerado por{' '}
                        <span className="font-semibold text-primary">MeuExame</span>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default SharedExamView;
