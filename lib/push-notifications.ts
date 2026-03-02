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
        console.warn('[Push] Este navegador não suporta notificações.');
        return 'denied';
    }

    if (Notification.permission === 'granted') {
        console.log('[Push] Permissão já concedida.');
        return 'granted';
    }

    const permission = await Notification.requestPermission();
    console.log('[Push] Permissão solicitada, resultado:', permission);
    return permission;
};

export const subscribeToPushNotifications = async (memberId: string): Promise<boolean> => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        console.warn('[Push] Push messaging não é suportado pelo navegador.');
        return false;
    }

    try {
        console.log('[Push] Iniciando subscrição para membro:', memberId);
        const registration = await navigator.serviceWorker.ready;
        console.log('[Push] Service Worker pronto.');

        // Check if already subscribed
        let subscription = await registration.pushManager.getSubscription();
        console.log('[Push] Subscrição existente:', subscription ? 'SIM' : 'NÃO');

        if (!subscription) {
            const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;

            if (!vapidPublicKey) {
                console.error('[Push] VITE_VAPID_PUBLIC_KEY não definida!');
                return false;
            }

            console.log('[Push] Criando nova subscrição com VAPID key...');
            const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);

            subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: convertedVapidKey,
            });
            console.log('[Push] Nova subscrição criada com sucesso!');
        }

        if (subscription) {
            const subscriptionJSON = subscription.toJSON();
            console.log('[Push] Subscription JSON:', JSON.stringify(subscriptionJSON));

            // Check if this exact subscription already exists for this member
            const { data: existingSubs, error: fetchError } = await supabase
                .from('push_subscriptions')
                .select('id')
                .eq('member_id', memberId);

            if (fetchError) {
                console.error('[Push] Erro ao verificar subscrições existentes:', fetchError);
            }

            // Always upsert: delete old and insert new subscription for this member
            if (existingSubs && existingSubs.length > 0) {
                console.log('[Push] Removendo', existingSubs.length, 'subscrições antigas...');
                await supabase.from('push_subscriptions').delete().eq('member_id', memberId);
            }

            console.log('[Push] Salvando nova subscrição no banco...');
            const { error: insertError } = await supabase
                .from('push_subscriptions')
                .insert([{
                    member_id: memberId,
                    subscription: subscriptionJSON,
                }]);

            if (insertError) {
                console.error('[Push] Erro ao salvar subscrição:', insertError);
                return false;
            }

            console.log('[Push] ✅ Subscrição salva no banco com sucesso!');
            return true;
        }

        return false;
    } catch (error) {
        console.error('[Push] Falha ao inscrever o usuário:', error);
        return false;
    }
};

// Test function to send a test push notification
export const sendTestPush = async (memberId: string): Promise<string> => {
    try {
        console.log('[Push Test] Enviando push de teste para membro:', memberId);
        const { data, error } = await supabase.functions.invoke('send-push', {
            body: {
                memberId,
                title: 'Teste de Notificação 🧪',
                message: 'Se você viu isso, as notificações estão funcionando!',
                url: '/'
            }
        });

        if (error) {
            console.error('[Push Test] Erro:', error);
            return `Erro: ${error.message}`;
        }

        console.log('[Push Test] Resposta:', data);
        return `Resultado: ${JSON.stringify(data)}`;
    } catch (e: any) {
        console.error('[Push Test] Exceção:', e);
        return `Exceção: ${e.message}`;
    }
};
