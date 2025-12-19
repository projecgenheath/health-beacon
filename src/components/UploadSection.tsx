import { useState, useCallback } from 'react';
import { Upload, FileText, Camera, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface UploadSectionProps {
  onUploadComplete?: () => void;
}

export const UploadSection = ({ onUploadComplete }: UploadSectionProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files).filter(
      (file) => file.type === 'application/pdf' || file.type.startsWith('image/')
    );
    
    if (files.length > 0) {
      setUploadedFiles((prev) => [...prev, ...files]);
      toast({
        title: 'Arquivo adicionado',
        description: `${files.length} arquivo(s) pronto(s) para processamento`,
      });
    }
  }, [toast]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setUploadedFiles((prev) => [...prev, ...files]);
      toast({
        title: 'Arquivo adicionado',
        description: `${files.length} arquivo(s) pronto(s) para processamento`,
      });
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
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
    let successCount = 0;
    let errorCount = 0;

    try {
      for (const file of uploadedFiles) {
        try {
          // 1. Create exam record in database
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
            console.error('Error creating exam record:', examError);
            errorCount++;
            continue;
          }

          // 2. Upload file to storage
          const filePath = `${user.id}/${examData.id}/${file.name}`;
          const { error: uploadError } = await supabase.storage
            .from('exam-files')
            .upload(filePath, file);

          if (uploadError) {
            console.error('Error uploading file:', uploadError);
            // Delete the exam record since upload failed
            await supabase.from('exams').delete().eq('id', examData.id);
            errorCount++;
            continue;
          }

          // 3. Get signed URL for the file
          const { data: signedUrlData, error: signedUrlError } = await supabase.storage
            .from('exam-files')
            .createSignedUrl(filePath, 3600); // 1 hour expiry

          if (signedUrlError || !signedUrlData?.signedUrl) {
            console.error('Error getting signed URL:', signedUrlError);
            errorCount++;
            continue;
          }

          // 4. Update exam with file URL
          await supabase
            .from('exams')
            .update({ file_url: filePath })
            .eq('id', examData.id);

          // 5. Call edge function to process with AI OCR
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

          const result = await response.json();

          if (!response.ok) {
            console.error('Error processing exam:', result.error);
            toast({
              title: 'Erro no processamento',
              description: result.error || 'Falha ao processar o exame',
              variant: 'destructive',
            });
            errorCount++;
            continue;
          }

          successCount++;
          console.log('Exam processed:', result);

        } catch (fileError) {
          console.error('Error processing file:', fileError);
          errorCount++;
        }
      }

      if (successCount > 0) {
        toast({
          title: 'Processamento concluído',
          description: `${successCount} exame(s) processado(s) com sucesso!`,
        });
        onUploadComplete?.();
      }

      if (errorCount > 0 && successCount === 0) {
        toast({
          title: 'Erro',
          description: `Falha ao processar ${errorCount} arquivo(s)`,
          variant: 'destructive',
        });
      }

      setUploadedFiles([]);
    } catch (error) {
      console.error('Error in processFiles:', error);
      toast({
        title: 'Erro',
        description: 'Ocorreu um erro ao processar os arquivos',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
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
            : 'border-border hover:border-primary/50 hover:bg-accent/50'
        )}
      >
        <input
          type="file"
          accept=".pdf,image/*"
          multiple
          onChange={handleFileInput}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
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
        <label className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-secondary text-secondary-foreground cursor-pointer hover:bg-secondary/80 transition-colors">
          <FileText className="h-5 w-5" />
          <span className="font-medium">Selecionar PDF</span>
          <input type="file" accept=".pdf" className="hidden" onChange={handleFileInput} />
        </label>
        <label className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-secondary text-secondary-foreground cursor-pointer hover:bg-secondary/80 transition-colors">
          <Camera className="h-5 w-5" />
          <span className="font-medium">Tirar Foto</span>
          <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileInput} />
        </label>
      </div>

      {/* Uploaded files list */}
      {uploadedFiles.length > 0 && (
        <div className="mt-4 space-y-2">
          <p className="text-sm font-medium text-foreground">Arquivos selecionados:</p>
          {uploadedFiles.map((file, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 rounded-xl bg-secondary/50 animate-scale-in"
            >
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-primary" />
                <span className="text-sm text-foreground truncate max-w-[200px]">{file.name}</span>
              </div>
              <button
                onClick={() => removeFile(index)}
                className="p-1 rounded-full hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
          
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
            {isProcessing ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Processando com IA...
              </>
            ) : (
              'Processar Exames'
            )}
          </button>
        </div>
      )}
    </div>
  );
};
