import { useState, useEffect, useCallback } from 'react';

interface NetworkStatus {
    isOnline: boolean;
    isSlowConnection: boolean;
    connectionType: string | null;
    effectiveType: string | null;
    downlink: number | null;
    rtt: number | null;
}

interface NetworkInformation extends EventTarget {
    effectiveType?: string;
    type?: string;
    downlink?: number;
    rtt?: number;
}

declare global {
    interface Navigator {
        connection?: NetworkInformation;
        mozConnection?: NetworkInformation;
        webkitConnection?: NetworkInformation;
    }
}

/**
 * Hook para monitorar status de conexão de rede
 * Detecta offline, conexão lenta e tipo de conexão
 */
export const useNetworkStatus = (): NetworkStatus => {
    const getConnection = useCallback((): NetworkInformation | null => {
        return navigator.connection ||
            navigator.mozConnection ||
            navigator.webkitConnection ||
            null;
    }, []);

    const getNetworkStatus = useCallback((): NetworkStatus => {
        const connection = getConnection();
        const effectiveType = connection?.effectiveType || null;

        return {
            isOnline: navigator.onLine,
            isSlowConnection: effectiveType === '2g' || effectiveType === 'slow-2g',
            connectionType: connection?.type || null,
            effectiveType,
            downlink: connection?.downlink ?? null,
            rtt: connection?.rtt ?? null,
        };
    }, [getConnection]);

    const [status, setStatus] = useState<NetworkStatus>(getNetworkStatus);

    useEffect(() => {
        const handleOnline = () => setStatus(prev => ({ ...prev, isOnline: true }));
        const handleOffline = () => setStatus(prev => ({ ...prev, isOnline: false }));
        const handleChange = () => setStatus(getNetworkStatus());

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        const connection = getConnection();
        if (connection) {
            connection.addEventListener('change', handleChange);
        }

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);

            const conn = getConnection();
            if (conn) {
                conn.removeEventListener('change', handleChange);
            }
        };
    }, [getConnection, getNetworkStatus]);

    return status;
};
