'use client';
import { useState, useEffect } from 'react';
import StudentPerformanceChart from '@/app/components/StudentPerformanceChart';
import { useCEOContext } from '@/app/ceo/CEOContext';
export default function CEODashboard() {
    const { searchQuery } = useCEOContext();
    const [kpiData, setKpiData] = useState(null);
    const [activityData, setActivityData] = useState(null);
    const [chartData, setChartData] = useState(null);
    const [attendanceData, setAttendanceData] = useState(null);
    const [submissionsData, setSubmissionsData] = useState(null);
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

            const [kpiRes, activityRes, chartRes, attendanceRes, submissionsRes] = await Promise.all([
                fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/dashboard/ceo/kpi`, { headers }),
                fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/dashboard/ceo/recent-activity`, { headers }),
                fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/dashboard/ceo/performance-chart`, { headers }),
                fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/attendance/today`, { headers }),
                fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/tests/submissions/all`, { headers })
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
    }, []);

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

    return (
        <section className="p-gutter max-w-[1440px] mx-auto space-y-lg">
            {/* KPI Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-md">
                <div className="bento-card p-md flex flex-col justify-between group">
                    <div>
                        <p className="font-label-md text-label-md text-on-surface-variant mb-xs">Total Students</p>
                        <h2 className="font-headline-lg text-headline-lg text-primary transition-transform group-hover:scale-[1.02] origin-left">{kpiData?.activeStudents || '0'}</h2>
                    </div>
                    <div className="flex items-center gap-xs mt-sm text-primary">
                        <span className="material-symbols-outlined text-[16px]">group</span>
                        <span className="font-label-sm text-label-sm">Active Members</span>
                    </div> 
                </div>
                
                <div className="bento-card p-md flex flex-col justify-between group">
                    <div>
                        <p className="font-label-md text-label-md text-on-surface-variant mb-xs">Total Staff</p>
                        <h2 className="font-headline-lg text-headline-lg text-secondary transition-transform group-hover:scale-[1.02] origin-left">{kpiData?.activeStaff || '0'}</h2>
                    </div>
                    <div className="flex items-center gap-xs mt-sm text-primary">
                        <span className="material-symbols-outlined text-[16px]">group</span>
                        <span className="font-label-sm text-label-sm">Active Members</span>
                    </div>
                </div>
            </div>

            {/* Dashboard Bento Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-md">
                
                {/* Main Chart Area */}
                <div className="lg:col-span-2 bento-card p-lg overflow-hidden relative group">
                    <div className="flex justify-between items-start mb-lg">
                        <div>
                            <h3 className="font-headline-md text-headline-md text-on-surface">Student Performance Trends</h3>
                            <p className="font-body-sm text-body-sm text-on-surface-variant">Average score across all departments</p>
                        </div>
                        <select className="bg-surface-container border-none rounded-lg font-label-sm text-label-sm text-primary focus:ring-0 cursor-pointer hover:bg-surface-container-high transition-colors">
                            <option>Last 6 Months</option>
                            <option>Academic Year</option>
                        </select>
                    </div>
                    
                    {/* Render the chart component here, passing data */}
                    <StudentPerformanceChart data={chartData} />
                </div>

                {/* Staff Activities Feed */}
                <div className="bento-card p-lg flex flex-col h-full max-h-[400px]">
                    <div className="flex justify-between items-center mb-md relative">
                        <h3 className="font-headline-md text-headline-md text-on-surface">Recent Activities</h3>
                        <div className="relative">
                            <span 
                                className="material-symbols-outlined text-outline cursor-pointer hover:text-primary transition-colors hover:scale-110 active:scale-95"
                                onClick={() => setShowActivityMenu(!showActivityMenu)}
                            >
                                more_vert
                            </span>
                            {showActivityMenu && (
                                <div className="absolute right-0 top-full mt-2 w-48 bg-surface-container shadow-lg rounded-xl border border-outline-variant overflow-hidden z-10">
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
                                        className="w-full text-left px-4 py-3 hover:bg-surface-container-high transition-colors text-error flex items-center gap-2 font-label-md"
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
                            <div key={activity.id} className="flex gap-sm group cursor-pointer hover:bg-surface-container-low p-2 -mx-2 rounded-lg transition-colors">
                                <div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                                    <span className="material-symbols-outlined text-on-primary-container text-[18px]">
                                        {activity.type === 'enrollment' ? 'person_add' : activity.type === 'completion' ? 'school' : 'admin_panel_settings'}
                                    </span>
                                </div>
                                <div>
                                    <p className="font-label-md text-label-md">{activity.user}</p>
                                    <p className="font-body-sm text-body-sm text-on-surface-variant">{activity.action}</p>
                                    <p className="font-label-sm text-label-sm text-outline mt-xs">{activity.time}</p>
                                </div>
                            </div>
                        ))}
                        
                        {filteredActivityData.length === 0 && (
                            <p className="text-body-sm text-on-surface-variant text-center mt-md">No recent activities found.</p>
                        )}
                    </div>
                </div>

                {/* Today's Attendance Card */}
                <div className="lg:col-span-3 bento-card p-lg flex flex-col h-full max-h-[400px]">
                    <div className="flex justify-between items-center mb-md">
                        <div>
                            <h3 className="font-headline-md text-headline-md text-on-surface">Today's Attendance</h3>
                            <p className="font-body-sm text-on-surface-variant">{attendanceData?.count || 0} students present</p>
                        </div>
                        <div className="flex items-center gap-sm">
                            <button 
                                onClick={() => fetchDashboardData(false)}
                                className="text-on-surface-variant hover:text-primary transition-colors flex items-center justify-center rounded-full hover:bg-surface-container-high p-2"
                                title="Refresh Attendance"
                            >
                                <span className="material-symbols-outlined">refresh</span>
                            </button>
                            <span className="material-symbols-outlined text-primary text-[32px]">group</span>
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto space-y-xs custom-scrollbar">
                        {filteredAttendanceNames.length > 0 ? (
                            filteredAttendanceNames.map((name, index) => (
                                <div key={index} className="flex items-center gap-sm p-sm bg-surface-container-low rounded-lg">
                                    <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold">
                                        {name.charAt(0).toUpperCase()}
                                    </div>
                                    <span className="font-label-md">{name}</span>
                                </div>
                            ))
                        ) : (
                            <p className="text-body-sm text-on-surface-variant text-center mt-md">No attendance marked today.</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Student Test Submissions Aggregated View */}
            <div className="bento-card p-lg overflow-hidden flex flex-col h-[500px]">
                <div className="flex justify-between items-center mb-md">
                    <div>
                        <h3 className="font-headline-md text-headline-md text-on-surface">Student Test Submissions</h3>
                        <p className="font-body-sm text-on-surface-variant">Aggregated overview of test activities and scores</p>
                    </div>
                    <div className="flex items-center gap-sm">
                        <span className="material-symbols-outlined text-outline cursor-pointer hover:text-primary transition-colors">filter_list</span>
                        <span className="material-symbols-outlined text-outline cursor-pointer hover:text-primary transition-colors">more_vert</span>
                    </div>
                </div>
                
                <div className="flex-1 overflow-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse">
                        <thead className="sticky top-0 bg-surface-container-lowest z-10">
                            <tr className="border-b border-outline-variant">
                                <th className="p-sm font-label-md text-on-surface-variant">Student</th>
                                <th className="p-sm font-label-md text-on-surface-variant">Test</th>
                                <th className="p-sm font-label-md text-on-surface-variant">Submitted</th>
                                <th className="p-sm font-label-md text-on-surface-variant">Status</th>
                                <th className="p-sm font-label-md text-on-surface-variant text-right">Score</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredSubmissionsData.length > 0 ? (
                                filteredSubmissionsData.map((sub) => (
                                    <tr key={sub.id} className="border-b border-outline-variant hover:bg-surface-container-low transition-colors">
                                        <td className="p-sm">
                                            <div className="font-label-md text-on-surface">{sub.student_name}</div>
                                        </td>
                                        <td className="p-sm">
                                            <div className="font-body-sm text-on-surface-variant truncate max-w-[200px]">{sub.test_title}</div>
                                        </td>
                                        <td className="p-sm font-body-sm text-on-surface-variant">
                                            {new Date(sub.submitted_at).toLocaleDateString()}
                                        </td>
                                        <td className="p-sm">
                                            <span className={`px-xs py-0.5 rounded text-xs font-medium ${
                                                sub.status === 'Reviewed' ? 'bg-primary-container text-on-primary-container' : 
                                                sub.status === 'Needs Work' ? 'bg-error-container text-on-error-container' : 
                                                'bg-secondary-container text-on-secondary-container'
                                            }`}>
                                                {sub.status || 'Pending Review'}
                                            </span>
                                        </td>
                                        <td className="p-sm text-right font-label-md text-primary">
                                            {sub.staff_comments ? (sub.status === 'Reviewed' ? 'Pass' : 'Fail') : '-'}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="p-md text-center text-body-md text-on-surface-variant">
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

