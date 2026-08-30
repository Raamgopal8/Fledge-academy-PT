'use client';

import React from 'react';
import { useNotifications } from '../context/NotificationContext';

export default function NotificationBell({ className = '' }) {
    const { unreadCount, setIsTrayOpen, notificationsEnabled } = useNotifications();

    if (!notificationsEnabled) return null;

    return (
        <button
            type="button"
            onClick={() => setIsTrayOpen(true)}
            className={`relative p-2 rounded-full hover:bg-white/10 text-white transition-all flex items-center justify-center cursor-pointer active:scale-95 ${className}`}
            title="Notifications (Test Deadlines, Classes, Announcements)"
            aria-label="Open Notifications"
        >
            <span className="material-symbols-outlined text-[22px]">notifications</span>
            
            {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-600 text-white text-[10px] font-black flex items-center justify-center shadow-lg border-2 border-white/80 animate-pulse">
                    {unreadCount > 9 ? '9+' : unreadCount}
                </span>
            )}
        </button>
    );
}
