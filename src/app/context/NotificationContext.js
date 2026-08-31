'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const NotificationContext = createContext(null);

const DAYS_MAP = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// Helper to parse start time from strings like "09:00 AM - 10:30 AM" or "14:30" or "2:00 PM"
function parseClassStartTime(timeStr) {
    if (!timeStr || typeof timeStr !== 'string') return null;
    try {
        const match = timeStr.match(/(\d{1,2}):(\d{2})(?:\s*(AM|PM))?/i);
        if (!match) return null;
        let hours = parseInt(match[1], 10);
        const minutes = parseInt(match[2], 10);
        const meridiem = match[3] ? match[3].toUpperCase() : null;

        if (meridiem === 'PM' && hours < 12) hours += 12;
        if (meridiem === 'AM' && hours === 12) hours = 0;

        const target = new Date();
        target.setHours(hours, minutes, 0, 0);
        return target;
    } catch (e) {
        return null;
    }
}

export function NotificationProvider({ children }) {
    const [notifications, setNotifications] = useState([]);
    const [activePopup, setActivePopup] = useState(null);
    const [isTrayOpen, setIsTrayOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);

    // Audio chime using standard Web Audio API
    const playNotificationChime = useCallback(() => {
        try {
            if (typeof window === 'undefined') return;
            const isEnabled = localStorage.getItem('notifications_enabled') !== 'false';
            if (!isEnabled) return;

            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (!AudioContext) return;
            const ctx = new AudioContext();
            
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            
            osc.type = 'sine';
            osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
            osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5
            
            gain.gain.setValueAtTime(0.08, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
            
            osc.connect(gain);
            gain.connect(ctx.destination);
            
            osc.start();
            osc.stop(ctx.currentTime + 0.35);
        } catch (e) {
            // Audio context policy might require user gesture first
        }
    }, []);

    // Sync notification preference with profile settings
    const checkNotificationPreference = useCallback(async () => {
        if (typeof window === 'undefined') return;
        
        // 1. Initial check from localStorage
        const localPref = localStorage.getItem('notifications_enabled');
        if (localPref !== null) {
            setNotificationsEnabled(localPref === 'true');
        }

        // 2. Fetch from user profile API
        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            const apiBase = process.env.NEXT_PUBLIC_API_URL || '';
            const res = await fetch(`${apiBase}/api/user/profile`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const profileData = await res.json();
                const enabled = profileData.preferences?.notifications !== false;
                setNotificationsEnabled(enabled);
                localStorage.setItem('notifications_enabled', enabled ? 'true' : 'false');
                if (!enabled) {
                    setActivePopup(null);
                }
            }
        } catch (err) {}
    }, []);

    const fetchAllNotifications = useCallback(async () => {
        if (typeof window === 'undefined') return;
        const token = localStorage.getItem('token');
        if (!token) return;

        const isEnabled = localStorage.getItem('notifications_enabled') !== 'false';
        if (!isEnabled) {
            setNotifications([]);
            setUnreadCount(0);
            setActivePopup(null);
            return;
        }

        let role = 'student';
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            role = (payload.role || '').toLowerCase();
        } catch (e) {}

        const userLevel = localStorage.getItem('level') || 'Level 5';
        const userBatch = localStorage.getItem('batch') || '';
        const dismissedKey = 'fledge_dismissed_notifications_v1';
        let dismissed = [];
        try {
            dismissed = JSON.parse(localStorage.getItem(dismissedKey) || '[]');
        } catch (e) {}

        const collected = [];
        const now = new Date();

        // 1. Fetch Announcements
        try {
            const annApiBase = process.env.NEXT_PUBLIC_ANNOUNCEMENT_API_URL || '';
            const res = await fetch(`${annApiBase}/api/announcement?level=${encodeURIComponent(userLevel)}&batch=${encodeURIComponent(userBatch)}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const announcements = await res.json();
                announcements.slice(0, 3).forEach(ann => {
                    const annDate = new Date(ann.created_at || now);
                    const diffHours = (now - annDate) / (1000 * 60 * 60);
                    if (diffHours <= 168) { // 7 days
                        const id = `ann-${ann.id || ann._id || annDate.getTime()}`;
                        collected.push({
                            id,
                            type: 'announcement',
                            title: ann.title || 'New Announcement',
                            message: ann.content ? (ann.content.length > 90 ? ann.content.substring(0, 90) + '...' : ann.content) : 'New update posted in the announcement channel.',
                            timestamp: annDate,
                            timeAgo: diffHours < 1 ? 'Just now' : (diffHours < 24 ? `${Math.floor(diffHours)}h ago` : `${Math.floor(diffHours / 24)}d ago`),
                            link: role === 'ceo' ? '/ceo/announcements' : (role === 'staff' ? '/staff/announcements' : '/dashboard/announcements'),
                            icon: 'campaign',
                            badgeColor: 'bg-purple-100 text-purple-800 border-purple-200',
                            accentColor: 'from-purple-500 to-indigo-600',
                            priority: 'normal'
                        });
                    }
                });
            }
        } catch (err) {}

        // 2. Fetch Tests & Deadlines
        try {
            const testApiBase = process.env.NEXT_PUBLIC_TEST_API_URL || '';
            const queryParams = new URLSearchParams();
            if (userLevel) queryParams.append('level', userLevel);
            if (userBatch) queryParams.append('batch', userBatch);

            const res = await fetch(`${testApiBase}/api/tests?${queryParams.toString()}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const tests = await res.json();
                tests.forEach(test => {
                    if (test.due_date) {
                        const dueDate = new Date(test.due_date);
                        const diffHours = (dueDate - now) / (1000 * 60 * 60);
                        const id = `test-${test.id || test._id}`;

                        if (diffHours > 0 && diffHours <= 48) {
                            collected.push({
                                id,
                                type: 'test_deadline',
                                title: diffHours <= 12 ? '🚨 Urgent Test Deadline!' : '⏰ Upcoming Test Deadline',
                                message: `"${test.title}" is due ${diffHours < 24 ? `in ${Math.max(1, Math.round(diffHours))} hours` : 'tomorrow'} (${dueDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`,
                                timestamp: dueDate,
                                timeAgo: `Due ${dueDate.toLocaleDateString([], { month: 'short', day: 'numeric' })}`,
                                link: role === 'ceo' ? '/ceo/tests' : (role === 'staff' ? '/staff/tests' : '/dashboard/tests'),
                                icon: 'assignment_late',
                                badgeColor: diffHours <= 12 ? 'bg-red-100 text-red-800 border-red-200' : 'bg-amber-100 text-amber-800 border-amber-200',
                                accentColor: diffHours <= 12 ? 'from-red-500 to-rose-600' : 'from-amber-500 to-orange-600',
                                priority: diffHours <= 12 ? 'high' : 'normal'
                            });
                        } else if (diffHours < 0 && diffHours >= -48) {
                            collected.push({
                                id,
                                type: 'test_deadline',
                                title: '⚠️ Test Overdue',
                                message: `"${test.title}" deadline has passed. Submit your answers if submissions are still open.`,
                                timestamp: dueDate,
                                timeAgo: 'Past due',
                                link: role === 'ceo' ? '/ceo/tests' : (role === 'staff' ? '/staff/tests' : '/dashboard/tests'),
                                icon: 'error',
                                badgeColor: 'bg-red-100 text-red-800 border-red-200',
                                accentColor: 'from-red-600 to-rose-700',
                                priority: 'high'
                            });
                        }
                    }
                });
            }
        } catch (err) {}

        // 3. Fetch Schedule (New Class Creation & 30-Minute Upcoming Class Reminder)
        try {
            const apiBase = process.env.NEXT_PUBLIC_API_URL || '';
            const res = await fetch(`${apiBase}/api/schedule?level=${encodeURIComponent(userLevel)}&batch=${encodeURIComponent(userBatch)}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const schedules = await res.json();
                const todayDayName = DAYS_MAP[now.getDay()];
                const tomorrowDayName = DAYS_MAP[(now.getDay() + 1) % 7];

                schedules.forEach(item => {
                    const schedId = item.id || item._id;

                    // A. Newly Created Class Alert (created in last 48 hours)
                    if (item.created_at) {
                        const createdDate = new Date(item.created_at);
                        const createdDiffHours = (now - createdDate) / (1000 * 60 * 60);
                        if (createdDiffHours <= 48) {
                            collected.push({
                                id: `sched-new-${schedId}`,
                                type: 'class_new',
                                title: '✨ New Class Scheduled!',
                                message: `"${item.name}" has been added for ${item.day_of_week} (${item.time}) by your instructor.`,
                                timestamp: createdDate,
                                timeAgo: createdDiffHours < 1 ? 'Just added' : `${Math.floor(createdDiffHours)}h ago`,
                                link: role === 'ceo' ? '/ceo/schedule' : (role === 'staff' ? '/staff/schedule' : '/dashboard/schedule'),
                                icon: 'add_circle',
                                badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300 font-bold',
                                accentColor: 'from-emerald-500 to-teal-600',
                                priority: 'high'
                            });
                        }
                    }

                    // B. Today's Classes: 30-Minute Countdown Reminder & Starting Now
                    if (item.day_of_week === todayDayName) {
                        const classStartTime = parseClassStartTime(item.time);
                        if (classStartTime) {
                            const diffMinutes = (classStartTime - now) / (1000 * 60);

                            if (diffMinutes > 0 && diffMinutes <= 30) {
                                // ⏰ 30-MINUTE REMINDER
                                const minsLeft = Math.max(1, Math.round(diffMinutes));
                                collected.push({
                                    id: `sched-30min-${schedId}-${now.toDateString()}-${Math.floor(diffMinutes / 10)}`,
                                    type: 'class_reminder',
                                    title: `⏰ Class in ${minsLeft} minute${minsLeft > 1 ? 's' : ''}!`,
                                    message: `"${item.name}" starts at ${item.time}${item.location ? ` • ${item.location}` : ''}. Get ready to join!`,
                                    timestamp: classStartTime,
                                    timeAgo: `In ${minsLeft}m`,
                                    link: item.class_link || (role === 'ceo' ? '/ceo/schedule' : (role === 'staff' ? '/staff/schedule' : '/dashboard/schedule')),
                                    icon: 'alarm',
                                    badgeColor: 'bg-amber-100 text-amber-900 border-amber-300 font-bold',
                                    accentColor: 'from-amber-500 to-rose-600',
                                    priority: 'urgent'
                                });
                            } else if (diffMinutes <= 0 && diffMinutes >= -30) {
                                // 🟢 CLASS STARTING NOW / IN PROGRESS
                                collected.push({
                                    id: `sched-live-${schedId}-${now.toDateString()}`,
                                    type: 'class_day',
                                    title: '🟢 Class Starting Now!',
                                    message: `"${item.name}" is starting now (${item.time}). Click to join or view session details.`,
                                    timestamp: now,
                                    timeAgo: 'Now',
                                    link: item.class_link || (role === 'ceo' ? '/ceo/schedule' : (role === 'staff' ? '/staff/schedule' : '/dashboard/schedule')),
                                    icon: 'play_circle',
                                    badgeColor: 'bg-emerald-100 text-emerald-900 border-emerald-300 font-bold',
                                    accentColor: 'from-emerald-500 to-teal-600',
                                    priority: 'high'
                                });
                            } else if (diffMinutes > 30) {
                                // Later today
                                collected.push({
                                    id: `sched-today-${schedId}-${todayDayName}`,
                                    type: 'class_day',
                                    title: '🎓 Class Scheduled Today',
                                    message: `${item.name} (${item.time || 'Today'}) ${item.location ? `• ${item.location}` : ''}`,
                                    timestamp: now,
                                    timeAgo: 'Today',
                                    link: role === 'ceo' ? '/ceo/schedule' : (role === 'staff' ? '/staff/schedule' : '/dashboard/schedule'),
                                    icon: 'calendar_month',
                                    badgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
                                    accentColor: 'from-blue-500 to-indigo-600',
                                    priority: 'high'
                                });
                            }
                        } else {
                            // Fallback if time couldn't be parsed
                            collected.push({
                                id: `sched-today-${schedId}-${todayDayName}`,
                                type: 'class_day',
                                title: '🎓 Class Scheduled Today',
                                message: `${item.name} (${item.time || 'Today'}) ${item.location ? `• ${item.location}` : ''}`,
                                timestamp: now,
                                timeAgo: 'Today',
                                link: role === 'ceo' ? '/ceo/schedule' : (role === 'staff' ? '/staff/schedule' : '/dashboard/schedule'),
                                icon: 'calendar_month',
                                badgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
                                accentColor: 'from-blue-500 to-indigo-600',
                                priority: 'high'
                            });
                        }
                    }

                    // C. Classes Scheduled Tomorrow (if no classes today)
                    if (item.day_of_week === tomorrowDayName) {
                        const hasToday = schedules.some(s => s.day_of_week === todayDayName);
                        if (!hasToday) {
                            collected.push({
                                id: `sched-tmrw-${schedId}-${tomorrowDayName}`,
                                type: 'class_day',
                                title: '📅 Class Scheduled Tomorrow',
                                message: `${item.name} (${item.time || tomorrowDayName}) ${item.location ? `• ${item.location}` : ''}`,
                                timestamp: now,
                                timeAgo: 'Tomorrow',
                                link: role === 'ceo' ? '/ceo/schedule' : (role === 'staff' ? '/staff/schedule' : '/dashboard/schedule'),
                                icon: 'event',
                                badgeColor: 'bg-sky-100 text-sky-800 border-sky-200',
                                accentColor: 'from-sky-500 to-blue-600',
                                priority: 'normal'
                            });
                        }
                    }
                });
            }
        } catch (err) {}

        // Calculate unread count and filter out explicitly cleared items
        const clearedKey = 'fledge_cleared_notifications_v1';
        let cleared = [];
        try {
            cleared = JSON.parse(localStorage.getItem(clearedKey) || '[]');
        } catch (e) {}

        const activeItems = collected.filter(item => !cleared.includes(item.id));
        const unreadItems = activeItems.filter(item => !dismissed.includes(item.id));
        setNotifications(activeItems);
        setUnreadCount(unreadItems.length);
    }, []);

    useEffect(() => {
        checkNotificationPreference();
        fetchAllNotifications();

        const handlePrefChange = (e) => {
            const enabled = e.detail?.enabled !== false;
            setNotificationsEnabled(enabled);
            if (!enabled) {
                setActivePopup(null);
                setNotifications([]);
                setUnreadCount(0);
            } else {
                fetchAllNotifications();
            }
        };

        const handleNewClassCreated = (e) => {
            fetchAllNotifications();
        };

        window.addEventListener('fledge_notification_preference_changed', handlePrefChange);
        window.addEventListener('fledge_new_class_created', handleNewClassCreated);

        // Check for 30-minute reminders and notifications every 60 seconds
        const interval = setInterval(fetchAllNotifications, 60000);
        return () => {
            clearInterval(interval);
            window.removeEventListener('fledge_notification_preference_changed', handlePrefChange);
            window.removeEventListener('fledge_new_class_created', handleNewClassCreated);
        };
    }, [checkNotificationPreference, fetchAllNotifications]);

    const [isRefreshing, setIsRefreshing] = useState(false);

    const dismissPopup = () => {
        if (activePopup) {
            markAsDismissed(activePopup.id);
        }
        setActivePopup(null);
    };

    const markAsDismissed = (id) => {
        try {
            const dismissedKey = 'fledge_dismissed_notifications_v1';
            const dismissed = JSON.parse(localStorage.getItem(dismissedKey) || '[]');
            if (!dismissed.includes(id)) {
                dismissed.push(id);
                localStorage.setItem(dismissedKey, JSON.stringify(dismissed));
            }
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (e) {}
    };

    const clearSingleNotification = (id) => {
        try {
            const clearedKey = 'fledge_cleared_notifications_v1';
            const cleared = JSON.parse(localStorage.getItem(clearedKey) || '[]');
            if (!cleared.includes(id)) {
                cleared.push(id);
                localStorage.setItem(clearedKey, JSON.stringify(cleared));
            }
            setNotifications(prev => prev.filter(n => n.id !== id));
            setUnreadCount(prev => Math.max(0, prev - 1));
            if (activePopup?.id === id) {
                setActivePopup(null);
            }
        } catch (e) {}
    };

    const clearAllNotifications = () => {
        try {
            const clearedKey = 'fledge_cleared_notifications_v1';
            const allCurrentIds = notifications.map(n => n.id);
            const existingCleared = JSON.parse(localStorage.getItem(clearedKey) || '[]');
            const updatedCleared = Array.from(new Set([...existingCleared, ...allCurrentIds]));
            
            localStorage.setItem(clearedKey, JSON.stringify(updatedCleared));
            setNotifications([]);
            setUnreadCount(0);
            setActivePopup(null);
        } catch (e) {}
    };

    const markAllAsRead = () => {
        try {
            const dismissedKey = 'fledge_dismissed_notifications_v1';
            const allIds = notifications.map(n => n.id);
            localStorage.setItem(dismissedKey, JSON.stringify(allIds));
            setUnreadCount(0);
            setActivePopup(null);
        } catch (e) {}
    };

    const resyncAndRefresh = async () => {
        setIsRefreshing(true);
        // Clear the cleared list on manual user resync so any fresh or existing active alerts reappear
        try {
            localStorage.removeItem('fledge_cleared_notifications_v1');
            localStorage.removeItem('fledge_dismissed_notifications_v1');
        } catch (e) {}
        await fetchAllNotifications();
        setTimeout(() => setIsRefreshing(false), 500);
    };

    return (
        <NotificationContext.Provider value={{
            notifications,
            unreadCount,
            activePopup,
            isTrayOpen,
            setIsTrayOpen,
            isRefreshing,
            dismissPopup,
            markAsDismissed,
            clearSingleNotification,
            clearAllNotifications,
            markAllAsRead,
            refreshNotifications: resyncAndRefresh,
            setActivePopup,
            notificationsEnabled,
            setNotificationsEnabled
        }}>
            {children}
        </NotificationContext.Provider>
    );
}

export function useNotifications() {
    const context = useContext(NotificationContext);
    if (!context) {
        return {
            notifications: [],
            unreadCount: 0,
            activePopup: null,
            isTrayOpen: false,
            setIsTrayOpen: () => {},
            isRefreshing: false,
            dismissPopup: () => {},
            markAsDismissed: () => {},
            clearSingleNotification: () => {},
            clearAllNotifications: () => {},
            markAllAsRead: () => {},
            refreshNotifications: () => {},
            setActivePopup: () => {},
            notificationsEnabled: true,
            setNotificationsEnabled: () => {}
        };
    }
    return context;
}
