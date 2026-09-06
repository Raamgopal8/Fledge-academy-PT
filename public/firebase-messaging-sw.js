importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

const firebaseConfig = {
    apiKey: new URL(location).searchParams.get('apiKey') || '',
    authDomain: new URL(location).searchParams.get('authDomain') || '',
    projectId: new URL(location).searchParams.get('projectId') || 'fledgeportal',
    storageBucket: new URL(location).searchParams.get('storageBucket') || 'fledgeportal.appspot.com',
    messagingSenderId: new URL(location).searchParams.get('messagingSenderId') || '844515198625',
    appId: new URL(location).searchParams.get('appId') || ''
};

try {
    firebase.initializeApp(firebaseConfig);
    const messaging = firebase.messaging();

    messaging.onBackgroundMessage((payload) => {
        console.log('[firebase-messaging-sw.js] Received background message:', payload);

        const notificationTitle = payload.notification?.title || payload.data?.title || 'Fledge Academy';
        const notificationOptions = {
            body: payload.notification?.body || payload.data?.body || payload.data?.message || 'New update available on your portal.',
            icon: payload.notification?.icon || payload.data?.icon || '/icon-192.png',
            badge: '/icon-192.png',
            tag: payload.data?.tag || payload.data?.id || 'fledge-fcm-alert',
            vibrate: [200, 100, 200],
            renotify: true,
            requireInteraction: true,
            data: {
                url: payload.data?.link || payload.data?.url || payload.fcmOptions?.link || '/dashboard',
                timestamp: Date.now()
            },
            actions: [
                { action: 'open', title: 'Open' },
                { action: 'close', title: 'Dismiss' }
            ]
        };

        return self.registration.showNotification(notificationTitle, notificationOptions);
    });
} catch (err) {
    console.warn('[firebase-messaging-sw.js] Firebase initialization notice:', err);
}

self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    if (event.action === 'close') {
        return;
    }

    const targetUrl = (event.notification.data && event.notification.data.url) 
        ? event.notification.data.url 
        : '/dashboard';

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
            // If already open, focus it and navigate
            for (let client of windowClients) {
                if (client.url.includes(self.location.origin) && 'focus' in client) {
                    client.focus();
                    if ('navigate' in client && targetUrl) {
                        return client.navigate(targetUrl);
                    }
                    return;
                }
            }
            // Otherwise open a new window
            if (clients.openWindow) {
                return clients.openWindow(targetUrl);
            }
        })
    );
});
