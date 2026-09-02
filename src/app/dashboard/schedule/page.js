'use client';

import { useState, useEffect } from 'react';

const DAYS_OF_WEEK = [
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
    'Sunday'
];

const COLOR_OPTIONS = [
    { value: 'primary', label: 'Primary (Blue)', bg: 'bg-primary-container/15', text: 'text-primary', border: 'border-primary' },
];

export default function StudentSchedulePage() {
    const [schedules, setSchedules] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('Monday');

    const fetchSchedules = async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem('token');
            const level = localStorage.getItem('level') || 'Level 5';
            const batch = localStorage.getItem('batch') || '';
                        const headers = {
                'Authorization': `Bearer ${token}`
            };
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/schedule?level=${encodeURIComponent(level)}&batch=${encodeURIComponent(batch)}`, { headers });
            if (!res.ok) {
                throw new Error('Failed to fetch schedule items');
            }
            const data = await res.json();
            setSchedules(data);
        } catch (err) {
            console.error('Error fetching schedules:', err);
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchSchedules();
        
        // Auto-select current day
        const now = new Date();
        const currentDayIndex = now.getDay() === 0 ? 6 : now.getDay() - 1; // getDay() is 0 for Sunday
        setActiveTab(DAYS_OF_WEEK[currentDayIndex]);
    }, []);

    const getColorConfig = (colorVal) => {
        return COLOR_OPTIONS.find(opt => opt.value === colorVal) || COLOR_OPTIONS[0];
    };

    const getClassStatus = (schedule) => {
        if (!schedule.time || !schedule.day_of_week) return null;
        
        const now = new Date();
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const currentDay = days[now.getDay()];
        
        if (schedule.day_of_week !== currentDay) return null;

        const timeParts = schedule.time.split(' ');
        const time = timeParts[0];
        const period = timeParts[1];
        if (!time) return null;
        
        let [hours, minutes] = time.split(':').map(Number);
        if (period === 'PM' && hours !== 12) hours += 12;
        if (period === 'AM' && hours === 12) hours = 0;
        
        const classTime = new Date();
        classTime.setHours(hours, minutes || 0, 0, 0);
        
        const diffMins = (classTime - now) / (1000 * 60);
        
        if (diffMins <= 0 && diffMins > -60) {
            return { status: 'live', text: 'Live Now' }; // Assuming class is 1 hour long
        } else if (diffMins > 0 && diffMins <= 15) {
            return { status: 'starting_soon', text: `Starts in ${Math.round(diffMins)} mins` };
        }
        return null;
    };

    const filteredSchedules = schedules.filter(s => s.day_of_week === activeTab);

    if (isLoading && schedules.length === 0) {
        return (
            <div className="p-gutter max-w-[1440px] mx-auto min-h-[50vh] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4 text-primary">
                    <span className="material-symbols-outlined text-[48px] animate-spin">progress_activity</span>
                    <p className="font-label-lg">Loading Schedules...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-[1440px] mx-auto p-3 sm:p-gutter space-y-4 sm:space-y-lg mt-2 sm:mt-6 w-full max-w-full overflow-x-hidden">
                {/* Header Section */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-md">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#6FB7E4] via-[#5D8BCC] to-[#465AA3]">My Class Schedule</h1>
                        <p className="font-body-md text-body-md text-on-surface-variant">View your weekly class sessions and virtual room links.</p>
                    </div>
                </div>

                {/* Error Callout */}
                {error && (
                    <div className="p-lg bg-error-container text-on-error-container rounded-xl flex items-center gap-md">
                        <span className="material-symbols-outlined text-[32px]">error</span>
                        <div>
                            <h3 className="font-headline-md">Error Loading Schedules</h3>
                            <p className="font-body-md">{error}</p>
                        </div>
                    </div>
                )}

                {/* Main Workspace Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-md items-start">
                    
                    {/* Left Side: Days Navigation */}
                    <div className="bg-surface-container-lowest p-2 sm:p-3 rounded-2xl custom-shadow border border-outline-variant/60 flex flex-row lg:flex-col overflow-x-auto lg:overflow-x-visible gap-1.5 custom-scrollbar shrink-0">
                        {DAYS_OF_WEEK.map((day) => {
                            const count = schedules.filter(s => s.day_of_week === day).length;
                            const isActive = activeTab === day;
                            return (
                                <button
                                    key={day}
                                    onClick={() => setActiveTab(day)}
                                    className={`flex items-center justify-between gap-3 px-4 py-2.5 sm:py-3 rounded-xl font-label-md text-xs sm:text-sm whitespace-nowrap transition-all cursor-pointer min-w-max lg:min-w-0 lg:w-full shrink-0 ${
                                        isActive
                                            ? 'bg-secondary-container text-on-secondary-container font-bold shadow-xs'
                                            : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface'
                                    }`}
                                >
                                    <span className="truncate">{day}</span>
                                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold shrink-0 ${
                                        isActive 
                                            ? 'bg-on-secondary-container/15 text-on-secondary-container'
                                            : 'bg-surface-container-highest text-outline'
                                    }`}>
                                        {count}
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Right Side: Schedule List */}
                    <div className="lg:col-span-3 space-y-md">
                        <div className="bg-surface-container-lowest p-md rounded-xl custom-shadow border border-surface-container relative overflow-hidden">
                            <div className="h-1 w-full absolute top-0 left-0 bg-primary"></div>
                            <div className="flex items-center justify-between mb-md">
                                <h3 className="font-headline-md text-headline-md">{activeTab} Schedule</h3>
                                <span className="text-body-sm text-on-surface-variant">{filteredSchedules.length} class(es) scheduled</span>
                            </div>

                            {filteredSchedules.length === 0 ? (
                                <div className="py-xl flex flex-col items-center justify-center text-center text-outline">
                                    <span className="material-symbols-outlined text-[64px] mb-sm opacity-50">calendar_today</span>
                                    <h4 className="font-headline-md text-on-surface mb-xs">No Classes Scheduled</h4>
                                    <p className="font-body-md">You have no classes scheduled for {activeTab}.</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-outline-variant/30">
                                    {filteredSchedules.map((item) => {
                                        const col = getColorConfig(item.color);
                                        const status = getClassStatus(item);
                                        const isLiveOrSoon = status !== null;

                                        return (
                                            <div key={item.id} className="py-md first:pt-0 last:pb-0 flex flex-col md:flex-row md:items-center justify-between gap-md group">
                                                <div className="flex items-start gap-md">
                                                    {/* Left Icon Panel */}
                                                    <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${col.bg} ${col.text} shrink-0`}>
                                                        <span className="material-symbols-outlined text-[28px]">school</span>
                                                    </div>
                                                    {/* Details Panel */}
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <h4 className="font-headline-md text-label-md text-on-surface group-hover:text-primary transition-colors">{item.name}</h4>
                                                            {isLiveOrSoon && (
                                                                <span className={`flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${status.status === 'live' ? 'bg-error-container text-error' : 'bg-tertiary-container text-tertiary'}`}>
                                                                    <span className="relative flex h-2 w-2">
                                                                        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${status.status === 'live' ? 'bg-error' : 'bg-tertiary'}`}></span>
                                                                        <span className={`relative inline-flex rounded-full h-2 w-2 ${status.status === 'live' ? 'bg-error' : 'bg-tertiary'}`}></span>
                                                                    </span>
                                                                    {status.text}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="flex flex-wrap items-center gap-x-md gap-y-1 mt-1 text-body-sm text-on-surface-variant">
                                                            <span className="flex items-center gap-1">
                                                                <span className="material-symbols-outlined text-sm">schedule</span>
                                                                {item.time}
                                                            </span>
                                                            <span className="flex items-center gap-1">
                                                                <span className="material-symbols-outlined text-sm">location_on</span>
                                                                {item.location}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Action Buttons */}
                                                <div className="flex items-center gap-sm self-end md:self-center">
                                                    {item.class_link ? (
                                                        <a
                                                            href={item.class_link.startsWith('http') ? item.class_link : `https://${item.class_link}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="px-4 py-2 bg-primary text-white rounded-lg font-label-sm flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors shadow-sm active:scale-[0.98]"
                                                        >
                                                            <span className="material-symbols-outlined text-sm">video_camera_front</span>
                                                            Join Virtual Room
                                                        </a>
                                                    ) : (
                                                        <button
                                                            disabled
                                                            className="px-4 py-2 bg-surface-variant text-on-surface-variant rounded-lg font-label-sm flex items-center justify-center gap-2 opacity-70 cursor-not-allowed shadow-sm"
                                                        >
                                                            <span className="material-symbols-outlined text-sm">videocam_off</span>
                                                            No Virtual Link
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
        </div>
    );
}
