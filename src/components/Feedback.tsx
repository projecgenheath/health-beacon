import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    CheckCircle2,
    AlertCircle,
    XCircle,
    Info,
    X,
    Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';

type FeedbackType = 'success' | 'error' | 'warning' | 'info' | 'loading';

interface FeedbackItem {
    id: string;
    type: FeedbackType;
    title: string;
    message?: string;
    duration?: number;
    action?: {
        label: string;
        onClick: () => void;
    };
}

interface UseFeedbackReturn {
    feedbacks: FeedbackItem[];
    showFeedback: (feedback: Omit<FeedbackItem, 'id'>) => string;
    dismissFeedback: (id: string) => void;
    clearAll: () => void;
    success: (title: string, message?: string) => string;
    error: (title: string, message?: string) => string;
    warning: (title: string, message?: string) => string;
    info: (title: string, message?: string) => string;
    loading: (title: string, message?: string) => string;
}

const defaultDurations: Record<FeedbackType, number> = {
    success: 3000,
    error: 5000,
    warning: 4000,
    info: 4000,
    loading: 0, // Loading doesn't auto-dismiss
};

/**
 * Hook para gerenciar feedback de ações do usuário
 */
export const useFeedback = (): UseFeedbackReturn => {
    const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);

    const showFeedback = useCallback((feedback: Omit<FeedbackItem, 'id'>): string => {
        const id = `feedback-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const duration = feedback.duration ?? defaultDurations[feedback.type];

        setFeedbacks(prev => [...prev, { ...feedback, id }]);

        if (duration > 0) {
            setTimeout(() => {
                setFeedbacks(prev => prev.filter(f => f.id !== id));
            }, duration);
        }

        return id;
    }, []);

    const dismissFeedback = useCallback((id: string) => {
        setFeedbacks(prev => prev.filter(f => f.id !== id));
    }, []);

    const clearAll = useCallback(() => {
        setFeedbacks([]);
    }, []);

    const success = useCallback((title: string, message?: string) => {
        return showFeedback({ type: 'success', title, message });
    }, [showFeedback]);

    const error = useCallback((title: string, message?: string) => {
        return showFeedback({ type: 'error', title, message });
    }, [showFeedback]);

    const warning = useCallback((title: string, message?: string) => {
        return showFeedback({ type: 'warning', title, message });
    }, [showFeedback]);

    const info = useCallback((title: string, message?: string) => {
        return showFeedback({ type: 'info', title, message });
    }, [showFeedback]);

    const loading = useCallback((title: string, message?: string) => {
        return showFeedback({ type: 'loading', title, message });
    }, [showFeedback]);

    return {
        feedbacks,
        showFeedback,
        dismissFeedback,
        clearAll,
        success,
        error,
        warning,
        info,
        loading,
    };
};

interface FeedbackContainerProps {
    feedbacks: FeedbackItem[];
    onDismiss: (id: string) => void;
    position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
}

const iconMap: Record<FeedbackType, React.ElementType> = {
    success: CheckCircle2,
    error: XCircle,
    warning: AlertCircle,
    info: Info,
    loading: Loader2,
};

const colorMap: Record<FeedbackType, { bg: string; icon: string; border: string }> = {
    success: {
        bg: 'bg-status-healthy/10',
        icon: 'text-status-healthy',
        border: 'border-status-healthy/20',
    },
    error: {
        bg: 'bg-status-danger/10',
        icon: 'text-status-danger',
        border: 'border-status-danger/20',
    },
    warning: {
        bg: 'bg-status-warning/10',
        icon: 'text-status-warning',
        border: 'border-status-warning/20',
    },
    info: {
        bg: 'bg-primary/10',
        icon: 'text-primary',
        border: 'border-primary/20',
    },
    loading: {
        bg: 'bg-muted',
        icon: 'text-muted-foreground',
        border: 'border-border',
    },
};

const positionClasses: Record<NonNullable<FeedbackContainerProps['position']>, string> = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-center': 'top-4 left-1/2 -translate-x-1/2',
    'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2',
};

/**
 * Container para exibir feedbacks animados
 */
export const FeedbackContainer = ({
    feedbacks,
    onDismiss,
    position = 'top-right'
}: FeedbackContainerProps) => {
    return (
        <div
            className={cn(
                'fixed z-50 flex flex-col gap-2 w-full max-w-sm pointer-events-none',
                positionClasses[position]
            )}
            aria-live="polite"
            aria-label="Notificações"
        >
            <AnimatePresence mode="popLayout">
                {feedbacks.map((feedback) => {
                    const Icon = iconMap[feedback.type];
                    const colors = colorMap[feedback.type];

                    return (
                        <motion.div
                            key={feedback.id}
                            layout
                            initial={{ opacity: 0, y: -20, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.15 } }}
                            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                            className={cn(
                                'pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-lg',
                                'bg-card/95 backdrop-blur-sm',
                                colors.border
                            )}
                            role="alert"
                        >
                            <div className={cn('p-1.5 rounded-lg', colors.bg)}>
                                <Icon
                                    className={cn(
                                        'h-4 w-4',
                                        colors.icon,
                                        feedback.type === 'loading' && 'animate-spin'
                                    )}
                                />
                            </div>

                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-foreground">
                                    {feedback.title}
                                </p>
                                {feedback.message && (
                                    <p className="text-sm text-muted-foreground mt-0.5">
                                        {feedback.message}
                                    </p>
                                )}
                                {feedback.action && (
                                    <button
                                        onClick={feedback.action.onClick}
                                        className={cn(
                                            'text-sm font-medium mt-2',
                                            colors.icon,
                                            'hover:underline focus:outline-none focus:underline'
                                        )}
                                    >
                                        {feedback.action.label}
                                    </button>
                                )}
                            </div>

                            {feedback.type !== 'loading' && (
                                <button
                                    onClick={() => onDismiss(feedback.id)}
                                    className="p-1 rounded-md hover:bg-muted transition-colors"
                                    aria-label="Fechar notificação"
                                >
                                    <X className="h-4 w-4 text-muted-foreground" />
                                </button>
                            )}
                        </motion.div>
                    );
                })}
            </AnimatePresence>
        </div>
    );
};
