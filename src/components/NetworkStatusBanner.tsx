import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { WifiOff, Wifi, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Banner que mostra status de conexão de rede
 * Aparece quando offline ou com conexão lenta
 */
export const NetworkStatusBanner = () => {
    const { isOnline, isSlowConnection, effectiveType } = useNetworkStatus();

    const showBanner = !isOnline || isSlowConnection;

    return (
        <AnimatePresence>
            {showBanner && (
                <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                    className="overflow-hidden"
                >
                    <div
                        className={cn(
                            'flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium',
                            !isOnline
                                ? 'bg-destructive text-destructive-foreground'
                                : 'bg-status-warning-bg text-status-warning border-b border-status-warning/20'
                        )}
                        role="alert"
                        aria-live="polite"
                    >
                        {!isOnline ? (
                            <>
                                <WifiOff className="h-4 w-4" />
                                <span>Você está offline. Algumas funcionalidades podem não funcionar.</span>
                            </>
                        ) : isSlowConnection ? (
                            <>
                                <AlertTriangle className="h-4 w-4" />
                                <span>
                                    Conexão lenta detectada ({effectiveType}). O carregamento pode ser mais demorado.
                                </span>
                            </>
                        ) : null}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

/**
 * Indicador compacto de status de rede para usar em headers/sidebars
 */
export const NetworkStatusIndicator = () => {
    const { isOnline, isSlowConnection } = useNetworkStatus();

    if (isOnline && !isSlowConnection) {
        return null;
    }

    return (
        <div
            className={cn(
                'flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium',
                !isOnline
                    ? 'bg-destructive/10 text-destructive'
                    : 'bg-status-warning/10 text-status-warning'
            )}
            title={!isOnline ? 'Sem conexão' : 'Conexão lenta'}
        >
            {!isOnline ? (
                <WifiOff className="h-3 w-3" />
            ) : (
                <Wifi className="h-3 w-3" />
            )}
            <span className="hidden sm:inline">
                {!isOnline ? 'Offline' : 'Lento'}
            </span>
        </div>
    );
};
