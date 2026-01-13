import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { CheckCircle, Upload, Loader2 } from 'lucide-react';

interface UploadProgressProps {
    progress: number;
    status: 'idle' | 'uploading' | 'processing' | 'success' | 'error';
    fileName?: string;
    className?: string;
}

export const UploadProgress = ({
    progress,
    status,
    fileName,
    className,
}: UploadProgressProps) => {
    const getStatusIcon = () => {
        switch (status) {
            case 'uploading':
                return <Upload className="h-5 w-5 text-primary animate-bounce" />;
            case 'processing':
                return <Loader2 className="h-5 w-5 text-primary animate-spin" />;
            case 'success':
                return <CheckCircle className="h-5 w-5 text-status-healthy" />;
            case 'error':
                return <Upload className="h-5 w-5 text-status-danger" />;
            default:
                return null;
        }
    };

    const getStatusText = () => {
        switch (status) {
            case 'uploading':
                return 'Enviando arquivo...';
            case 'processing':
                return 'Processando com IA...';
            case 'success':
                return 'Concluído!';
            case 'error':
                return 'Erro no upload';
            default:
                return '';
        }
    };

    const getProgressColor = () => {
        switch (status) {
            case 'success':
                return 'bg-status-healthy';
            case 'error':
                return 'bg-status-danger';
            default:
                return 'bg-primary';
        }
    };

    if (status === 'idle') return null;

    return (
        <div className={cn('rounded-xl bg-card border border-border/50 p-4 animate-slide-up', className)}>
            <div className="flex items-center gap-3 mb-3">
                <div className="flex-shrink-0">{getStatusIcon()}</div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                        {fileName || 'Arquivo'}
                    </p>
                    <p className="text-xs text-muted-foreground">{getStatusText()}</p>
                </div>
                {status !== 'error' && status !== 'success' && (
                    <span className="text-sm font-semibold text-primary">
                        {Math.round(progress)}%
                    </span>
                )}
            </div>

            <Progress
                value={progress}
                className="h-2"
                indicatorClassName={cn(
                    'transition-all duration-300',
                    getProgressColor()
                )}
            />
        </div>
    );
};
