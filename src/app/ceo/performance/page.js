'use client';

import { useState, useEffect, useCallback } from 'react';
import { useCEOContext } from '@/app/ceo/CEOContext';

export default function CEOPerformance() {
    const { searchQuery: globalSearch, selectedBatch } = useCEOContext();
    
    const [activeTab, setActiveTab] = useState('sessions'); // 'sessions' | 'feed'
    const [summary, setSummary] = useState(null);
    const [sessions, setSessions] = useState([]);
    const [logs, setLogs] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    
    // Filters
    const [roleFilter, setRoleFilter] = useState('all'); // 'all' | 'student' | 'staff'
    const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'online' | 'offline'
    const [typeFilter, setTypeFilter] = useState('all'); // 'all' | 'login' | 'logout' | 'test_submit' | ...
    const [searchQuery, setSearchQuery] = useState('');

    const fetchData = useCallback(async (showLoading = false) => {
        if (showLoading) setIsLoading(true);
        setIsRefreshing(true);

        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            const headers = { 'Authorization': `Bearer ${token}` };
            const apiBase = process.env.NEXT_PUBLIC_API_URL || '';

            const batchParam = (selectedBatch && selectedBatch !== 'All Batches' && selectedBatch !== 'Global')
                ? `&batch=${encodeURIComponent(selectedBatch)}`
                : '';

            const [summaryRes, sessionsRes, logsRes] = await Promise.all([
                fetch(`${apiBase}/api/activity/ceo/summary`, { headers }),
                fetch(`${apiBase}/api/activity/ceo/user-sessions?${batchParam}`, { headers }),
                fetch(`${apiBase}/api/activity/ceo/logs?limit=150${batchParam}`, { headers })
            ]);

            if (summaryRes.ok) setSummary(await summaryRes.json());
            if (sessionsRes.ok) setSessions(await sessionsRes.json());
            if (logsRes.ok) setLogs(await logsRes.json());
        } catch (err) {
            console.error('Error fetching activity data:', err);
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, [selectedBatch]);

    useEffect(() => {
        fetchData(true);
        // Auto-refresh every 15 seconds to keep online statuses and activities fresh
        const interval = setInterval(() => fetchData(false), 15000);
        return () => clearInterval(interval);
    }, [fetchData]);

    const formatTime = (isoString) => {
        if (!isoString) return '—';
        const d = new Date(isoString);
        if (isNaN(d.getTime())) return '—';
        
        const now = new Date();
        const diffMs = now - d;
        const diffMins = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

        // Format clock time
        const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24 && d.toDateString() === now.toDateString()) {
            return `Today at ${timeStr}`;
        }
        
        const yesterday = new Date(now);
        yesterday.setDate(now.getDate() - 1);
        if (d.toDateString() === yesterday.toDateString()) {
            return `Yesterday at ${timeStr}`;
        }

        return `${d.toLocaleDateString([], { month: 'short', day: 'numeric' })} at ${timeStr}`;
    };

    // Filter sessions
    const effectiveSearch = (searchQuery || globalSearch || '').toLowerCase();
    
    const filteredSessions = sessions.filter(user => {
        if (roleFilter !== 'all' && user.role !== roleFilter) return false;
        if (statusFilter === 'online' && !user.is_online) return false;
        if (statusFilter === 'offline' && user.is_online) return false;
        if (effectiveSearch) {
            const matchesName = (user.name || '').toLowerCase().includes(effectiveSearch);
            const matchesEmail = (user.email || '').toLowerCase().includes(effectiveSearch);
            const matchesAction = (user.latest_action || '').toLowerCase().includes(effectiveSearch);
            if (!matchesName && !matchesEmail && !matchesAction) return false;
        }
        return true;
    });

    // Filter activity logs
    const filteredLogs = logs.filter(log => {
        if (roleFilter !== 'all' && log.role !== roleFilter) return false;
        if (typeFilter !== 'all' && log.activity_type !== typeFilter) return false;
        if (effectiveSearch) {
            const matchesUser = (log.user_name || '').toLowerCase().includes(effectiveSearch);
            const matchesEmail = (log.user_email || '').toLowerCase().includes(effectiveSearch);
            const matchesAction = (log.action || '').toLowerCase().includes(effectiveSearch);
            if (!matchesUser && !matchesEmail && !matchesAction) return false;
        }
        return true;
    });

    const getActivityIcon = (type) => {
        switch (type) {
            case 'login': return { icon: 'login', color: 'text-emerald-600 bg-emerald-500/15 border-emerald-300' };
            case 'logout': return { icon: 'logout', color: 'text-slate-600 bg-slate-500/15 border-slate-300' };
            case 'test_submit': return { icon: 'assignment_turned_in', color: 'text-amber-600 bg-amber-500/15 border-amber-300' };
            case 'material_view': return { icon: 'menu_book', color: 'text-blue-600 bg-blue-500/15 border-blue-300' };
            case 'video_watch': return { icon: 'smart_display', color: 'text-purple-600 bg-purple-500/15 border-purple-300' };
            case 'class_schedule': return { icon: 'event', color: 'text-indigo-600 bg-indigo-500/15 border-indigo-300' };
            default: return { icon: 'visibility', color: 'text-primary bg-primary/10 border-primary/20' };
        }
    };

    return (
        <section className="max-w-[1440px] mx-auto p-3 md:p-gutter space-y-4 md:space-y-lg animate-fade-in w-full max-w-full overflow-x-hidden">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-2 md:mb-lg">
                <div>
                    <div className="flex items-center gap-2 mb-0.5">
                        <span className="material-symbols-outlined text-primary text-2xl sm:text-4xl">
                            monitoring
                        </span>
                        <h1 className="text-2xl sm:text-4xl font-bold text-on-surface tracking-tight bg-gradient-to-r from-[#6FB7E4] via-[#5D8BCC] to-[#465AA3] text-transparent bg-clip-text">
                            Activity & Performance Monitor
                        </h1>
                    </div>
                    <p className="text-xs sm:text-base text-on-surface-variant max-w-2xl">
                        Real-time student & staff online status, login/logout tracking, and institutional activity audit stream.
                    </p>
                </div>
                
                <div className="flex items-center gap-2 self-start sm:self-auto">
                    <button 
                        onClick={() => fetchData(false)}
                        disabled={isRefreshing}
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-on-surface text-xs sm:text-sm font-semibold transition-all active:scale-95 shadow-xs cursor-pointer"
                        title="Refresh live activity"
                    >
                        <span className={`material-symbols-outlined text-[18px] ${isRefreshing ? 'animate-spin text-primary' : ''}`}>
                            refresh
                        </span>
                        <span>{isRefreshing ? 'Syncing...' : 'Refresh'}</span>
                    </button>
                </div>
            </div>

            {/* KPI Metric Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-md">
                {/* 1. Online Users */}
                <div className="bento-card rounded-2xl bg-surface-container-lowest border border-outline-variant p-4 md:p-5 flex flex-col justify-between shadow-xs">
                    <div className="flex items-center justify-between">
                        <span className="text-xs sm:text-sm font-bold text-on-surface-variant">Currently Online</span>
                        <span className="relative flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                        </span>
                    </div>
                    <div className="mt-3 flex items-baseline gap-2">
                        <span className="text-2xl sm:text-4xl font-extrabold text-on-surface">
                            {summary?.total_online ?? '—'}
                        </span>
                        <span className="text-xs text-emerald-600 font-bold">Active Now</span>
                    </div>
                    <p className="text-[11px] sm:text-xs text-on-surface-variant mt-1">
                        {summary ? `${summary.online_students} Students • ${summary.online_staff} Staff` : 'Loading...'}
                    </p>
                </div>

                {/* 2. Logins Today */}
                <div className="bento-card rounded-2xl bg-surface-container-lowest border border-outline-variant p-4 sm:p-5 flex flex-col justify-between shadow-xs">
                    <div className="flex items-center justify-between">
                        <span className="text-xs sm:text-sm font-bold text-on-surface-variant">Logins Today</span>
                        <span className="material-symbols-outlined text-primary text-[22px]">login</span>
                    </div>
                    <div className="mt-3 flex items-baseline gap-2">
                        <span className="text-2xl sm:text-4xl font-extrabold text-on-surface">
                            {summary?.logins_today ?? '—'}
                        </span>
                        <span className="text-xs text-primary font-bold">Sessions</span>
                    </div>
                    <p className="text-[11px] sm:text-xs text-on-surface-variant mt-1">
                        Total authenticated user logins
                    </p>
                </div>

                {/* 3. Actions Today */}
                <div className="bento-card rounded-2xl bg-surface-container-lowest border border-outline-variant p-4 sm:p-5 flex flex-col justify-between shadow-xs">
                    <div className="flex items-center justify-between">
                        <span className="text-xs sm:text-sm font-bold text-on-surface-variant">Total Actions</span>
                        <span className="material-symbols-outlined text-purple-600 text-[22px]">bolt</span>
                    </div>
                    <div className="mt-3 flex items-baseline gap-2">
                        <span className="text-2xl sm:text-4xl font-extrabold text-on-surface">
                            {summary?.total_actions_today ?? '—'}
                        </span>
                        <span className="text-xs text-purple-600 font-bold">Events</span>
                    </div>
                    <p className="text-[11px] sm:text-xs text-on-surface-variant mt-1">
                        Tests, materials, classes & views
                    </p>
                </div>

                {/* 4. Total Users */}
                <div className="bento-card rounded-2xl bg-surface-container-lowest border border-outline-variant p-4 sm:p-5 flex flex-col justify-between shadow-xs">
                    <div className="flex items-center justify-between">
                        <span className="text-xs sm:text-sm font-bold text-on-surface-variant">Total Members</span>
                        <span className="material-symbols-outlined text-amber-600 text-[22px]">group</span>
                    </div>
                    <div className="mt-3 flex items-baseline gap-2">
                        <span className="text-2xl sm:text-4xl font-extrabold text-on-surface">
                            {summary ? (summary.total_students + summary.total_staff) : '—'}
                        </span>
                        <span className="text-xs text-amber-600 font-bold">Enrolled</span>
                    </div>
                    <p className="text-[11px] sm:text-xs text-on-surface-variant mt-1">
                        {summary ? `${summary.total_students} Students • ${summary.total_staff} Staff` : 'Loading...'}
                    </p>
                </div>
            </div>

            {/* Main Tabs Container */}
            <div className="bento-card rounded-2xl sm:rounded-3xl bg-surface-container-lowest border border-outline-variant shadow-xs overflow-hidden w-full max-w-full">
                {/* Tab Controls & Filters Toolbar */}
                <div className="p-4 sm:p-6 border-b border-outline-variant/60 bg-surface-container-low space-y-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        {/* Tab Switcher */}
                        <div className="flex items-center gap-1.5 p-1 bg-surface-container rounded-2xl border border-outline-variant/40">
                            <button
                                onClick={() => setActiveTab('sessions')}
                                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer ${
                                    activeTab === 'sessions'
                                        ? 'bg-primary text-on-primary shadow-xs'
                                        : 'text-on-surface-variant hover:text-on-surface'
                                }`}
                            >
                                <span className="material-symbols-outlined text-[18px]">person_pin</span>
                                <span>User Sessions & Online Status</span>
                                <span className={`px-2 py-0.5 rounded-full text-[10px] ${activeTab === 'sessions' ? 'bg-white/20 text-white' : 'bg-surface-container-high'}`}>
                                    {filteredSessions.length}
                                </span>
                            </button>

                            <button
                                onClick={() => setActiveTab('feed')}
                                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer ${
                                    activeTab === 'feed'
                                        ? 'bg-primary text-on-primary shadow-xs'
                                        : 'text-on-surface-variant hover:text-on-surface'
                                }`}
                            >
                                <span className="material-symbols-outlined text-[18px]">history</span>
                                <span>Live Activity Feed</span>
                                <span className={`px-2 py-0.5 rounded-full text-[10px] ${activeTab === 'feed' ? 'bg-white/20 text-white' : 'bg-surface-container-high'}`}>
                                    {filteredLogs.length}
                                </span>
                            </button>
                        </div>

                        {/* Search Input */}
                        <div className="relative w-full sm:w-72">
                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[18px]">
                                search
                            </span>
                            <input
                                type="text"
                                placeholder="Search by name, email, action..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 bg-surface-container-lowest border border-outline-variant rounded-xl text-xs sm:text-sm text-on-surface focus:border-primary outline-none transition-all"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery('')}
                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface"
                                >
                                    <span className="material-symbols-outlined text-[16px]">close</span>
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Filter Pills */}
                    <div className="flex items-center gap-2 flex-wrap pt-1">
                        {/* Role filter */}
                        <div className="flex items-center gap-1 bg-surface-container-lowest p-1 rounded-xl border border-outline-variant/60 text-xs">
                            <span className="text-[11px] font-bold text-on-surface-variant px-2">Role:</span>
                            {['all', 'student', 'staff'].map((r) => (
                                <button
                                    key={r}
                                    onClick={() => setRoleFilter(r)}
                                    className={`px-2.5 py-1 rounded-lg font-semibold capitalize transition-all cursor-pointer ${
                                        roleFilter === r
                                            ? 'bg-secondary text-on-secondary shadow-xs'
                                            : 'text-on-surface-variant hover:bg-surface-container'
                                    }`}
                                >
                                    {r === 'all' ? 'All Roles' : `${r}s`}
                                </button>
                            ))}
                        </div>

                        {/* Status filter (for sessions tab) */}
                        {activeTab === 'sessions' && (
                            <div className="flex items-center gap-1 bg-surface-container-lowest p-1 rounded-xl border border-outline-variant/60 text-xs">
                                <span className="text-[11px] font-bold text-on-surface-variant px-2">Status:</span>
                                {[
                                    { id: 'all', label: 'All' },
                                    { id: 'online', label: '🟢 Online' },
                                    { id: 'offline', label: '⚪ Offline' }
                                ].map((st) => (
                                    <button
                                        key={st.id}
                                        onClick={() => setStatusFilter(st.id)}
                                        className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                                            statusFilter === st.id
                                                ? 'bg-secondary text-on-secondary shadow-xs'
                                                : 'text-on-surface-variant hover:bg-surface-container'
                                        }`}
                                    >
                                        {st.label}
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Activity Type filter (for feed tab) */}
                        {activeTab === 'feed' && (
                            <div className="flex items-center gap-1 bg-surface-container-lowest p-1 rounded-xl border border-outline-variant/60 text-xs overflow-x-auto custom-scrollbar">
                                <span className="text-[11px] font-bold text-on-surface-variant px-2">Event:</span>
                                {[
                                    { id: 'all', label: 'All Events' },
                                    { id: 'login', label: 'Logins' },
                                    { id: 'logout', label: 'Logouts' },
                                    { id: 'test_submit', label: 'Tests' },
                                    { id: 'material_view', label: 'Materials' },
                                    { id: 'video_watch', label: 'Videos' },
                                    { id: 'page_view', label: 'Page Views' }
                                ].map((t) => (
                                    <button
                                        key={t.id}
                                        onClick={() => setTypeFilter(t.id)}
                                        className={`px-2.5 py-1 rounded-lg font-semibold whitespace-nowrap transition-all cursor-pointer ${
                                            typeFilter === t.id
                                                ? 'bg-secondary text-on-secondary shadow-xs'
                                                : 'text-on-surface-variant hover:bg-surface-container'
                                        }`}
                                    >
                                        {t.label}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Content Area */}
                <div className="p-4 sm:p-6">
                    {isLoading ? (
                        <div className="py-24 flex flex-col items-center justify-center text-primary">
                            <span className="material-symbols-outlined text-[42px] animate-spin">progress_activity</span>
                            <p className="font-label-md mt-3 text-on-surface-variant">Loading Activity Data...</p>
                        </div>
                    ) : activeTab === 'sessions' ? (
                        /* TAB 1: USER SESSIONS & STATUS TABLE */
                        filteredSessions.length === 0 ? (
                            <div className="py-20 flex flex-col items-center justify-center text-center text-on-surface-variant">
                                <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center mb-3">
                                    <span className="material-symbols-outlined text-4xl text-outline">person_off</span>
                                </div>
                                <h3 className="font-bold text-base text-on-surface">No users matched</h3>
                                <p className="text-xs text-outline mt-1">Try adjusting your role or status filters.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto custom-scrollbar -mx-4 sm:mx-0">
                                <table className="w-full text-left border-collapse text-xs sm:text-sm">
                                    <thead>
                                        <tr className="border-b border-outline-variant/60 text-[11px] uppercase tracking-wider text-on-surface-variant font-bold">
                                            <th className="py-3 px-4">User</th>
                                            <th className="py-3 px-3">Role / Level</th>
                                            <th className="py-3 px-3">Status</th>
                                            <th className="py-3 px-3">Last Seen</th>
                                            <th className="py-3 px-3">Login Time</th>
                                            <th className="py-3 px-3">Logout Time</th>
                                            <th className="py-3 px-4">Latest Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-outline-variant/30 font-medium">
                                        {filteredSessions.map((u) => (
                                            <tr 
                                                key={u.id || u.email}
                                                className="hover:bg-surface-container-low transition-colors"
                                            >
                                                {/* User info */}
                                                <td className="py-3.5 px-4">
                                                    <div className="flex items-center gap-3 min-w-[180px]">
                                                        <div className="relative">
                                                            <div className="w-9 h-9 rounded-full bg-surface-container flex items-center justify-center font-bold text-primary border border-outline-variant/60 overflow-hidden shrink-0">
                                                                {u.profile_image_url ? (
                                                                    <img src={u.profile_image_url} alt={u.name} className="w-full h-full object-cover" />
                                                                ) : (
                                                                    <span className="material-symbols-outlined text-[18px]">person</span>
                                                                )}
                                                            </div>
                                                            {/* Status dot on avatar */}
                                                            <span 
                                                                className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white dark:border-slate-900 ${
                                                                    u.is_online ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'
                                                                }`}
                                                            />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="font-bold text-on-surface truncate leading-tight">{u.name}</p>
                                                            <p className="text-[11px] text-on-surface-variant truncate">{u.email}</p>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Role / Batch */}
                                                <td className="py-3.5 px-3 whitespace-nowrap">
                                                    <div className="flex flex-col gap-1">
                                                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border w-fit capitalize ${
                                                            u.role === 'staff' 
                                                                ? 'bg-blue-100 text-blue-800 border-blue-200' 
                                                                : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                                                        }`}>
                                                            {u.role}
                                                        </span>
                                                        <span className="text-[11px] text-on-surface-variant font-medium">
                                                            {u.batch || 'Batch - 1'} • {u.level || 'Level 5'}
                                                        </span>
                                                    </div>
                                                </td>

                                                {/* Online Status */}
                                                <td className="py-3.5 px-3 whitespace-nowrap">
                                                    {u.is_online ? (
                                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold shadow-2xs">
                                                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                                            Online Now
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-container text-on-surface-variant border border-outline-variant/60 text-xs font-medium">
                                                            <span className="w-2 h-2 rounded-full bg-slate-400" />
                                                            Offline
                                                        </span>
                                                    )}
                                                </td>

                                                {/* Last Seen */}
                                                <td className="py-3.5 px-3 whitespace-nowrap font-medium text-on-surface">
                                                    {u.is_online ? (
                                                        <span className="text-emerald-600 font-bold">Active now</span>
                                                    ) : (
                                                        <span className="text-on-surface-variant">{formatTime(u.last_seen_at)}</span>
                                                    )}
                                                </td>

                                                {/* Login Time */}
                                                <td className="py-3.5 px-3 whitespace-nowrap text-on-surface-variant">
                                                    {formatTime(u.last_login_at)}
                                                </td>

                                                {/* Logout Time */}
                                                <td className="py-3.5 px-3 whitespace-nowrap text-on-surface-variant">
                                                    {formatTime(u.last_logout_at)}
                                                </td>

                                                {/* Latest Action */}
                                                <td className="py-3.5 px-4 min-w-[200px]">
                                                    <div className="flex items-center gap-2">
                                                        <span className="material-symbols-outlined text-[16px] text-primary shrink-0">
                                                            {getActivityIcon(u.latest_activity_type).icon}
                                                        </span>
                                                        <span className="text-xs text-on-surface font-medium truncate max-w-[240px]" title={u.latest_action}>
                                                            {u.latest_action || 'No recent action'}
                                                        </span>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )
                    ) : (
                        /* TAB 2: LIVE ACTIVITY AUDIT FEED */
                        filteredLogs.length === 0 ? (
                            <div className="py-20 flex flex-col items-center justify-center text-center text-on-surface-variant">
                                <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center mb-3">
                                    <span className="material-symbols-outlined text-4xl text-outline">history_toggle_off</span>
                                </div>
                                <h3 className="font-bold text-base text-on-surface">No activity events found</h3>
                                <p className="text-xs text-outline mt-1">Actions performed by students and staff will appear here live.</p>
                            </div>
                        ) : (
                            <div className="space-y-2.5">
                                {filteredLogs.map((log) => {
                                    const { icon, color } = getActivityIcon(log.activity_type);
                                    return (
                                        <div
                                            key={log.id}
                                            className="p-3 sm:p-4 rounded-2xl bg-surface-container-lowest hover:bg-surface-container-low border border-outline-variant/60 shadow-2xs transition-all flex items-start justify-between gap-3 group"
                                        >
                                            <div className="flex items-start gap-3 min-w-0">
                                                {/* Activity Type Icon */}
                                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border mt-0.5 ${color}`}>
                                                    <span className="material-symbols-outlined text-[20px]">{icon}</span>
                                                </div>

                                                {/* Text Info */}
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <span className="font-bold text-xs sm:text-sm text-on-surface">
                                                            {log.user_name}
                                                        </span>
                                                        <span className={`text-[10px] font-bold px-2 py-0.2 rounded-full border capitalize ${
                                                            log.role === 'staff' 
                                                                ? 'bg-blue-100 text-blue-800 border-blue-200' 
                                                                : log.role === 'ceo'
                                                                ? 'bg-purple-100 text-purple-800 border-purple-200'
                                                                : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                                                        }`}>
                                                            {log.role}
                                                        </span>
                                                        <span className="text-[11px] text-on-surface-variant">
                                                            ({log.user_email})
                                                        </span>
                                                    </div>

                                                    <p className="text-xs sm:text-sm text-on-surface font-medium mt-1 leading-snug">
                                                        {log.action}
                                                    </p>

                                                    {log.batch && (
                                                        <span className="inline-block mt-1 text-[10px] text-outline font-semibold">
                                                            {log.batch} {log.level ? `• ${log.level}` : ''}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Timestamp */}
                                            <div className="text-right shrink-0">
                                                <span className="text-xs font-bold text-on-surface whitespace-nowrap">
                                                    {formatTime(log.timestamp)}
                                                </span>
                                                {log.ip_address && (
                                                    <p className="text-[10px] text-outline hidden sm:block mt-0.5">
                                                        IP: {log.ip_address}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )
                    )}
                </div>
            </div>
        </section>
    );
}
