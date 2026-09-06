'use client';

import { useEffect } from 'react';
import { registerServiceWorker } from '../utils/pushNotifications';
import { requestFCMToken } from '../utils/firebaseMessaging';

export default function ServiceWorkerRegister() {
    useEffect(() => {
        if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

        registerServiceWorker().then(() => {
            const hasToken = localStorage.getItem('token');
            const isEnabled = localStorage.getItem('notifications_enabled') !== 'false';
            if (!hasToken || !isEnabled || !('Notification' in window)) return;

            if (Notification.permission === 'granted') {
                requestFCMToken().catch(() => {});
            } else if (Notification.permission === 'default') {
                // Request permission upon first user interaction to satisfy Android user-gesture requirement
                const handleFirstInteraction = async () => {
                    window.removeEventListener('click', handleFirstInteraction);
                    window.removeEventListener('touchstart', handleFirstInteraction);
                    try {
                        await requestFCMToken();
                    } catch (e) {}
                };

                window.addEventListener('click', handleFirstInteraction, { once: true });
                window.addEventListener('touchstart', handleFirstInteraction, { once: true });

                // Also attempt after delay if installed as PWA standalone app
                setTimeout(() => {
                    if (window.matchMedia('(display-mode: standalone)').matches) {
                        requestFCMToken().catch(() => {});
                    }
                }, 2500);
            }
        });
    }, []);

    return null;
}
