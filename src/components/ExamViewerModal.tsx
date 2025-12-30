import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { X, Download, ZoomIn, ZoomOut, Loader2, FileText, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface ExamViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileUrl: string | null;
  fileName: string;
}

export const ExamViewerModal = ({ isOpen, onClose, fileUrl, fileName }: ExamViewerModalProps) => {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [zoom, setZoom] = useState(100);

  const isPdf = fileName.toLowerCase().endsWith('.pdf');
  const isImage = /\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(fileName);

  useEffect(() => {
    if (isOpen && fileUrl) {
      fetchSignedUrl();
    } else {
      setSignedUrl(null);
      setError(null);
      setZoom(100);
    }
  }, [isOpen, fileUrl]);

  const fetchSignedUrl = async () => {
    if (!fileUrl) return;

    setLoading(true);
    setError(null);

    try {
      const { data, error: urlError } = await supabase.storage
        .from('exam-files')
        .createSignedUrl(fileUrl, 3600);

      if (urlError) throw urlError;
      setSignedUrl(data.signedUrl);
    } catch (err) {
      console.error('Error getting signed URL:', err);
      setError('Não foi possível carregar o arquivo');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!signedUrl) return;

    const link = document.createElement('a');
    link.href = signedUrl;
    link.download = fileName;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 25, 200));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 25, 50));

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[85vh] flex flex-col p-0 gap-0 overflow-hidden">
        <DialogHeader className="flex-shrink-0 px-6 py-4 border-b border-border/50 bg-card">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-lg font-semibold text-foreground">
                  {fileName}
                </DialogTitle>
                <p className="text-sm text-muted-foreground">
                  {isPdf ? 'Documento PDF' : 'Imagem do exame'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isImage && signedUrl && (
                <>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleZoomOut}
                    disabled={zoom <= 50}
                    className="h-9 w-9"
                  >
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                  <span className="text-sm text-muted-foreground w-12 text-center">
                    {zoom}%
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleZoomIn}
                    disabled={zoom >= 200}
                    className="h-9 w-9"
                  >
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                </>
              )}

              {signedUrl && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownload}
                  className="gap-2"
                >
                  <Download className="h-4 w-4" />
                  Baixar
                </Button>
              )}

              {isPdf && signedUrl && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(signedUrl, '_blank')}
                  className="gap-2"
                >
                  <ExternalLink className="h-4 w-4" />
                  Abrir
                </Button>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-auto bg-muted/30 p-4">
          {loading && (
            <div className="flex items-center justify-center h-full">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Carregando arquivo...</p>
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center justify-center h-full">
              <div className="flex flex-col items-center gap-3 text-center">
                <div className="h-16 w-16 rounded-full bg-status-danger/10 flex items-center justify-center">
                  <X className="h-8 w-8 text-status-danger" />
                </div>
                <p className="text-sm text-muted-foreground">{error}</p>
                <Button variant="outline" size="sm" onClick={fetchSignedUrl}>
                  Tentar novamente
                </Button>
              </div>
            </div>
          )}

          {signedUrl && !loading && !error && (
            <>
              {isImage && (
                <div className="flex items-center justify-center min-h-full">
                  <img
                    src={signedUrl}
                    alt={fileName}
                    className="rounded-lg shadow-lg transition-transform duration-300"
                    style={{ 
                      transform: `scale(${zoom / 100})`,
                      maxWidth: '100%',
                      height: 'auto'
                    }}
                  />
                </div>
              )}

              {isPdf && (
                <iframe
                  src={`${signedUrl}#toolbar=1&navpanes=0`}
                  className="w-full h-full rounded-lg border border-border/50"
                  title={fileName}
                />
              )}

              {!isImage && !isPdf && (
                <div className="flex items-center justify-center h-full">
                  <div className="flex flex-col items-center gap-3 text-center">
                    <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                      <FileText className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Visualização não disponível para este tipo de arquivo
                    </p>
                    <Button variant="outline" size="sm" onClick={handleDownload}>
                      <Download className="h-4 w-4 mr-2" />
                      Baixar arquivo
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};