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
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [userRole, setUserRole] = useState('student');

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
        } catch (e) {}
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
                if (profileData.role) {
                    setUserRole(profileData.role.toLowerCase());
                }
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
        let currentUserId = '';
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            role = (payload.role || '').toLowerCase();
            currentUserId = payload.user_id || payload.id || payload.sub || '';
        } catch (e) {}

        setUserRole(role);

        const userLevel = localStorage.getItem('level') || 'Level 5';
        const userBatch = localStorage.getItem('batch') || '';
        const dismissedKey = `fledge_dismissed_${role}_v2`;
        const clearedKey = `fledge_cleared_${role}_v2`;
        
        let dismissed = [];
        let cleared = [];
        try {
            dismissed = JSON.parse(localStorage.getItem(dismissedKey) || '[]');
            cleared = JSON.parse(localStorage.getItem(clearedKey) || '[]');
        } catch (e) {}

        const collected = [];
        const now = new Date();
        const headers = { 'Authorization': `Bearer ${token}` };

        const apiBase = process.env.NEXT_PUBLIC_API_URL || '';
        const annApiBase = process.env.NEXT_PUBLIC_ANNOUNCEMENT_API_URL || '';
        const testApiBase = process.env.NEXT_PUBLIC_TEST_API_URL || '';
        const materialsApiBase = process.env.NEXT_PUBLIC_MATERIALS_API_URL || '';
        const communityApiBase = process.env.NEXT_PUBLIC_COMMUNITY_API_URL || '';
        const videoApiBase = process.env.NEXT_PUBLIC_VIDEO_API_URL || '';

        // Fetch authoritative permanently cleared IDs from backend
        try {
            const clearedRes = await fetch(`${apiBase}/api/notifications/cleared-ids`, { headers });
            if (clearedRes.ok) {
                const serverCleared = await clearedRes.json();
                if (Array.isArray(serverCleared) && serverCleared.length > 0) {
                    cleared = Array.from(new Set([...cleared, ...serverCleared]));
                    try {
                        localStorage.setItem(clearedKey, JSON.stringify(cleared));
                    } catch (e) {}
                }
            }
        } catch (e) {}

        // 0. PERSISTENT DB & REDIS NOTIFICATIONS PIPELINE
        try {
            const res = await fetch(`${apiBase}/api/notifications`, { headers });
            if (res.ok) {
                const dbNotifs = await res.json();
                if (Array.isArray(dbNotifs)) {
                    dbNotifs.forEach(dn => {
                        const notifId = dn.id || dn._id;
                        if (!notifId || cleared.includes(notifId)) return;
                        const notifDate = dn.created_at ? new Date(dn.created_at) : now;
                        const diffHours = (now - notifDate) / (1000 * 60 * 60);
                        const isRead = dn.read || dismissed.includes(notifId);

                        let badgeColor = 'bg-primary/10 text-primary border-primary/20';
                        let icon = 'notifications';
                        let link = dn.link || (role === 'student' ? '/dashboard' : ((role === 'staff' || role === 'sensi') ? '/sensi/dashboard' : '/admin/dashboard'));

                        if (dn.type === 'fee_pending') {
                            badgeColor = 'bg-error/15 text-error border-error/30';
                            icon = 'payments';
                            link = '/dashboard';
                        } else if (dn.type === 'test_created' || dn.type === 'test_report' || dn.type === 'test_submission') {
                            badgeColor = 'bg-emerald-100 text-emerald-800 border-emerald-300';
                            icon = 'assignment';
                        } else if (dn.type === 'community_message') {
                            badgeColor = 'bg-purple-100 text-purple-800 border-purple-300';
                            icon = 'forum';
                        }

                        collected.push({
                            id: notifId,
                            isDbRecord: true,
                            type: dn.type || 'general',
                            title: dn.title,
                            message: dn.message,
                            timestamp: notifDate,
                            timeAgo: diffHours < 1 ? 'Just now' : (diffHours < 24 ? `${Math.floor(diffHours)}h ago` : `${Math.floor(diffHours / 24)}d ago`),
                            link,
                            icon,
                            badgeColor,
                            priority: dn.type === 'fee_pending' ? 'high' : 'normal',
                            isRead
                        });
                    });
                }
            }
        } catch (err) {}

        // ==========================================
        // 1. ADMIN NOTIFICATION PIPELINE
        // Requirements: New test reports, New community chat messages
        // ==========================================
        if ((role === 'ceo' || role === 'admin') || role === 'admin') {
            // A. New Test Reports (Completed student submissions)
            try {
                const res = await fetch(`${testApiBase}/api/tests/submissions/all`, { headers });
                if (res.ok) {
                    const submissions = await res.json();
                    submissions.slice(0, 15).forEach(sub => {
                        const subDate = new Date(sub.submitted_at || now);
                        const diffHours = (now - subDate) / (1000 * 60 * 60);
                        if (diffHours <= 168) { // last 7 days
                            const id = `admin-test-rep-${sub.id || sub._id || subDate.getTime()}`;
                            const studentName = sub.student_name || 'Student';
                            const scoreText = sub.score !== undefined ? `${sub.score}/${sub.total_points || 100}` : 'Submitted';
                            collected.push({
                                id,
                                type: 'test_report',
                                title: `📊 Test Report: ${studentName}`,
                                message: `${studentName} completed "${sub.test_title || 'Class Test'}" with score ${scoreText}.`,
                                timestamp: subDate,
                                timeAgo: diffHours < 1 ? 'Just now' : (diffHours < 24 ? `${Math.floor(diffHours)}h ago` : `${Math.floor(diffHours / 24)}d ago`),
                                link: '/admin/tests',
                                icon: 'assessment',
                                badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
                                accentColor: 'from-emerald-500 to-teal-600',
                                priority: 'normal'
                            });
                        }
                    });
                }
            } catch (err) {}

            // B. New Community Chat Messages
            try {
                const res = await fetch(`${communityApiBase}/api/community/messages`, { headers });
                if (res.ok) {
                    const messages = await res.json();
                    messages.slice(-15).reverse().forEach(msg => {
                        // Exclude CEO's own messages
                        const isSelf = msg.author_id === currentUserId || (msg.role || '').toLowerCase() === 'ceo';
                        if (!isSelf) {
                            const msgDate = new Date(msg.created_at || now);
                            const diffHours = (now - msgDate) / (1000 * 60 * 60);
                            if (diffHours <= 72) { // last 3 days
                                const id = `admin-comm-msg-${msg.id || msg._id || msgDate.getTime()}`;
                                collected.push({
                                    id,
                                    type: 'community_message',
                                    title: `💬 ${msg.author_name || 'Community Member'}`,
                                    message: msg.content ? (msg.content.length > 90 ? msg.content.substring(0, 90) + '...' : msg.content) : 'Sent an audio voice message in Community.',
                                    timestamp: msgDate,
                                    timeAgo: diffHours < 1 ? 'Just now' : (diffHours < 24 ? `${Math.floor(diffHours)}h ago` : `${Math.floor(diffHours / 24)}d ago`),
                                    link: '/admin/community',
                                    icon: 'forum',
                                    badgeColor: 'bg-blue-100 text-blue-800 border-blue-300',
                                    accentColor: 'from-blue-500 to-indigo-600',
                                    priority: 'normal'
                                });
                            }
                        }
                    });
                }
            } catch (err) {}
        }

        // ==========================================
        // 2. STUDENT NOTIFICATION PIPELINE
        // Requirements:
        // - Class schedule created & upcoming
        // - New test created
        // - New materials posted
        // - New CEO announcement chat posted
        // - New community chat messages
        // - New video posted
        // ==========================================
        else if (role === 'student') {
            // A. Class Schedule Created & Upcoming
            try {
                const res = await fetch(`${apiBase}/api/schedule?level=${encodeURIComponent(userLevel)}&batch=${encodeURIComponent(userBatch)}`, { headers });
                if (res.ok) {
                    const schedules = await res.json();
                    const todayDayName = DAYS_MAP[now.getDay()];
                    const tomorrowDayName = DAYS_MAP[(now.getDay() + 1) % 7];

                    schedules.forEach(item => {
                        const schedId = item.id || item._id;

                        // 1. Newly created class alert (last 48h)
                        if (item.created_at) {
                            const createdDate = new Date(item.created_at);
                            const createdDiffHours = (now - createdDate) / (1000 * 60 * 60);
                            if (createdDiffHours <= 48) {
                                collected.push({
                                    id: `stud-sched-new-${schedId}`,
                                    type: 'class_schedule',
                                    title: '✨ New Class Scheduled!',
                                    message: `"${item.name}" has been scheduled for ${item.day_of_week} (${item.time}) by your instructor.`,
                                    timestamp: createdDate,
                                    timeAgo: createdDiffHours < 1 ? 'Just added' : `${Math.floor(createdDiffHours)}h ago`,
                                    link: '/dashboard/schedule',
                                    icon: 'add_circle',
                                    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300 font-bold',
                                    accentColor: 'from-emerald-500 to-teal-600',
                                    priority: 'high'
                                });
                            }
                        }

                        // 2. Upcoming class countdown (≤30 minutes) & Today's classes
                        if (item.day_of_week === todayDayName) {
                            const classStartTime = parseClassStartTime(item.time);
                            if (classStartTime) {
                                const diffMinutes = Math.round((classStartTime - now) / (1000 * 60));
                                if (diffMinutes >= 0 && diffMinutes <= 30) {
                                    collected.push({
                                        id: `stud-class-reminder-${schedId}-${todayDayName}`,
                                        type: 'class_schedule',
                                        title: diffMinutes === 0 ? '🔴 Class Starting Right Now!' : `🔔 Class Starting in ${diffMinutes} Mins!`,
                                        message: `"${item.name}" begins at ${item.time}. Join via link or report to ${item.location || 'classroom'}.`,
                                        timestamp: now,
                                        timeAgo: diffMinutes === 0 ? 'Now' : `In ${diffMinutes}m`,
                                        link: item.class_link || '/dashboard/schedule',
                                        icon: 'alarm',
                                        badgeColor: 'bg-rose-100 text-rose-800 border-rose-300 font-bold animate-pulse',
                                        accentColor: 'from-rose-500 to-red-600',
                                        priority: 'urgent',
                                        actionText: item.class_link ? 'Join Class Now' : 'View Schedule'
                                    });
                                } else {
                                    collected.push({
                                        id: `stud-sched-today-${schedId}-${todayDayName}`,
                                        type: 'class_schedule',
                                        title: '🎓 Class Scheduled Today',
                                        message: `${item.name} at ${item.time || 'Today'} ${item.location ? `• ${item.location}` : ''}`,
                                        timestamp: now,
                                        timeAgo: 'Today',
                                        link: '/dashboard/schedule',
                                        icon: 'calendar_month',
                                        badgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
                                        accentColor: 'from-blue-500 to-indigo-600',
                                        priority: 'high'
                                    });
                                }
                            } else {
                                collected.push({
                                    id: `stud-sched-today-${schedId}-${todayDayName}`,
                                    type: 'class_schedule',
                                    title: '🎓 Class Scheduled Today',
                                    message: `${item.name} (${item.time || 'Today'}) ${item.location ? `• ${item.location}` : ''}`,
                                    timestamp: now,
                                    timeAgo: 'Today',
                                    link: '/dashboard/schedule',
                                    icon: 'calendar_month',
                                    badgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
                                    accentColor: 'from-blue-500 to-indigo-600',
                                    priority: 'high'
                                });
                            }
                        }

                        // 3. Classes tomorrow (if no class today)
                        if (item.day_of_week === tomorrowDayName) {
                            const hasToday = schedules.some(s => s.day_of_week === todayDayName);
                            if (!hasToday) {
                                collected.push({
                                    id: `stud-sched-tmrw-${schedId}-${tomorrowDayName}`,
                                    type: 'class_schedule',
                                    title: '📅 Class Scheduled Tomorrow',
                                    message: `${item.name} (${item.time || tomorrowDayName}) ${item.location ? `• ${item.location}` : ''}`,
                                    timestamp: now,
                                    timeAgo: 'Tomorrow',
                                    link: '/dashboard/schedule',
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

            // B. New Test Created & Deadlines
            try {
                const queryParams = new URLSearchParams();
                if (userLevel) queryParams.append('level', userLevel);
                if (userBatch) queryParams.append('batch', userBatch);

                const res = await fetch(`${testApiBase}/api/tests?${queryParams.toString()}`, { headers });
                if (res.ok) {
                    const tests = await res.json();
                    tests.forEach(test => {
                        const testId = test.id || test._id;
                        if (test.created_at) {
                            const createdDate = new Date(test.created_at);
                            const diffHours = (now - createdDate) / (1000 * 60 * 60);
                            if (diffHours <= 72) {
                                collected.push({
                                    id: `stud-test-new-${testId}`,
                                    type: 'test_created',
                                    title: '📝 New Test Assigned!',
                                    message: `"${test.title}" has been published. Due: ${test.due_date ? new Date(test.due_date).toLocaleDateString([], { month: 'short', day: 'numeric' }) : 'Soon'}.`,
                                    timestamp: createdDate,
                                    timeAgo: diffHours < 1 ? 'Just now' : `${Math.floor(diffHours)}h ago`,
                                    link: '/dashboard/tests',
                                    icon: 'assignment',
                                    badgeColor: 'bg-amber-100 text-amber-800 border-amber-300 font-bold',
                                    accentColor: 'from-amber-500 to-orange-600',
                                    priority: 'high'
                                });
                            }
                        }

                        const isAlreadySubmitted = test.has_submitted || (test.submission && test.submission.status !== 'Need Work' && test.submission.status !== 'Needs Work' && test.submission.status !== 'Failed');
                        if (test.due_date && !isAlreadySubmitted) {
                            const dueDate = new Date(test.due_date);
                            const diffHours = (dueDate - now) / (1000 * 60 * 60);
                            if (diffHours > 0 && diffHours <= 48) {
                                collected.push({
                                    id: `stud-test-due-${testId}`,
                                    type: 'test_created',
                                    title: diffHours <= 12 ? '🚨 Urgent Test Deadline!' : '⏰ Upcoming Test Deadline',
                                    message: `"${test.title}" is due ${diffHours < 24 ? `in ${Math.max(1, Math.round(diffHours))} hours` : 'tomorrow'} (${dueDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`,
                                    timestamp: dueDate,
                                    timeAgo: `Due ${dueDate.toLocaleDateString([], { month: 'short', day: 'numeric' })}`,
                                    link: '/dashboard/tests',
                                    icon: 'assignment_late',
                                    badgeColor: diffHours <= 12 ? 'bg-red-100 text-red-800 border-red-200' : 'bg-amber-100 text-amber-800 border-amber-200',
                                    accentColor: diffHours <= 12 ? 'from-red-500 to-rose-600' : 'from-amber-500 to-orange-600',
                                    priority: diffHours <= 12 ? 'high' : 'normal'
                                });
                            }
                        }
                    });
                }
            } catch (err) {}

            // C. New Materials Posted
            try {
                const queryParams = new URLSearchParams();
                if (userLevel) queryParams.append('level', userLevel);
                if (userBatch) queryParams.append('batch', userBatch);

                const res = await fetch(`${materialsApiBase}/api/materials/?${queryParams.toString()}`, { headers });
                if (res.ok) {
                    const materials = await res.json();
                    materials.slice(0, 10).forEach(mat => {
                        const matDate = new Date(mat.created_at || now);
                        const diffHours = (now - matDate) / (1000 * 60 * 60);
                        if (diffHours <= 168) { // last 7 days
                            const id = `stud-mat-${mat.id || mat._id || matDate.getTime()}`;
                            collected.push({
                                id,
                                type: 'material_new',
                                title: '📚 New Study Material Posted',
                                message: `"${mat.title}" (${mat.category || mat.file_type || 'Study Notes'}) is available for download.`,
                                timestamp: matDate,
                                timeAgo: diffHours < 1 ? 'Just now' : (diffHours < 24 ? `${Math.floor(diffHours)}h ago` : `${Math.floor(diffHours / 24)}d ago`),
                                link: '/dashboard/materials',
                                icon: 'menu_book',
                                badgeColor: 'bg-teal-100 text-teal-800 border-teal-300 font-bold',
                                accentColor: 'from-teal-500 to-emerald-600',
                                priority: 'normal'
                            });
                        }
                    });
                }
            } catch (err) {}

            // D. New CEO Announcement Chat Posted
            try {
                const res = await fetch(`${annApiBase}/api/announcement?level=${encodeURIComponent(userLevel)}&batch=${encodeURIComponent(userBatch)}`, { headers });
                if (res.ok) {
                    const announcements = await res.json();
                    announcements.slice(0, 5).forEach(ann => {
                        const annDate = new Date(ann.created_at || now);
                        const diffHours = (now - annDate) / (1000 * 60 * 60);
                        if (diffHours <= 168) {
                            const id = `stud-ann-${ann.id || ann._id || annDate.getTime()}`;
                            collected.push({
                                id,
                                type: 'announcement',
                                title: `📢 ${ann.title || 'Official Announcement'}`,
                                message: ann.content ? (ann.content.length > 90 ? ann.content.substring(0, 90) + '...' : ann.content) : 'New announcement posted by Admin.',
                                timestamp: annDate,
                                timeAgo: diffHours < 1 ? 'Just now' : (diffHours < 24 ? `${Math.floor(diffHours)}h ago` : `${Math.floor(diffHours / 24)}d ago`),
                                link: '/dashboard/announcements',
                                icon: 'campaign',
                                badgeColor: 'bg-purple-100 text-purple-800 border-purple-300',
                                accentColor: 'from-purple-500 to-indigo-600',
                                priority: 'normal'
                            });
                        }
                    });
                }
            } catch (err) {}

            // E. New Community Chat Messages
            try {
                const res = await fetch(`${communityApiBase}/api/community/messages?level=${encodeURIComponent(userLevel)}&batch=${encodeURIComponent(userBatch)}`, { headers });
                if (res.ok) {
                    const messages = await res.json();
                    messages.slice(-15).reverse().forEach(msg => {
                        if (msg.author_id !== currentUserId) {
                            const msgDate = new Date(msg.created_at || now);
                            const diffHours = (now - msgDate) / (1000 * 60 * 60);
                            if (diffHours <= 72) {
                                const id = `stud-comm-msg-${msg.id || msg._id || msgDate.getTime()}`;
                                collected.push({
                                    id,
                                    type: 'community_message',
                                    title: `💬 ${msg.author_name || 'Classmate'}`,
                                    message: msg.content ? (msg.content.length > 90 ? msg.content.substring(0, 90) + '...' : msg.content) : 'Sent a voice/audio message in Community.',
                                    timestamp: msgDate,
                                    timeAgo: diffHours < 1 ? 'Just now' : (diffHours < 24 ? `${Math.floor(diffHours)}h ago` : `${Math.floor(diffHours / 24)}d ago`),
                                    link: '/community',
                                    icon: 'forum',
                                    badgeColor: 'bg-blue-100 text-blue-800 border-blue-300',
                                    accentColor: 'from-blue-500 to-indigo-600',
                                    priority: 'normal'
                                });
                            }
                        }
                    });
                }
            } catch (err) {}

            // F. New Video Posted
            try {
                const res = await fetch(`${videoApiBase}/api/videos?level=${encodeURIComponent(userLevel)}&batch=${encodeURIComponent(userBatch)}`, { headers });
                if (res.ok) {
                    const videos = await res.json();
                    videos.slice(0, 10).forEach(vid => {
                        const vidDate = new Date(vid.created_at || now);
                        const diffHours = (now - vidDate) / (1000 * 60 * 60);
                        if (diffHours <= 168) {
                            const id = `stud-vid-${vid.id || vid._id || vidDate.getTime()}`;
                            collected.push({
                                id,
                                type: 'video_new',
                                title: '🎥 New Video Lesson Posted',
                                message: `"${vid.title}" (${vid.category || 'Lecture'}) has been added to your Video Library.`,
                                timestamp: vidDate,
                                timeAgo: diffHours < 1 ? 'Just now' : (diffHours < 24 ? `${Math.floor(diffHours)}h ago` : `${Math.floor(diffHours / 24)}d ago`),
                                link: '/dashboard/videos',
                                icon: 'smart_display',
                                badgeColor: 'bg-rose-100 text-rose-800 border-rose-300 font-bold',
                                accentColor: 'from-rose-500 to-pink-600',
                                priority: 'normal'
                            });
                        }
                    });
                }
            } catch (err) {}

            // G. Pending Fee Reminders from CEO
            try {
                const res = await fetch(`${apiBase}/api/finance/student/reminders`, { headers });
                if (res.ok) {
                    const reminders = await res.json();
                    reminders.slice(0, 10).forEach(rem => {
                        const remDate = new Date(rem.created_at || now);
                        const diffHours = (now - remDate) / (1000 * 60 * 60);
                        if (diffHours <= 336) { // last 14 days
                            const id = `stud-fee-rem-${rem.id || rem._id || remDate.getTime()}`;
                            collected.push({
                                id,
                                type: 'fee_pending',
                                title: '💰 Pending Fee Reminder from Admin',
                                message: rem.message || `Pending Fee Balance: ₹${rem.pending_amount || 0}. Total Fee: ₹${rem.total_fee || 0}, Paid: ₹${rem.paid_amount || 0}. Please clear the remaining balance.`,
                                timestamp: remDate,
                                timeAgo: diffHours < 1 ? 'Just now' : (diffHours < 24 ? `${Math.floor(diffHours)}h ago` : `${Math.floor(diffHours / 24)}d ago`),
                                link: '/dashboard',
                                icon: 'payments',
                                badgeColor: 'bg-rose-100 text-rose-800 border-rose-300 font-bold animate-pulse',
                                accentColor: 'from-rose-500 to-red-600',
                                priority: 'urgent'
                            });
                        }
                    });
                }
            } catch (err) {}
        }

        // ==========================================
        // 3. SENSI NOTIFICATION PIPELINE
        // Requirements:
        // - New CEO announcement chat
        // - New students test completed
        // - Upcoming class schedule
        // - New community chat message
        // - New student notes posted
        // ==========================================
        else if ((role === 'staff' || role === 'sensi')) {
            // A. New CEO Announcement Chat
            try {
                const res = await fetch(`${annApiBase}/api/announcement`, { headers });
                if (res.ok) {
                    const announcements = await res.json();
                    announcements.slice(0, 5).forEach(ann => {
                        const annDate = new Date(ann.created_at || now);
                        const diffHours = (now - annDate) / (1000 * 60 * 60);
                        if (diffHours <= 168) {
                            const id = `sensi-ann-${ann.id || ann._id || annDate.getTime()}`;
                            collected.push({
                                id,
                                type: 'announcement',
                                title: `📢 Admin Announcement: ${ann.title || 'Official Update'}`,
                                message: ann.content ? (ann.content.length > 90 ? ann.content.substring(0, 90) + '...' : ann.content) : 'New announcement posted by Admin.',
                                timestamp: annDate,
                                timeAgo: diffHours < 1 ? 'Just now' : (diffHours < 24 ? `${Math.floor(diffHours)}h ago` : `${Math.floor(diffHours / 24)}d ago`),
                                link: '/sensi/announcements',
                                icon: 'campaign',
                                badgeColor: 'bg-purple-100 text-purple-800 border-purple-300',
                                accentColor: 'from-purple-500 to-indigo-600',
                                priority: 'normal'
                            });
                        }
                    });
                }
            } catch (err) {}

            // B. New Students Test Completed
            try {
                const res = await fetch(`${testApiBase}/api/tests/submissions/all`, { headers });
                if (res.ok) {
                    const submissions = await res.json();
                    submissions.slice(0, 15).forEach(sub => {
                        const subDate = new Date(sub.submitted_at || now);
                        const diffHours = (now - subDate) / (1000 * 60 * 60);
                        if (diffHours <= 168) {
                            const id = `sensi-test-sub-${sub.id || sub._id || subDate.getTime()}`;
                            const studentName = sub.student_name || 'Student';
                            collected.push({
                                id,
                                type: 'test_submission',
                                title: `✍️ Student Test Completed: ${studentName}`,
                                message: `${studentName} finished "${sub.test_title || 'Assessment'}". Review or grade their answers.`,
                                timestamp: subDate,
                                timeAgo: diffHours < 1 ? 'Just now' : (diffHours < 24 ? `${Math.floor(diffHours)}h ago` : `${Math.floor(diffHours / 24)}d ago`),
                                link: '/sensi/tests',
                                icon: 'rate_review',
                                badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-300 font-bold',
                                accentColor: 'from-indigo-500 to-blue-600',
                                priority: 'high'
                            });
                        }
                    });
                }
            } catch (err) {}

            // C. Upcoming Class Schedule
            try {
                const res = await fetch(`${apiBase}/api/schedule`, { headers });
                if (res.ok) {
                    const schedules = await res.json();
                    const todayDayName = DAYS_MAP[now.getDay()];

                    schedules.forEach(item => {
                        const schedId = item.id || item._id;
                        if (item.day_of_week === todayDayName) {
                            const classStartTime = parseClassStartTime(item.time);
                            if (classStartTime) {
                                const diffMinutes = Math.round((classStartTime - now) / (1000 * 60));
                                if (diffMinutes >= 0 && diffMinutes <= 30) {
                                    collected.push({
                                        id: `sensi-class-reminder-${schedId}-${todayDayName}`,
                                        type: 'class_schedule',
                                        title: diffMinutes === 0 ? '🔴 Teaching Class Starting Now!' : `🔔 Class Starts in ${diffMinutes} Mins!`,
                                        message: `"${item.name}" begins at ${item.time}. Classroom: ${item.location || 'Online'}.`,
                                        timestamp: now,
                                        timeAgo: diffMinutes === 0 ? 'Now' : `In ${diffMinutes}m`,
                                        link: item.class_link || '/sensi/schedule',
                                        icon: 'alarm',
                                        badgeColor: 'bg-rose-100 text-rose-800 border-rose-300 font-bold animate-pulse',
                                        accentColor: 'from-rose-500 to-red-600',
                                        priority: 'urgent'
                                    });
                                } else {
                                    collected.push({
                                        id: `sensi-sched-today-${schedId}-${todayDayName}`,
                                        type: 'class_schedule',
                                        title: '🎓 Class Scheduled Today',
                                        message: `${item.name} at ${item.time || 'Today'} ${item.location ? `• ${item.location}` : ''}`,
                                        timestamp: now,
                                        timeAgo: 'Today',
                                        link: '/sensi/schedule',
                                        icon: 'calendar_month',
                                        badgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
                                        accentColor: 'from-blue-500 to-indigo-600',
                                        priority: 'normal'
                                    });
                                }
                            }
                        }
                    });
                }
            } catch (err) {}

            // D. New Community Chat Messages
            try {
                const res = await fetch(`${communityApiBase}/api/community/messages`, { headers });
                if (res.ok) {
                    const messages = await res.json();
                    messages.slice(-15).reverse().forEach(msg => {
                        if (msg.author_id !== currentUserId) {
                            const msgDate = new Date(msg.created_at || now);
                            const diffHours = (now - msgDate) / (1000 * 60 * 60);
                            if (diffHours <= 72) {
                                const id = `sensi-comm-msg-${msg.id || msg._id || msgDate.getTime()}`;
                                collected.push({
                                    id,
                                    type: 'community_message',
                                    title: `💬 Community: ${msg.author_name || 'Student'}`,
                                    message: msg.content ? (msg.content.length > 90 ? msg.content.substring(0, 90) + '...' : msg.content) : 'Sent a voice/audio message in Community.',
                                    timestamp: msgDate,
                                    timeAgo: diffHours < 1 ? 'Just now' : (diffHours < 24 ? `${Math.floor(diffHours)}h ago` : `${Math.floor(diffHours / 24)}d ago`),
                                    link: '/sensi/community',
                                    icon: 'forum',
                                    badgeColor: 'bg-blue-100 text-blue-800 border-blue-300',
                                    accentColor: 'from-blue-500 to-indigo-600',
                                    priority: 'normal'
                                });
                            }
                        }
                    });
                }
            } catch (err) {}

            // E. New Student Notes Posted
            try {
                const res = await fetch(`${apiBase}/api/student-notes`, { headers });
                if (res.ok) {
                    const notes = await res.json();
                    notes.slice(0, 10).forEach(note => {
                        const noteDate = new Date(note.created_at || now);
                        const diffHours = (now - noteDate) / (1000 * 60 * 60);
                        if (diffHours <= 168) {
                            const id = `sensi-note-${note.id || note._id || noteDate.getTime()}`;
                            const studentName = note.uploader_name || 'Student';
                            collected.push({
                                id,
                                type: 'student_note_new',
                                title: `📝 Student Notes Uploaded: ${studentName}`,
                                message: `${studentName} uploaded "${note.title || 'Study Notes'}" for ${note.level || ''} ${note.batch || ''}.`,
                                timestamp: noteDate,
                                timeAgo: diffHours < 1 ? 'Just now' : (diffHours < 24 ? `${Math.floor(diffHours)}h ago` : `${Math.floor(diffHours / 24)}d ago`),
                                link: '/sensi/dashboard',
                                icon: 'edit_note',
                                badgeColor: 'bg-teal-100 text-teal-800 border-teal-300 font-bold',
                                accentColor: 'from-teal-500 to-emerald-600',
                                priority: 'normal'
                            });
                        }
                    });
                }
            } catch (err) {}
        }

        // Filter out cleared and dismissed
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

        const handleNewClassCreated = () => {
            fetchAllNotifications();
        };

        window.addEventListener('fledge_notification_preference_changed', handlePrefChange);
        window.addEventListener('fledge_new_class_created', handleNewClassCreated);

        // Auto-refresh interval every 60s
        const interval = setInterval(fetchAllNotifications, 60000);
        return () => {
            clearInterval(interval);
            window.removeEventListener('fledge_notification_preference_changed', handlePrefChange);
            window.removeEventListener('fledge_new_class_created', handleNewClassCreated);
        };
    }, [checkNotificationPreference, fetchAllNotifications]);

    const dismissPopup = () => {
        if (activePopup) {
            markAsDismissed(activePopup.id);
        }
        setActivePopup(null);
    };

    const markAsDismissed = (id) => {
        try {
            const dismissedKey = `fledge_dismissed_${userRole}_v2`;
            const dismissed = JSON.parse(localStorage.getItem(dismissedKey) || '[]');
            if (!dismissed.includes(id)) {
                dismissed.push(id);
                localStorage.setItem(dismissedKey, JSON.stringify(dismissed));
            }
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));

            const token = localStorage.getItem('token');
            if (token) {
                const apiBase = process.env.NEXT_PUBLIC_API_URL || '';
                fetch(`${apiBase}/api/notifications/${id}/read`, {
                    method: 'PATCH',
                    headers: { 'Authorization': `Bearer ${token}` }
                }).catch(() => {});
            }
        } catch (e) {}
    };

    const clearSingleNotification = (id) => {
        try {
            const clearedKey = `fledge_cleared_${userRole}_v2`;
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

            const token = localStorage.getItem('token');
            if (token) {
                const apiBase = process.env.NEXT_PUBLIC_API_URL || '';
                fetch(`${apiBase}/api/notifications/${id}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` }
                }).catch(() => {});
            }
        } catch (e) {}
    };

    const clearAllNotifications = () => {
        try {
            const clearedKey = `fledge_cleared_${userRole}_v2`;
            const allCurrentIds = notifications.map(n => n.id);
            const existingCleared = JSON.parse(localStorage.getItem(clearedKey) || '[]');
            const updatedCleared = Array.from(new Set([...existingCleared, ...allCurrentIds]));
            
            localStorage.setItem(clearedKey, JSON.stringify(updatedCleared));
            setNotifications([]);
            setUnreadCount(0);
            setActivePopup(null);

            const token = localStorage.getItem('token');
            if (token) {
                const apiBase = process.env.NEXT_PUBLIC_API_URL || '';
                fetch(`${apiBase}/api/notifications/clear-all`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` }
                }).catch(() => {});
            }
        } catch (e) {}
    };

    const markAllAsRead = () => {
        try {
            const dismissedKey = `fledge_dismissed_${userRole}_v2`;
            const allIds = notifications.map(n => n.id);
            localStorage.setItem(dismissedKey, JSON.stringify(allIds));
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            setUnreadCount(0);
            setActivePopup(null);

            const token = localStorage.getItem('token');
            if (token) {
                const apiBase = process.env.NEXT_PUBLIC_API_URL || '';
                fetch(`${apiBase}/api/notifications/read-all`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` }
                }).catch(() => {});
            }
        } catch (e) {}
    };

    const [resyncFeedback, setResyncFeedback] = useState(null);

    const resyncAndRefresh = async () => {
        setIsRefreshing(true);
        setResyncFeedback(null);
        const countBefore = notifications.length;

        await fetchAllNotifications();

        setTimeout(() => {
            setIsRefreshing(false);
            setResyncFeedback('No new notifications arrived');
            setTimeout(() => {
                setResyncFeedback(null);
            }, 3500);
        }, 500);
    };

    return (
        <NotificationContext.Provider value={{
            notifications,
            unreadCount,
            activePopup,
            isTrayOpen,
            setIsTrayOpen,
            isRefreshing,
            resyncFeedback,
            userRole,
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
            resyncFeedback: null,
            userRole: 'student',
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
