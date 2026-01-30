import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { UploadSection } from '@/components/exams/UploadSection';

interface UploadModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onUploadComplete?: () => void;
}

export const UploadModal = ({ open, onOpenChange, onUploadComplete }: UploadModalProps) => {
    const handleUploadComplete = () => {
        onUploadComplete?.();
        // Close modal after successful upload
        setTimeout(() => {
            onOpenChange(false);
        }, 2000);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Upload de Resultado de Exame</DialogTitle>
                    <DialogDescription>
                        Envie os resultados dos seus exames para análise automática com IA
                    </DialogDescription>
                </DialogHeader>
                <div className="mt-4">
                    <UploadSection onUploadComplete={handleUploadComplete} />
                </div>
            </DialogContent>
        </Dialog>
    );
};
