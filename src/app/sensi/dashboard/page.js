'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSensiContext } from '@/app/sensi/SensiContext';

const COLOR_CLASSES = {
    primary: 'border-l-primary',
    secondary: 'border-l-secondary',
    tertiary: 'border-l-tertiary',
    error: 'border-l-error'
};

export default function SensiDashboard() {
    const { selectedBatch, setIsBatchModalOpen } = useSensiContext();
    const [summary, setSummary] = useState(null);
    const [classes, setClasses] = useState(null);
    const [activities, setActivities] = useState(null);
    const [profile, setProfile] = useState(null);
    const [studentNotes, setStudentNotes] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // Grading Drawer State
    const [selectedSubmission, setSelectedSubmission] = useState(null);
    const [quickGradeScore, setQuickGradeScore] = useState('');
    const [quickGradeComments, setQuickGradeComments] = useState('');
    const [quickGradeStatus, setQuickGradeStatus] = useState('Approved');
    const [isSavingGrade, setIsSavingGrade] = useState(false);
    const [selectedActivities, setSelectedActivities] = useState([]);
    const [actionMessage, setActionMessage] = useState('');

    const fetchDashboardData = async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem('token');
            if (!token) throw new Error("No authentication token found");
            const headers = { 'Authorization': `Bearer ${token}` };

            const batchParam = (selectedBatch && selectedBatch !== 'All Assigned Batches' && selectedBatch !== 'All Batches') 
                ? `?batch=${encodeURIComponent(selectedBatch)}` 
                : '';

            const [summaryRes, classesRes, activitiesRes, profileRes, notesRes] = await Promise.all([
                fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/dashboard/sensi/summary${batchParam}`, { headers }).catch(() => null),
                fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/dashboard/sensi/classes${batchParam}`, { headers }).catch(() => null),
                fetch(`${process.env.NEXT_PUBLIC_TEST_API_URL || ''}/api/tests/submissions/all${batchParam}`, { headers }).catch(() => null),
                fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/user/profile`, { headers }).catch(() => null),
                fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/student-notes${batchParam}`, { headers }).catch(() => null)
            ]);

            if (summaryRes && summaryRes.ok) setSummary(await summaryRes.json());
            if (classesRes && classesRes.ok) setClasses(await classesRes.json());
            if (activitiesRes && activitiesRes.ok) setActivities(await activitiesRes.json());
            if (profileRes && profileRes.ok) setProfile(await profileRes.json());
            if (notesRes && notesRes.ok) setStudentNotes(await notesRes.json());
        } catch (err) {
            console.error("Error fetching dashboard data:", err);
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboardData();
    }, [selectedBatch]);

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 18) return 'Good afternoon';
        return 'Good evening';
    };

    const sensiDisplayName = profile?.name?.split(' ')[0] || summary?.name || 'Instructor';
    const greeting = `${getGreeting()}, ${sensiDisplayName}`;

    const handleBulkAction = async (status) => {
        if (!selectedActivities.length) return;
        const token = localStorage.getItem('token');
        let successCount = 0;
        
        for (const id of selectedActivities) {
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_TEST_API_URL || ''}/api/tests/submissions/${id}/review`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        sensi_comments: status === 'Approved' ? 'Approved by instructor' : 'Please review and resubmit',
                        status: status
                    })
                });
                if (res.ok) successCount++;
            } catch (err) {
                console.error("Bulk update error:", err);
            }
        }
        
        if (successCount > 0) {
            setActionMessage(`Successfully updated ${successCount} submissions to "${status}".`);
            setActivities(prev => prev.map(a => 
                selectedActivities.includes(a.id) ? { ...a, status } : a
            ));
            setSelectedActivities([]);
            setTimeout(() => setActionMessage(''), 4000);
        }
    };

    const handleSingleGradeSubmit = async () => {
        if (!selectedSubmission) return;
        setIsSavingGrade(true);
        try {
            const token = localStorage.getItem('token');
            const feedbackText = quickGradeScore 
                ? `[Score: ${quickGradeScore}/100] ${quickGradeComments}`
                : quickGradeComments || 'Reviewed by instructor';

            const res = await fetch(`${process.env.NEXT_PUBLIC_TEST_API_URL || ''}/api/tests/submissions/${selectedSubmission.id}/review`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    sensi_comments: feedbackText,
                    status: quickGradeStatus
                })
            });

            if (res.ok) {
                setSelectedSubmission(null);
                window.location.reload();
            } else {
                const err = await res.json().catch(() => ({}));
                alert(`Failed to save review: ${err.detail || 'Network error'}`);
            }
        } catch (error) {
            console.error('Grade error:', error);
            alert('An error occurred while saving review.');
        } finally {
            setIsSavingGrade(false);
        }
    };

    const openGradingDrawer = (sub) => {
        setSelectedSubmission(sub);
        const isNeed = sub.status === 'Need Work' || sub.status === 'Needs Work' || sub.status === 'Failed';
        setQuickGradeStatus(isNeed ? 'Need Work' : 'Approved');
        setQuickGradeComments(sub.sensi_comments || '');
        setQuickGradeScore('');
    };

    const getInitials = (name) => {
        if (!name) return 'S';
        const parts = name.trim().split(' ');
        if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
        return name.slice(0, 2).toUpperCase();
    };

    const isSubApproved = (s) => s === 'Approved' || s === 'Reviewed';
    const isSubNeedWork = (s) => s === 'Need Work' || s === 'Needs Work' || s === 'Failed';

    const pendingSubmissions = activities?.filter(a => !isSubApproved(a.status) && !isSubNeedWork(a.status)) || [];
    const approvedCount = activities?.filter(a => isSubApproved(a.status))?.length || 0;
    const totalSubmissions = activities?.length || 0;

    if (isLoading && !summary && !activities) {
        return (
            <section className="p-gutter max-w-[1440px] mx-auto min-h-[50vh] flex items-center justify-center">
                <div className="flex flex-col items-center gap-3 text-primary">
                    <span className="material-symbols-outlined text-[48px] animate-spin">progress_activity</span>
                    <p className="font-label-lg text-sm text-on-surface-variant font-medium">Loading Instructor Dashboard...</p>
                </div>
            </section>
        );
    }

    return (
        <>
            <div className="max-w-[1440px] mx-auto p-4 md:px-8 lg:px-12 md:py-8 space-y-6 md:space-y-8 relative pb-32 animate-fade-in">
                {/* Welcome Header */}
                <section className="flex flex-col md:flex-row md:items-center justify-between gap-md">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="material-symbols-outlined text-primary text-3xl">school</span>
                            <h1 className="text-3xl md:text-4xl font-bold tracking-tight bg-gradient-to-r from-[#6FB7E4] via-[#5D8BCC] to-[#465AA3] text-transparent bg-clip-text">
                                {greeting}
                            </h1>
                        </div>
                        <p className="font-body-md text-on-surface-variant">
                            Here is your instructor command center and batch overview for today.
                        </p>
                    </div>
                </section>

                {actionMessage && (
                    <div className="bg-green-500/10 text-green-700 dark:text-green-400 p-4 rounded-2xl flex items-center gap-2.5 border border-green-500/30">
                        <span className="material-symbols-outlined text-[22px]">check_circle</span>
                        <span className="text-sm font-medium">{actionMessage}</span>
                    </div>
                )}

                {error && (
                    <div className="p-4 bg-error/10 text-error rounded-2xl flex items-center gap-2 border border-error/30">
                        <span className="material-symbols-outlined">error</span>
                        <span className="text-xs font-medium">{error}</span>
                    </div>
                )}

                {/* KPI Metrics Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    {/* Pending Grading */}
                    <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-3xl p-5 custom-shadow hover:shadow-md transition-shadow flex flex-col justify-between group">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Pending Reviews</p>
                                <h2 className="text-3xl font-extrabold text-amber-600 dark:text-amber-400 mt-1">
                                    {pendingSubmissions.length}
                                </h2>
                            </div>
                            <div className="w-12 h-12 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                                <span className="material-symbols-outlined text-[26px]">pending_actions</span>
                            </div>
                        </div>
                        <div className="mt-4 pt-3 border-t border-outline-variant/40 flex items-center justify-between">
                            <span className="text-xs text-on-surface-variant">{totalSubmissions} total submissions</span>
                            {pendingSubmissions.length > 0 && (
                                <button
                                    onClick={() => openGradingDrawer(pendingSubmissions[0])}
                                    className="text-xs font-bold text-primary hover:underline flex items-center gap-0.5 cursor-pointer"
                                >
                                    Review <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Today's Schedule */}
                    <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-3xl p-5 custom-shadow hover:shadow-md transition-shadow flex flex-col justify-between group">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Today's Sessions</p>
                                <h2 className="text-3xl font-extrabold text-on-surface mt-1">
                                    {classes?.length || 0}
                                </h2>
                            </div>
                            <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center group-hover:scale-105 transition-transform">
                                <span className="material-symbols-outlined text-[26px]">calendar_clock</span>
                            </div>
                        </div>
                        <div className="mt-4 pt-3 border-t border-outline-variant/40 flex items-center justify-between">
                            <span className="text-xs text-primary font-bold flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                                Active timetable
                            </span>
                            <Link href="/sensi/schedule" className="text-xs font-bold text-primary hover:underline flex items-center gap-0.5">
                                Schedule <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                            </Link>
                        </div>
                    </div>

                    {/* Approved / Pass Rate */}
                    <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-3xl p-5 custom-shadow hover:shadow-md transition-shadow flex flex-col justify-between group">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Approved Submissions</p>
                                <h2 className="text-3xl font-extrabold text-green-600 dark:text-green-400 mt-1">
                                    {approvedCount}
                                </h2>
                            </div>
                            <div className="w-12 h-12 rounded-2xl bg-green-500/15 text-green-600 dark:text-green-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                                <span className="material-symbols-outlined text-[26px]">check_circle</span>
                            </div>
                        </div>
                        <div className="mt-4 pt-3 border-t border-outline-variant/40 flex items-center justify-between">
                            <span className="text-xs text-green-700 dark:text-green-400 font-medium">
                                {totalSubmissions > 0 ? `${Math.round((approvedCount / totalSubmissions) * 100)}% approved` : 'All caught up'}
                            </span>
                            <Link href="/sensi/progress" className="text-xs font-bold text-primary hover:underline flex items-center gap-0.5">
                                Progress <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                            </Link>
                        </div>
                    </div>

                    {/* Attendance Rate */}
                    <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-3xl p-5 custom-shadow hover:shadow-md transition-shadow flex flex-col justify-between group">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Attendance Rate</p>
                                <h2 className="text-3xl font-extrabold text-secondary mt-1">
                                    {summary?.attendanceRate || '96%'}
                                </h2>
                            </div>
                            <div className="w-12 h-12 rounded-2xl bg-secondary-container text-on-secondary-container flex items-center justify-center group-hover:scale-105 transition-transform">
                                <span className="material-symbols-outlined text-[26px]">how_to_reg</span>
                            </div>
                        </div>
                        <div className="mt-4 pt-3 border-t border-outline-variant/40 flex items-center justify-between">
                            <span className="text-xs text-on-surface-variant">Class participation</span>
                            <Link href="/sensi/members" className="text-xs font-bold text-primary hover:underline flex items-center gap-0.5">
                                Members <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Grid Layout: Schedule & Quick Suite */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Upcoming Classes */}
                    <div className="lg:col-span-2 bg-surface-container-lowest rounded-3xl p-6 custom-shadow border border-outline-variant/60 flex flex-col space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b border-outline-variant/40">
                            <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary text-[22px]">event_upcoming</span>
                                <h3 className="font-headline-sm text-on-surface font-bold text-base">Upcoming Class Sessions</h3>
                            </div>
                            <Link href="/sensi/schedule" className="text-xs font-bold text-primary hover:underline">
                                View Full Schedule
                            </Link>
                        </div>
                        
                        <div className="space-y-3 flex-grow">
                            {classes && classes.length > 0 ? (
                                classes.map((c, index) => {
                                    const timeParts = c.time ? c.time.split(' ') : ['09:00', 'AM'];
                                    const time = timeParts[0] || '09:00';
                                    const period = timeParts[1] || 'AM';
                                    const statusBadge = index === 0 ? 'Live Now' : (index === 1 ? 'Next' : 'Upcoming');
                                    const statusClass = index === 0 
                                        ? 'bg-error/15 text-error border-error/30' 
                                        : (index === 1 ? 'bg-primary/15 text-primary border-primary/30' : 'bg-surface-container text-on-surface-variant border-outline-variant/40');
                                    
                                    return (
                                        <div 
                                            key={c.id || index} 
                                            className={`flex flex-col sm:flex-row sm:items-center p-4 bg-surface-container-low/60 rounded-2xl border-l-4 ${COLOR_CLASSES[c.color] || 'border-l-primary'} border border-outline-variant/40 hover:bg-surface-container-low transition-all gap-4 justify-between`}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="text-center w-16 px-2 py-1.5 rounded-xl bg-surface-container border border-outline-variant/60 shrink-0">
                                                    <span className="block text-[11px] font-bold text-on-surface-variant leading-none">{time}</span>
                                                    <span className="block text-xs font-extrabold text-primary leading-tight mt-0.5">{period}</span>
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                        <h4 className="font-bold text-xs text-on-surface">{c.name}</h4>
                                                    </div>
                                                    <p className="text-xs text-on-surface-variant flex items-center gap-2">
                                                        <span>{c.location || 'Online Room'}</span>
                                                        <span>•</span>
                                                        <span>{c.students} Enrolled Students</span>
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2 shrink-0">
                                                <Link
                                                    href="/sensi/schedule"
                                                    className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-surface-container border border-outline-variant hover:bg-surface text-on-surface transition-colors inline-flex items-center gap-1 cursor-pointer"
                                                >
                                                    <span className="material-symbols-outlined text-[14px]">how_to_reg</span>
                                                    <span>Meet Link</span>
                                                </Link>
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="p-8 text-center text-on-surface-variant flex flex-col items-center justify-center gap-2">
                                    <span className="material-symbols-outlined text-4xl text-outline/40">event_available</span>
                                    <p className="text-xs font-medium">No upcoming sessions scheduled for today.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Quick Actions Bento */}
                    <div className="bg-surface-container-lowest rounded-3xl p-6 custom-shadow border border-outline-variant/60 flex flex-col space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b border-outline-variant/40">
                            <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary text-[22px]">bolt</span>
                                <h3 className="font-headline-sm text-on-surface font-bold text-base">Quick Actions</h3>
                            </div>
                        </div>

                        <div className="flex flex-col gap-2.5 flex-1">
                            <Link 
                                href="/sensi/tests" 
                                className="flex items-center gap-3 p-3.5 bg-primary text-on-primary rounded-2xl hover:opacity-95 active:scale-[0.98] transition-all shadow-sm font-bold text-xs group"
                            >
                                <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                                    <span className="material-symbols-outlined text-[18px]">quiz</span>
                                </div>
                                <div className="flex-1">
                                    <p className="leading-none">Create Test / Assessment</p>
                                    <p className="text-[10px] text-white/80 font-normal mt-0.5">Assign tests with multi-batch logic</p>
                                </div>
                                <span className="material-symbols-outlined text-[16px] group-hover:translate-x-0.5 transition-transform">arrow_forward</span>
                            </Link>

                            <Link 
                                href="/sensi/videos" 
                                className="flex items-center gap-3 p-3 bg-surface-container-low border border-outline-variant/60 rounded-2xl hover:bg-surface-container transition-all text-on-surface font-semibold text-xs group"
                            >
                                <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                                    <span className="material-symbols-outlined text-[18px]">smart_display</span>
                                </div>
                                <div className="flex-1">
                                    <p className="leading-none font-bold">Video Lessons</p>
                                    <p className="text-[10px] text-on-surface-variant font-normal mt-0.5">Publish Google Drive / YouTube lectures</p>
                                </div>
                                <span className="material-symbols-outlined text-[16px] text-outline group-hover:text-primary transition-colors">arrow_forward</span>
                            </Link>

                            <Link 
                                href="/sensi/materials" 
                                className="flex items-center gap-3 p-3 bg-surface-container-low border border-outline-variant/60 rounded-2xl hover:bg-surface-container transition-all text-on-surface font-semibold text-xs group"
                            >
                                <div className="w-8 h-8 rounded-xl bg-secondary-container text-on-secondary-container flex items-center justify-center shrink-0">
                                    <span className="material-symbols-outlined text-[18px]">library_books</span>
                                </div>
                                <div className="flex-1">
                                    <p className="leading-none font-bold">Upload Materials</p>
                                    <p className="text-[10px] text-on-surface-variant font-normal mt-0.5">PDFs, lecture slides & flashcards</p>
                                </div>
                                <span className="material-symbols-outlined text-[16px] text-outline group-hover:text-primary transition-colors">arrow_forward</span>
                            </Link>

                            <Link 
                                href="/sensi/announcements" 
                                className="flex items-center gap-3 p-3 bg-surface-container-low border border-outline-variant/60 rounded-2xl hover:bg-surface-container transition-all text-on-surface font-semibold text-xs group"
                            >
                                <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                                    <span className="material-symbols-outlined text-[18px]">campaign</span>
                                </div>
                                <div className="flex-1">
                                    <p className="leading-none font-bold">Announcements</p>
                                    <p className="text-[10px] text-on-surface-variant font-normal mt-0.5">Broadcast academy updates</p>
                                </div>
                                <span className="material-symbols-outlined text-[16px] text-outline group-hover:text-primary transition-colors">arrow_forward</span>
                            </Link>

                            <Link 
                                href="/sensi/community" 
                                className="flex items-center gap-3 p-3 bg-surface-container-low border border-outline-variant/60 rounded-2xl hover:bg-surface-container transition-all text-on-surface font-semibold text-xs group"
                            >
                                <div className="w-8 h-8 rounded-xl bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                                    <span className="material-symbols-outlined text-[18px]">forum</span>
                                </div>
                                <div className="flex-1">
                                    <p className="leading-none font-bold">Community</p>
                                    <p className="text-[10px] text-on-surface-variant font-normal mt-0.5">Student discussion & queries</p>
                                </div>
                                <span className="material-symbols-outlined text-[16px] text-outline group-hover:text-primary transition-colors">arrow_forward</span>
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Recent Student Submissions Table */}
                <section className="bg-surface-container-lowest rounded-3xl custom-shadow border border-outline-variant/60 overflow-hidden space-y-4 p-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-outline-variant/40">
                        <div className="flex items-center gap-2.5">
                            <span className="material-symbols-outlined text-primary text-[22px]">assignment_turned_in</span>
                            <div>
                                <h3 className="font-headline-sm text-on-surface font-bold text-base">Recent Student Submissions</h3>
                                <p className="text-xs text-on-surface-variant">Review and approve completed student assessments.</p>
                            </div>
                            {selectedActivities.length > 0 && (
                                <span className="px-2.5 py-0.5 bg-primary/10 text-primary border border-primary/20 text-xs rounded-full font-bold">
                                    {selectedActivities.length} Selected
                                </span>
                            )}
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            {selectedActivities.length > 0 && (
                                <>
                                    <button 
                                        onClick={() => handleBulkAction('Approved')}
                                        className="px-3.5 py-1.5 bg-green-500/15 text-green-700 dark:text-green-400 border border-green-500/30 text-xs font-bold rounded-xl hover:bg-green-500/25 transition-colors flex items-center gap-1 cursor-pointer"
                                    >
                                        <span className="material-symbols-outlined text-[16px]">done_all</span> Approve Selected
                                    </button>
                                    <button 
                                        onClick={() => handleBulkAction('Need Work')}
                                        className="px-3.5 py-1.5 bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30 text-xs font-bold rounded-xl hover:bg-amber-500/25 transition-colors flex items-center gap-1 cursor-pointer"
                                    >
                                        <span className="material-symbols-outlined text-[16px]">replay</span> Request Need Work
                                    </button>
                                </>
                            )}
                            <Link href="/sensi/progress" className="text-primary text-xs hover:underline font-bold ml-2">
                                View Full Progress Log →
                            </Link>
                        </div>
                    </div>
                    
                    <div className="overflow-x-auto custom-scrollbar">
                        <table className="w-full text-left border-collapse min-w-[800px]">
                            <thead>
                                <tr className="border-b border-outline-variant/60 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
                                    <th className="py-3 px-3 w-10">
                                        <input 
                                            type="checkbox" 
                                            className="rounded border-outline text-primary focus:ring-primary h-4 w-4 cursor-pointer"
                                            checked={activities?.length > 0 && selectedActivities.length === Math.min(6, activities.length)}
                                            onChange={(e) => {
                                                if (e.target.checked && activities) {
                                                    setSelectedActivities(activities.slice(0, 6).map(a => a.id));
                                                } else {
                                                    setSelectedActivities([]);
                                                }
                                            }}
                                        />
                                    </th>
                                    <th className="py-3 px-4">Student</th>
                                    <th className="py-3 px-4">Assessment</th>
                                    <th className="py-3 px-4">Submitted At</th>
                                    <th className="py-3 px-4">Status</th>
                                    <th className="py-3 px-4 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-outline-variant/30">
                                {activities && activities.slice(0, 6).map((sub) => {
                                    const isSelected = selectedActivities.includes(sub.id);
                                    const isApproved = isSubApproved(sub.status);
                                    const isNeedWork = isSubNeedWork(sub.status);

                                    return (
                                        <tr key={sub.id} className={`transition-colors ${isSelected ? 'bg-primary/5' : 'hover:bg-surface-container-low/60'}`}>
                                            <td className="py-3 px-3">
                                                <input 
                                                    type="checkbox" 
                                                    className="rounded border-outline text-primary focus:ring-primary h-4 w-4 cursor-pointer"
                                                    checked={isSelected}
                                                    onChange={(e) => {
                                                        if (e.target.checked) {
                                                            setSelectedActivities([...selectedActivities, sub.id]);
                                                        } else {
                                                            setSelectedActivities(selectedActivities.filter(id => id !== sub.id));
                                                        }
                                                    }}
                                                />
                                            </td>
                                            <td className="py-3 px-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/40 text-primary flex items-center justify-center font-bold text-xs ring-1 ring-primary/20 shrink-0">
                                                        {getInitials((sub.student_name && !['unknown', 'unkown', 'null', 'none', ''].includes(sub.student_name.trim().toLowerCase())) ? sub.student_name : (sub.student_email ? sub.student_email.split('@')[0] : 'Student'))}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="font-bold text-xs text-on-surface truncate">
                                                            {(sub.student_name && !['unknown', 'unkown', 'null', 'none', ''].includes(sub.student_name.trim().toLowerCase())) ? sub.student_name : (sub.student_email ? sub.student_email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : 'Student')}
                                                        </div>
                                                        <div className="text-[10px] text-on-surface-variant truncate">{sub.student_email || ''}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-3 px-4">
                                                <div className="font-semibold text-xs text-on-surface line-clamp-1">{sub.test_title || 'Assessment'}</div>
                                                {sub.test_batch && (
                                                    <span className="text-[10px] font-medium text-on-surface-variant bg-surface-container px-1.5 py-0.2 rounded border border-outline-variant/40 inline-block mt-0.5">
                                                        {sub.test_batch}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="py-3 px-4 text-xs text-on-surface-variant whitespace-nowrap">
                                                {sub.submitted_at ? new Date(sub.submitted_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'Recent'}
                                            </td>
                                            <td className="py-3 px-4 whitespace-nowrap">
                                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border inline-flex items-center gap-1 ${
                                                    isApproved 
                                                        ? 'bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/30' 
                                                        : isNeedWork 
                                                        ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30' 
                                                        : 'bg-primary/10 text-primary border-primary/20'
                                                }`}>
                                                    <span className="material-symbols-outlined text-[12px]">
                                                        {isApproved ? 'check_circle' : isNeedWork ? 'cancel' : 'pending'}
                                                    </span>
                                                    <span>{isApproved ? 'Approved' : isNeedWork ? 'Need Work' : (sub.status || 'Pending')}</span>
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 text-right whitespace-nowrap">
                                                <button 
                                                    onClick={() => openGradingDrawer(sub)}
                                                    className="px-3 py-1 rounded-xl text-xs font-bold bg-primary/10 text-primary hover:bg-primary hover:text-on-primary transition-all inline-flex items-center gap-1 cursor-pointer shadow-2xs"
                                                >
                                                    <span className="material-symbols-outlined text-[14px]">edit_document</span>
                                                    <span>Review</span>
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {(!activities || activities.length === 0) && (
                                    <tr>
                                        <td colSpan="6" className="py-8 text-center text-xs text-on-surface-variant">
                                            No student submissions found for this batch.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Student Uploaded Notes Section (with Uploader Name) */}
                <section className="bg-surface-container-lowest rounded-3xl custom-shadow border border-outline-variant/60 overflow-hidden space-y-4 p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-outline-variant/40">
                        <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                                <span className="material-symbols-outlined text-[22px]">menu_book</span>
                            </div>
                            <div>
                                <h3 className="font-headline-sm text-on-surface font-bold text-base">Student Shared Notes</h3>
                                <p className="text-xs text-on-surface-variant">Review notes links submitted by enrolled students.</p>
                            </div>
                        </div>
                        {studentNotes && studentNotes.length > 0 && (
                            <span className="px-3 py-1 bg-primary/10 text-primary border border-primary/20 text-xs rounded-full font-bold self-start sm:self-auto">
                                {studentNotes.length} Note{studentNotes.length > 1 ? 's' : ''} Uploaded
                            </span>
                        )}
                    </div>

                    {(!studentNotes || studentNotes.length === 0) ? (
                        <div className="p-8 text-center text-on-surface-variant flex flex-col items-center justify-center gap-2 bg-surface-container-low/30 rounded-2xl border border-dashed border-outline-variant/60">
                            <span className="material-symbols-outlined text-3xl text-outline/40">note_stack</span>
                            <p className="text-xs font-medium">No student notes uploaded for this batch yet.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {studentNotes.map((note) => (
                                <div 
                                    key={note.id} 
                                    className="p-4 bg-surface-container-low/50 rounded-2xl border border-outline-variant/50 hover:border-primary/40 hover:bg-surface-container-low transition-all flex flex-col justify-between space-y-3"
                                >
                                    <div className="space-y-2">
                                        {/* Uploader Name Badge (prominently displayed) */}
                                        <div className="flex items-center gap-2.5">
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/40 text-primary flex items-center justify-center font-bold text-xs ring-1 ring-primary/20 shrink-0">
                                                {getInitials(note.uploader_name)}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-xs font-bold text-on-surface truncate">
                                                    {note.uploader_name || 'Student'}
                                                </p>
                                                <p className="text-[10px] text-on-surface-variant">
                                                    {note.created_at ? new Date(note.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recently'}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Note Topic / Title */}
                                        <div className="pt-1">
                                            <h4 className="text-xs font-bold text-on-surface line-clamp-1">
                                                {note.title || 'Study Notes'}
                                            </h4>
                                            <p className="text-[11px] text-primary truncate mt-0.5" title={note.note_link}>
                                                {note.note_link}
                                            </p>
                                        </div>
                                    </div>

                                        {/* Action link */}
                                        <div className="pt-2 border-t border-outline-variant/30 flex items-center justify-between">
                                            {note.batch && (
                                                <span className="text-[10px] font-medium text-on-surface-variant bg-surface-container px-2 py-0.5 rounded-md border border-outline-variant/40">
                                                    {note.batch}
                                                </span>
                                            )}
                                            <div className="flex items-center gap-2 ml-auto">
                                                <button
                                                    onClick={async (e) => {
                                                        e.preventDefault();
                                                        if(confirm('Are you sure you want to delete this note?')) {
                                                            try {
                                                                const token = localStorage.getItem('token');
                                                                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/student-notes/${note.id}`, {
                                                                    method: 'DELETE',
                                                                    headers: { 'Authorization': `Bearer ${token}` }
                                                                });
                                                                if(res.ok) {
                                                                    setStudentNotes(prev => prev.filter(n => n.id !== note.id));
                                                                } else {
                                                                    alert('Failed to delete note');
                                                                }
                                                            } catch (err) {
                                                                console.error('Error deleting note:', err);
                                                            }
                                                        }
                                                    }}
                                                    className="p-1.5 rounded-lg text-error hover:bg-error/10 transition-colors"
                                                    title="Delete Note"
                                                >
                                                    <span className="material-symbols-outlined text-[16px]">delete</span>
                                                </button>
                                                <a
                                                    href={note.note_link}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="px-3 py-1.5 rounded-xl bg-primary text-white hover:bg-primary/90 text-xs font-bold transition-all shadow-xs flex items-center gap-1"
                                                >
                                                    <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                                                    <span>View Notes</span>
                                                </a>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                </section>
            </div>

            {/* Quick Review Drawer Modal */}
            {selectedSubmission && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-surface rounded-3xl p-6 max-w-[540px] w-full shadow-2xl border border-outline-variant/60 max-h-[90vh] overflow-y-auto custom-scrollbar relative space-y-4">
                        {/* Header */}
                        <div className="flex justify-between items-start pb-3 border-b border-outline-variant/40">
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="material-symbols-outlined text-primary text-[22px]">grading</span>
                                    <h2 className="font-headline-sm text-on-surface font-bold text-lg">Review Submission</h2>
                                </div>
                                <p className="text-xs text-on-surface-variant mt-0.5">
                                    {selectedSubmission.test_title} • <span className="font-semibold text-primary">{selectedSubmission.student_name}</span>
                                </p>
                            </div>
                            <button 
                                onClick={() => setSelectedSubmission(null)}
                                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-container text-on-surface-variant transition-colors cursor-pointer"
                            >
                                <span className="material-symbols-outlined text-[18px]">close</span>
                            </button>
                        </div>

                        {/* Student Submission Answer */}
                        <div className="bg-surface-container-low p-4 rounded-2xl border border-outline-variant/60 space-y-1.5">
                            <div className="flex justify-between items-center">
                                <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider flex items-center gap-1">
                                    <span className="material-symbols-outlined text-[14px] text-primary">description</span>
                                    <span>Student's Submission</span>
                                </span>
                                <span className="text-[10px] text-outline">
                                    {selectedSubmission.submitted_at ? new Date(selectedSubmission.submitted_at).toLocaleString() : ''}
                                </span>
                            </div>

                            {selectedSubmission.submission_content && selectedSubmission.submission_content.startsWith('http') ? (
                                <a 
                                    href={selectedSubmission.submission_content} 
                                    target="_blank" 
                                    rel="noreferrer" 
                                    className="text-xs font-semibold text-primary hover:underline break-all inline-flex items-center gap-1 pt-1"
                                >
                                    <span className="material-symbols-outlined text-[15px]">open_in_new</span>
                                    <span>{selectedSubmission.submission_content}</span>
                                </a>
                            ) : (
                                <p className="text-xs text-on-surface whitespace-pre-wrap leading-relaxed pt-1">
                                    {selectedSubmission.submission_content || 'No text content provided.'}
                                </p>
                            )}
                        </div>

                        {/* Grading Form */}
                        <div className="space-y-4">
                            {/* Outcome Status Selector */}
                            <div>
                                <label className="block text-xs font-bold text-on-surface mb-1.5">Review Outcome</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setQuickGradeStatus('Approved')}
                                        className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                                            quickGradeStatus === 'Approved'
                                                ? 'bg-green-500/15 text-green-700 dark:text-green-400 border-green-500 ring-1 ring-green-500 shadow-2xs'
                                                : 'border-outline-variant text-on-surface-variant hover:bg-surface-container'
                                        }`}
                                    >
                                        <span className="material-symbols-outlined text-[16px]">check_circle</span>
                                        <span>Approved</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setQuickGradeStatus('Need Work')}
                                        className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                                            quickGradeStatus === 'Need Work'
                                                ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500 ring-1 ring-amber-500 shadow-2xs'
                                                : 'border-outline-variant text-on-surface-variant hover:bg-surface-container'
                                        }`}
                                    >
                                        <span className="material-symbols-outlined text-[16px]">cancel</span>
                                        <span>Need Work</span>
                                    </button>
                                </div>
                            </div>
                            
                            {/* Feedback Comments */}
                            <div>
                                <label className="block text-xs font-bold text-on-surface mb-1">Feedback Comments</label>
                                <textarea 
                                    rows="3"
                                    placeholder="Add constructive notes, feedback, or instructions for the student..."
                                    value={quickGradeComments}
                                    onChange={(e) => setQuickGradeComments(e.target.value)}
                                    className="w-full bg-surface-container-low border border-outline-variant rounded-2xl p-3 text-xs text-on-surface focus:outline-none focus:border-primary transition-colors resize-none"
                                />
                            </div>

                            {/* Modal Actions */}
                            <div className="flex justify-end gap-2.5 pt-3 border-t border-outline-variant/40">
                                <button
                                    type="button"
                                    onClick={() => setSelectedSubmission(null)}
                                    className="px-4 py-2 rounded-xl text-xs font-semibold text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handleSingleGradeSubmit}
                                    disabled={isSavingGrade}
                                    className="px-5 py-2 rounded-xl text-xs font-bold text-on-primary bg-primary hover:opacity-90 transition-all disabled:opacity-50 flex items-center gap-1.5 shadow-md cursor-pointer"
                                >
                                    {isSavingGrade ? (
                                        <>
                                            <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
                                            <span>Saving...</span>
                                        </>
                                    ) : (
                                        <>
                                            <span className="material-symbols-outlined text-[16px]">send</span>
                                            <span>Submit</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
