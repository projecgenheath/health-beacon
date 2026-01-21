import * as Sentry from '@sentry/react';

/**
 * Inicializa o Sentry para monitoramento de erros
 * Deve ser chamado no início da aplicação
 */
export const initErrorTracking = () => {
    const dsn = import.meta.env.VITE_SENTRY_DSN;

    if (!dsn) {
        console.warn('[ErrorTracking] Sentry DSN not configured. Error tracking disabled.');
        return;
    }

    Sentry.init({
        dsn,
        environment: import.meta.env.MODE,

        // Performance monitoring
        tracesSampleRate: import.meta.env.MODE === 'production' ? 0.1 : 1.0,

        // Session replay for error reproduction
        replaysSessionSampleRate: 0.1,
        replaysOnErrorSampleRate: 1.0,

        integrations: [
            Sentry.browserTracingIntegration(),
            Sentry.replayIntegration({
                maskAllText: false,
                blockAllMedia: false,
            }),
        ],

        // Filter out non-critical errors
        beforeSend(event, hint) {
            const error = hint.originalException;

            // Ignore network errors that are expected
            if (error instanceof TypeError && error.message === 'Failed to fetch') {
                // Only report if user is online
                if (!navigator.onLine) {
                    return null;
                }
            }

            // Ignore ResizeObserver errors (common browser noise)
            if (error instanceof Error && error.message.includes('ResizeObserver')) {
                return null;
            }

            return event;
        },
    });

    console.log('[ErrorTracking] Sentry initialized');
};

/**
 * Captura uma exceção e envia para o Sentry
 */
export const captureError = (
    error: Error,
    context?: Record<string, unknown>
) => {
    console.error('[ErrorTracking] Captured error:', error);

    Sentry.captureException(error, {
        extra: context,
    });
};

/**
 * Captura uma mensagem de log para o Sentry
 */
export const captureMessage = (
    message: string,
    level: 'info' | 'warning' | 'error' = 'info',
    context?: Record<string, unknown>
) => {
    Sentry.captureMessage(message, {
        level,
        extra: context,
    });
};

/**
 * Define o usuário atual para o contexto do Sentry
 */
export const setUser = (user: { id: string; email?: string; name?: string } | null) => {
    if (user) {
        Sentry.setUser({
            id: user.id,
            email: user.email,
            username: user.name,
        });
    } else {
        Sentry.setUser(null);
    }
};

/**
 * Adiciona breadcrumb para debugging
 */
export const addBreadcrumb = (
    category: string,
    message: string,
    level: 'debug' | 'info' | 'warning' | 'error' = 'info',
    data?: Record<string, unknown>
) => {
    Sentry.addBreadcrumb({
        category,
        message,
        level,
        data,
    });
};

/**
 * Wrapper para funções que devem reportar erros
 */
export function withErrorTracking<T extends (...args: unknown[]) => unknown>(
    fn: T,
    context?: Record<string, unknown>
): T {
    return ((...args: Parameters<T>) => {
        try {
            const result = fn(...args);

            // Handle promises
            if (result instanceof Promise) {
                return result.catch((error) => {
                    captureError(error instanceof Error ? error : new Error(String(error)), context);
                    throw error;
                });
            }

            return result;
        } catch (error) {
            captureError(error instanceof Error ? error : new Error(String(error)), context);
            throw error;
        }
    }) as T;
}
