import { useState, useCallback, useRef } from 'react';
import { Upload, FileText, Camera, X, Loader2, CheckCircle, AlertCircle, Image } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Progress } from '@/components/ui/progress';

interface UploadSectionProps {
  onUploadComplete?: () => void;
}

interface FileWithPreview {
  file: File;
  preview: string | null;
  status: 'pending' | 'uploading' | 'processing' | 'success' | 'error';
  progress: number;
  error?: string;
}

type ProcessingStep = 'idle' | 'uploading' | 'analyzing' | 'extracting' | 'saving';

const stepLabels: Record<ProcessingStep, string> = {
  idle: 'Aguardando',
  uploading: 'Enviando arquivo...',
  analyzing: 'Analisando documento com IA...',
  extracting: 'Extraindo resultados...',
  saving: 'Salvando no banco de dados...',
};

export const UploadSection = ({ onUploadComplete }: UploadSectionProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState<ProcessingStep>('idle');
  const [overallProgress, setOverallProgress] = useState(0);
  const { toast } = useToast();
  const { user } = useAuth();
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const createPreview = (file: File): Promise<string | null> => {
    return new Promise((resolve) => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(file);
      } else {
        resolve(null);
      }
    });
  };

  const addFiles = async (newFiles: File[]) => {
    const validFiles = newFiles.filter(
      (file) => file.type === 'application/pdf' || file.type.startsWith('image/')
    );

    if (validFiles.length === 0) {
      toast({
        title: 'Formato inválido',
        description: 'Apenas PDF ou imagens são aceitos',
        variant: 'destructive',
      });
      return;
    }

    const filesWithPreviews = await Promise.all(
      validFiles.map(async (file) => ({
        file,
        preview: await createPreview(file),
        status: 'pending' as const,
        progress: 0,
      }))
    );

    setFiles((prev) => [...prev, ...filesWithPreviews]);
    toast({
      title: 'Arquivo adicionado',
      description: `${validFiles.length} arquivo(s) pronto(s) para processamento`,
    });
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    await addFiles(droppedFiles);
  }, []);

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length > 0) {
      await addFiles(selectedFiles);
    }
    e.target.value = '';
  };

  const handleCameraCapture = () => {
    cameraInputRef.current?.click();
  };

  const removeFile = (index: number) => {
    setFiles((prev) => {
      const file = prev[index];
      if (file.preview) {
        URL.revokeObjectURL(file.preview);
      }
      return prev.filter((_, i) => i !== index);
    });
  };

  const updateFileStatus = (index: number, updates: Partial<FileWithPreview>) => {
    setFiles((prev) => prev.map((f, i) => (i === index ? { ...f, ...updates } : f)));
  };

  const processFiles = async () => {
    if (!user) {
      toast({
        title: 'Erro',
        description: 'Você precisa estar logado para processar exames',
        variant: 'destructive',
      });
      return;
    }

    setIsProcessing(true);
    setOverallProgress(0);
    let successCount = 0;
    let errorCount = 0;

    const totalFiles = files.length;

    for (let i = 0; i < files.length; i++) {
      const fileData = files[i];
      const file = fileData.file;
      const baseProgress = (i / totalFiles) * 100;
      const fileProgressWeight = 100 / totalFiles;

      try {
        // Step 1: Create exam record
        updateFileStatus(i, { status: 'uploading', progress: 10 });
        setCurrentStep('uploading');
        setOverallProgress(baseProgress + fileProgressWeight * 0.1);

        const { data: examData, error: examError } = await supabase
          .from('exams')
          .insert({
            user_id: user.id,
            file_name: file.name,
            upload_date: new Date().toISOString(),
          })
          .select()
          .single();

        if (examError) {
          throw new Error('Erro ao criar registro do exame');
        }

        // Step 2: Upload file to storage
        updateFileStatus(i, { progress: 30 });
        setOverallProgress(baseProgress + fileProgressWeight * 0.3);

        const filePath = `${user.id}/${examData.id}/${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from('exam-files')
          .upload(filePath, file);

        if (uploadError) {
          await supabase.from('exams').delete().eq('id', examData.id);
          throw new Error('Erro ao enviar arquivo');
        }

        // Step 3: Get signed URL
        const { data: signedUrlData, error: signedUrlError } = await supabase.storage
          .from('exam-files')
          .createSignedUrl(filePath, 3600);

        if (signedUrlError || !signedUrlData?.signedUrl) {
          throw new Error('Erro ao obter URL do arquivo');
        }

        // Update exam with file URL
        await supabase
          .from('exams')
          .update({ file_url: filePath })
          .eq('id', examData.id);

        // Step 4: Process with AI
        updateFileStatus(i, { status: 'processing', progress: 50 });
        setCurrentStep('analyzing');
        setOverallProgress(baseProgress + fileProgressWeight * 0.5);

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
              fileName: file.name,
              examId: examData.id,
            }),
          }
        );

        updateFileStatus(i, { progress: 75 });
        setCurrentStep('extracting');
        setOverallProgress(baseProgress + fileProgressWeight * 0.75);

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Falha ao processar o exame');
        }

        // Step 5: Complete
        updateFileStatus(i, { status: 'success', progress: 100 });
        setCurrentStep('saving');
        setOverallProgress(baseProgress + fileProgressWeight);

        successCount++;

      } catch (error) {
        console.error('Error processing file:', error);
        updateFileStatus(i, {
          status: 'error',
          error: error instanceof Error ? error.message : 'Erro desconhecido',
        });
        errorCount++;
      }
    }

    setCurrentStep('idle');
    setIsProcessing(false);

    if (successCount > 0) {
      toast({
        title: 'Processamento concluído!',
        description: `${successCount} exame(s) processado(s) com sucesso`,
      });
      onUploadComplete?.();
      // Remove successful files after a delay
      setTimeout(() => {
        setFiles((prev) => prev.filter((f) => f.status !== 'success'));
      }, 2000);
    }

    if (errorCount > 0 && successCount === 0) {
      toast({
        title: 'Erro no processamento',
        description: `Falha ao processar ${errorCount} arquivo(s)`,
        variant: 'destructive',
      });
    }
  };

  const getStatusIcon = (status: FileWithPreview['status']) => {
    switch (status) {
      case 'uploading':
      case 'processing':
        return <Loader2 className="h-4 w-4 animate-spin text-primary" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-status-healthy" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-status-danger" />;
      default:
        return null;
    }
  };

  const getStatusText = (status: FileWithPreview['status']) => {
    switch (status) {
      case 'uploading':
        return 'Enviando...';
      case 'processing':
        return 'Processando...';
      case 'success':
        return 'Concluído!';
      case 'error':
        return 'Erro';
      default:
        return '';
    }
  };

  return (
    <div className="rounded-2xl bg-card p-6 shadow-md animate-slide-up" style={{ animationDelay: '100ms' }}>
      <h2 className="text-lg font-semibold text-foreground mb-4">Upload de Exames</h2>
      
      {/* Drop zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          'relative border-2 border-dashed rounded-xl p-8 transition-all duration-300 text-center',
          isDragging
            ? 'border-primary bg-primary/5 scale-[1.02]'
            : 'border-border hover:border-primary/50 hover:bg-accent/50',
          isProcessing && 'pointer-events-none opacity-60'
        )}
      >
        <input
          type="file"
          accept=".pdf,image/*"
          multiple
          onChange={handleFileInput}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={isProcessing}
        />
        
        <div className="flex flex-col items-center gap-3">
          <div className={cn(
            'h-14 w-14 rounded-xl flex items-center justify-center transition-colors',
            isDragging ? 'gradient-primary' : 'bg-primary/10'
          )}>
            <Upload className={cn('h-7 w-7', isDragging ? 'text-primary-foreground' : 'text-primary')} />
          </div>
          <div>
            <p className="font-medium text-foreground">
              Arraste seus exames aqui
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              PDF ou foto • Múltiplos arquivos aceitos
            </p>
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="flex gap-3 mt-4">
        <label className={cn(
          "flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-secondary text-secondary-foreground cursor-pointer hover:bg-secondary/80 transition-colors",
          isProcessing && 'pointer-events-none opacity-60'
        )}>
          <FileText className="h-5 w-5" />
          <span className="font-medium">Selecionar PDF</span>
          <input 
            type="file" 
            accept=".pdf" 
            className="hidden" 
            onChange={handleFileInput}
            disabled={isProcessing}
          />
        </label>
        <button
          onClick={handleCameraCapture}
          disabled={isProcessing}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors",
            isProcessing && 'pointer-events-none opacity-60'
          )}
        >
          <Camera className="h-5 w-5" />
          <span className="font-medium">Tirar Foto</span>
        </button>
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleFileInput}
          disabled={isProcessing}
        />
      </div>

      {/* Files list with previews */}
      {files.length > 0 && (
        <div className="mt-4 space-y-3">
          <p className="text-sm font-medium text-foreground">
            Arquivos selecionados ({files.length}):
          </p>
          
          <div className="grid gap-3">
            {files.map((fileData, index) => (
              <div
                key={index}
                className={cn(
                  'relative flex items-center gap-3 p-3 rounded-xl transition-all animate-scale-in',
                  fileData.status === 'success' && 'bg-status-healthy/10 border border-status-healthy/30',
                  fileData.status === 'error' && 'bg-status-danger/10 border border-status-danger/30',
                  fileData.status === 'pending' && 'bg-secondary/50',
                  (fileData.status === 'uploading' || fileData.status === 'processing') && 'bg-primary/5 border border-primary/30'
                )}
              >
                {/* Preview thumbnail */}
                <div className="h-12 w-12 rounded-lg overflow-hidden bg-muted flex-shrink-0 flex items-center justify-center">
                  {fileData.preview ? (
                    <img
                      src={fileData.preview}
                      alt="Preview"
                      className="h-full w-full object-cover"
                    />
                  ) : fileData.file.type === 'application/pdf' ? (
                    <FileText className="h-6 w-6 text-primary" />
                  ) : (
                    <Image className="h-6 w-6 text-muted-foreground" />
                  )}
                </div>

                {/* File info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {fileData.file.name}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    {getStatusIcon(fileData.status)}
                    <span className={cn(
                      'text-xs',
                      fileData.status === 'success' && 'text-status-healthy',
                      fileData.status === 'error' && 'text-status-danger',
                      (fileData.status === 'uploading' || fileData.status === 'processing') && 'text-primary',
                      fileData.status === 'pending' && 'text-muted-foreground'
                    )}>
                      {fileData.error || getStatusText(fileData.status) || `${(fileData.file.size / 1024).toFixed(1)} KB`}
                    </span>
                  </div>
                  
                  {/* Progress bar for active files */}
                  {(fileData.status === 'uploading' || fileData.status === 'processing') && (
                    <Progress value={fileData.progress} className="h-1 mt-2" />
                  )}
                </div>

                {/* Remove button */}
                {fileData.status === 'pending' && !isProcessing && (
                  <button
                    onClick={() => removeFile(index)}
                    className="p-1.5 rounded-full hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Overall progress */}
          {isProcessing && (
            <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 space-y-3">
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                <span className="text-sm font-medium text-foreground">
                  {stepLabels[currentStep]}
                </span>
              </div>
              <Progress value={overallProgress} className="h-2" />
              <p className="text-xs text-muted-foreground text-right">
                {Math.round(overallProgress)}% concluído
              </p>
            </div>
          )}

          {/* Process button */}
          {files.some((f) => f.status === 'pending') && !isProcessing && (
            <button
              onClick={processFiles}
              disabled={isProcessing || !user}
              className={cn(
                'w-full py-3 px-4 rounded-xl font-medium transition-all duration-300',
                'gradient-primary text-primary-foreground',
                'hover:opacity-90 disabled:opacity-50',
                'flex items-center justify-center gap-2'
              )}
            >
              Processar {files.filter((f) => f.status === 'pending').length} Exame(s)
            </button>
          )}
        </div>
      )}
    </div>
  );
};
