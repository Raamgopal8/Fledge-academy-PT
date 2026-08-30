'use client';
import { useState, useEffect } from 'react';
import StudentPerformanceChart from '@/app/components/StudentPerformanceChart';
import { useCEOContext } from '@/app/ceo/CEOContext';
export default function CEODashboard() {
    const { searchQuery, selectedBatch } = useCEOContext();
    const [kpiData, setKpiData] = useState(null);
    const [chartData, setChartData] = useState(null);
    const [attendanceData, setAttendanceData] = useState(null);
    const [submissionsData, setSubmissionsData] = useState(null);
    const [profile, setProfile] = useState(null);
    const [financeSummary, setFinanceSummary] = useState(null);
    const [staffList, setStaffList] = useState([]);
    const [studentList, setStudentList] = useState([]);
    const [recentActivities, setRecentActivities] = useState([]);
    const [activitySummary, setActivitySummary] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchDashboardData = async (showLoading = false) => {
        if (showLoading) setIsLoading(true);
        try {
            const token = localStorage.getItem('token');
            const headers = {
                'Authorization': `Bearer ${token}`
            };

            const batchQuery = (selectedBatch && selectedBatch !== 'All Batches') ? `?batch=${encodeURIComponent(selectedBatch)}` : '';
            const [kpiRes, chartRes, attendanceRes, submissionsRes, profileRes, financeRes, staffRes, studentRes, activityRes, summaryRes] = await Promise.all([
                fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/dashboard/ceo/kpi${batchQuery}`, { headers }),
                fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/dashboard/ceo/performance-chart`, { headers }),
                fetch(`${process.env.NEXT_PUBLIC_ATTENDANCE_API_URL || ''}/api/attendance/today`, { headers }),
                fetch(`${process.env.NEXT_PUBLIC_TEST_API_URL || ''}/api/tests/submissions/all`, { headers }),
                fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/user/profile`, { headers }),
                fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/finance`, { headers }),
                fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/user/staff`, { headers }),
                fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/user/students`, { headers }),
                fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/activity/ceo/logs?limit=6`, { headers }),
                fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/activity/ceo/summary`, { headers })
            ]);

            if (!kpiRes.ok || !chartRes.ok || !attendanceRes.ok) {
                throw new Error('Failed to fetch dashboard data');
            }

            setKpiData(await kpiRes.json());
            setChartData(await chartRes.json());
            setAttendanceData(await attendanceRes.json());
            if (submissionsRes.ok) {
                setSubmissionsData(await submissionsRes.json());
            }
            if (profileRes.ok) {
                setProfile(await profileRes.json());
            }
            if (financeRes.ok) {
                const financeData = await financeRes.json();
                setFinanceSummary(financeData.summary);
            }
            if (staffRes.ok) {
                setStaffList(await staffRes.json());
            }
            if (studentRes.ok) {
                setStudentList(await studentRes.json());
            }
            if (activityRes.ok) {
                setRecentActivities(await activityRes.json());
            }
            if (summaryRes.ok) {
                setActivitySummary(await summaryRes.json());
            }
        } catch (err) {
            console.error("Error fetching dashboard data:", err);
            setError(err.message);
        } finally {
            if (showLoading) setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboardData(true);
        const interval = setInterval(() => fetchDashboardData(false), 30000); // Auto refresh every 30 seconds
        return () => clearInterval(interval);
    }, [selectedBatch]);

    if (isLoading) {
        return (
            <section className="p-gutter max-w-[1440px] mx-auto min-h-[50vh] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4 text-primary">
                    <span className="material-symbols-outlined text-[48px] animate-spin">progress_activity</span>
                    <p className="font-label-lg">Loading Dashboard Data...</p>
                </div>
            </section>
        );
    }

    if (error) {
        return (
            <section className="p-gutter max-w-[1440px] mx-auto min-h-[50vh] flex items-center justify-center">
                <div className="p-lg bg-error-container text-on-error-container rounded-xl flex items-center gap-md">
                    <span className="material-symbols-outlined text-[32px]">error</span>
                    <div>
                        <h3 className="font-headline-md">Error Loading Data</h3>
                        <p className="font-body-md">{error}</p>
                    </div>
                </div>
            </section>
        );
    }

    const filteredAttendanceNames = attendanceData?.names?.filter(name =>
        name.toLowerCase().includes((searchQuery || '').toLowerCase())
    ) || [];

    const filteredSubmissionsData = submissionsData?.filter(sub =>
        sub.student_name.toLowerCase().includes((searchQuery || '').toLowerCase()) ||
        sub.test_title.toLowerCase().includes((searchQuery || '').toLowerCase()) ||
        (sub.status || '').toLowerCase().includes((searchQuery || '').toLowerCase())
    ) || [];
    
    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 18) return 'Good afternoon';
        return 'Good evening';
    };

    const greeting = `${getGreeting()}, ${profile?.name?.split(' ')[0] || profile?.username || 'CEO'}`;
   
    return (
        <section className="max-w-[1440px] mx-auto p-3 md:p-gutter space-y-4 md:space-y-lg animate-fade-in w-full max-w-full overflow-x-hidden">
            {/* Header Section */}
            <div className="mb-2 md:mb-lg">
                <h1 className="text-2xl sm:text-4xl font-bold tracking-tight bg-gradient-to-r from-[#6FB7E4] via-[#5D8BCC] to-[#465AA3] text-transparent bg-clip-text">
                    {greeting}
                </h1>
                <p className="text-xs sm:text-base text-on-surface-variant mt-0.5">Here's what's happening at the academy today.</p>
            </div>

            {/* KPI Section */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 md:gap-md">
                {/* Total Students */}
                <div className="bento-card rounded-2xl sm:rounded-3xl bg-surface-container-lowest p-3.5 md:p-md flex flex-col justify-between group border border-outline-variant/60 shadow-xs hover:shadow-md hover:border-primary/40 transition-all">
                    <div className="flex items-center gap-2 sm:gap-sm">
                        <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-full bg-blue-100 dark:bg-blue-950/50 border border-blue-200/60 dark:border-blue-800/40 flex items-center justify-center shrink-0">
                            <span className="material-symbols-outlined text-blue-600 dark:text-blue-400 text-[18px] sm:text-[24px]">school</span>
                        </div>
                        <div className="min-w-0">
                            <p className="text-xs font-medium text-on-surface-variant truncate">Students</p>
                            <h2 className="text-xl sm:text-4xl font-extrabold text-on-surface transition-transform group-hover:scale-[1.02] origin-left truncate">{kpiData?.activeStudents || '0'}</h2>
                        </div>
                    </div>
                </div>

                {/* Total Staff */}
                <div className="bento-card rounded-2xl sm:rounded-3xl bg-surface-container-lowest p-3.5 md:p-md flex flex-col justify-between group border border-outline-variant/60 shadow-xs hover:shadow-md hover:border-primary/40 transition-all">
                    <div className="flex items-center gap-2 sm:gap-sm">
                        <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-full bg-surface-container-high border border-outline-variant/60 flex items-center justify-center shrink-0">
                            <span className="material-symbols-outlined text-on-surface-variant text-[18px] sm:text-[24px]">badge</span>
                        </div>
                        <div className="min-w-0">
                            <p className="text-xs font-medium text-on-surface-variant truncate">Staff</p>
                            <h2 className="text-xl sm:text-4xl font-extrabold text-on-surface transition-transform group-hover:scale-[1.02] origin-left truncate">{kpiData?.activeStaff || '0'}</h2>
                        </div>
                    </div>
                </div>

                {/* Active Courses */}
                <div className="bento-card rounded-2xl sm:rounded-3xl bg-surface-container-lowest p-3.5 md:p-md flex flex-col justify-between group border border-outline-variant/60 shadow-xs hover:shadow-md hover:border-primary/40 transition-all">
                    <div className="flex items-center gap-2 sm:gap-sm">
                        <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-full bg-purple-100 dark:bg-purple-950/50 border border-purple-200/60 dark:border-purple-800/40 flex items-center justify-center shrink-0">
                            <span className="material-symbols-outlined text-purple-600 dark:text-purple-400 text-[18px] sm:text-[24px]">menu_book</span>
                        </div>
                        <div className="min-w-0">
                            <p className="text-xs font-medium text-on-surface-variant truncate">Tracks</p>
                            <h2 className="text-xl sm:text-4xl font-extrabold text-on-surface transition-transform group-hover:scale-[1.02] origin-left truncate">{kpiData?.activeCourses || '1'}</h2>
                        </div>
                    </div>
                </div>

                {/* Total Balance */}
                <div className="bento-card rounded-2xl sm:rounded-3xl bg-surface-container-lowest p-3.5 md:p-md flex flex-col justify-between group border border-outline-variant/60 shadow-xs hover:shadow-md hover:border-primary/40 transition-all">
                    <div className="flex items-center gap-2 sm:gap-sm">
                        <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/50 border border-emerald-200/60 dark:border-emerald-800/40 flex items-center justify-center shrink-0">
                            <span className="material-symbols-outlined text-emerald-600 dark:text-emerald-400 text-[18px] sm:text-[24px]">account_balance_wallet</span>
                        </div>
                        <div className="min-w-0">
                            <p className="text-xs font-medium text-on-surface-variant truncate">Balance</p>
                            <h2 className="text-xl sm:text-4xl font-extrabold text-on-surface transition-transform group-hover:scale-[1.02] origin-left truncate">
                                ${financeSummary?.balance > 10000 ? (financeSummary.balance / 1000).toFixed(1) + 'K' : (financeSummary?.balance?.toFixed(0) || '0')}
                            </h2>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Grid for Feeds and Lists */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-md">
                {/* Quick Links Card */}
                <div className="bento-card rounded-2xl sm:rounded-3xl bg-surface-container-lowest p-4 md:p-lg flex flex-col border border-outline-variant/60 shadow-xs hover:shadow-md transition-all">
                    <div className="flex justify-between items-center mb-3 md:mb-md">
                        <h3 className="font-bold text-base sm:text-xl text-on-surface">Quick Actions</h3>
                        <span className="material-symbols-outlined text-primary text-[22px] sm:text-[28px]">bolt</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2.5 md:gap-4 flex-1">
                        <a href="/ceo/students" className="flex flex-col items-center justify-center p-3 sm:p-4 bg-blue-50/80 hover:bg-blue-100/90 dark:bg-blue-950/30 dark:hover:bg-blue-900/40 border border-blue-200/80 dark:border-blue-800/50 text-blue-700 dark:text-blue-300 rounded-xl sm:rounded-2xl transition-all text-center group cursor-pointer shadow-2xs">
                            <span className="material-symbols-outlined text-[24px] sm:text-[32px] mb-1 group-hover:scale-110 transition-transform">person_add</span>
                            <span className="text-xs sm:text-sm font-bold">Students</span>
                        </a>
                        <a href="/ceo/staff" className="flex flex-col items-center justify-center p-3 sm:p-4 bg-emerald-50/80 hover:bg-emerald-100/90 dark:bg-emerald-950/30 dark:hover:bg-emerald-900/40 border border-emerald-200/80 dark:border-emerald-800/50 text-emerald-700 dark:text-emerald-300 rounded-xl sm:rounded-2xl transition-all text-center group cursor-pointer shadow-2xs">
                            <span className="material-symbols-outlined text-[24px] sm:text-[32px] mb-1 group-hover:scale-110 transition-transform">badge</span>
                            <span className="text-xs sm:text-sm font-bold">Staff</span>
                        </a>
                        <a href="/ceo/finances" className="flex flex-col items-center justify-center p-3 sm:p-4 bg-amber-50/80 hover:bg-amber-100/90 dark:bg-amber-950/30 dark:hover:bg-amber-900/40 border border-amber-200/80 dark:border-amber-800/50 text-amber-700 dark:text-amber-300 rounded-xl sm:rounded-2xl transition-all text-center group cursor-pointer shadow-2xs">
                            <span className="material-symbols-outlined text-[24px] sm:text-[32px] mb-1 group-hover:scale-110 transition-transform">payments</span>
                            <span className="text-xs sm:text-sm font-bold">Finances</span>
                        </a>
                        <a href="/ceo/attendance" className="flex flex-col items-center justify-center p-3 sm:p-4 bg-purple-50/80 hover:bg-purple-100/90 dark:bg-purple-950/30 dark:hover:bg-purple-900/40 border border-purple-200/80 dark:border-purple-800/50 text-purple-700 dark:text-purple-300 rounded-xl sm:rounded-2xl transition-all text-center group cursor-pointer shadow-2xs">
                            <span className="material-symbols-outlined text-[24px] sm:text-[32px] mb-1 group-hover:scale-110 transition-transform">assignment</span>
                            <span className="text-xs sm:text-sm font-bold">Attendance</span>
                        </a>
                    </div>
                </div>

                {/* Today's Attendance Card */}
                <div className="bento-card rounded-2xl sm:rounded-3xl bg-surface-container-lowest p-4 md:p-lg flex flex-col max-h-[350px] sm:max-h-[400px] border border-outline-variant/60 shadow-xs hover:shadow-md transition-all">
                    <div className="flex justify-between items-center mb-3 md:mb-md">
                        <div>
                            <h3 className="font-bold text-base sm:text-xl text-on-surface">Today's Attendance</h3>
                            <p className="text-xs text-on-surface-variant">{attendanceData?.count || 0} students present</p>
                        </div>
                        <div className="flex items-center gap-1 sm:gap-sm">
                            <button
                                onClick={() => fetchDashboardData(false)}
                                className="text-on-surface-variant hover:text-on-surface transition-colors flex items-center justify-center rounded-full hover:bg-surface-variant p-1.5"
                                title="Refresh Attendance"
                            >
                                <span className="material-symbols-outlined text-[20px]">refresh</span>
                            </button>
                            <span className="material-symbols-outlined text-blue-600 dark:text-blue-400 text-[24px] sm:text-[32px]">group</span>
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto space-y-1.5 custom-scrollbar pr-1">
                        {filteredAttendanceNames.length > 0 ? (
                            filteredAttendanceNames.map((name, index) => (
                                <div key={index} className="flex items-center gap-2 p-2 bg-surface-variant/40 border border-outline-variant/40 rounded-xl hover:bg-surface-variant/70 transition-colors">
                                    <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-950/50 border border-blue-200/60 dark:border-blue-800/40 flex items-center justify-center text-blue-600 dark:text-blue-400 text-xs font-bold shrink-0">
                                        {name.charAt(0).toUpperCase()}
                                    </div>
                                    <span className="text-xs sm:text-sm text-on-surface font-medium truncate">{name}</span>
                                </div>
                            ))
                        ) : (
                            <p className="text-xs text-on-surface-variant text-center mt-6">No attendance marked today.</p>
                        )}
                    </div>
                </div>

                {/* Active Students List */}
                <div className="bento-card rounded-2xl sm:rounded-3xl bg-surface-container-lowest p-4 md:p-lg flex flex-col max-h-[350px] sm:max-h-[400px] border border-outline-variant/60 shadow-xs hover:shadow-md transition-all">
                    <div className="flex justify-between items-center mb-3 md:mb-md">
                        <div>
                            <h3 className="font-bold text-base sm:text-xl text-on-surface">Active Students</h3>
                            <p className="text-xs text-on-surface-variant">Enrolled students</p>
                        </div>
                        <span className="material-symbols-outlined text-blue-600 dark:text-blue-400 text-[24px] sm:text-[32px]">school</span>
                    </div>
                    <div className="flex-1 overflow-y-auto space-y-1.5 custom-scrollbar pr-1">
                        {studentList.length > 0 ? (
                            studentList.filter(student => {
                                const matchesSearch = (student.name || '').toLowerCase().includes((searchQuery || '').toLowerCase()) ||
                                                      student.email.toLowerCase().includes((searchQuery || '').toLowerCase());
                                const overrideBatch = (selectedBatch === 'All Batches' || selectedBatch === 'Global' || selectedBatch === 'Global Access') ? '' : (selectedBatch || '');
                                const matchesBatch = overrideBatch ? (student.batch || '').trim() === overrideBatch.trim() : true;
                                return matchesSearch && matchesBatch;
                            }).map((student, index) => (
                                <div key={index} className="flex items-center gap-2 p-2 bg-surface-variant/40 border border-outline-variant/40 rounded-xl group hover:bg-surface-variant/70 transition-colors">
                                    <div className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-950/50 border border-blue-200/60 dark:border-blue-800/40 flex items-center justify-center text-blue-600 dark:text-blue-400 text-xs font-bold shrink-0">
                                        {student.name ? student.name.charAt(0).toUpperCase() : (student.email ? student.email.charAt(0).toUpperCase() : 'S')}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs sm:text-sm font-semibold text-on-surface truncate">{student.name || 'N/A'}</p>
                                        <p className="text-[10px] sm:text-xs text-on-surface-variant truncate">{student.level || 'Student'} {student.batch ? `• ${student.batch}` : ''}</p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-xs text-on-surface-variant text-center mt-6">No active students found.</p>
                        )}
                    </div>
                </div>

                {/* Active Staff List */}
                <div className="bento-card rounded-2xl sm:rounded-3xl bg-surface-container-lowest p-4 md:p-lg flex flex-col max-h-[350px] sm:max-h-[400px] border border-outline-variant/60 shadow-xs hover:shadow-md transition-all">
                    <div className="flex justify-between items-center mb-3 md:mb-md">
                        <div>
                            <h3 className="font-bold text-base sm:text-xl text-on-surface">Active Staff</h3>
                            <p className="text-xs text-on-surface-variant">Assigned instructors</p>
                        </div>
                        <span className="material-symbols-outlined text-on-surface-variant text-[24px] sm:text-[32px]">badge</span>
                    </div>
                    <div className="flex-1 overflow-y-auto space-y-1.5 custom-scrollbar pr-1">
                        {staffList.length > 0 ? (
                            staffList.filter(staff => {
                                const matchesSearch = (staff.name || '').toLowerCase().includes((searchQuery || '').toLowerCase()) ||
                                                      staff.email.toLowerCase().includes((searchQuery || '').toLowerCase());
                                const overrideBatch = (selectedBatch === 'All Batches' || selectedBatch === 'Global' || selectedBatch === 'Global Access') ? '' : (selectedBatch || '');
                                const matchesBatch = overrideBatch ? (staff.batch || '').trim() === overrideBatch.trim() : true;
                                return matchesSearch && matchesBatch;
                            }).map((staff, index) => (
                                <div key={index} className="flex items-center gap-2 p-2 bg-surface-variant/40 border border-outline-variant/40 rounded-xl group hover:bg-surface-variant/70 transition-colors">
                                    <div className="w-7 h-7 rounded-full bg-surface-container-high border border-outline-variant/60 flex items-center justify-center text-on-surface-variant text-xs font-bold shrink-0">
                                        {staff.name ? staff.name.charAt(0).toUpperCase() : (staff.email ? staff.email.charAt(0).toUpperCase() : 'S')}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs sm:text-sm font-semibold text-on-surface truncate">{staff.name || 'N/A'}</p>
                                        <p className="text-[10px] sm:text-xs text-on-surface-variant truncate">{staff.level || 'Staff'} {staff.batch ? `• ${staff.batch}` : ''}</p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-xs text-on-surface-variant text-center mt-6">No active staff found.</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Live Student & Staff Activity Feed */}
            <div className="bento-card rounded-2xl sm:rounded-3xl bg-surface-container-lowest p-4 md:p-lg flex flex-col border border-outline-variant/60 shadow-xs hover:shadow-md transition-all w-full max-w-full">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 md:mb-md">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20">
                            <span className="material-symbols-outlined text-[20px]">monitoring</span>
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="font-bold text-base sm:text-lg text-on-surface">Live Activity Stream</h3>
                                {activitySummary && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50 text-[11px] font-bold">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                        {activitySummary.total_online} Online Now
                                    </span>
                                )}
                            </div>
                            <p className="text-xs text-on-surface-variant">Real-time student & staff logins, logouts, and platform actions</p>
                        </div>
                    </div>
                    <a
                        href="/ceo/performance"
                        className="text-xs font-bold text-primary hover:underline flex items-center gap-1 self-start sm:self-auto cursor-pointer"
                    >
                        <span>View Full Monitor</span>
                        <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                    </a>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
                    {recentActivities.length > 0 ? (
                        recentActivities.map((act) => (
                            <div
                                key={act.id}
                                className="p-3 rounded-xl bg-surface-variant/40 border border-outline-variant/40 flex items-start gap-2.5 hover:bg-surface-variant/70 transition-colors"
                            >
                                <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center shrink-0 text-primary mt-0.5 border border-outline-variant/30">
                                    <span className="material-symbols-outlined text-[18px]">
                                        {act.activity_type === 'login' ? 'login' :
                                         act.activity_type === 'logout' ? 'logout' :
                                         act.activity_type === 'test_submit' ? 'assignment_turned_in' :
                                         act.activity_type === 'material_view' ? 'menu_book' :
                                         act.activity_type === 'video_watch' ? 'smart_display' : 'visibility'}
                                    </span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-1">
                                        <p className="text-xs font-bold text-on-surface truncate">{act.user_name}</p>
                                        <span className="text-[10px] text-outline font-medium shrink-0">
                                            {act.timestamp ? new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                        </span>
                                    </div>
                                    <p className="text-[11px] text-on-surface-variant line-clamp-1 mt-0.5">{act.action}</p>
                                    <span className={`inline-block mt-1 text-[9px] font-bold px-1.5 py-0.2 rounded-full border capitalize ${
                                        act.role === 'staff' ? 'bg-blue-100 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800/40' :
                                        act.role === 'ceo' ? 'bg-purple-100 dark:bg-purple-950/40 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-800/40' :
                                        'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/40'
                                    }`}>
                                        {act.role}
                                    </span>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="col-span-full py-8 text-center text-xs text-on-surface-variant">
                            No recent activity recorded yet.
                        </div>
                    )}
                </div>
            </div>

            {/* Student Test Submissions Aggregated View */}
            <div className="bento-card rounded-2xl sm:rounded-3xl bg-surface-container-lowest p-4 md:p-lg overflow-hidden flex flex-col h-[400px] sm:h-[500px] border border-outline-variant/60 shadow-xs hover:shadow-md transition-all w-full max-w-full">
                <div className="flex justify-between items-center mb-3 md:mb-md">
                    <div>
                        <h3 className="font-bold text-base sm:text-xl text-on-surface">Student Test Submissions</h3>
                        <p className="text-xs text-on-surface-variant">Aggregated overview of tests and scores</p>
                    </div>
                    <div className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-on-surface-variant cursor-pointer hover:text-on-surface transition-colors text-[20px]">filter_list</span>
                    </div>
                </div>

                <div className="flex-1 overflow-x-auto custom-scrollbar w-full border border-outline-variant/40 rounded-xl">
                    <table className="w-full text-left border-collapse min-w-[500px]">
                        <thead className="sticky top-0 bg-surface-container-high border-b border-outline-variant/60 z-10">
                            <tr>
                                <th className="p-2.5 sm:p-3 text-xs font-semibold text-on-surface-variant">Student</th>
                                <th className="p-2.5 sm:p-3 text-xs font-semibold text-on-surface-variant">Test</th>
                                <th className="p-2.5 sm:p-3 text-xs font-semibold text-on-surface-variant">Submitted</th>
                                <th className="p-2.5 sm:p-3 text-xs font-semibold text-on-surface-variant">Status</th>
                                <th className="p-2.5 sm:p-3 text-xs font-semibold text-on-surface-variant text-right">Score</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredSubmissionsData.length > 0 ? (
                                filteredSubmissionsData.map((sub) => (
                                    <tr key={sub.id} className="border-b border-outline-variant/30 hover:bg-surface-container-high/40 transition-colors">
                                        <td className="p-2.5 sm:p-3">
                                            <div className="text-xs font-semibold text-on-surface">{sub.student_name}</div>
                                        </td>
                                        <td className="p-2.5 sm:p-3">
                                            <div className="text-xs text-on-surface-variant truncate max-w-[150px]">{sub.test_title}</div>
                                        </td>
                                        <td className="p-2.5 sm:p-3 text-xs text-on-surface-variant">
                                            {new Date(sub.submitted_at).toLocaleDateString()}
                                        </td>
                                        <td className="p-2.5 sm:p-3">
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                                                sub.status === 'Reviewed' 
                                                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/40' :
                                                sub.status === 'Needs Work' 
                                                    ? 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800/40' :
                                                    'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/40'
                                            }`}>
                                                {sub.status || 'Pending'}
                                            </span>
                                        </td>
                                        <td className="p-2.5 sm:p-3 text-right text-xs text-on-surface font-bold">
                                            {sub.staff_comments ? (sub.status === 'Reviewed' ? 'Pass' : 'Fail') : '-'}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="p-6 text-center text-xs text-on-surface-variant">
                                        No student submissions found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </section>
    );
}

