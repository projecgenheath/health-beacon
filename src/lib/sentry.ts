import * as Sentry from '@sentry/react';

const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN;

export const initSentry = () => {
    if (!SENTRY_DSN) {
        console.warn('Sentry DSN not configured. Error monitoring disabled.');
        return;
    }

    Sentry.init({
        dsn: SENTRY_DSN,
        environment: import.meta.env.MODE,
        integrations: [
            Sentry.browserTracingIntegration(),
            Sentry.replayIntegration({
                maskAllText: true,
                blockAllMedia: true,
            }),
        ],
        // Performance Monitoring
        tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0,
        // Session Replay
        replaysSessionSampleRate: 0.1,
        replaysOnErrorSampleRate: 1.0,
        // Only send errors in production
        enabled: import.meta.env.PROD,
        // Ignore common false positives
        ignoreErrors: [
            'ResizeObserver loop limit exceeded',
            'ResizeObserver loop completed with undelivered notifications',
            'Non-Error promise rejection',
            'Network request failed',
            'Load failed',
            'Failed to fetch',
        ],
        beforeSend(event) {
            // Don't send events in development
            if (import.meta.env.DEV) {
                console.log('[Sentry] Event would be sent:', event);
                return null;
            }
            return event;
        },
    });
};

// Capture error with context
export const captureError = (error: Error, context?: Record<string, unknown>) => {
    console.error(error);
    Sentry.captureException(error, {
        extra: context,
    });
};

// Set user context for error tracking
export const setUserContext = (userId: string, email?: string) => {
    Sentry.setUser({
        id: userId,
        email,
    });
};

// Clear user context on logout
export const clearUserContext = () => {
    Sentry.setUser(null);
};

// Add breadcrumb for tracking user actions
export const addBreadcrumb = (
    message: string,
    category: string = 'user',
    level: Sentry.SeverityLevel = 'info'
) => {
    Sentry.addBreadcrumb({
        message,
        category,
        level,
        timestamp: Date.now() / 1000,
    });
};

export { Sentry };
