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

            if (kpiRes.ok) {
                setKpiData(await kpiRes.json());
            } else {
                setKpiData({
                    totalRevenue: "$0",
                    revenueGrowth: "+0%",
                    activeStudents: "0",
                    studentsGrowth: "+0%",
                    activeStaff: "0",
                    courseCompletionRate: "0%",
                    completionGrowth: "+0%",
                    averageRating: "0.0",
                    ratingGrowth: "+0.0"
                });
            }

            if (chartRes.ok) {
                setChartData(await chartRes.json());
            } else {
                setChartData([]);
            }

            if (attendanceRes.ok) {
                setAttendanceData(await attendanceRes.json());
            } else {
                setAttendanceData({ present: 0, absent: 0, percentage: 0 });
            }

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
        <div className="max-w-[1440px] mx-auto p-gutter space-y-lg relative pb-32 animate-fade-in">
            {/* Header Section */}
            <section className="flex flex-col md:flex-row md:items-center justify-between gap-md mb-lg">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="material-symbols-outlined text-primary text-3xl">admin_panel_settings</span>
                        <h1 className="text-3xl md:text-4xl font-bold tracking-tight bg-gradient-to-r from-[#6FB7E4] via-[#5D8BCC] to-[#465AA3] text-transparent bg-clip-text">
                            {greeting}
                        </h1>
                    </div>
                    <p className="font-body-md text-on-surface-variant">
                        Here is your executive command center and institutional overview for today.
                    </p>
                </div>

                {/* Batch Filter Pill */}
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-surface-container-lowest border border-outline-variant/70 text-on-surface text-xs font-bold shadow-xs">
                        <span className="material-symbols-outlined text-primary text-[18px]">domain</span>
                        <span>{selectedBatch || 'Global Access'}</span>
                    </div>
                </div>
            </section>

            {/* KPI Metrics Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {/* 1. Students */}
                <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-3xl p-5 custom-shadow hover:shadow-md transition-shadow flex flex-col justify-between group">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Enrolled Students</p>
                            <h2 className="text-3xl font-extrabold text-on-surface mt-1">
                                {kpiData?.activeStudents || '0'}
                            </h2>
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                            <span className="material-symbols-outlined text-[26px]">school</span>
                        </div>
                    </div>
                    <div className="mt-4 pt-3 border-t border-outline-variant/40 flex items-center justify-between">
                        <span className="text-xs text-on-surface-variant">Active academy learners</span>
                        <a href="/ceo/students" className="text-xs font-bold text-primary hover:underline flex items-center gap-0.5">
                            Students <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                        </a>
                    </div>
                </div>

                {/* 2. Staff */}
                <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-3xl p-5 custom-shadow hover:shadow-md transition-shadow flex flex-col justify-between group">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Active Staff</p>
                            <h2 className="text-3xl font-extrabold text-on-surface mt-1">
                                {kpiData?.activeStaff || '0'}
                            </h2>
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                            <span className="material-symbols-outlined text-[26px]">badge</span>
                        </div>
                    </div>
                    <div className="mt-4 pt-3 border-t border-outline-variant/40 flex items-center justify-between">
                        <span className="text-xs text-on-surface-variant">Assigned instructors</span>
                        <a href="/ceo/staff" className="text-xs font-bold text-primary hover:underline flex items-center gap-0.5">
                            Staff <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                        </a>
                    </div>
                </div>

                {/* 3. Tracks */}
                <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-3xl p-5 custom-shadow hover:shadow-md transition-shadow flex flex-col justify-between group">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Learning Tracks</p>
                            <h2 className="text-3xl font-extrabold text-on-surface mt-1">
                                {kpiData?.activeCourses || '1'}
                            </h2>
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                            <span className="material-symbols-outlined text-[26px]">menu_book</span>
                        </div>
                    </div>
                    <div className="mt-4 pt-3 border-t border-outline-variant/40 flex items-center justify-between">
                        <span className="text-xs text-on-surface-variant">Curriculum levels</span>
                        <a href="/ceo/materials" className="text-xs font-bold text-primary hover:underline flex items-center gap-0.5">
                            Materials <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                        </a>
                    </div>
                </div>

                {/* 4. Treasury Balance */}
                <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-3xl p-5 custom-shadow hover:shadow-md transition-shadow flex flex-col justify-between group">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Treasury Balance</p>
                            <h2 className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
                                ${financeSummary?.balance > 10000 ? (financeSummary.balance / 1000).toFixed(1) + 'K' : (financeSummary?.balance?.toFixed(0) || '0')}
                            </h2>
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                            <span className="material-symbols-outlined text-[26px]">account_balance_wallet</span>
                        </div>
                    </div>
                    <div className="mt-4 pt-3 border-t border-outline-variant/40 flex items-center justify-between">
                        <span className="text-xs text-on-surface-variant">Net cash balance</span>
                        <a href="/ceo/finances" className="text-xs font-bold text-primary hover:underline flex items-center gap-0.5">
                            Finances <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                        </a>
                    </div>
                </div>
            </div>

            {/* Main Middle Row: Today's Attendance & Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                {/* Today's Attendance Section (Col-Span 7) */}
                <div className="lg:col-span-7 bg-surface-container-lowest border border-outline-variant/60 rounded-3xl p-5 md:p-6 custom-shadow hover:shadow-md transition-all flex flex-col">
                    <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center gap-2.5">
                            <div className="w-10 h-10 rounded-2xl bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                                <span className="material-symbols-outlined text-[22px]">calendar_today</span>
                            </div>
                            <div>
                                <h3 className="font-bold text-base md:text-lg text-on-surface">Today's Attendance</h3>
                                <p className="text-xs text-on-surface-variant">{attendanceData?.count || 0} students present today</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <button
                                onClick={() => fetchDashboardData(false)}
                                className="text-on-surface-variant hover:text-on-surface transition-colors flex items-center justify-center rounded-xl hover:bg-surface-container p-2"
                                title="Refresh Attendance"
                            >
                                <span className="material-symbols-outlined text-[20px]">refresh</span>
                            </button>
                            <a 
                                href="/ceo/attendance" 
                                className="text-xs font-bold text-primary hover:underline flex items-center gap-0.5 ml-2"
                            >
                                View Report <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                            </a>
                        </div>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto max-h-[320px] space-y-2 custom-scrollbar pr-1">
                        {filteredAttendanceNames.length > 0 ? (
                            filteredAttendanceNames.map((name, index) => (
                                <div key={index} className="flex items-center justify-between p-3 bg-surface-container-low/60 hover:bg-surface-container-high/60 border border-outline-variant/40 rounded-2xl transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-950/50 border border-blue-200/60 dark:border-blue-800/40 flex items-center justify-center text-blue-600 dark:text-blue-400 text-xs font-bold shrink-0">
                                            {name.charAt(0).toUpperCase()}
                                        </div>
                                        <span className="text-xs sm:text-sm text-on-surface font-semibold truncate">{name}</span>
                                    </div>
                                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40">
                                        Present
                                    </span>
                                </div>
                            ))
                        ) : (
                            <div className="flex flex-col items-center justify-center py-12 text-center text-on-surface-variant">
                                <span className="material-symbols-outlined text-[36px] text-outline opacity-40 mb-1">assignment_turned_in</span>
                                <p className="text-xs font-medium">No attendance marked yet today.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Quick Actions (Col-Span 5 - Matching Staff Quick Actions) */}
                <div className="lg:col-span-5 bg-surface-container-lowest border border-outline-variant/60 rounded-3xl p-5 md:p-6 custom-shadow hover:shadow-md transition-all flex flex-col justify-between">
                    <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary text-[22px]">bolt</span>
                            <h3 className="font-bold text-base md:text-lg text-on-surface">Executive Actions</h3>
                        </div>
                    </div>

                    <div className="space-y-2.5 flex-1 flex flex-col justify-center">
                        <a 
                            href="/ceo/students" 
                            className="w-full bg-primary text-on-primary p-3.5 rounded-2xl flex items-center justify-between hover:opacity-95 transition-all shadow-xs group cursor-pointer"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                                    <span className="material-symbols-outlined text-[20px]">person_add</span>
                                </div>
                                <div className="text-left">
                                    <h4 className="font-bold text-xs sm:text-sm">Manage Students</h4>
                                    <p className="text-[11px] opacity-80">Enrollment, levels & batches</p>
                                </div>
                            </div>
                            <span className="material-symbols-outlined text-[18px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
                        </a>

                        <a 
                            href="/ceo/staff" 
                            className="w-full bg-surface-container-low hover:bg-surface-container-high border border-outline-variant/60 text-on-surface p-3.5 rounded-2xl flex items-center justify-between transition-all group cursor-pointer"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                                    <span className="material-symbols-outlined text-[20px]">badge</span>
                                </div>
                                <div className="text-left">
                                    <h4 className="font-bold text-xs sm:text-sm">Staff & Faculty</h4>
                                    <p className="text-[11px] text-on-surface-variant">Instructor assignments & access</p>
                                </div>
                            </div>
                            <span className="material-symbols-outlined text-[18px] text-outline group-hover:text-primary group-hover:translate-x-1 transition-all">arrow_forward</span>
                        </a>

                        <a 
                            href="/ceo/finances" 
                            className="w-full bg-surface-container-low hover:bg-surface-container-high border border-outline-variant/60 text-on-surface p-3.5 rounded-2xl flex items-center justify-between transition-all group cursor-pointer"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                                    <span className="material-symbols-outlined text-[20px]">payments</span>
                                </div>
                                <div className="text-left">
                                    <h4 className="font-bold text-xs sm:text-sm">Financial Ledger</h4>
                                    <p className="text-[11px] text-on-surface-variant">Income, expenses & cashflow</p>
                                </div>
                            </div>
                            <span className="material-symbols-outlined text-[18px] text-outline group-hover:text-primary group-hover:translate-x-1 transition-all">arrow_forward</span>
                        </a>

                        <a 
                            href="/ceo/attendance" 
                            className="w-full bg-surface-container-low hover:bg-surface-container-high border border-outline-variant/60 text-on-surface p-3.5 rounded-2xl flex items-center justify-between transition-all group cursor-pointer"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-xl bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                                    <span className="material-symbols-outlined text-[20px]">assignment</span>
                                </div>
                                <div className="text-left">
                                    <h4 className="font-bold text-xs sm:text-sm">Attendance Reports</h4>
                                    <p className="text-[11px] text-on-surface-variant">Daily student roll-call & logs</p>
                                </div>
                            </div>
                            <span className="material-symbols-outlined text-[18px] text-outline group-hover:text-primary group-hover:translate-x-1 transition-all">arrow_forward</span>
                        </a>
                    </div>
                </div>
            </div>

            {/* Active Students & Staff Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* Active Students List */}
                <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-3xl p-5 md:p-6 custom-shadow hover:shadow-md transition-all flex flex-col max-h-[380px]">
                    <div className="flex justify-between items-center mb-4">
                        <div>
                            <h3 className="font-bold text-base md:text-lg text-on-surface">Active Students</h3>
                            <p className="text-xs text-on-surface-variant">Enrolled learners in the academy</p>
                        </div>
                        <a href="/ceo/students" className="text-xs font-bold text-primary hover:underline flex items-center gap-0.5">
                            All Students <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                        </a>
                    </div>
                    <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar pr-1">
                        {studentList.length > 0 ? (
                            studentList.filter(student => {
                                const matchesSearch = (student.name || '').toLowerCase().includes((searchQuery || '').toLowerCase()) ||
                                                      student.email.toLowerCase().includes((searchQuery || '').toLowerCase());
                                const overrideBatch = (selectedBatch === 'All Batches' || selectedBatch === 'Global' || selectedBatch === 'Global Access') ? '' : (selectedBatch || '');
                                const matchesBatch = overrideBatch ? (student.batch || '').trim() === overrideBatch.trim() : true;
                                return matchesSearch && matchesBatch;
                            }).slice(0, 8).map((student, index) => (
                                <div key={index} className="flex items-center justify-between p-3 bg-surface-container-low/60 hover:bg-surface-container-high/60 border border-outline-variant/40 rounded-2xl group transition-colors">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-950/50 border border-blue-200/60 dark:border-blue-800/40 flex items-center justify-center text-blue-600 dark:text-blue-400 text-xs font-bold shrink-0">
                                            {student.name ? student.name.charAt(0).toUpperCase() : (student.email ? student.email.charAt(0).toUpperCase() : 'S')}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-xs sm:text-sm font-semibold text-on-surface truncate">{student.name || 'N/A'}</p>
                                            <p className="text-[10px] text-on-surface-variant truncate">{student.email}</p>
                                        </div>
                                    </div>
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant shrink-0 ml-2">
                                        {student.level || 'Student'}
                                    </span>
                                </div>
                            ))
                        ) : (
                            <p className="text-xs text-on-surface-variant text-center py-10">No active students found.</p>
                        )}
                    </div>
                </div>

                {/* Active Staff List */}
                <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-3xl p-5 md:p-6 custom-shadow hover:shadow-md transition-all flex flex-col max-h-[380px]">
                    <div className="flex justify-between items-center mb-4">
                        <div>
                            <h3 className="font-bold text-base md:text-lg text-on-surface">Active Staff</h3>
                            <p className="text-xs text-on-surface-variant">Instructors and mentors</p>
                        </div>
                        <a href="/ceo/staff" className="text-xs font-bold text-primary hover:underline flex items-center gap-0.5">
                            All Staff <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                        </a>
                    </div>
                    <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar pr-1">
                        {staffList.length > 0 ? (
                            staffList.filter(staff => {
                                const matchesSearch = (staff.name || '').toLowerCase().includes((searchQuery || '').toLowerCase()) ||
                                                      staff.email.toLowerCase().includes((searchQuery || '').toLowerCase());
                                const overrideBatch = (selectedBatch === 'All Batches' || selectedBatch === 'Global' || selectedBatch === 'Global Access') ? '' : (selectedBatch || '');
                                const matchesBatch = overrideBatch ? (staff.batch || '').trim() === overrideBatch.trim() : true;
                                return matchesSearch && matchesBatch;
                            }).slice(0, 8).map((staff, index) => (
                                <div key={index} className="flex items-center justify-between p-3 bg-surface-container-low/60 hover:bg-surface-container-high/60 border border-outline-variant/40 rounded-2xl group transition-colors">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-950/50 border border-emerald-200/60 dark:border-emerald-800/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400 text-xs font-bold shrink-0">
                                            {staff.name ? staff.name.charAt(0).toUpperCase() : (staff.email ? staff.email.charAt(0).toUpperCase() : 'S')}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-xs sm:text-sm font-semibold text-on-surface truncate">{staff.name || 'N/A'}</p>
                                            <p className="text-[10px] text-on-surface-variant truncate">{staff.email}</p>
                                        </div>
                                    </div>
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40 shrink-0 ml-2">
                                        {staff.role || 'Staff'}
                                    </span>
                                </div>
                            ))
                        ) : (
                            <p className="text-xs text-on-surface-variant text-center py-10">No active staff found.</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Live Student & Staff Activity Stream */}
            <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-3xl p-5 md:p-6 custom-shadow hover:shadow-md transition-all flex flex-col">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                    <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20">
                            <span className="material-symbols-outlined text-[22px]">monitoring</span>
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="font-bold text-base md:text-lg text-on-surface">Live Activity Stream</h3>
                                {activitySummary && (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50 text-[11px] font-bold">
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

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {recentActivities.length > 0 ? (
                        recentActivities.map((act) => (
                            <div
                                key={act.id}
                                className="p-3.5 rounded-2xl bg-surface-container-low/60 border border-outline-variant/40 flex items-start gap-3 hover:bg-surface-container-high/60 transition-colors"
                            >
                                <div className="w-9 h-9 rounded-xl bg-surface-container flex items-center justify-center shrink-0 text-primary mt-0.5 border border-outline-variant/30">
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
                                    <span className={`inline-block mt-1 text-[9px] font-bold px-2 py-0.2 rounded-full border capitalize ${
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
            <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-3xl p-5 md:p-6 custom-shadow hover:shadow-md transition-all flex flex-col">
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <h3 className="font-bold text-base md:text-lg text-on-surface">Student Test Submissions</h3>
                        <p className="text-xs text-on-surface-variant">Aggregated overview of tests and scores</p>
                    </div>
                    <a href="/ceo/tests" className="text-xs font-bold text-primary hover:underline flex items-center gap-0.5">
                        All Tests <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                    </a>
                </div>

                <div className="overflow-x-auto custom-scrollbar w-full border border-outline-variant/40 rounded-2xl">
                    <table className="w-full text-left border-collapse min-w-[500px]">
                        <thead className="bg-surface-container-low border-b border-outline-variant/60">
                            <tr>
                                <th className="p-3 text-xs font-bold text-on-surface-variant">Student</th>
                                <th className="p-3 text-xs font-bold text-on-surface-variant">Test</th>
                                <th className="p-3 text-xs font-bold text-on-surface-variant">Submitted</th>
                                <th className="p-3 text-xs font-bold text-on-surface-variant">Status</th>
                                <th className="p-3 text-xs font-bold text-on-surface-variant text-right">Score</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-outline-variant/30">
                            {filteredSubmissionsData.length > 0 ? (
                                filteredSubmissionsData.slice(0, 10).map((sub) => {
                                    const isApproved = sub.status === 'Approved' || sub.status === 'Reviewed';
                                    const isNeedWork = sub.status === 'Need Work' || sub.status === 'Needs Work' || sub.status === 'Failed';

                                    return (
                                        <tr key={sub.id} className="hover:bg-surface-container-low/60 transition-colors">
                                            <td className="p-3">
                                                <div className="text-xs font-bold text-on-surface">{sub.student_name || 'Student'}</div>
                                            </td>
                                            <td className="p-3">
                                                <div className="text-xs text-on-surface-variant truncate max-w-[180px]">{sub.test_title || 'Assessment'}</div>
                                            </td>
                                            <td className="p-3 text-xs text-on-surface-variant">
                                                {sub.submitted_at ? new Date(sub.submitted_at).toLocaleDateString() : 'Recent'}
                                            </td>
                                            <td className="p-3">
                                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                                                    isApproved
                                                        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/40' :
                                                    isNeedWork 
                                                        ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/40' :
                                                        'bg-primary/10 text-primary border-primary/20'
                                                }`}>
                                                    {isApproved ? 'Approved' : isNeedWork ? 'Need Work' : (sub.status || 'Pending')}
                                                </span>
                                            </td>
                                            <td className="p-3 text-right text-xs text-on-surface font-bold">
                                                {sub.staff_comments ? (isApproved ? 'Pass' : 'Need Work') : '-'}
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan="5" className="p-8 text-center text-xs text-on-surface-variant">
                                        No student submissions recorded yet.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

