// Utility for Service Worker & Web Push Notifications Registration

// Convert Base64 URL safe VAPID key to Uint8Array
function urlBase64ToUint8Array(base64String) {
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
}

export async function registerServiceWorker() {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
        return null;
    }

    try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
            scope: '/'
        });
        return registration;
    } catch (err) {
        console.warn('Service Worker registration failed:', err);
        return null;
    }
}

export async function subscribeToPushNotifications() {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window)) {
        console.warn('Push messaging is not supported in this browser.');
        return { success: false, reason: 'unsupported' };
    }

    try {
        // 1. Request Notification Permission
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
            return { success: false, reason: 'permission_denied' };
        }

        // 2. Register / Get Service Worker
        let registration = await navigator.serviceWorker.ready;
        if (!registration) {
            registration = await registerServiceWorker();
        }
        if (!registration) {
            return { success: false, reason: 'sw_failed' };
        }

        // 3. Get existing subscription or create new
        let subscription = await registration.pushManager.getSubscription();

        const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

        if (!subscription && vapidPublicKey) {
            const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);
            subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: convertedVapidKey
            });
        }

        // 4. Send subscription token to backend if available
        if (subscription) {
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    const apiBase = process.env.NEXT_PUBLIC_API_URL || '';
                    await fetch(`${apiBase}/api/notifications/subscribe`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify(subscription)
                    });
                } catch (e) {
                    console.warn('Could not sync push token with backend:', e);
                }
            }
            return { success: true, subscription };
        }

        return { success: true, permission: 'granted' };
    } catch (err) {
        console.warn('Error subscribing to push notifications:', err);
        return { success: false, error: err.message };
    }
}

export async function unsubscribeFromPushNotifications() {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
        return;
    }

    try {
        const registration = await navigator.serviceWorker.ready;
        if (registration) {
            const subscription = await registration.pushManager.getSubscription();
            if (subscription) {
                await subscription.unsubscribe();
            }
        }
    } catch (err) {
        console.warn('Error unsubscribing:', err);
    }
}
