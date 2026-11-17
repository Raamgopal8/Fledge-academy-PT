'use client';

import { useState, useEffect, useRef } from 'react';

export default function NetworkStatus() {
  const [status, setStatus] = useState('online'); // 'online' | 'offline' | 'slow'
  const [showToast, setShowToast] = useState(false);
  const hideTimerRef = useRef(null);
  const wasOfflineOrSlow = useRef(false);

  useEffect(() => {
    let isMounted = true;

    const triggerNotification = (newStatus, autoHide = false) => {
      setStatus(newStatus);
      setShowToast(true);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
      if (autoHide) {
        hideTimerRef.current = setTimeout(() => {
          if (isMounted) setShowToast(false);
        }, 4000);
      }
    };

    // Ping check: actively verifies actual internet reachability
    const checkActualReachability = async () => {
      // If browser already reports offline, no need to ping
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        wasOfflineOrSlow.current = true;
        triggerNotification('offline', false);
        return;
      }

      const startTime = Date.now();
      try {
        // Fast HEAD request to a reliable public endpoint with cache-busting
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000);

        const res = await fetch(`https://www.gstatic.com/generate_204?t=${Date.now()}`, {
          method: 'HEAD',
          mode: 'no-cors',
          cache: 'no-store',
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
        const latency = Date.now() - startTime;

        if (!isMounted) return;

        // Check if latency is high (slow network)
        const connection = typeof navigator !== 'undefined' && (navigator.connection || navigator.mozConnection || navigator.webkitConnection);
        const isNetworkSlow = (connection && (['slow-2g', '2g'].includes(connection.effectiveType) || (connection.downlink && connection.downlink < 0.5))) || latency > 2000;

        if (isNetworkSlow) {
          wasOfflineOrSlow.current = true;
          triggerNotification('slow', true);
        } else if (wasOfflineOrSlow.current) {
          wasOfflineOrSlow.current = false;
          triggerNotification('online', true);
        } else {
          setShowToast(false);
        }
      } catch (err) {
        if (!isMounted) return;
        // Request aborted or failed => genuinely offline
        wasOfflineOrSlow.current = true;
        triggerNotification('offline', false);
      }
    };

    // Initial check on mount
    checkActualReachability();

    // Browser event listeners
    const handleOnline = () => {
      checkActualReachability();
    };

    const handleOffline = () => {
      wasOfflineOrSlow.current = true;
      triggerNotification('offline', false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const connection = typeof navigator !== 'undefined' && (navigator.connection || navigator.mozConnection || navigator.webkitConnection);
    if (connection) {
      connection.addEventListener('change', checkActualReachability);
    }

    // Periodic check every 15 seconds
    const intervalId = setInterval(checkActualReachability, 15000);

    return () => {
      isMounted = false;
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (connection) {
        connection.removeEventListener('change', checkActualReachability);
      }
      clearInterval(intervalId);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, []);

  if (!showToast) return null;

  const config = {
    offline: {
      bg: 'bg-red-600 dark:bg-red-700',
      icon: 'wifi_off',
      title: 'You are offline',
      desc: 'No internet connection detected. Please check your network.',
      animate: 'animate-pulse',
    },
    slow: {
      bg: 'bg-amber-600 dark:bg-amber-700',
      icon: 'network_check',
      title: 'Slow Internet Connection',
      desc: 'Your connection is experiencing high latency or low speed.',
      animate: '',
    },
    online: {
      bg: 'bg-emerald-600 dark:bg-emerald-700',
      icon: 'wifi',
      title: 'Back online',
      desc: 'Your internet connection has been restored.',
      animate: '',
    },
  }[status];

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[9999] flex items-center gap-3 px-4 py-2 transition-all duration-300 max-w-[90vw] w-full pointer-events-auto"
    >
      <div className={`flex items-center gap-3 w-full rounded-2xl ${config.bg} px-4 py-3 shadow-2xl text-white border border-white/15 backdrop-blur-md`}>
        <span className={`material-symbols-outlined text-2xl ${config.animate}`}>
          {config.icon}
        </span>
        <div className="flex-1 text-xs sm:text-sm">
          <div className="font-bold leading-tight">{config.title}</div>
          <div className="text-[11px] sm:text-xs opacity-90 leading-tight mt-0.5">{config.desc}</div>
        </div>
        {status !== 'offline' && (
          <button
            onClick={() => setShowToast(false)}
            className="p-1 rounded-lg hover:bg-white/20 transition-colors cursor-pointer"
            aria-label="Dismiss"
          >
            <span className="material-symbols-outlined text-base">close</span>
          </button>
        )}
      </div>
    </div>
  );
}