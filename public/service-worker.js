// Minimal Service Worker to enable PWA installability
self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
    // Simple pass-through for now to ensure online functionality is robust
    // This satisfies the PWA requirement for a fetch handler
    event.respondWith(fetch(event.request));
});

// --- Web Push Notifications ---
self.addEventListener('push', (event) => {
    if (event.data) {
        try {
            const data = event.data.json();
            const title = data.title || 'Casa de Oxóssi';
            const options = {
                body: data.message || data.body || 'Você tem uma nova notificação',
                icon: '/pwa-icon.png',
                badge: '/pwa-icon.png', // You may want a small monochromatic icon here later
                data: data.url || '/',
                vibrate: [200, 100, 200],
            };
            event.waitUntil(self.registration.showNotification(title, options));
        } catch (e) {
            // Fallback for plain text
            event.waitUntil(
                self.registration.showNotification('Casa de Oxóssi', {
                    body: event.data.text(),
                    icon: '/pwa-icon.png',
                })
            );
        }
    }
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    const urlToOpen = new URL(event.notification.data || '/', self.location.origin).href;

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
            let matchingClient = null;
            for (let i = 0; i < windowClients.length; i++) {
                const windowClient = windowClients[i];
                if (windowClient.url === urlToOpen) {
                    matchingClient = windowClient;
                    break;
                }
            }

            if (matchingClient) {
                return matchingClient.focus();
            } else {
                return clients.openWindow(urlToOpen);
            }
        })
    );
});
