'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useNotifications } from '../context/NotificationContext';

export default function NotificationPopup() {
    const router = useRouter();
    const { 
        notifications, 
        unreadCount, 
        isTrayOpen, 
        setIsTrayOpen, 
        userRole,
        markAsDismissed, 
        clearSingleNotification,
        clearAllNotifications,
        markAllAsRead,
        refreshNotifications,
        isRefreshing,
        resyncFeedback
    } = useNotifications();

    const [activeTab, setActiveTab] = useState('all');

    const handleActionClick = (link, id) => {
        if (id) markAsDismissed(id);
        setIsTrayOpen(false);
        if (link) router.push(link);
    };

    // Build role-specific tabs
    const getTabsForRole = () => {
        if (userRole === 'ceo' || userRole === 'admin') {
            return [
                { id: 'all', label: 'All', count: notifications.length, icon: 'notifications' },
                { id: 'test_report', label: 'Test Reports', count: notifications.filter(n => n.type === 'test_report').length, icon: 'assessment' },
                { id: 'community_message', label: 'Community', count: notifications.filter(n => n.type === 'community_message').length, icon: 'forum' }
            ];
        }

        if (userRole === 'staff' || userRole === 'sensi') {
            return [
                { id: 'all', label: 'All', count: notifications.length, icon: 'notifications' },
                { id: 'announcement', label: 'Announcements', count: notifications.filter(n => n.type === 'announcement').length, icon: 'campaign' },
                { id: 'test_submission', label: 'Test Submissions', count: notifications.filter(n => n.type === 'test_submission').length, icon: 'rate_review' },
                { id: 'class_schedule', label: 'Classes', count: notifications.filter(n => n.type === 'class_schedule').length, icon: 'calendar_month' },
                { id: 'student_note_new', label: 'Student Notes', count: notifications.filter(n => n.type === 'student_note_new').length, icon: 'edit_note' },
                { id: 'community_message', label: 'Community', count: notifications.filter(n => n.type === 'community_message').length, icon: 'forum' }
            ];
        }

        // Default: Student
        return [
            { id: 'all', label: 'All', count: notifications.length, icon: 'notifications' },
            { id: 'fee_pending', label: 'Fees Due', count: notifications.filter(n => n.type === 'fee_pending').length, icon: 'payments' },
            { id: 'class_schedule', label: 'Classes', count: notifications.filter(n => n.type === 'class_schedule').length, icon: 'calendar_month' },
            { id: 'test_created', label: 'Tests', count: notifications.filter(n => n.type === 'test_created').length, icon: 'assignment' },
            { id: 'material_new', label: 'Materials', count: notifications.filter(n => n.type === 'material_new').length, icon: 'menu_book' },
            { id: 'announcement', label: 'Announcements', count: notifications.filter(n => n.type === 'announcement').length, icon: 'campaign' },
            { id: 'video_new', label: 'Videos', count: notifications.filter(n => n.type === 'video_new').length, icon: 'smart_display' },
            { id: 'community_message', label: 'Community', count: notifications.filter(n => n.type === 'community_message').length, icon: 'forum' }
        ];
    };

    const tabs = getTabsForRole();

    // Filter notifications by active tab
    const filteredNotifications = notifications.filter(n => {
        if (activeTab === 'all') return true;
        return n.type === activeTab;
    });

    const getBadgeLabel = (type) => {
        switch (type) {
            case 'fee_pending': return 'Fee Reminder';
            case 'test_report': return 'Test Report';
            case 'community_message': return 'Community';
            case 'class_schedule': return 'Class Schedule';
            case 'test_created': return 'Test';
            case 'material_new': return 'Material';
            case 'announcement': return 'Announcement';
            case 'video_new': return 'Video Lesson';
            case 'test_submission': return 'Test Completed';
            case 'student_note_new': return 'Student Notes';
            default: return 'Notification';
        }
    };

    const displayRole = (userRole === 'ceo' || userRole === 'admin') ? 'Admin' : (userRole === 'staff' || userRole === 'sensi') ? 'Sensi' : 'Student';

    return (
        <>
            {/* CENTERED NOTIFICATION CENTER MODAL (Opened on Bell Click) */}
            {isTrayOpen && (
                <div 
                    className="fixed inset-0 z-[100] flex items-center justify-center p-2.5 sm:p-4 bg-black/60 backdrop-blur-sm"
                    onClick={() => setIsTrayOpen(false)}
                >
                    <div 
                        role="dialog"
                        aria-modal="true"
                        className="relative w-full max-w-[560px] max-h-[90dvh] sm:max-h-[85vh] bg-surface-container-lowest dark:bg-slate-900 border border-outline-variant/80 shadow-2xl rounded-2xl sm:rounded-3xl flex flex-col overflow-hidden mx-auto"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="p-3.5 sm:p-5 bg-surface-container-low flex items-center justify-between border-b border-outline-variant/60 shrink-0">
                            <div className="flex items-center gap-2.5 sm:gap-3">
                                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-primary text-on-primary flex items-center justify-center font-bold shadow-xs shrink-0">
                                    <span className="material-symbols-outlined text-[20px] sm:text-[22px]">notifications</span>
                                </div>
                                <div className="min-w-0">
                                    <h3 className="font-bold text-sm sm:text-lg text-on-surface flex items-center gap-1.5 sm:gap-2">
                                        <span>Notifications</span>
                                        <span className="text-[10px] font-extrabold uppercase px-1.5 sm:px-2 py-0.2 rounded-md bg-primary/10 text-primary border border-primary/20 shrink-0">
                                            {displayRole}
                                        </span>
                                    </h3>
                                    <p className="text-[11px] sm:text-xs text-on-surface-variant truncate">
                                        {unreadCount > 0 ? `${unreadCount} unread alert${unreadCount > 1 ? 's' : ''}` : 'All caught up'}
                                    </p>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                                {notifications.length > 0 && (
                                    <>
                                        {unreadCount > 0 && (
                                            <button
                                                type="button"
                                                onClick={markAllAsRead}
                                                className="text-[11px] sm:text-xs font-bold text-primary hover:underline px-2 py-1 rounded-lg hover:bg-surface-container transition-colors cursor-pointer"
                                            >
                                                Mark read
                                            </button>
                                        )}
                                        <button
                                            type="button"
                                            onClick={clearAllNotifications}
                                            className="text-xs font-bold text-error hover:underline p-1.5 rounded-lg hover:bg-error/10 transition-colors cursor-pointer flex items-center justify-center"
                                            title="Clear all notifications"
                                        >
                                            <span className="material-symbols-outlined text-[16px] sm:text-[18px]">delete_sweep</span>
                                        </button>
                                    </>
                                )}
                                <button
                                    type="button"
                                    onClick={() => setIsTrayOpen(false)}
                                    className="w-8 h-8 sm:w-9 sm:h-9 rounded-full hover:bg-surface-container text-on-surface-variant flex items-center justify-center cursor-pointer transition-colors"
                                    title="Close"
                                >
                                    <span className="material-symbols-outlined text-[20px] sm:text-[22px]">close</span>
                                </button>
                            </div>
                        </div>

                        {/* Filter Tabs */}
                        <div className="flex items-center gap-1 sm:gap-1.5 p-2 sm:p-3 bg-surface-container-lowest border-b border-outline-variant/40 overflow-x-auto custom-scrollbar shrink-0">
                            {tabs.map(tab => (
                                <button
                                    key={tab.id}
                                    type="button"
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1 sm:gap-1.5 cursor-pointer shrink-0 ${
                                        activeTab === tab.id
                                            ? 'bg-primary text-on-primary shadow-xs font-bold'
                                            : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
                                    }`}
                                >
                                    <span className="material-symbols-outlined text-[14px] sm:text-[15px]">{tab.icon}</span>
                                    <span>{tab.label}</span>
                                    {tab.count > 0 && (
                                        <span className={`px-1.5 py-0.2 rounded-full text-[9px] sm:text-[10px] font-bold ${
                                            activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-surface-container-high text-on-surface-variant'
                                        }`}>
                                            {tab.count}
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>

                        {/* Resync Feedback Banner */}
                        {resyncFeedback && (
                            <div className="mx-3 sm:mx-4 mt-2.5 sm:mt-3 p-2 sm:p-2.5 rounded-xl sm:rounded-2xl bg-primary/10 border border-primary/20 text-primary text-[11px] sm:text-xs font-semibold flex items-center justify-center gap-1.5 shadow-xs shrink-0">
                                <span className="material-symbols-outlined text-[15px] sm:text-[16px]">check_circle</span>
                                <span>{resyncFeedback}</span>
                            </div>
                        )}

                        {/* Notification List */}
                        <div className="flex-1 overflow-y-auto p-2.5 sm:p-4 space-y-2.5 sm:space-y-3 custom-scrollbar">
                            {filteredNotifications.length === 0 ? (
                                <div className="flex flex-col items-center justify-center text-center py-16 sm:py-20 text-on-surface-variant">
                                    <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-surface-container-high flex items-center justify-center mb-2.5 sm:mb-3">
                                        <span className="material-symbols-outlined text-3xl sm:text-4xl text-outline">notifications_off</span>
                                    </div>
                                    <h4 className="font-bold text-xs sm:text-sm text-on-surface">No notifications</h4>
                                    <p className="text-[11px] sm:text-xs text-outline mt-0.5 max-w-[240px]">
                                        You're all caught up with your updates.
                                    </p>
                                </div>
                            ) : (
                                filteredNotifications.map(item => (
                                    <div
                                        key={item.id}
                                        className="bg-surface-container-lowest hover:bg-surface-container-low rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-outline-variant/60 shadow-xs transition-all flex items-start gap-2.5 sm:gap-3.5 group relative cursor-pointer hover:border-primary/40 overflow-hidden w-full"
                                        onClick={() => handleActionClick(item.link, item.id)}
                                    >
                                        {/* Icon Container */}
                                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-surface-container flex items-center justify-center shrink-0 shadow-xs mt-0.5 group-hover:scale-105 transition-transform">
                                            <span className="material-symbols-outlined text-[18px] sm:text-[22px] text-primary">
                                                {item.icon || 'notifications'}
                                            </span>
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0 pr-1 sm:pr-2 overflow-hidden">
                                            <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                                                <span className={`text-[8.5px] sm:text-[9px] font-bold px-1.5 sm:px-2 py-0.2 rounded-full border truncate ${item.badgeColor || 'bg-primary/10 text-primary border-primary/20'}`}>
                                                    {getBadgeLabel(item.type)}
                                                </span>
                                                <span className="text-[9.5px] sm:text-[10px] text-on-surface-variant font-medium">
                                                    {item.timeAgo}
                                                </span>
                                            </div>
                                            <h4 className="text-xs sm:text-sm font-bold text-on-surface truncate group-hover:text-primary transition-colors">
                                                {item.title}
                                            </h4>
                                            <p className="text-[11px] sm:text-xs text-on-surface-variant mt-0.5 sm:mt-1 line-clamp-2 leading-snug sm:leading-relaxed break-words">
                                                {item.message}
                                            </p>
                                        </div>

                                        {/* Individual Clear/Delete Button 'X' */}
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                clearSingleNotification(item.id);
                                            }}
                                            className="text-on-surface-variant/70 hover:text-error hover:bg-error/10 p-1 sm:p-1.5 rounded-lg sm:rounded-xl transition-all opacity-80 sm:opacity-0 sm:group-hover:opacity-100 shrink-0 cursor-pointer active:scale-90"
                                            title="Dismiss notification"
                                            aria-label="Delete notification"
                                        >
                                            <span className="material-symbols-outlined text-[16px] sm:text-[18px]">close</span>
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Footer with Resync Button */}
                        <div className="p-3 sm:p-4 bg-surface-container-low border-t border-outline-variant/60 flex items-center justify-between shrink-0">
                            <span className="text-[11px] sm:text-xs text-on-surface-variant flex items-center gap-1.5">
                                <span className={`w-2 h-2 rounded-full ${isRefreshing ? 'bg-amber-500 animate-ping' : 'bg-emerald-500 animate-pulse'}`}></span>
                                <span className="truncate">{isRefreshing ? 'Syncing...' : 'Live Sync'}</span>
                            </span>
                            <button
                                type="button"
                                onClick={refreshNotifications}
                                disabled={isRefreshing}
                                className="flex items-center gap-1 text-[11px] sm:text-xs font-bold text-primary hover:underline cursor-pointer disabled:opacity-50 active:scale-95 transition-all shrink-0"
                            >
                                <span className={`material-symbols-outlined text-[14px] sm:text-[16px] ${isRefreshing ? 'animate-spin' : ''}`}>sync</span>
                                <span>{isRefreshing ? 'Updating...' : 'Resync'}</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
