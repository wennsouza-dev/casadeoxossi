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
