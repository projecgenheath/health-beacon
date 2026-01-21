import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface PushSubscriptionData {
    endpoint: string;
    p256dh: string;
    auth: string;
}

interface UseNotificationsReturn {
    isSupported: boolean;
    permission: NotificationPermission | 'unsupported';
    isSubscribed: boolean;
    isLoading: boolean;
    requestPermission: () => Promise<boolean>;
    subscribe: () => Promise<boolean>;
    unsubscribe: () => Promise<boolean>;
    sendTestNotification: () => void;
}

/**
 * Hook para gerenciar notificações push
 * Suporta PWA e notificações nativas do browser
 */
export const useNotifications = (): UseNotificationsReturn => {
    const { user } = useAuth();
    const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>('default');
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const isSupported = typeof window !== 'undefined' &&
        'Notification' in window &&
        'serviceWorker' in navigator;

    // Check current permission and subscription status
    useEffect(() => {
        if (!isSupported) {
            setPermission('unsupported');
            return;
        }

        setPermission(Notification.permission);

        // Check if already subscribed
        const checkSubscription = async () => {
            if (!user) return;

            try {
                const registration = await navigator.serviceWorker.ready;
                const subscription = await registration.pushManager.getSubscription();
                setIsSubscribed(!!subscription);
            } catch (error) {
                console.error('Error checking subscription:', error);
            }
        };

        checkSubscription();
    }, [isSupported, user]);

    const requestPermission = useCallback(async (): Promise<boolean> => {
        if (!isSupported) return false;

        try {
            const result = await Notification.requestPermission();
            setPermission(result);
            return result === 'granted';
        } catch (error) {
            console.error('Error requesting notification permission:', error);
            return false;
        }
    }, [isSupported]);

    const subscribe = useCallback(async (): Promise<boolean> => {
        if (!isSupported || !user || permission !== 'granted') return false;

        setIsLoading(true);

        try {
            const registration = await navigator.serviceWorker.ready;

            // Get VAPID public key from environment
            const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;

            if (!vapidPublicKey) {
                console.warn('VAPID public key not configured');
                // Fallback to in-browser notifications only
                setIsSubscribed(true);
                setIsLoading(false);
                return true;
            }

            const keyArray = urlBase64ToUint8Array(vapidPublicKey);
            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: keyArray.buffer.slice(keyArray.byteOffset, keyArray.byteOffset + keyArray.byteLength) as ArrayBuffer,
            });

            // Save subscription to database
            const subscriptionData: PushSubscriptionData = {
                endpoint: subscription.endpoint,
                p256dh: arrayBufferToBase64(subscription.getKey('p256dh')!),
                auth: arrayBufferToBase64(subscription.getKey('auth')!),
            };

            const { error } = await supabase
                .from('push_subscriptions')
                .upsert({
                    user_id: user.id,
                    ...subscriptionData,
                }, {
                    onConflict: 'user_id',
                });

            if (error) throw error;

            setIsSubscribed(true);
            return true;
        } catch (error) {
            console.error('Error subscribing to push notifications:', error);
            return false;
        } finally {
            setIsLoading(false);
        }
    }, [isSupported, user, permission]);

    const unsubscribe = useCallback(async (): Promise<boolean> => {
        if (!isSupported || !user) return false;

        setIsLoading(true);

        try {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.getSubscription();

            if (subscription) {
                await subscription.unsubscribe();
            }

            // Remove from database
            const { error } = await supabase
                .from('push_subscriptions')
                .delete()
                .eq('user_id', user.id);

            if (error) throw error;

            setIsSubscribed(false);
            return true;
        } catch (error) {
            console.error('Error unsubscribing from push notifications:', error);
            return false;
        } finally {
            setIsLoading(false);
        }
    }, [isSupported, user]);

    const sendTestNotification = useCallback(() => {
        if (!isSupported || permission !== 'granted') return;

        new Notification('Health Beacon', {
            body: 'Notificações configuradas com sucesso! 🎉',
            icon: '/favicon.svg',
            badge: '/favicon.svg',
            tag: 'test-notification',
        });
    }, [isSupported, permission]);

    return {
        isSupported,
        permission,
        isSubscribed,
        isLoading,
        requestPermission,
        subscribe,
        unsubscribe,
        sendTestNotification,
    };
};

// Helper functions
function urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
        .replace(/-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
}
