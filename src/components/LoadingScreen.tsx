import { Activity } from 'lucide-react';

interface LoadingScreenProps {
    message?: string;
    fullScreen?: boolean;
}

export const LoadingScreen = ({
    message = 'Carregando...',
    fullScreen = true
}: LoadingScreenProps) => {
    const containerClasses = fullScreen
        ? 'min-h-screen flex items-center justify-center bg-background'
        : 'flex items-center justify-center p-8';

    return (
        <div className={containerClasses}>
            <div className="flex flex-col items-center gap-4 animate-fade-in">
                <div className="relative">
                    {/* Outer ring */}
                    <div className="h-20 w-20 rounded-full border-4 border-primary/20" />

                    {/* Spinning ring */}
                    <div className="absolute inset-0 h-20 w-20 rounded-full border-4 border-transparent border-t-primary animate-spin" />

                    {/* Icon */}
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="h-16 w-16 rounded-2xl gradient-primary flex items-center justify-center shadow-glow-primary">
                            <Activity className="h-8 w-8 text-primary-foreground animate-pulse-slow" />
                        </div>
                    </div>
                </div>

                <div className="text-center space-y-1">
                    <p className="text-sm font-medium text-foreground">{message}</p>
                    <p className="text-xs text-muted-foreground">Aguarde um momento</p>
                </div>
            </div>
        </div>
    );
};

// Minimal loader for inline use
export const InlineLoader = () => {
    return (
        <div className="flex items-center justify-center p-4">
            <div className="h-8 w-8 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
        </div>
    );
};
