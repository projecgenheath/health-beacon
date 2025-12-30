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

  useEffect(() => {
    if (user) {
      fetchUploads();
    }
  }, [user]);

  const fetchUploads = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('exams')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setUploads(data || []);
    } catch (error) {
      console.error('Error fetching uploads:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReprocess = async (exam: ExamUpload) => {
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
      const { data: signedUrlData, error: signedUrlError } = await supabase.storage
        .from('exam-files')
        .createSignedUrl(exam.file_url, 3600);

      if (signedUrlError || !signedUrlData?.signedUrl) {
        throw new Error('Erro ao obter URL do arquivo');
      }

      const { data: { session } } = await supabase.auth.getSession();

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/process-exam`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({
            fileUrl: signedUrlData.signedUrl,
            fileName: exam.file_name,
            examId: exam.id,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Falha ao reprocessar');
      }

      toast({
        title: 'Reprocessado!',
        description: 'O exame foi reprocessado com sucesso',
      });

      await fetchUploads();
      onReprocess?.();
    } catch (error) {
      console.error('Error reprocessing:', error);
      toast({
        title: 'Erro ao reprocessar',
        description: error instanceof Error ? error.message : 'Tente novamente',
        variant: 'destructive',
      });
    } finally {
      setReprocessingId(null);
    }
  };

  const handleDelete = async (exam: ExamUpload) => {
    try {
      // Delete from storage if file_url exists
      if (exam.file_url) {
        const { error: storageError } = await supabase.storage
          .from('exam-files')
          .remove([exam.file_url]);

        if (storageError) {
          console.error('Error deleting file from storage:', storageError);
        }
      }

      // Delete from database
      const { error: dbError } = await supabase
        .from('exams')
        .delete()
        .eq('id', exam.id);

      if (dbError) throw dbError;

      // Update local state
      setUploads(uploads.filter(u => u.id !== exam.id));

      toast({
        title: 'Excluído',
        description: 'O upload foi excluído com sucesso',
      });

      onReprocess?.();
    } catch (error) {
      console.error('Error deleting exam:', error);
      toast({
        title: 'Erro ao excluir',
        description: 'Não foi possível excluir o upload',
        variant: 'destructive',
      });
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
          <button className="flex items-center justify-between w-full p-4 hover:bg-accent/30 transition-colors">
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
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setViewingExam(upload)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  )}

                  {upload.processed === false && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleReprocess(upload)}
                      disabled={reprocessingId === upload.id}
                      className="h-8"
                    >
                      <RefreshCw className={cn(
                        'h-4 w-4 mr-1',
                        reprocessingId === upload.id && 'animate-spin'
                      )} />
                      {reprocessingId === upload.id ? 'Processando...' : 'Reprocessar'}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(upload)}
                      className="h-8 w-8 text-status-danger hover:text-red-600 hover:bg-red-50"
                      title="Excluir upload falho"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </>
                  )}
              </div>
              </div>
            ))}
        </div>
      </CollapsibleContent>
    </Collapsible >

      <ExamViewerModal
        isOpen={!!viewingExam}
        onClose={() => setViewingExam(null)}
        fileUrl={viewingExam?.file_url || null}
        fileName={viewingExam?.file_name || ''}
      />
    </>
  );
};