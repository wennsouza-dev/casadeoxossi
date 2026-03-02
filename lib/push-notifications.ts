import { supabase } from './supabase';

// Utility to convert Base64 URL safe VAPID key to Uint8Array
const urlBase64ToUint8Array = (base64String: string) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
};

export const requestNotificationPermission = async (): Promise<NotificationPermission> => {
    if (!('Notification' in window)) {
        console.warn('Este navegador não suporta notificações de desktop.');
        return 'denied';
    }

    if (Notification.permission === 'granted') {
        return 'granted';
    }

    const permission = await Notification.requestPermission();
    return permission;
};

export const subscribeToPushNotifications = async (memberId: string): Promise<boolean> => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        console.warn('Push messaging não é suportado pelo navegador.');
        return false;
    }

    try {
        const registration = await navigator.serviceWorker.ready;

        // Check if already subscribed
        let subscription = await registration.pushManager.getSubscription();

        if (!subscription) {
            // Replaces the placeholder with the Vite environment variable for VAPID
            const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;

            if (!vapidPublicKey) {
                console.error('VITE_VAPID_PUBLIC_KEY is not defined in the environment variables.');
                return false;
            }

            const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);

            subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: convertedVapidKey,
            });
        }

        // Save subscription to the database if it doesn't already exist for this member
        if (subscription) {
            const subscriptionJSON = subscription.toJSON();

            // Verifique se já existe no banco
            const { data: existingSubs, error: fetchError } = await supabase
                .from('push_subscriptions')
                .select('*')
                .eq('member_id', memberId)
                // Usando contains para garantir que não mande duplicado exato
                .contains('subscription', subscriptionJSON);

            if (fetchError) {
                console.error('Error checking existing subscriptions:', fetchError);
            }

            if (!existingSubs || existingSubs.length === 0) {
                const { error: insertError } = await supabase
                    .from('push_subscriptions')
                    .insert([
                        {
                            member_id: memberId,
                            subscription: subscriptionJSON,
                        }
                    ]);

                if (insertError) {
                    console.error('Error saving push subscription:', insertError);
                    return false;
                }
            }

            return true;
        }

        return false;
    } catch (error) {
        console.error('Failed to subscribe the user: ', error);
        return false;
    }
};
