'use client';

import { useEffect } from 'react';
import { registerServiceWorker } from '../utils/pushNotifications';
import { requestFCMToken } from '../utils/firebaseMessaging';

export default function ServiceWorkerRegister() {
    useEffect(() => {
        if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
            registerServiceWorker().then(() => {
                // If notification permission was already granted previously, ensure token is refreshed and synced with backend
                if ('Notification' in window && Notification.permission === 'granted') {
                    const isEnabled = localStorage.getItem('notifications_enabled') !== 'false';
                    const hasToken = localStorage.getItem('token');
                    if (isEnabled && hasToken) {
                        requestFCMToken().catch(() => {});
                    }
                }
            });
        }
    }, []);

    return null;
}
