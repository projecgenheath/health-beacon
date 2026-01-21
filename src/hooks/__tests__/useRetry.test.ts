import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useRetry, withRetry } from '../useRetry';

describe('useRetry', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('should execute async function successfully', async () => {
        const mockFn = vi.fn().mockResolvedValue('success');

        const { result } = renderHook(() => useRetry(mockFn));

        let executePromise: Promise<unknown>;
        act(() => {
            executePromise = result.current.execute();
        });

        await act(async () => {
            await executePromise;
        });

        expect(result.current.data).toBe('success');
        expect(result.current.error).toBeNull();
        expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should retry on failure', async () => {
        const mockFn = vi.fn()
            .mockRejectedValueOnce(new TypeError('Failed to fetch'))
            .mockResolvedValue('success');

        const { result } = renderHook(() => useRetry(mockFn, { maxRetries: 3 }));

        act(() => {
            result.current.execute();
        });

        // Fast-forward through retries
        await act(async () => {
            await vi.runAllTimersAsync();
        });

        expect(result.current.data).toBe('success');
        expect(mockFn).toHaveBeenCalledTimes(2);
    });

    it('should give up after max retries', async () => {
        const error = new TypeError('Failed to fetch');
        const mockFn = vi.fn().mockRejectedValue(error);

        const { result } = renderHook(() => useRetry(mockFn, { maxRetries: 2 }));

        act(() => {
            result.current.execute();
        });

        await act(async () => {
            await vi.runAllTimersAsync();
        });

        expect(result.current.data).toBeNull();
        expect(result.current.error).toBeTruthy();
        expect(mockFn).toHaveBeenCalledTimes(3); // Initial + 2 retries
    });

    it('should not retry for non-retryable errors by default', async () => {
        const error = new Error('Validation error');
        const mockFn = vi.fn().mockRejectedValue(error);

        const { result } = renderHook(() => useRetry(mockFn, { maxRetries: 3 }));

        act(() => {
            result.current.execute();
        });

        await act(async () => {
            await vi.runAllTimersAsync();
        });

        expect(mockFn).toHaveBeenCalledTimes(1); // No retries
    });

    it('should reset state correctly', async () => {
        const mockFn = vi.fn().mockResolvedValue('success');

        const { result } = renderHook(() => useRetry(mockFn));

        await act(async () => {
            await result.current.execute();
        });

        expect(result.current.data).toBe('success');

        act(() => {
            result.current.reset();
        });

        expect(result.current.data).toBeNull();
        expect(result.current.error).toBeNull();
        expect(result.current.isLoading).toBe(false);
    });
});

describe('withRetry', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('should return result on success', async () => {
        const mockFn = vi.fn().mockResolvedValue('success');

        const result = await withRetry(mockFn);

        expect(result).toBe('success');
    });

    it('should retry and succeed', async () => {
        const mockFn = vi.fn()
            .mockRejectedValueOnce(new TypeError('Failed to fetch'))
            .mockResolvedValue('success');

        const promise = withRetry(mockFn);

        await vi.runAllTimersAsync();

        const result = await promise;
        expect(result).toBe('success');
        expect(mockFn).toHaveBeenCalledTimes(2);
    });

    it('should throw after max retries', async () => {
        const mockFn = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'));

        const promise = withRetry(mockFn, { maxRetries: 1 });

        await vi.runAllTimersAsync();

        await expect(promise).rejects.toThrow('Failed to fetch');
        expect(mockFn).toHaveBeenCalledTimes(2);
    });
});
