import { useState, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Camera, RotateCcw, Check, X, SwitchCamera } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface CameraCaptureProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onCapture: (file: File) => void;
}

export const CameraCapture = ({ open, onOpenChange, onCapture }: CameraCaptureProps) => {
    const { t } = useTranslation();
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
    const [isLoading, setIsLoading] = useState(false);

    const startCamera = useCallback(async () => {
        try {
            setIsLoading(true);
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode,
                    width: { ideal: 1920 },
                    height: { ideal: 1080 },
                },
            });
            setStream(mediaStream);
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }
        } catch (error) {
            console.error('Error accessing camera:', error);
            toast.error('Não foi possível acessar a câmera');
        } finally {
            setIsLoading(false);
        }
    }, [facingMode]);

    const stopCamera = useCallback(() => {
        if (stream) {
            stream.getTracks().forEach((track) => track.stop());
            setStream(null);
        }
    }, [stream]);

    const switchCamera = async () => {
        stopCamera();
        setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'));
    };

    const capturePhoto = () => {
        if (!videoRef.current || !canvasRef.current) return;

        const video = videoRef.current;
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');

        if (!context) return;

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0);

        const imageData = canvas.toDataURL('image/jpeg', 0.9);
        setCapturedImage(imageData);
        stopCamera();
    };

    const retakePhoto = () => {
        setCapturedImage(null);
        startCamera();
    };

    const confirmPhoto = async () => {
        if (!capturedImage) return;

        try {
            // Convert base64 to blob
            const response = await fetch(capturedImage);
            const blob = await response.blob();
            const file = new File([blob], `exam-photo-${Date.now()}.jpg`, {
                type: 'image/jpeg',
            });

            onCapture(file);
            handleClose();
            toast.success('Foto capturada com sucesso!');
        } catch (error) {
            console.error('Error processing photo:', error);
            toast.error('Erro ao processar foto');
        }
    };

    const handleClose = () => {
        stopCamera();
        setCapturedImage(null);
        onOpenChange(false);
    };

    // Start camera when dialog opens
    const handleOpenChange = (isOpen: boolean) => {
        if (isOpen) {
            startCamera();
        } else {
            handleClose();
        }
        onOpenChange(isOpen);
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-lg p-0 overflow-hidden">
                <DialogHeader className="p-4 pb-0">
                    <DialogTitle className="flex items-center gap-2">
                        <Camera className="h-5 w-5 text-primary" />
                        Capturar Exame
                    </DialogTitle>
                    <DialogDescription>
                        Posicione o exame na câmera para fotografar
                    </DialogDescription>
                </DialogHeader>

                <div className="relative aspect-[4/3] bg-black">
                    {/* Video preview */}
                    {!capturedImage && (
                        <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            muted
                            className={cn(
                                'w-full h-full object-cover',
                                isLoading && 'opacity-50'
                            )}
                        />
                    )}

                    {/* Captured image preview */}
                    {capturedImage && (
                        <img
                            src={capturedImage}
                            alt="Captured"
                            className="w-full h-full object-cover"
                        />
                    )}

                    {/* Loading overlay */}
                    {isLoading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                            <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        </div>
                    )}

                    {/* Camera guide */}
                    {!capturedImage && !isLoading && (
                        <div className="absolute inset-4 border-2 border-white/30 rounded-lg pointer-events-none">
                            <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-white rounded-tl-lg" />
                            <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-white rounded-tr-lg" />
                            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-white rounded-bl-lg" />
                            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-white rounded-br-lg" />
                        </div>
                    )}

                    {/* Hidden canvas for capture */}
                    <canvas ref={canvasRef} className="hidden" />
                </div>

                {/* Controls */}
                <div className="p-4 flex justify-center gap-4">
                    {!capturedImage ? (
                        <>
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={switchCamera}
                                disabled={isLoading}
                                className="h-12 w-12 rounded-full"
                            >
                                <SwitchCamera className="h-5 w-5" />
                            </Button>
                            <Button
                                size="icon"
                                onClick={capturePhoto}
                                disabled={isLoading || !stream}
                                className="h-16 w-16 rounded-full bg-white text-black hover:bg-gray-100"
                            >
                                <Camera className="h-8 w-8" />
                            </Button>
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={handleClose}
                                className="h-12 w-12 rounded-full"
                            >
                                <X className="h-5 w-5" />
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button
                                variant="outline"
                                onClick={retakePhoto}
                                className="gap-2"
                            >
                                <RotateCcw className="h-4 w-4" />
                                Refazer
                            </Button>
                            <Button onClick={confirmPhoto} className="gap-2">
                                <Check className="h-4 w-4" />
                                Usar foto
                            </Button>
                        </>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};
