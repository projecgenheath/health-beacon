import { useState, useCallback, useRef } from 'react';

interface RetryConfig {
    maxRetries?: number;
    initialDelay?: number;
    maxDelay?: number;
    backoffMultiplier?: number;
    retryCondition?: (error: unknown) => boolean;
}

interface RetryState<T> {
    data: T | null;
    error: Error | null;
    isLoading: boolean;
    isRetrying: boolean;
    retryCount: number;
    execute: () => Promise<T | null>;
    reset: () => void;
}

const defaultRetryCondition = (error: unknown): boolean => {
    // Retry on network errors or 5xx server errors
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
        return true;
    }
    if (error instanceof Error && error.message.includes('network')) {
        return true;
    }
    // Check for HTTP status codes in error message
    const statusMatch = String(error).match(/\b(5\d{2})\b/);
    if (statusMatch) {
        return true;
    }
    return false;
};

/**
 * Hook para executar operações assíncronas com retry automático
 * Usa exponential backoff para resiliência de rede
 */
export function useRetry<T>(
    asyncFn: () => Promise<T>,
    config: RetryConfig = {}
): RetryState<T> {
    const {
        maxRetries = 3,
        initialDelay = 1000,
        maxDelay = 10000,
        backoffMultiplier = 2,
        retryCondition = defaultRetryCondition,
    } = config;

    const [data, setData] = useState<T | null>(null);
    const [error, setError] = useState<Error | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isRetrying, setIsRetrying] = useState(false);
    const [retryCount, setRetryCount] = useState(0);

    const abortControllerRef = useRef<AbortController | null>(null);

    const sleep = (ms: number): Promise<void> =>
        new Promise(resolve => setTimeout(resolve, ms));

    const calculateDelay = useCallback((attempt: number): number => {
        const delay = initialDelay * Math.pow(backoffMultiplier, attempt);
        // Add jitter (±25%)
        const jitter = delay * 0.25 * (Math.random() * 2 - 1);
        return Math.min(delay + jitter, maxDelay);
    }, [initialDelay, backoffMultiplier, maxDelay]);

    const execute = useCallback(async (): Promise<T | null> => {
        // Cancel any existing request
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        abortControllerRef.current = new AbortController();

        setIsLoading(true);
        setError(null);
        setRetryCount(0);

        let lastError: Error | null = null;

        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                if (attempt > 0) {
                    setIsRetrying(true);
                    setRetryCount(attempt);
                    const delay = calculateDelay(attempt - 1);
                    console.log(`Retry attempt ${attempt}/${maxRetries} after ${Math.round(delay)}ms`);
                    await sleep(delay);
                }

                const result = await asyncFn();
                setData(result);
                setIsLoading(false);
                setIsRetrying(false);
                return result;
            } catch (err) {
                lastError = err instanceof Error ? err : new Error(String(err));

                // Check if we should retry
                if (attempt < maxRetries && retryCondition(err)) {
                    continue;
                }

                // No more retries or condition not met
                break;
            }
        }

        setError(lastError);
        setIsLoading(false);
        setIsRetrying(false);
        return null;
    }, [asyncFn, maxRetries, calculateDelay, retryCondition]);

    const reset = useCallback(() => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        setData(null);
        setError(null);
        setIsLoading(false);
        setIsRetrying(false);
        setRetryCount(0);
    }, []);

    return {
        data,
        error,
        isLoading,
        isRetrying,
        retryCount,
        execute,
        reset,
    };
}

/**
 * Wrapper para funções assíncronas com retry
 */
export async function withRetry<T>(
    asyncFn: () => Promise<T>,
    config: RetryConfig = {}
): Promise<T> {
    const {
        maxRetries = 3,
        initialDelay = 1000,
        maxDelay = 10000,
        backoffMultiplier = 2,
        retryCondition = defaultRetryCondition,
    } = config;

    const sleep = (ms: number): Promise<void> =>
        new Promise(resolve => setTimeout(resolve, ms));

    const calculateDelay = (attempt: number): number => {
        const delay = initialDelay * Math.pow(backoffMultiplier, attempt);
        const jitter = delay * 0.25 * (Math.random() * 2 - 1);
        return Math.min(delay + jitter, maxDelay);
    };

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            if (attempt > 0) {
                const delay = calculateDelay(attempt - 1);
                await sleep(delay);
            }
            return await asyncFn();
        } catch (err) {
            lastError = err instanceof Error ? err : new Error(String(err));

            if (attempt < maxRetries && retryCondition(err)) {
                continue;
            }
            break;
        }
    }

    throw lastError;
}
