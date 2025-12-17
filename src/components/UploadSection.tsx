import { useState, useCallback } from 'react';
import { Upload, FileText, Camera, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

export const UploadSection = () => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

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
    setIsProcessing(true);
    // Simulate processing
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setIsProcessing(false);
    toast({
      title: 'Processamento concluído',
      description: 'Seus exames foram analisados com sucesso!',
    });
    setUploadedFiles([]);
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
            disabled={isProcessing}
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
                Processando...
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
