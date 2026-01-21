import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useNetworkStatus } from '../useNetworkStatus';

describe('useNetworkStatus', () => {
    const originalNavigator = { ...window.navigator };

    beforeEach(() => {
        // Reset navigator mock
        Object.defineProperty(window, 'navigator', {
            value: {
                onLine: true,
                connection: null,
                mozConnection: null,
                webkitConnection: null,
            },
            writable: true,
        });
    });

    it('should return online status when navigator.onLine is true', () => {
        Object.defineProperty(window.navigator, 'onLine', { value: true });

        const { result } = renderHook(() => useNetworkStatus());

        expect(result.current.isOnline).toBe(true);
    });

    it('should return offline status when navigator.onLine is false', () => {
        Object.defineProperty(window.navigator, 'onLine', { value: false });

        const { result } = renderHook(() => useNetworkStatus());

        expect(result.current.isOnline).toBe(false);
    });

    it('should detect slow connection based on effectiveType', () => {
        Object.defineProperty(window.navigator, 'connection', {
            value: {
                effectiveType: '2g',
                addEventListener: vi.fn(),
                removeEventListener: vi.fn(),
            },
        });

        const { result } = renderHook(() => useNetworkStatus());

        expect(result.current.isSlowConnection).toBe(true);
        expect(result.current.effectiveType).toBe('2g');
    });

    it('should not flag fast connection as slow', () => {
        Object.defineProperty(window.navigator, 'connection', {
            value: {
                effectiveType: '4g',
                addEventListener: vi.fn(),
                removeEventListener: vi.fn(),
            },
        });

        const { result } = renderHook(() => useNetworkStatus());

        expect(result.current.isSlowConnection).toBe(false);
        expect(result.current.effectiveType).toBe('4g');
    });

    it('should update status on online event', async () => {
        Object.defineProperty(window.navigator, 'onLine', {
            value: false,
            configurable: true
        });

        const { result } = renderHook(() => useNetworkStatus());

        expect(result.current.isOnline).toBe(false);

        // Simulate going online
        Object.defineProperty(window.navigator, 'onLine', {
            value: true,
            configurable: true
        });

        act(() => {
            window.dispatchEvent(new Event('online'));
        });

        await waitFor(() => {
            expect(result.current.isOnline).toBe(true);
        });
    });

    it('should update status on offline event', async () => {
        Object.defineProperty(window.navigator, 'onLine', {
            value: true,
            configurable: true
        });

        const { result } = renderHook(() => useNetworkStatus());

        expect(result.current.isOnline).toBe(true);

        act(() => {
            window.dispatchEvent(new Event('offline'));
        });

        await waitFor(() => {
            expect(result.current.isOnline).toBe(false);
        });
    });
});
