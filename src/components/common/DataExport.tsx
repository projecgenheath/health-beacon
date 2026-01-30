import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, FileJson, Shield, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export const DataExport = () => {
    const { t } = useTranslation();
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);

    const exportAllData = async () => {
        if (!user) return;

        setLoading(true);
        try {
            // Fetch all user data from different tables
            const [
                { data: profile },
                { data: exams },
                { data: examResults },
                { data: bmiHistory },
                { data: goals },
                { data: medications },
                { data: achievements },
            ] = await Promise.all([
                supabase.from('profiles').select('*').eq('user_id', user.id).single(),
                supabase.from('exams').select('*').eq('user_id', user.id),
                supabase.from('exam_results').select('*').eq('user_id', user.id),
                supabase.from('bmi_history').select('*').eq('user_id', user.id),
                supabase.from('health_goals').select('*').eq('user_id', user.id),
                supabase.from('medications').select('*').eq('user_id', user.id),
                supabase.from('achievements').select('*').eq('user_id', user.id),
            ]);

            const exportData = {
                exported_at: new Date().toISOString(),
                user: {
                    id: user.id,
                    email: user.email,
                },
                profile,
                exams: exams || [],
                exam_results: examResults || [],
                bmi_history: bmiHistory || [],
                health_goals: goals || [],
                medications: medications || [],
                achievements: achievements || [],
            };

            // Create and download JSON file
            const blob = new Blob([JSON.stringify(exportData, null, 2)], {
                type: 'application/json',
            });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `meuexame-data-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            toast.success('Dados exportados com sucesso!');
        } catch (error) {
            console.error('Error exporting data:', error);
            toast.error('Erro ao exportar dados');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-primary" />
                    {t('lgpd.exportData')}
                </CardTitle>
                <CardDescription>
                    {t('lgpd.exportDescription')}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="p-4 rounded-xl bg-muted/30 border border-border/50 mb-4">
                    <div className="flex items-start gap-3">
                        <FileJson className="h-5 w-5 text-muted-foreground mt-0.5" />
                        <div className="text-sm text-muted-foreground">
                            <p className="font-medium text-foreground mb-1">Seus dados incluem:</p>
                            <ul className="list-disc list-inside space-y-1">
                                <li>Informações do perfil</li>
                                <li>Exames enviados</li>
                                <li>Resultados de exames</li>
                                <li>Histórico de IMC</li>
                                <li>Metas de saúde</li>
                                <li>Medicamentos</li>
                                <li>Conquistas</li>
                            </ul>
                        </div>
                    </div>
                </div>

                <Button
                    onClick={exportAllData}
                    disabled={loading}
                    className="w-full gap-2"
                >
                    {loading ? (
                        <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Exportando...
                        </>
                    ) : (
                        <>
                            <Download className="h-4 w-4" />
                            {t('lgpd.exportButton')}
                        </>
                    )}
                </Button>
            </CardContent>
        </Card>
    );
};
