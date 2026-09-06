// Client-Side Firebase Cloud Messaging (FCM) Utility
// Supports Web & Mobile PWA Real-time Push Notifications

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging';

export const DEFAULT_FIREBASE_VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

export function getFirebaseApp() {
    if (typeof window === 'undefined') return null;

    if (!getApps().length) {
        if (!firebaseConfig.apiKey && !firebaseConfig.projectId) {
            console.warn('[FCM] Firebase config is missing API key or Project ID.');
        }
        return initializeApp(firebaseConfig);
    }
    return getApp();
}

export async function getFirebaseMessaging() {
    if (typeof window === 'undefined') return null;

    try {
        const supported = await isSupported();
        if (!supported) {
            console.warn('[FCM] Firebase Messaging is not supported in this browser environment.');
            return null;
        }

        const app = getFirebaseApp();
        if (!app) return null;

        return getMessaging(app);
    } catch (err) {
        console.warn('[FCM] Error initializing Firebase Messaging:', err);
        return null;
    }
}

/**
 * Sends device FCM token to the backend server to associate with the current user.
 */
export async function syncFCMTokenWithBackend(fcmToken) {
    if (!fcmToken || typeof window === 'undefined') return;

    const authToken = localStorage.getItem('token');
    if (!authToken) return;

    const apiBase = process.env.NEXT_PUBLIC_API_URL || '';
    const endpoints = [
        `${apiBase}/api/notifications/fcm-token`,
        `${apiBase}/api/notifications/subscribe`
    ];

    for (const url of endpoints) {
        try {
            const res = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify({
                    token: fcmToken,
                    device_type: /Mobi|Android|iPhone/i.test(navigator.userAgent) ? 'mobile' : 'desktop',
                    user_agent: navigator.userAgent,
                    updated_at: new Date().toISOString()
                })
            });
            if (res.ok) {
                break;
            }
        } catch (err) {
            // Silently continue to next endpoint
        }
    }
}

/**
 * Requests Notification permission and retrieves the FCM registration token.
 * Registers /firebase-messaging-sw.js if not already registered.
 */
export async function requestFCMToken() {
    if (typeof window === 'undefined') {
        return { success: false, reason: 'server_side' };
    }

    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
        return { success: false, reason: 'unsupported' };
    }

    try {
        // 1. Request user permission
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
            return { success: false, reason: 'permission_denied' };
        }

        // 2. Register or get Firebase Messaging Service Worker
        let swRegistration = null;
        try {
            swRegistration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
                scope: '/'
            });
            await navigator.serviceWorker.ready;
        } catch (swErr) {
            console.warn('[FCM] Could not register /firebase-messaging-sw.js, trying default sw:', swErr);
            swRegistration = await navigator.serviceWorker.ready;
        }

        // 3. Initialize Firebase Messaging
        const messaging = await getFirebaseMessaging();
        if (!messaging) {
            return { success: false, reason: 'messaging_not_supported' };
        }

        // 4. Retrieve FCM Token
        const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY || process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || DEFAULT_FIREBASE_VAPID_KEY;
        const tokenOptions = {
            serviceWorkerRegistration: swRegistration
        };
        if (vapidKey) {
            tokenOptions.vapidKey = vapidKey;
        }

        const currentToken = await getToken(messaging, tokenOptions);

        if (currentToken) {
            localStorage.setItem('fledge_fcm_token', currentToken);
            localStorage.setItem('notifications_enabled', 'true');
            
            // Sync token with backend database
            await syncFCMTokenWithBackend(currentToken);

            return { success: true, token: currentToken };
        } else {
            console.warn('[FCM] No registration token available. Request permission to generate one.');
            return { success: false, reason: 'no_token_generated' };
        }
    } catch (err) {
        console.error('[FCM] An error occurred while retrieving token:', err);
        return { success: false, error: err.message };
    }
}

/**
 * Sets up a listener for real-time messages received while the application is in the foreground.
 * Calls `onMessageCallback({ title, body, icon, link, data })`.
 */
export function setupFCMForegroundListener(onMessageCallback) {
    if (typeof window === 'undefined') return () => {};

    let unsubscribe = () => {};

    getFirebaseMessaging().then((messaging) => {
        if (!messaging) return;

        try {
            unsubscribe = onMessage(messaging, (payload) => {
                console.log('[FCM] Foreground push message received:', payload);

                const notificationData = {
                    title: payload.notification?.title || payload.data?.title || 'Fledge Academy Alert',
                    body: payload.notification?.body || payload.data?.body || payload.data?.message || 'New update available.',
                    icon: payload.notification?.icon || payload.data?.icon || '/icon-192.png',
                    link: payload.data?.link || payload.data?.url || payload.fcmOptions?.link || '/dashboard',
                    id: payload.data?.id || `fcm-${Date.now()}`,
                    type: payload.data?.type || 'push',
                    timestamp: new Date()
                };

                if (typeof onMessageCallback === 'function') {
                    onMessageCallback(notificationData, payload);
                }
            });
        } catch (err) {
            console.warn('[FCM] Error attaching foreground onMessage listener:', err);
        }
    });

    return () => {
        try {
            unsubscribe();
        } catch (e) {}
    };
}

/**
 * Removes the FCM token when user logs out or disables notifications.
 */
export async function removeFCMToken() {
    if (typeof window === 'undefined') return;

    const fcmToken = localStorage.getItem('fledge_fcm_token');
    const authToken = localStorage.getItem('token');

    if (fcmToken && authToken) {
        try {
            const apiBase = process.env.NEXT_PUBLIC_API_URL || '';
            await fetch(`${apiBase}/api/notifications/fcm-token/remove`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify({ token: fcmToken })
            });
        } catch (e) {}
    }

    localStorage.removeItem('fledge_fcm_token');
}
