'use client';
import { useState, useEffect } from 'react';
import StudentPerformanceChart from '@/app/components/StudentPerformanceChart';
import { useCEOContext } from '@/app/ceo/CEOContext';
export default function CEODashboard() {
    const { searchQuery, selectedBatch } = useCEOContext();
    const [kpiData, setKpiData] = useState(null);
    const [activityData, setActivityData] = useState(null);
    const [chartData, setChartData] = useState(null);
    const [attendanceData, setAttendanceData] = useState(null);
    const [submissionsData, setSubmissionsData] = useState(null);
    const [profile, setProfile] = useState(null);
    const [financeSummary, setFinanceSummary] = useState(null);
    const [staffList, setStaffList] = useState([]);
    const [studentList, setStudentList] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showActivityMenu, setShowActivityMenu] = useState(false);

    const fetchDashboardData = async (showLoading = false) => {
        if (showLoading) setIsLoading(true);
        try {
            const token = localStorage.getItem('token');
            const headers = {
                'Authorization': `Bearer ${token}`
            };

            const batchQuery = (selectedBatch && selectedBatch !== 'All Batches') ? `?batch=${encodeURIComponent(selectedBatch)}` : '';
            const [kpiRes, activityRes, chartRes, attendanceRes, submissionsRes, profileRes, financeRes, staffRes, studentRes] = await Promise.all([
                fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/dashboard/ceo/kpi${batchQuery}`, { headers }),
                fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/dashboard/ceo/recent-activity`, { headers }),
                fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/dashboard/ceo/performance-chart`, { headers }),
                fetch(`${process.env.NEXT_PUBLIC_ATTENDANCE_API_URL || 'http://localhost:8002'}/api/attendance/today`, { headers }),
                fetch(`${process.env.NEXT_PUBLIC_TEST_API_URL || 'http://localhost:8003'}/api/tests/submissions/all`, { headers }),
                fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/user/profile`, { headers }),
                fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/finance`, { headers }),
                fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/user/staff`, { headers }),
                fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/user/students`, { headers })
            ]);

            if (!kpiRes.ok || !activityRes.ok || !chartRes.ok || !attendanceRes.ok) {
                throw new Error('Failed to fetch dashboard data');
            }

            setKpiData(await kpiRes.json());
            setActivityData(await activityRes.json());
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

    const filteredActivityData = activityData?.filter(activity =>
        activity.user.toLowerCase().includes((searchQuery || '').toLowerCase()) ||
        activity.action.toLowerCase().includes((searchQuery || '').toLowerCase())
    ) || [];

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
        <section className="p-gutter max-w-[1440px] mx-auto space-y-lg">
            {/* Header Section */}
            <div className="mb-md">
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight bg-gradient-to-r from-[#6FB7E4] via-[#5D8BCC] to-[#465AA3] text-transparent bg-clip-text">
                    {greeting}
                </h1>
                <p className="font-body-lg text-on-surface-variant mt-xs">Here's what's happening at the academy today.</p>
            </div>

            {/* KPI Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-md">
                {/* Total Students */}
                <div className="bento-card rounded-3xl bg-gradient-to-br from-[#465AA3]/5 via-[#5D8BCC]/5 to-[#6FB7E4]/5 p-md flex flex-col justify-between group border border-[#5D8BCC]/20 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-sm mb-md">
                        <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                            <span className="material-symbols-outlined text-blue-600 text-[24px]">school</span>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500 mb-xs">Total Students</p>
                            <h2 className="text-4xl font-extrabold text-gray-900 transition-transform group-hover:scale-[1.02] origin-left">{kpiData?.activeStudents || '0'}</h2>
                        </div>
                    </div>
                </div>

                {/* Total Staff */}
                <div className="bento-card rounded-3xl bg-gradient-to-br from-[#465AA3]/5 via-[#5D8BCC]/5 to-[#6FB7E4]/5 p-md flex flex-col justify-between group border border-[#5D8BCC]/20 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-sm mb-md">
                        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                            <span className="material-symbols-outlined text-gray-600 text-[24px]">badge</span>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500 mb-xs">Total Staff</p>
                            <h2 className="text-4xl font-extrabold text-gray-900 transition-transform group-hover:scale-[1.02] origin-left">{kpiData?.activeStaff || '0'}</h2>
                        </div>
                    </div>
                  
                </div>

                {/* Active Courses */}
                <div className="bento-card rounded-3xl bg-gradient-to-br from-[#465AA3]/5 via-[#5D8BCC]/5 to-[#6FB7E4]/5 p-md flex flex-col justify-between group border border-[#5D8BCC]/20 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-sm mb-md">
                        <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center shrink-0">
                            <span className="material-symbols-outlined text-purple-600 text-[24px]">menu_book</span>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500 mb-xs">Active Tracks</p>
                            <h2 className="text-4xl font-extrabold text-gray-900 transition-transform group-hover:scale-[1.02] origin-left">{kpiData?.activeCourses || '1'}</h2>
                        </div>
                    </div>
                    
                </div>

                {/* Total Balance */}
                <div className="bento-card rounded-3xl bg-gradient-to-br from-[#465AA3]/5 via-[#5D8BCC]/5 to-[#6FB7E4]/5 p-md flex flex-col justify-between group border border-[#5D8BCC]/20 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-sm mb-md">
                        <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                            <span className="material-symbols-outlined text-green-600 text-[24px]">account_balance_wallet</span>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500 mb-xs">Total Balance</p>
                            <h2 className="text-4xl font-extrabold text-gray-900 transition-transform group-hover:scale-[1.02] origin-left">
                                ${financeSummary?.balance > 10000 ? (financeSummary.balance / 1000).toFixed(1) + 'K' : (financeSummary?.balance?.toFixed(2) || '0.00')}
                            </h2>
                        </div>
                    </div>

                </div>
            </div>

            {/* Dashboard Main Chart */}
            <div className="bento-card rounded-3xl bg-white p-lg overflow-hidden relative group border border-outline-variant shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-lg">
                    <div>
                        <h3 className="font-headline-md text-headline-md text-on-surface">Student Performance Trends</h3>
                        <p className="font-body-sm text-body-sm text-on-surface-variant">Average score across all departments</p>
                    </div>
                    <select className="bg-surface border border-outline-variant rounded-lg font-label-sm text-label-sm text-on-surface focus:ring-0 cursor-pointer hover:bg-surface-variant transition-colors p-2">
                        <option>Last 6 Months</option>
                        <option>Academic Year</option>
                    </select>
                </div>

                {/* Render the chart component here, passing data */}
                <StudentPerformanceChart data={chartData} />
            </div>

            {/* Bottom Grid for Feeds and Lists */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-md">
                {/* Staff Activities Feed */}
                <div className="bento-card rounded-3xl bg-white p-lg flex flex-col h-full max-h-[400px] border border-outline-variant shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-center mb-md relative">
                        <h3 className="font-headline-md text-headline-md text-on-surface">Recent Activities</h3>
                        <div className="relative">
                            <span
                                className="material-symbols-outlined text-on-surface-variant cursor-pointer hover:text-on-surface transition-colors hover:scale-110 active:scale-95"
                                onClick={() => setShowActivityMenu(!showActivityMenu)}
                            >
                                more_vert
                            </span>
                            {showActivityMenu && (
                                <div className="absolute right-0 top-full mt-2 w-48 bg-surface shadow-lg rounded-xl border border-outline-variant overflow-hidden z-10">
                                    <button
                                        onClick={async () => {
                                            try {
                                                const token = localStorage.getItem('token');
                                                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/dashboard/ceo/recent-activity`, {
                                                    method: 'DELETE',
                                                    headers: { 'Authorization': `Bearer ${token}` }
                                                });
                                                if (res.ok) {
                                                    setActivityData([]);
                                                } else {
                                                    console.error('Failed to delete activities');
                                                }
                                            } catch (err) {
                                                console.error('Error deleting activities:', err);
                                            } finally {
                                                setShowActivityMenu(false);
                                            }
                                        }}
                                        className="w-full text-left px-4 py-3 hover:bg-surface-variant transition-colors text-error flex items-center gap-2 font-label-md"
                                    >
                                        <span className="material-symbols-outlined text-[20px]">delete</span>
                                        Clear All Activities
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto space-y-md custom-scrollbar pr-xs">
                        {filteredActivityData.map((activity) => (
                            <div key={activity.id} className="flex gap-sm group cursor-pointer hover:bg-surface-variant p-2 -mx-2 rounded-lg transition-colors">
                                <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                                    <span className="material-symbols-outlined text-blue-600 text-[18px]">
                                        {activity.type === 'enrollment' ? 'person_add' : activity.type === 'completion' ? 'school' : 'admin_panel_settings'}
                                    </span>
                                </div>
                                <div>
                                    <p className="font-label-md text-label-md text-on-surface">{activity.user}</p>
                                    <p className="font-body-sm text-body-sm text-on-surface-variant">{activity.action}</p>
                                    <p className="font-label-sm text-label-sm text-on-surface-variant/60 mt-xs">{activity.time}</p>
                                </div>
                            </div>
                        ))}

                        {filteredActivityData.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-6 text-center h-full">
                                <svg width="140" height="100" viewBox="0 0 160 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="mb-4 opacity-80">
                                    <rect x="30" y="20" width="100" height="80" rx="8" fill="#EFF6FF"/>
                                    <path d="M50 45H110" stroke="#93C5FD" strokeWidth="6" strokeLinecap="round"/>
                                    <path d="M50 65H90" stroke="#93C5FD" strokeWidth="6" strokeLinecap="round"/>
                                    <path d="M50 85H100" stroke="#93C5FD" strokeWidth="6" strokeLinecap="round"/>
                                    <circle cx="120" cy="85" r="16" fill="#3B82F6" className="animate-bounce" style={{animationDuration: '2s'}}/>
                                    <path d="M114 85L118 89L126 81" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                                <h4 className="text-label-lg font-bold text-on-surface mb-1">No activities found</h4>
                                <p className="text-body-sm text-on-surface-variant mb-4 max-w-[220px]">It looks like there hasn't been any recent activity. Check back later or create one!</p>
                                <button className="bg-blue-600 hover:bg-blue-700 text-white font-label-md py-2 px-5 rounded-full transition-colors flex items-center gap-2 shadow-sm hover:shadow-md active:scale-95">
                                    <span className="material-symbols-outlined text-[18px]">add</span>
                                    Create new activity
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Today's Attendance Card */}
                <div className="bento-card rounded-3xl bg-white p-lg flex flex-col h-full max-h-[400px] border border-outline-variant shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-center mb-md">
                        <div>
                            <h3 className="font-headline-md text-headline-md text-on-surface">Today's Attendance</h3>
                            <p className="font-body-sm text-on-surface-variant">{attendanceData?.count || 0} students present</p>
                        </div>
                        <div className="flex items-center gap-sm">
                            <button
                                onClick={() => fetchDashboardData(false)}
                                className="text-on-surface-variant hover:text-on-surface transition-colors flex items-center justify-center rounded-full hover:bg-surface-variant p-2"
                                title="Refresh Attendance"
                            >
                                <span className="material-symbols-outlined">refresh</span>
                            </button>
                            <span className="material-symbols-outlined text-blue-600 text-[32px]">group</span>
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto space-y-xs custom-scrollbar">
                        {filteredAttendanceNames.length > 0 ? (
                            filteredAttendanceNames.map((name, index) => (
                                <div key={index} className="flex items-center gap-sm p-sm bg-surface-variant/50 rounded-lg">
                                    <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xs font-bold">
                                        {name.charAt(0).toUpperCase()}
                                    </div>
                                    <span className="font-label-md text-on-surface">{name}</span>
                                </div>
                            ))
                        ) : (
                            <p className="text-body-sm text-on-surface-variant text-center mt-md">No attendance marked today.</p>
                        )}
                    </div>
                </div>

                {/* Active Students List */}
                <div className="bento-card rounded-3xl bg-white p-lg flex flex-col h-full max-h-[400px] border border-outline-variant shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-center mb-md">
                        <div>
                            <h3 className="font-headline-md text-headline-md text-on-surface">Active Students</h3>
                            <p className="font-body-sm text-on-surface-variant">Currently enrolled students</p>
                        </div>
                        <span className="material-symbols-outlined text-blue-600 text-[32px]">school</span>
                    </div>
                    <div className="flex-1 overflow-y-auto space-y-sm custom-scrollbar">
                        {studentList.length > 0 ? (
                            studentList.filter(student => {
                                const matchesSearch = (student.name || '').toLowerCase().includes((searchQuery || '').toLowerCase()) ||
                                                      student.email.toLowerCase().includes((searchQuery || '').toLowerCase());
                                const overrideBatch = (selectedBatch === 'All Batches' || selectedBatch === 'Global' || selectedBatch === 'Global Access') ? '' : (selectedBatch || '');
                                const matchesBatch = overrideBatch ? (student.batch || '').trim() === overrideBatch.trim() : true;
                                return matchesSearch && matchesBatch;
                            }).map((student, index) => (
                                <div key={index} className="flex items-center gap-sm p-sm bg-surface-variant/50 rounded-lg group hover:bg-surface-variant transition-colors">
                                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-sm font-bold shrink-0">
                                        {student.name ? student.name.charAt(0).toUpperCase() : (student.email ? student.email.charAt(0).toUpperCase() : 'S')}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-label-md text-on-surface truncate">{student.name || 'N/A'}</p>
                                        <p className="text-xs text-on-surface-variant truncate">{student.level || 'Student'} {student.batch ? `• ${student.batch}` : ''}</p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-body-sm text-on-surface-variant text-center mt-md">No active students found.</p>
                        )}
                    </div>
                </div>

                {/* Active Staff List */}
                <div className="bento-card rounded-3xl bg-white p-lg flex flex-col h-full max-h-[400px] border border-outline-variant shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-center mb-md">
                        <div>
                            <h3 className="font-headline-md text-headline-md text-on-surface">Active Staff</h3>
                            <p className="font-body-sm text-on-surface-variant">Currently assigned staff</p>
                        </div>
                        <span className="material-symbols-outlined text-gray-600 text-[32px]">badge</span>
                    </div>
                    <div className="flex-1 overflow-y-auto space-y-sm custom-scrollbar">
                        {staffList.length > 0 ? (
                            staffList.filter(staff => {
                                const matchesSearch = (staff.name || '').toLowerCase().includes((searchQuery || '').toLowerCase()) ||
                                                      staff.email.toLowerCase().includes((searchQuery || '').toLowerCase());
                                const overrideBatch = (selectedBatch === 'All Batches' || selectedBatch === 'Global' || selectedBatch === 'Global Access') ? '' : (selectedBatch || '');
                                const matchesBatch = overrideBatch ? (staff.batch || '').trim() === overrideBatch.trim() : true;
                                return matchesSearch && matchesBatch;
                            }).map((staff, index) => (
                                <div key={index} className="flex items-center gap-sm p-sm bg-surface-variant/50 rounded-lg group hover:bg-surface-variant transition-colors">
                                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 text-sm font-bold shrink-0">
                                        {staff.name ? staff.name.charAt(0).toUpperCase() : (staff.email ? staff.email.charAt(0).toUpperCase() : 'S')}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-label-md text-on-surface truncate">{staff.name || 'N/A'}</p>
                                        <p className="text-xs text-on-surface-variant truncate">{staff.level || 'Staff'} {staff.batch ? `• ${staff.batch}` : ''}</p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-body-sm text-on-surface-variant text-center mt-md">No active staff found.</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Student Test Submissions Aggregated View */}
            <div className="bento-card rounded-3xl bg-gradient-to-bl from-[#465AA3] via-[#5D8BCC] to-[#6FB7E4] text-white p-lg overflow-hidden flex flex-col h-[500px] border-none shadow-lg">
                <div className="flex justify-between items-center mb-md">
                    <div>
                        <h3 className="font-headline-md text-headline-md text-white">Student Test Submissions</h3>
                        <p className="font-body-sm text-white/80">Aggregated overview of test activities and scores</p>
                    </div>
                    <div className="flex items-center gap-sm">
                        <span className="material-symbols-outlined text-white/80 cursor-pointer hover:text-white transition-colors">filter_list</span>
                        <span className="material-symbols-outlined text-white/80 cursor-pointer hover:text-white transition-colors">more_vert</span>
                    </div>
                </div>

                <div className="flex-1 overflow-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse">
                        <thead className="sticky top-0 bg-[#465AA3]/50 backdrop-blur-md z-10">
                            <tr className="border-b border-white/20">
                                <th className="p-sm font-label-md text-white/80">Student</th>
                                <th className="p-sm font-label-md text-white/80">Test</th>
                                <th className="p-sm font-label-md text-white/80">Submitted</th>
                                <th className="p-sm font-label-md text-white/80">Status</th>
                                <th className="p-sm font-label-md text-white/80 text-right">Score</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredSubmissionsData.length > 0 ? (
                                filteredSubmissionsData.map((sub) => (
                                    <tr key={sub.id} className="border-b border-white/10 hover:bg-white/10 transition-colors">
                                        <td className="p-sm">
                                            <div className="font-label-md text-white">{sub.student_name}</div>
                                        </td>
                                        <td className="p-sm">
                                            <div className="font-body-sm text-white/80 truncate max-w-[200px]">{sub.test_title}</div>
                                        </td>
                                        <td className="p-sm font-body-sm text-white/80">
                                            {new Date(sub.submitted_at).toLocaleDateString()}
                                        </td>
                                        <td className="p-sm">
                                            <span className={`px-xs py-0.5 rounded text-xs font-medium ${sub.status === 'Reviewed' ? 'bg-green-500/20 text-green-100' :
                                                    sub.status === 'Needs Work' ? 'bg-red-500/20 text-red-100' :
                                                        'bg-yellow-500/20 text-yellow-100'
                                                }`}>
                                                {sub.status || 'Pending Review'}
                                            </span>
                                        </td>
                                        <td className="p-sm text-right font-label-md text-white font-bold">
                                            {sub.staff_comments ? (sub.status === 'Reviewed' ? 'Pass' : 'Fail') : '-'}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="p-md text-center text-body-md text-white/80">
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

