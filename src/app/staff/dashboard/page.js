'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

const COLOR_CLASSES = {
    primary: 'border-primary',
    secondary: 'border-secondary',
    tertiary: 'border-tertiary',
    error: 'border-error'
};

export default function StaffDashboard() {
    const [summary, setSummary] = useState(null);
    const [classes, setClasses] = useState(null);
    const [activities, setActivities] = useState(null);
    const [profile, setProfile] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const token = localStorage.getItem('token');
                const headers = {
                    'Authorization': `Bearer ${token}`
                };

                const [summaryRes, classesRes, activitiesRes, profileRes] = await Promise.all([
                    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/dashboard/staff/summary`, { headers }),
                    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/dashboard/staff/classes`, { headers }),
                    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/tests/submissions/all`, { headers }),
                    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/user/profile`, { headers })
                ]);

                if (!summaryRes.ok || !classesRes.ok || !activitiesRes.ok) {
                    throw new Error('Failed to fetch dashboard data');
                }

                setSummary(await summaryRes.json());
                setClasses(await classesRes.json());
                setActivities(await activitiesRes.json());
                if (profileRes.ok) {
                    setProfile(await profileRes.json());
                }
            } catch (err) {
                console.error("Error fetching dashboard data:", err);
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchDashboardData();
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

    return (
        <div className="max-w-[1440px] mx-auto p-gutter space-y-lg">
            {/* Welcome Header */}
            <section className="flex flex-col md:flex-row md:items-center justify-between gap-md mt-6">
                <div>
                    <h2 className="font-headline-lg text-headline-lg text-on-surface">Welcome back, {profile?.name || summary?.name}</h2>
                    <p className="font-body-md text-body-md text-on-surface-variant">You have {classes?.length || 0} classes today and {activities?.filter(a => a.status !== 'Reviewed').length || 0} ungraded assignments.</p>
                </div>
            </section>

            {/* Grid Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-md">
                {/* Quick Action Card (Bento Style) */}
                <div className="lg:col-span-2 relative bg-surface-container-lowest rounded-xl p-md custom-shadow overflow-hidden min-h-[280px] flex flex-col justify-between border border-surface-container">
                    <div className="h-1 w-full absolute top-0 left-0 bg-primary rounded-t-lg"></div>
                    <div className="flex flex-col md:flex-row gap-lg h-full">
                        <div className="flex-1 space-y-md flex flex-col justify-center">
                            <div>
                                <span className="inline-block px-3 py-1 bg-secondary-container text-on-secondary-container rounded-full font-label-sm text-label-sm mb-2">Quick Action</span>
                                <h3 className="font-headline-md text-headline-md">Post New Material</h3>
                            </div>
                            <p className="font-body-md text-body-md text-on-surface-variant">Upload new lecture notes, slides, or reading materials to your assigned courses instantly.</p>
                            <div className="pt-base space-x-sm flex items-center">
                                <Link href="/staff/materials" className="px-6 py-3 bg-primary text-on-primary rounded-lg font-label-md text-label-md hover:scale-105 active:scale-95 transition-transform inline-block text-center">
                                    Start Upload
                                </Link>
                                <Link href="/staff/materials" className="px-6 py-3 border border-outline-variant text-primary rounded-lg font-label-md text-label-md hover:bg-surface-container-low active:scale-95 transition-colors inline-block text-center">
                                    Browse Library
                                </Link>
                            </div>
                        </div>
                        <div className="hidden md:block w-48 h-48 rounded-xl overflow-hidden shadow-inner self-center">
                            {/* Using standard img */}
                            <img className="w-full h-full object-cover" alt="3D Education Illustration" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAsgls8MkjaAEYb7zryUVHzanb22qcTRvtIlAgIQQq7glnFnCjESaqj8oep4QwBVIpFG6ytg1ZtfKyrlJKPaWXh4BuyTVd6NRN--kKVcsNOFZHTHEzGsZ6XQBZsd_ts059P02CxyQdwdxmhnuLvbXEUAZLGZ1_RbAA1jhRxUB__HPRWbVjG41OXq9kjtDYZFxOGQezDzCG862hwlUJcXvb5xf6p-JGcA2QMZ42i0dFg-5p5cf1tARi87EiVBYk2Ck9axjWEUiAkSYg5" />
                        </div>
                    </div>
                </div>

                {/* Upcoming Classes Card */}
                <div className="bg-surface-container-lowest rounded-xl p-md custom-shadow border border-surface-container flex flex-col relative overflow-hidden">
                    <div className="h-1 w-full absolute top-0 left-0 bg-tertiary rounded-t-lg"></div>
                    <div className="flex items-center justify-between mb-md">
                        <h3 className="font-label-md text-label-md uppercase tracking-wider text-outline">Upcoming Classes</h3>
                        <span className="material-symbols-outlined text-tertiary">calendar_today</span>
                    </div>
                    
                    <div className="space-y-sm flex-grow">
                        {classes && classes.map((c) => {
                            const timeParts = c.time ? c.time.split(' ') : ['09:00', 'AM'];
                            const time = timeParts[0] || '09:00';
                            const period = timeParts[1] || 'AM';
                            return (
                                <div key={c.id} className={`flex items-center p-sm bg-surface-container-low rounded-lg border-l-4 ${COLOR_CLASSES[c.color] || 'border-primary'} transition-colors hover:bg-surface-container`}>
                                    <div className="mr-sm text-center">
                                        <span className="block font-label-sm text-label-sm text-outline">{time}</span>
                                        <span className="block font-label-md text-label-md font-bold">{period}</span>
                                    </div>
                                    <div>
                                        <h4 className="font-label-md text-label-md">{c.name}</h4>
                                        <p className="font-body-sm text-body-sm text-on-surface-variant">{c.location} • {c.students} Students</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    <Link href="/staff/schedule" className="mt-md w-full py-2 text-primary font-label-sm text-label-sm hover:underline active:scale-95 transition-transform text-center block">
                        View Full Schedule
                    </Link>
                </div>
            </div>

            {/* Recent Test Submissions Table */}
            <section className="bg-surface-container-lowest rounded-xl custom-shadow border border-surface-container overflow-hidden">
                <div className="px-md py-md border-b border-outline-variant flex flex-col md:flex-row md:items-center justify-between gap-sm">
                    <h3 className="font-headline-md text-headline-md">Recent Student Submissions</h3>
                    <Link href="/staff/activities" className="text-primary text-sm hover:underline font-medium">View All Activities</Link>
                </div>
                
                <div className="overflow-x-auto">
                    <table className="w-full text-left min-w-[800px]">
                        <thead className="bg-surface-container-low border-b border-outline-variant">
                            <tr>
                                <th className="px-md py-4 font-label-md text-label-md text-on-surface-variant font-medium">Student Name</th>
                                <th className="px-md py-4 font-label-md text-label-md text-on-surface-variant font-medium">Test / Assignment</th>
                                <th className="px-md py-4 font-label-md text-label-md text-on-surface-variant font-medium">Status</th>
                                <th className="px-md py-4 font-label-md text-label-md text-on-surface-variant font-medium">Staff Comments</th>
                                <th className="px-md py-4 font-label-md text-label-md text-on-surface-variant font-medium">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-surface-variant">
                            {activities && activities.slice(0, 5).map((sub) => (
                                <tr key={sub.id} className="hover:bg-surface-container/50 transition-colors">
                                    <td className="px-md py-4">
                                        <div className="font-title-sm text-on-surface">{sub.student_name}</div>
                                        <div className="text-xs text-on-surface-variant">{new Date(sub.submitted_at).toLocaleDateString()}</div>
                                    </td>
                                    <td className="px-md py-4 font-body-md text-on-surface">{sub.test_title}</td>
                                    <td className="px-md py-4">
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${
                                            sub.status === 'Reviewed' ? 'bg-primary-container/30 text-primary border-primary/20' : 
                                            sub.status === 'Needs Work' ? 'bg-error-container/30 text-error border-error/20' :
                                            'bg-tertiary-container/30 text-tertiary border-tertiary/20'
                                        }`}>
                                            {sub.status}
                                        </span>
                                    </td>
                                    <td className="px-md py-4 font-body-sm text-on-surface-variant max-w-[200px] truncate">
                                        {sub.staff_comments || '-'}
                                    </td>
                                    <td className="px-md py-4">
                                        <Link href="/staff/activities" className="text-primary hover:text-primary/80 font-medium text-sm flex items-center gap-1">
                                            <span className="material-symbols-outlined text-[16px]">rate_review</span>
                                            Review
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                            {(!activities || activities.length === 0) && (
                                <tr>
                                    <td colSpan="5" className="px-md py-8 text-center text-on-surface-variant">No recent submissions found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
}
