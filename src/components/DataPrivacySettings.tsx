import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    Download,
    FileJson,
    FileSpreadsheet,
    Shield,
    Loader2,
    CheckCircle2,
    AlertTriangle,
    Trash2,
} from 'lucide-react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface ExportFormat {
    id: 'json' | 'csv';
    name: string;
    icon: React.ElementType;
    description: string;
}

const exportFormats: ExportFormat[] = [
    {
        id: 'json',
        name: 'JSON',
        icon: FileJson,
        description: 'Formato completo com todos os dados estruturados',
    },
    {
        id: 'csv',
        name: 'CSV',
        icon: FileSpreadsheet,
        description: 'Compatível com Excel e planilhas',
    },
];

/**
 * Componente de exportação e privacidade de dados (LGPD)
 */
export const DataPrivacySettings = () => {
    const { user } = useAuth();
    const { toast } = useToast();
    const [isExporting, setIsExporting] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [exportComplete, setExportComplete] = useState(false);

    const handleExport = async (format: 'json' | 'csv') => {
        if (!user) return;

        setIsExporting(true);
        setExportComplete(false);

        try {
            // Fetch all user data
            const [profileResult, examsResult, resultsResult, goalsResult, medsResult] = await Promise.all([
                supabase.from('profiles').select('*').eq('user_id', user.id).single(),
                supabase.from('exams').select('*').eq('user_id', user.id),
                supabase.from('exam_results').select('*').eq('user_id', user.id),
                supabase.from('health_goals').select('*').eq('user_id', user.id),
                supabase.from('medications').select('*').eq('user_id', user.id),
            ]);

            const exportData = {
                exportDate: new Date().toISOString(),
                profile: profileResult.data,
                exams: examsResult.data || [],
                examResults: resultsResult.data || [],
                healthGoals: goalsResult.data || [],
                medications: medsResult.data || [],
            };

            let content: string;
            let mimeType: string;
            let extension: string;

            if (format === 'json') {
                content = JSON.stringify(exportData, null, 2);
                mimeType = 'application/json';
                extension = 'json';
            } else {
                // Convert to CSV (simplified - exams only for CSV)
                const headers = ['id', 'exam_date', 'file_name', 'status', 'created_at'];
                const rows = (examsResult.data || []).map(exam =>
                    headers.map(h => exam[h as keyof typeof exam] ?? '').join(',')
                );
                content = [headers.join(','), ...rows].join('\n');
                mimeType = 'text/csv';
                extension = 'csv';
            }

            // Create download
            const blob = new Blob([content], { type: mimeType });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `health-beacon-export-${format(new Date(), 'yyyy-MM-dd')}.${extension}`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            setExportComplete(true);
            toast({
                title: 'Dados exportados',
                description: `Seus dados foram exportados em formato ${format.toUpperCase()}.`,
            });

            // Reset success state after 3 seconds
            setTimeout(() => setExportComplete(false), 3000);
        } catch (error) {
            console.error('Export error:', error);
            toast({
                title: 'Erro na exportação',
                description: 'Não foi possível exportar seus dados. Tente novamente.',
                variant: 'destructive',
            });
        } finally {
            setIsExporting(false);
        }
    };

    const handleDeleteAccount = async () => {
        if (!user) return;

        setIsDeleting(true);

        try {
            // Note: Full account deletion would require a server-side function
            // This is a placeholder that shows the concept
            toast({
                title: 'Solicitação enviada',
                description: 'Sua solicitação de exclusão será processada em até 48 horas.',
            });
        } catch (error) {
            console.error('Delete error:', error);
            toast({
                title: 'Erro',
                description: 'Não foi possível processar sua solicitação.',
                variant: 'destructive',
            });
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Privacidade e Dados
                </CardTitle>
                <CardDescription>
                    Gerencie seus dados conforme a Lei Geral de Proteção de Dados (LGPD)
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Export section */}
                <div>
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                        <Download className="h-4 w-4" />
                        Exportar meus dados
                    </h4>
                    <p className="text-sm text-muted-foreground mb-4">
                        Baixe uma cópia de todos os seus dados armazenados no Health Beacon.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {exportFormats.map((format) => (
                            <Button
                                key={format.id}
                                variant="outline"
                                className="h-auto py-4 px-4 flex flex-col items-start gap-2"
                                onClick={() => handleExport(format.id)}
                                disabled={isExporting}
                            >
                                <div className="flex items-center gap-2 w-full">
                                    {isExporting ? (
                                        <Loader2 className="h-5 w-5 animate-spin" />
                                    ) : exportComplete ? (
                                        <CheckCircle2 className="h-5 w-5 text-status-healthy" />
                                    ) : (
                                        <format.icon className="h-5 w-5" />
                                    )}
                                    <span className="font-medium">{format.name}</span>
                                </div>
                                <span className="text-xs text-muted-foreground text-left">
                                    {format.description}
                                </span>
                            </Button>
                        ))}
                    </div>
                </div>

                <div className="border-t border-border" />

                {/* Delete account section */}
                <div>
                    <h4 className="font-medium mb-3 flex items-center gap-2 text-destructive">
                        <Trash2 className="h-4 w-4" />
                        Excluir minha conta
                    </h4>
                    <p className="text-sm text-muted-foreground mb-4">
                        Solicite a exclusão permanente de todos os seus dados. Esta ação é irreversível.
                    </p>

                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="destructive" className="gap-2">
                                <Trash2 className="h-4 w-4" />
                                Solicitar exclusão
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle className="flex items-center gap-2">
                                    <AlertTriangle className="h-5 w-5 text-destructive" />
                                    Excluir conta permanentemente?
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                    Esta ação é <strong>irreversível</strong>. Todos os seus dados serão
                                    permanentemente excluídos, incluindo:
                                    <ul className="list-disc list-inside mt-2 space-y-1">
                                        <li>Perfil e informações pessoais</li>
                                        <li>Todos os exames e histórico</li>
                                        <li>Metas e acompanhamentos</li>
                                        <li>Medicamentos cadastrados</li>
                                        <li>Links compartilhados</li>
                                    </ul>
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                    onClick={handleDeleteAccount}
                                    disabled={isDeleting}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                    {isDeleting ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            Processando...
                                        </>
                                    ) : (
                                        'Sim, excluir minha conta'
                                    )}
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>

                {/* LGPD info box */}
                <div className="p-4 rounded-xl bg-muted/50 border border-border">
                    <div className="flex items-start gap-3">
                        <Shield className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                        <div className="text-sm">
                            <p className="font-medium text-foreground mb-1">
                                Seus direitos sob a LGPD
                            </p>
                            <p className="text-muted-foreground">
                                Você tem direito a acessar, corrigir, portar e solicitar a exclusão
                                dos seus dados pessoais a qualquer momento. Para mais informações,
                                consulte nossa Política de Privacidade.
                            </p>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};
