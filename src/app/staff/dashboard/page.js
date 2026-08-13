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
    const [selectedSubmission, setSelectedSubmission] = useState(null);
    const [quickGradeScore, setQuickGradeScore] = useState('');
    const [quickGradeComments, setQuickGradeComments] = useState('');
    const [selectedActivities, setSelectedActivities] = useState([]);

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
                    fetch(`${process.env.NEXT_PUBLIC_TEST_API_URL || 'http://localhost:8003'}/api/tests/submissions/all`, { headers }),
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

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 18) return 'Good afternoon';
        return 'Good evening';
    };

    const greeting = `${getGreeting()}, ${profile?.name?.split(' ')[0] || summary?.name || 'Staff'}`;

    const handleBulkAction = async (status) => {
        if (!selectedActivities.length) return;
        
        const token = localStorage.getItem('token');
        let successCount = 0;
        
        for (const id of selectedActivities) {
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_TEST_API_URL || 'http://localhost:8003'}/api/tests/submissions/${id}/review`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        staff_comments: status === 'Reviewed' ? 'Approved in bulk' : 'Please resubmit',
                        status: status
                    })
                });
                if (res.ok) {
                    successCount++;
                }
            } catch (err) {
                console.error("Bulk update error:", err);
            }
        }
        
        if (successCount > 0) {
            alert(`Successfully updated ${successCount} submissions to ${status}.`);
            setActivities(prev => prev.map(a => 
                selectedActivities.includes(a.id) ? { ...a, status } : a
            ));
            setSelectedActivities([]);
        } else {
            alert('Failed to update submissions.');
        }
    };

    return (
        <>
        <div className="max-w-[1440px] mx-auto p-gutter space-y-lg relative">
            {/* Welcome Header */}
            <section className="flex flex-col md:flex-row md:items-center justify-between gap-md mt-6">
                <div>
                    <h1 className="text-3xl md:text-4xl font-bold tracking-tight bg-gradient-to-r from-[#6FB7E4] via-[#5D8BCC] to-[#465AA3] text-transparent bg-clip-text mb-2">
                        {greeting}
                    </h1>
                    <p className="font-body-md text-body-md text-on-surface-variant">Here is your Today's overview.</p>
                </div>
            </section>

            {/* KPI Summary Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-md">
                <div className="bg-surface-container-lowest p-md rounded-xl border border-surface-container custom-shadow flex flex-col justify-between hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-sm">
                        <span className="font-label-md text-outline">Pending Grading</span>
                        <span className="material-symbols-outlined text-error">assignment_late</span>
                    </div>
                    <div className="text-3xl font-bold text-on-surface mb-1">{activities?.filter(a => a.status !== 'Reviewed').length || 0}</div>
                    <p className="font-body-sm text-on-surface-variant mb-md">Submissions to review</p>
                    <button 
                        onClick={() => {
                            const pending = activities?.find(a => a.status !== 'Reviewed');
                            if (pending) {
                                setSelectedSubmission(pending);
                            } else {
                                alert("No pending submissions to grade.");
                            }
                        }}
                        className="text-sm text-primary font-label-md hover:underline text-left mt-auto flex items-center gap-1"
                    >
                        Start Grading Queue <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                    </button>
                </div>
                <div className="bg-surface-container-lowest p-md rounded-xl border border-surface-container custom-shadow flex flex-col justify-between hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-sm">
                        <span className="font-label-md text-outline">Today's Schedule</span>
                        <span className="material-symbols-outlined text-tertiary">calendar_clock</span>
                    </div>
                    <div className="text-3xl font-bold text-on-surface mb-1">{classes?.length || 0}</div>
                    <p className="font-body-sm text-on-surface-variant mb-md">Sessions scheduled</p>
                    <p className="text-sm font-label-md text-tertiary mt-auto">Next in 45 mins</p>
                </div>
                <div className="bg-surface-container-lowest p-md rounded-xl border border-surface-container custom-shadow flex flex-col justify-between hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-sm">
                        <span className="font-label-md text-outline">Active Students</span>
                        <span className="material-symbols-outlined text-secondary">groups</span>
                    </div>
                    <div className="text-3xl font-bold text-on-surface mb-1">
                        {classes ? classes.reduce((total, c) => total + (Number(c.students) || 0), 0) : 0}
                    </div>
                    <p className="font-body-sm text-on-surface-variant mt-auto">Enrolled across courses</p>
                </div>
                <div className="bg-surface-container-lowest p-md rounded-xl border border-surface-container custom-shadow flex flex-col justify-between hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-sm">
                        <span className="font-label-md text-outline">Attendance Rate</span>
                        <span className="material-symbols-outlined text-primary">analytics</span>
                    </div>
                    <div className="text-3xl font-bold text-on-surface mb-1">{summary?.attendanceRate || '--%'}</div>
                    <p className="font-body-sm text-on-surface-variant mt-auto">Average participation</p>
                </div>
            </div>

            {/* Grid Layout for Classes & Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-md">
                {/* Upcoming Classes Card */}
                <div className="lg:col-span-2 bg-surface-container-lowest rounded-xl p-md custom-shadow border border-surface-container flex flex-col relative overflow-hidden">
                    <div className="h-1 w-full absolute top-0 left-0 bg-tertiary rounded-t-lg"></div>
                    <div className="flex items-center justify-between mb-md">
                        <h3 className="font-label-md text-label-md uppercase tracking-wider text-outline">Upcoming Classes</h3>
                        <span className="material-symbols-outlined text-tertiary">calendar_today</span>
                    </div>
                    
                    <div className="space-y-sm flex-grow">
                        {classes && classes.map((c, index) => {
                            const timeParts = c.time ? c.time.split(' ') : ['09:00', 'AM'];
                            const time = timeParts[0] || '09:00';
                            const period = timeParts[1] || 'AM';
                            const statusBadge = index === 0 ? 'Live Now' : (index === 1 ? 'In 30 Mins' : 'Later');
                            const statusColor = index === 0 ? 'bg-error-container text-error' : (index === 1 ? 'bg-tertiary-container text-tertiary' : 'bg-surface-container text-on-surface-variant');
                            
                            return (
                                <div key={c.id} className={`flex flex-col sm:flex-row sm:items-center p-sm bg-surface-container-low rounded-lg border-l-4 ${COLOR_CLASSES[c.color] || 'border-primary'} transition-colors hover:bg-surface-container gap-4 justify-between`}>
                                    <div className="flex items-center gap-4">
                                        <div className="text-center w-16 shrink-0">
                                            <span className="block font-label-sm text-label-sm text-outline">{time}</span>
                                            <span className="block font-label-md text-label-md font-bold">{period}</span>
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <h4 className="font-label-md text-label-md font-bold">{c.name}</h4>
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${statusColor}`}>{statusBadge}</span>
                                            </div>
                                            <p className="font-body-sm text-body-sm text-on-surface-variant">{c.location} • {c.students} Students</p>
                                        </div>
                                    </div>
                                    
                                </div>
                            );
                        })}
                        {(!classes || classes.length === 0) && (
                            <div className="p-8 text-center text-on-surface-variant">No upcoming classes scheduled.</div>
                        )}
                    </div>
                </div>

                {/* Redesigned Quick Actions Suite */}
                <div className="bg-surface-container-lowest rounded-xl p-md custom-shadow border border-surface-container flex flex-col relative overflow-hidden">
                    <div className="h-1 w-full absolute top-0 left-0 bg-primary rounded-t-lg"></div>
                    <div className="flex items-center justify-between mb-md">
                        <h3 className="font-label-md text-label-md uppercase tracking-wider text-outline">Quick Actions</h3>
                        <span className="material-symbols-outlined text-primary">bolt</span>
                    </div>
                    <div className="flex flex-col gap-sm">
                        <Link href="/staff/tests" className="flex items-center gap-3 p-3 bg-primary text-on-primary rounded-lg hover:scale-[1.02] active:scale-95 transition-transform shadow-sm font-medium">
                            <span className="material-symbols-outlined">add_task</span>
                            Create Assignment
                        </Link>
                        <Link href="/staff/materials" className="flex items-center gap-3 p-3 border border-outline-variant rounded-lg hover:bg-surface-container transition-colors text-on-surface font-medium">
                            <span className="material-symbols-outlined text-secondary">upload_file</span>
                            Upload Lecture Notes
                        </Link>
                        <Link href="/staff/members" className="flex items-center gap-3 p-3 border border-outline-variant rounded-lg hover:bg-surface-container transition-colors text-on-surface font-medium text-left">
                            <span className="material-symbols-outlined text-secondary">how_to_reg</span>
                            Mark Attendance
                        </Link>
                        <Link href="/staff/announcements" className="flex items-center gap-3 p-3 border border-outline-variant rounded-lg hover:bg-surface-container transition-colors text-on-surface font-medium text-left">
                            <span className="material-symbols-outlined text-tertiary">campaign</span>
                            Broadcast Announcement
                        </Link>
                        <Link href="/staff/community" className="flex items-center gap-3 p-3 border border-outline-variant rounded-lg hover:bg-surface-container transition-colors text-on-surface font-medium text-left">
                            <span className="material-symbols-outlined text-tertiary">forum</span>
                            Community Forum
                        </Link>
                    </div>
                </div>
            </div>

            {/* Recent Test Submissions Table */}
            <section className="bg-surface-container-lowest rounded-xl custom-shadow border border-surface-container overflow-hidden">
                <div className="px-md py-md border-b border-outline-variant flex flex-col md:flex-row md:items-center justify-between gap-sm">
                    <div className="flex items-center gap-sm">
                        <h3 className="font-headline-md text-headline-md">Recent Student Submissions</h3>
                        {selectedActivities.length > 0 && (
                            <span className="px-2 py-1 bg-primary-container text-on-primary-container text-xs rounded-full font-bold">
                                {selectedActivities.length} Selected
                            </span>
                        )}
                    </div>
                    <div className="flex flex-wrap items-center gap-sm">
                        {selectedActivities.length > 0 && (
                            <>
                                <button 
                                    onClick={() => handleBulkAction('Reviewed')}
                                    className="px-3 py-1.5 border border-outline-variant text-sm font-medium rounded-lg hover:bg-surface-container text-on-surface transition-colors flex items-center gap-1"
                                >
                                    <span className="material-symbols-outlined text-[18px]">done_all</span> Approve
                                </button>
                                <button 
                                    onClick={() => handleBulkAction('Needs Work')}
                                    className="px-3 py-1.5 border border-outline-variant text-sm font-medium rounded-lg hover:bg-surface-container text-error transition-colors flex items-center gap-1"
                                >
                                    <span className="material-symbols-outlined text-[18px]">replay</span> Request Resubmission
                                </button>
                            </>
                        )}
                        <Link href="/staff/activities" className="text-primary text-sm hover:underline font-medium ml-2">View All Activities</Link>
                    </div>
                </div>
                
                <div className="overflow-x-auto">
                    <table className="w-full text-left min-w-[900px]">
                        <thead className="bg-surface-container-low border-b border-outline-variant">
                            <tr>
                                <th className="px-md py-4 w-12">
                                    <input 
                                        type="checkbox" 
                                        className="rounded border-outline text-primary focus:ring-primary h-4 w-4 cursor-pointer"
                                        checked={activities?.length > 0 && selectedActivities.length === Math.min(5, activities.length)}
                                        onChange={(e) => {
                                            if (e.target.checked && activities) {
                                                setSelectedActivities(activities.slice(0, 5).map(a => a.id));
                                            } else {
                                                setSelectedActivities([]);
                                            }
                                        }}
                                    />
                                </th>
                                <th className="px-md py-4 font-label-md text-label-md text-on-surface-variant font-medium">Student</th>
                                <th className="px-md py-4 font-label-md text-label-md text-on-surface-variant font-medium">Assignment</th>
                                <th className="px-md py-4 font-label-md text-label-md text-on-surface-variant font-medium">Status</th>
                                <th className="px-md py-4 font-label-md text-label-md text-on-surface-variant font-medium">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-surface-variant">
                            {activities && activities.slice(0, 5).map((sub) => {
                                const isSelected = selectedActivities.includes(sub.id);
                                return (
                                <tr key={sub.id} className={`transition-colors ${isSelected ? 'bg-primary-container/10' : 'hover:bg-surface-container/30'}`}>
                                    <td className="px-md py-4">
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
                                    <td className="px-md py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center font-bold font-title-sm shrink-0 border border-outline-variant shadow-sm">
                                                {sub.student_name ? sub.student_name.charAt(0).toUpperCase() : 'U'}
                                            </div>
                                            <div>
                                                <div className="font-title-sm text-on-surface font-medium">{sub.student_name || 'Unknown Student'}</div>
                                                <div className="text-xs text-on-surface-variant flex items-center gap-1 mt-0.5">
                                                    <span className="material-symbols-outlined text-[14px]">school</span>
                                                    {sub.course_name || 'General Course'}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-md py-4">
                                        <div className="font-body-md text-on-surface font-medium">{sub.test_title}</div>
                                        <div className="text-xs text-on-surface-variant mt-0.5">Submitted: {new Date(sub.submitted_at).toLocaleDateString()}</div>
                                    </td>
                                    <td className="px-md py-4">
                                        <span className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border ${
                                            sub.status === 'Reviewed' ? 'bg-primary-container/30 text-primary border-primary/20' : 
                                            sub.status === 'Needs Work' ? 'bg-error-container/30 text-error border-error/20' :
                                            'bg-tertiary-container/30 text-tertiary border-tertiary/20'
                                        }`}>
                                            {sub.status}
                                        </span>
                                    </td>
                                    <td className="px-md py-4">
                                        <button 
                                            onClick={() => setSelectedSubmission(sub)}
                                            className="text-primary hover:bg-surface-container px-3 py-1.5 rounded-lg font-medium text-sm flex items-center gap-1 border border-outline-variant transition-colors bg-white shadow-sm hover:shadow"
                                        >
                                            <span className="material-symbols-outlined text-[16px]">edit_document</span>
                                            Grade
                                        </button>
                                    </td>
                                </tr>
                                )
                            })}
                            {(!activities || activities.length === 0) && (
                                <tr>
                                    <td colSpan="5" className="px-md py-8 text-center text-on-surface-variant">No recent submissions found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </section>            {/* Quick-Grade Drawer Overlay */}
        </div>
        {selectedSubmission && (
            <div className="fixed inset-0 z-[100] flex justify-end">
                <div 
                    className="absolute inset-0 bg-black/50 transition-opacity"
                    onClick={() => setSelectedSubmission(null)}
                />
                <div className="relative h-screen w-full max-w-[400px] bg-surface-container-lowest shadow-2xl border-l border-surface-container flex flex-col overflow-y-auto animate-slide-in-right">
                    <div className="p-4 border-b border-outline-variant flex justify-between items-center bg-surface-container-lowest sticky top-0 z-10">
                        <div>
                            <h3 className="font-headline-sm text-on-surface font-bold">Quick Grade</h3>
                            <p className="font-body-sm text-on-surface-variant">Grading {selectedSubmission.student_name || 'Unknown'}'s work</p>
                        </div>
                        <button 
                            onClick={() => setSelectedSubmission(null)}
                            className="p-2 hover:bg-surface-container rounded-full text-on-surface-variant transition-colors"
                        >
                            <span className="material-symbols-outlined">close</span>
                        </button>
                    </div>
                    
                    <div className="p-4 flex-grow flex flex-col gap-md">
                        {/* Document Preview Placeholder */}
                        <div className="bg-surface-container-low border border-outline-variant rounded-xl p-4 flex flex-col items-center justify-center min-h-[200px] text-on-surface-variant gap-2 shadow-inner">
                            <span className="material-symbols-outlined text-[48px] text-outline">description</span>
                            <p className="font-label-md text-center">{selectedSubmission.test_title}</p>
                            <button className="text-primary text-sm font-medium flex items-center gap-1 mt-2 hover:underline">
                                <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                                Open Full Document
                            </button>
                        </div>

                        {/* Grading Inputs */}
                        <div className="space-y-4 mt-2">
                            <div>
                                <label className="block font-label-md text-on-surface mb-1 font-bold">Score</label>
                                <input 
                                    type="number" 
                                    className="w-full bg-surface-container-lowest border border-outline rounded-lg px-3 py-2 text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                                    placeholder="e.g. 95"
                                    value={quickGradeScore}
                                    onChange={(e) => setQuickGradeScore(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block font-label-md text-on-surface mb-1 font-bold">Feedback Comments</label>
                                <textarea 
                                    rows="4"
                                    className="w-full bg-surface-container-lowest border border-outline rounded-lg px-3 py-2 text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all resize-none"
                                    placeholder="Excellent work on..."
                                    value={quickGradeComments}
                                    onChange={(e) => setQuickGradeComments(e.target.value)}
                                ></textarea>
                            </div>
                        </div>
                    </div>

                    <div className="p-4 border-t border-outline-variant bg-surface-container-lowest flex justify-end gap-2 sticky bottom-0">
                        <button 
                            onClick={() => setSelectedSubmission(null)}
                            className="px-4 py-2 font-label-md text-on-surface-variant hover:bg-surface-container rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={async () => {
                                if (!quickGradeComments && !quickGradeScore) {
                                    alert("Please enter a score or comments.");
                                    return;
                                }
                                try {
                                    const token = localStorage.getItem('token');
                                    const combinedComments = `Score: ${quickGradeScore}\n\n${quickGradeComments}`;
                                    const res = await fetch(`${process.env.NEXT_PUBLIC_TEST_API_URL || 'http://localhost:8003'}/api/tests/submissions/${selectedSubmission.id}/review`, {
                                        method: 'PUT',
                                        headers: {
                                            'Content-Type': 'application/json',
                                            'Authorization': `Bearer ${token}`
                                        },
                                        body: JSON.stringify({
                                            staff_comments: combinedComments,
                                            status: 'Reviewed'
                                        })
                                    });
                                    if (res.ok) {
                                        alert(`Graded ${selectedSubmission.student_name} successfully!`);
                                        
                                        // Update local state to reflect the change
                                        setActivities(prev => prev.map(a => 
                                            a.id === selectedSubmission.id ? { ...a, status: 'Reviewed' } : a
                                        ));
                                        
                                        setSelectedSubmission(null);
                                        setQuickGradeScore('');
                                        setQuickGradeComments('');
                                    } else {
                                        const err = await res.json();
                                        alert(`Failed to submit grade: ${err.detail || 'Unknown error'}`);
                                    }
                                } catch (error) {
                                    console.error(error);
                                    alert("An error occurred while submitting the grade.");
                                }
                            }}
                            className="px-4 py-2 font-label-md bg-primary text-on-primary rounded-lg hover:scale-[1.02] active:scale-95 transition-transform shadow-sm flex items-center gap-2"
                        >
                            <span className="material-symbols-outlined text-[18px]">send</span>
                            Submit Grade
                        </button>
                    </div>
                </div>
            </div>
        )}
        </>
    );
}
