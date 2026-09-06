// Utility for Service Worker & Web Push Notifications Registration
import { requestFCMToken, removeFCMToken, DEFAULT_FIREBASE_VAPID_KEY } from './firebaseMessaging';

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
        // Register default PWA service worker
        const registration = await navigator.serviceWorker.register('/sw.js', {
            scope: '/'
        });

        // Also register Firebase Messaging service worker if supported
        try {
            await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
                scope: '/'
            });
        } catch (fcmSwErr) {
            // Non-blocking if firebase sw registration fails
        }

        return registration;
    } catch (err) {
        console.warn('Service Worker registration failed:', err);
        return null;
    }
}

export async function subscribeToPushNotifications() {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
        console.warn('Push messaging is not supported in this browser.');
        return { success: false, reason: 'unsupported' };
    }

    try {
        // 1. Request Notification Permission
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
            return { success: false, reason: 'permission_denied' };
        }

        // 2. Primary: Try Firebase Cloud Messaging (FCM)
        try {
            const fcmResult = await requestFCMToken();
            if (fcmResult && fcmResult.success) {
                return { success: true, method: 'fcm', token: fcmResult.token };
            }
        } catch (fcmErr) {
            console.warn('[Push] FCM subscription skipped or encountered error, falling back to WebPush:', fcmErr);
        }

        // 3. Fallback: Standard Web Push with PushManager
        if (!('PushManager' in window)) {
            return { success: true, permission: 'granted' };
        }

        let registration = await navigator.serviceWorker.ready;
        if (!registration) {
            registration = await registerServiceWorker();
        }
        if (!registration) {
            return { success: false, reason: 'sw_failed' };
        }

        let subscription = await registration.pushManager.getSubscription();
        const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY || DEFAULT_FIREBASE_VAPID_KEY;

        if (!subscription && vapidPublicKey) {
            const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);
            subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: convertedVapidKey
            });
        }

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
            return { success: true, method: 'webpush', subscription };
        }

        return { success: true, permission: 'granted' };
    } catch (err) {
        console.warn('Error subscribing to push notifications:', err);
        return { success: false, error: err.message };
    }
}

export async function unsubscribeFromPushNotifications() {
    if (typeof window === 'undefined') {
        return;
    }

    try {
        // Clean up FCM token
        await removeFCMToken();

        // Clean up Web Push subscription
        if ('serviceWorker' in navigator) {
            const registration = await navigator.serviceWorker.ready;
            if (registration && registration.pushManager) {
                const subscription = await registration.pushManager.getSubscription();
                if (subscription) {
                    await subscription.unsubscribe();
                }
            }
        }
    } catch (err) {
        console.warn('Error unsubscribing:', err);
    }
}
