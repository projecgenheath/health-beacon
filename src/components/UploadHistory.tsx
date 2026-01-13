import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import {
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  Eye,
  ChevronDown,
  History,
  Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { ExamViewerModal } from './ExamViewerModal';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

interface ExamUpload {
  id: string;
  file_name: string;
  file_url: string | null;
  upload_date: string;
  exam_date: string | null;
  lab_name: string | null;
  processed: boolean | null;
  created_at: string;
}

interface UploadHistoryProps {
  onReprocess?: () => void;
}

export const UploadHistory = ({ onReprocess }: UploadHistoryProps) => {
  const { user } = useAuth();
  const [uploads, setUploads] = useState<ExamUpload[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [reprocessingId, setReprocessingId] = useState<string | null>(null);
  const [viewingExam, setViewingExam] = useState<ExamUpload | null>(null);
  const [deletingExam, setDeletingExam] = useState<ExamUpload | null>(null);

  useEffect(() => {
    if (user) {
      fetchUploads();
    }
  }, [user]);

  const fetchUploads = async () => {
    if (!user) return;
    console.log('Fetching uploads for user:', user.id);

    try {
      const { data, error } = await supabase
        .from('exams')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      console.log('Uploads fetched successfully:', data?.length);
      setUploads(data || []);
    } catch (error) {
      console.error('Error fetching uploads:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReprocess = async (e: React.MouseEvent, exam: ExamUpload) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) return;
    if (!exam.file_url) {
      toast({
        title: 'Erro',
        description: 'Arquivo não encontrado para reprocessar',
        variant: 'destructive',
      });
      return;
    }

    setReprocessingId(exam.id);

    try {
      toast({
        title: 'Reprocessando...',
        description: `O exame ${exam.file_name} está sendo reprocessado.`,
      });
      console.log('Reprocessing exam:', exam.id);

      const { data: signedUrlData, error: signedUrlError } = await supabase.storage
        .from('exam-files')
        .createSignedUrl(exam.file_url, 3600);

      if (signedUrlError || !signedUrlData?.signedUrl) {
        throw new Error('Erro ao obter URL do arquivo para reprocessamento.');
      }

      const { data: result, error: functionError } = await supabase.functions.invoke('process-exam', {
        body: {
          fileUrl: signedUrlData.signedUrl,
          fileName: exam.file_name,
          examId: exam.id,
        },
      });

      if (functionError) {
        throw new Error(functionError.message || 'Falha ao reprocessar o exame.');
      }

      toast({
        title: 'Reprocessado!',
        description: 'O exame foi reprocessado com sucesso.',
      });

      await fetchUploads();
      onReprocess?.();
    } catch (error) {
      console.error('Error reprocessing exam:', error);
      toast({
        title: 'Erro ao reprocessar',
        description: error instanceof Error ? error.message : 'Não foi possível reprocessar o exame. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setReprocessingId(null);
    }
  };

  const handleDelete = (e: React.MouseEvent, exam: ExamUpload) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      toast({
        title: 'Erro de autenticação',
        description: 'Você precisa estar logado para excluir exames.',
        variant: 'destructive',
      });
      return;
    }

    setDeletingExam(exam);
  };

  const performDelete = async () => {
    if (!deletingExam) return;

    try {
      console.log('Attempting to delete exam:', deletingExam.id);
      setLoading(true);

      // 1. Delete file from storage if it exists
      if (deletingExam.file_url) {
        console.log('Deleting file from storage:', deletingExam.file_url);
        const { error: storageError } = await supabase.storage
          .from('exam-files')
          .remove([deletingExam.file_url]);

        if (storageError) {
          console.error('Error deleting file from storage:', storageError);
          // We continue anyway to try and delete the database record
        }
      }

      // 2. Delete from database
      console.log('Deleting record from database:', deletingExam.id);
      const { error: dbError } = await supabase
        .from('exams')
        .delete()
        .eq('id', deletingExam.id);

      if (dbError) {
        console.error('Database delete error:', dbError);
        throw dbError;
      }

      toast({
        title: 'Exame excluído',
        description: 'O upload e seus resultados foram removidos.',
      });

      console.log('Deletion successful. Refreshing list...');
      await fetchUploads();
      onReprocess?.();
    } catch (error) {
      console.error('Detailed deletion error:', error);
      toast({
        title: 'Erro ao excluir',
        description: error instanceof Error ? error.message : 'Não foi possível remover o exame.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      setDeletingExam(null);
    }
  };

  const getStatusIcon = (processed: boolean | null) => {
    if (processed === true) {
      return <CheckCircle className="h-4 w-4 text-status-healthy" />;
    } else if (processed === false) {
      return <XCircle className="h-4 w-4 text-status-danger" />;
    }
    return <Clock className="h-4 w-4 text-status-warning" />;
  };

  const getStatusText = (processed: boolean | null) => {
    if (processed === true) return 'Processado';
    if (processed === false) return 'Falhou';
    return 'Pendente';
  };

  if (loading || uploads.length === 0) return null;

  const failedUploads = uploads.filter(u => u.processed === false);
  const hasFailures = failedUploads.length > 0;

  return (
    <>
      <Collapsible
        open={isOpen}
        onOpenChange={setIsOpen}
        className="rounded-2xl bg-card border border-border/50 shadow-sm overflow-hidden animate-slide-up"
        style={{ animationDelay: '150ms' }}
      >
        <CollapsibleTrigger asChild>
          <button
            className="flex items-center justify-between w-full p-4 hover:bg-accent/30 transition-colors"
            aria-label={isOpen ? "Fechar histórico de uploads" : "Abrir histórico de uploads"}
          >
            <div className="flex items-center gap-3">
              <div className={cn(
                'h-10 w-10 rounded-xl flex items-center justify-center',
                hasFailures ? 'bg-status-warning/10' : 'bg-primary/10'
              )}>
                <History className={cn(
                  'h-5 w-5',
                  hasFailures ? 'text-status-warning' : 'text-primary'
                )} />
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-foreground">Histórico de Uploads</h3>
                <p className="text-sm text-muted-foreground">
                  {uploads.length} upload(s) • {failedUploads.length > 0 && (
                    <span className="text-status-danger">{failedUploads.length} com erro</span>
                  )}
                </p>
              </div>
            </div>
            <ChevronDown className={cn(
              'h-5 w-5 text-muted-foreground transition-transform duration-300',
              isOpen && 'rotate-180'
            )} />
          </button>
        </CollapsibleTrigger>

        <CollapsibleContent className="border-t border-border/50">
          <div className="max-h-64 overflow-y-auto">
            {uploads.map((upload) => (
              <div
                key={upload.id}
                className={cn(
                  'flex items-center gap-3 p-3 border-b border-border/30 last:border-b-0 hover:bg-accent/20 transition-colors',
                  upload.processed === false && 'bg-status-danger/5'
                )}
              >
                <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {upload.file_name}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {getStatusIcon(upload.processed)}
                    <span>{getStatusText(upload.processed)}</span>
                    <span>•</span>
                    <span>
                      {format(new Date(upload.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {upload.file_url && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setViewingExam(upload);
                      }}
                      aria-label={`Visualizar ${upload.file_name}`}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  )}

                  {(upload.processed === false || upload.processed === null) && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={(e) => handleReprocess(e, upload)}
                      disabled={reprocessingId === upload.id}
                      className="h-8"
                      aria-label={`Reprocessar ${upload.file_name}`}
                    >
                      <RefreshCw className={cn(
                        'h-4 w-4 mr-1',
                        reprocessingId === upload.id && 'animate-spin'
                      )} />
                      {reprocessingId === upload.id ? 'Processando...' : 'Reprocessar'}
                    </Button>
                  )}

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={(e) => handleDelete(e, upload)}
                    aria-label={`Excluir ${upload.file_name}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>

      <ConfirmDialog
        open={!!deletingExam}
        onOpenChange={(open) => !open && setDeletingExam(null)}
        title="Confirmar exclusão"
        description={`Deseja realmente excluir "${deletingExam?.file_name}"? Todos os resultados associados serão removidos permanentemente.`}
        confirmText="Excluir"
        cancelText="Cancelar"
        onConfirm={performDelete}
        variant="destructive"
      />

      <ExamViewerModal
        isOpen={!!viewingExam}
        onClose={() => setViewingExam(null)}
        fileUrl={viewingExam?.file_url || null}
        fileName={viewingExam?.file_name || ''}
      />
    </>
  );
};
