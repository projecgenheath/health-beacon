/**
 * Centralized logging utility for the application
 * Can be extended to send logs to external services (Sentry, LogRocket, etc.)
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogContext {
    [key: string]: unknown;
}

class Logger {
    private isDevelopment = process.env.NODE_ENV === 'development';

    private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
        const timestamp = new Date().toISOString();
        const contextStr = context ? `\n${JSON.stringify(context, null, 2)}` : '';
        return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}`;
    }

    info(message: string, context?: LogContext): void {
        if (this.isDevelopment) {
            console.log(this.formatMessage('info', message, context));
        }
        // TODO: Send to analytics service
    }

    warn(message: string, context?: LogContext): void {
        console.warn(this.formatMessage('warn', message, context));
        // TODO: Send to monitoring service
    }

    error(message: string, error?: Error, context?: LogContext): void {
        const fullContext = {
            ...context,
            error: error ? {
                message: error.message,
                stack: error.stack,
                name: error.name,
            } : undefined,
        };

        console.error(this.formatMessage('error', message, fullContext));

        // TODO: Send to error tracking service (Sentry)
        // if (window.Sentry) {
        //   Sentry.captureException(error, {
        //     contexts: { custom: context },
        //   });
        // }
    }

    debug(message: string, context?: LogContext): void {
        if (this.isDevelopment) {
            console.debug(this.formatMessage('debug', message, context));
        }
    }

    /**
     * Log performance metrics
     */
    performance(metric: string, value: number, unit: string = 'ms'): void {
        if (this.isDevelopment) {
            console.log(`[PERF] ${metric}: ${value}${unit}`);
        }
        // TODO: Send to analytics
    }

    /**
     * Log user actions for analytics
     */
    event(eventName: string, properties?: LogContext): void {
        if (this.isDevelopment) {
            console.log(`[EVENT] ${eventName}`, properties);
        }
        // TODO: Send to analytics service (Google Analytics, Mixpanel, etc.)
    }
}

export const logger = new Logger();
