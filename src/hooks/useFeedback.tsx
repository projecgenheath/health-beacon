import { useState, useCallback } from 'react';

export type FeedbackType = 'success' | 'error' | 'warning' | 'info' | 'loading';

export interface FeedbackItem {
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

export interface UseFeedbackReturn {
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
