'use client';

import { useEffect } from 'react';
import { registerServiceWorker } from '../utils/pushNotifications';

export default function ServiceWorkerRegister() {
    useEffect(() => {
        if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
            registerServiceWorker();
        }
    }, []);

    return null;
}
