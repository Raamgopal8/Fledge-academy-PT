'use client';
import { useState, useEffect } from 'react';

const LEVEL_COLORS = {
    'Level 5': 'bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/30',
    'Level 4': 'bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30',
    'Level 3': 'bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 border-yellow-500/30',
    'Level 2': 'bg-orange-500/15 text-orange-700 dark:text-orange-400 border-orange-500/30',
    'Level 1': 'bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30',
};

export default function StudentTasks() {
    const [tasks, setTasks] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('all'); // 'all', 'pending', 'submitted'
    const [filterLevel, setFilterLevel] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');
    
    // Active modal / submission
    const [activeTaskForSubmission, setActiveTaskForSubmission] = useState(null);
    const [submissionContent, setSubmissionContent] = useState('');
    const [studentName, setStudentName] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [successFeedback, setSuccessFeedback] = useState('');
    const [studentLevel, setStudentLevel] = useState('Level 5');

    useEffect(() => {
        fetchStudentInfoAndTasks();
    }, []);

    const fetchStudentInfoAndTasks = async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem('token');
            let level = localStorage.getItem('level');
            let batch = localStorage.getItem('batch');
            let name = localStorage.getItem('userName') || localStorage.getItem('name') || '';

            if (name) setStudentName(name);

            // If level or batch not in storage, fetch from profile
            if (!level || !batch || !name) {
                try {
                    const profRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/user/profile`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (profRes.ok) {
                        const prof = await profRes.json();
                        level = prof.level || level || 'Level 5';
                        batch = prof.batch || batch || '';
                        if (prof.name) {
                            setStudentName(prof.name);
                            localStorage.setItem('userName', prof.name);
                        }
                        localStorage.setItem('level', level);
                        if (batch) localStorage.setItem('batch', batch);
                    }
                } catch (e) {
                    console.error('Profile fetch error:', e);
                }
            }

            level = level || 'Level 5';
            batch = batch || '';
            setStudentLevel(level);

            const queryParams = new URLSearchParams();
            if (level) queryParams.append('level', level);
            if (batch) queryParams.append('batch', batch);

            const res = await fetch(`${process.env.NEXT_PUBLIC_TEST_API_URL || ''}/api/tests?${queryParams.toString()}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!res.ok) {
                throw new Error('Failed to fetch tasks');
            }

            const data = await res.json();
            setTasks(data);
        } catch (err) {
            console.error('Error fetching tasks:', err);
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const activeName = studentName.trim() || localStorage.getItem('userName') || localStorage.getItem('name') || '';
        if (!activeTaskForSubmission || !submissionContent.trim() || !activeName) return;

        setIsSubmitting(true);
        setError(null);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${process.env.NEXT_PUBLIC_TEST_API_URL || ''}/api/tests/${activeTaskForSubmission.id}/submit`, {
                method: 'POST',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ student_name: activeName, submission_content: submissionContent })
            });

            if (res.ok) {
                const submissionData = await res.json();
                setActiveTaskForSubmission(null);
                setSubmissionContent('');
                window.location.reload();
            } else {
                const errData = await res.json().catch(() => ({}));
                setError(errData.detail || 'Failed to submit task');
            }
        } catch (err) {
            console.error(err);
            setError('Failed to submit task. Please check your connection.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const getTaskUrgency = (dueDateStr, submission) => {
        if (submission) {
            const status = submission.status || 'Submitted';
            if (status === 'Approved' || status === 'Reviewed') {
                return { label: 'Completed', color: 'success', icon: 'check_circle' };
            } else if (status === 'Need Work' || status === 'Needs Work' || status === 'Failed') {
                return { label: 'Need Work', color: 'warning', icon: 'assignment_return' };
            } else {
                return { label: 'Submitted', color: 'primary', icon: 'task_alt' };
            }
        }
        if (!dueDateStr) return { label: 'No Deadline', color: 'neutral', icon: 'schedule' };
        const now = new Date();
        const dueDate = new Date(dueDateStr);
        const diffHours = (dueDate - now) / (1000 * 60 * 60);

        if (diffHours < 0) return { label: 'Overdue', color: 'error', icon: 'error' };
        if (diffHours <= 24) return { label: 'Due Soon', color: 'warning', icon: 'alarm' };
        if (diffHours <= 72) return { label: 'In 3 Days', color: 'primary', icon: 'schedule' };
        return { label: dueDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }), color: 'neutral', icon: 'calendar_today' };
    };

    const getLevelBadgeClass = (lvl) => {
        return LEVEL_COLORS[lvl] || 'bg-primary/10 text-primary border-primary/20';
    };

    const pendingTasks = tasks.filter(t => !t.submission || t.submission.status === 'Need Work' || t.submission.status === 'Needs Work' || t.submission.status === 'Failed');
    const submittedTasks = tasks.filter(t => t.submission && t.submission.status !== 'Need Work' && t.submission.status !== 'Needs Work' && t.submission.status !== 'Failed');

    const filteredTasks = tasks.filter(t => {
        // Tab filter
        const isPending = !t.submission || t.submission.status === 'Need Work' || t.submission.status === 'Needs Work' || t.submission.status === 'Failed';
        if (activeTab === 'pending' && !isPending) return false;
        if (activeTab === 'submitted' && isPending) return false;

        // Level filter
        if (filterLevel !== 'All' && t.level !== filterLevel) return false;

        // Search query (matches title or description, NOT exposing batch)
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            const titleMatch = (t.title || '').toLowerCase().includes(q);
            const descMatch = (t.description || '').toLowerCase().includes(q);
            return titleMatch || descMatch;
        }
        return true;
    });

    return (
        <section className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-8 lg:px-12 py-4 sm:py-6 space-y-4 sm:space-y-lg w-full max-w-full overflow-x-hidden">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-md mb-lg">
                    <div>
                        <div className="flex items-center gap-sm mb-xs">
                            <span className="material-symbols-outlined text-primary text-3xl">assignment</span>
                            <h1 className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#6FB7E4] via-[#5D8BCC] to-[#465AA3]">
                                Tasks & Assignments
                            </h1>
                        </div>
                        <p className="font-body-lg text-on-surface-variant max-w-2xl">
                            Track your upcoming tests, submit coursework, and view teacher feedback.
                        </p>
                    </div>

                    {/* Active Student Level Indicator (Batch is hidden in UI) */}
                    <div className="flex items-center gap-2">
                        {studentLevel && (
                            <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold shadow-2xs">
                                <span className="material-symbols-outlined text-[16px]">school</span>
                                <span>{studentLevel}</span>
                            </div>
                        )}
                    </div>
                </div>

                {successFeedback && (
                    <div className="bg-green-500/10 text-green-700 dark:text-green-400 p-4 rounded-2xl flex items-center gap-2.5 border border-green-500/30">
                        <span className="material-symbols-outlined text-[22px]">check_circle</span>
                        <span className="text-sm font-medium">{successFeedback}</span>
                    </div>
                )}

                {/* Main Content Area */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-lg">
                    {/* Tasks List */}
                    <div className="lg:col-span-8 space-y-4">
                        {/* Control Bar: Tabs & Search */}
                        <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-3 sm:p-4 custom-shadow space-y-3">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                {/* Status Tabs */}
                                <div className="flex gap-1 bg-surface-container-low p-1 rounded-xl border border-outline-variant/60 overflow-x-auto custom-scrollbar w-full sm:w-auto shrink-0 flex-nowrap">
                                    {[
                                        { key: 'all', label: 'All Tasks', count: tasks.length },
                                        { key: 'pending', label: 'Pending', count: pendingTasks.length },
                                        { key: 'submitted', label: 'Completed', count: submittedTasks.length },
                                    ].map(tab => (
                                        <button
                                            key={tab.key}
                                            type="button"
                                            onClick={() => setActiveTab(tab.key)}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 flex-1 sm:flex-initial ${
                                                activeTab === tab.key
                                                    ? 'bg-surface text-on-surface shadow-xs font-bold'
                                                    : 'text-on-surface-variant hover:text-on-surface'
                                            }`}
                                        >
                                            <span>{tab.label}</span>
                                            <span className={`px-1.5 py-0.2 rounded-full text-[10px] shrink-0 ${
                                                activeTab === tab.key ? 'bg-primary/10 text-primary font-bold' : 'bg-surface-container text-on-surface-variant'
                                            }`}>
                                                {tab.count}
                                            </span>
                                        </button>
                                    ))}
                                </div>

                                {/* Search Bar */}
                                <div className="relative min-w-[200px]">
                                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[16px] text-on-surface-variant">search</span>
                                    <input 
                                        type="text"
                                        placeholder="Search assignments..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full pl-8 pr-3 py-1.5 bg-surface-container-low border border-outline-variant rounded-xl text-xs text-on-surface focus:outline-none focus:border-primary transition-colors"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Tasks Container */}
                        <div className="space-y-4">
                            {isLoading ? (
                                <div className="flex flex-col justify-center items-center h-64 bg-surface-container-lowest border border-outline-variant rounded-2xl gap-3">
                                    <span className="material-symbols-outlined text-4xl text-primary animate-spin">progress_activity</span>
                                    <p className="text-xs text-on-surface-variant">Loading assignments...</p>
                                </div>
                            ) : error ? (
                                <div className="flex justify-center text-error p-xl bg-surface-container-lowest rounded-2xl border border-error/20">
                                    <p>{error}</p>
                                </div>
                            ) : filteredTasks.length === 0 ? (
                                <div className="flex flex-col items-center justify-center text-center p-12 bg-surface-container-lowest rounded-2xl border border-dashed border-outline-variant h-64 custom-shadow">
                                    <span className="material-symbols-outlined text-6xl text-outline/40 mb-3">
                                        {activeTab === 'pending' ? 'task_alt' : 'assignment'}
                                    </span>
                                    <h3 className="font-headline-sm text-on-surface-variant font-bold">
                                        {activeTab === 'pending' ? "You're all caught up!" : "No tasks found"}
                                    </h3>
                                    <p className="font-body-md text-outline text-xs mt-1">
                                        {activeTab === 'pending' 
                                            ? "Great job! You don't have any pending assignments right now."
                                            : "Submitted tasks with feedback will appear here."}
                                    </p>
                                </div>
                            ) : (
                                filteredTasks.map(task => {
                                    const urgency = getTaskUrgency(task.due_date, task.submission);
                                    const isNeedWork = task.submission && (task.submission.status === 'Need Work' || task.submission.status === 'Needs Work' || task.submission.status === 'Failed');
                                    const isApproved = task.submission && (task.submission.status === 'Approved' || task.submission.status === 'Reviewed');
                                    const isPending = !task.submission || isNeedWork;
                                    const hasStaffComments = task.submission && task.submission.staff_comments;

                                    return (
                                         <div 
                                             key={task.id} 
                                             className="bg-surface-container-lowest rounded-2xl p-5 border border-outline-variant hover:border-primary/50 hover:shadow-md transition-all custom-shadow"
                                         >
                                             {/* Card Top Row */}
                                             <div className="flex items-start justify-between gap-3 mb-2.5">
                                                 <div className="flex-1">
                                                     <div className="flex items-center gap-2 flex-wrap mb-1">
                                                         <h3 className="font-headline-sm text-on-surface font-bold text-base">
                                                             {task.title}
                                                         </h3>
                                                         {task.level && (
                                                             <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${getLevelBadgeClass(task.level)}`}>
                                                                 {task.level}
                                                             </span>
                                                         )}
                                                     </div>
                                                 </div>

                                                 {/* Status Badge */}
                                                 <div className="shrink-0">
                                                     {task.submission ? (
                                                         <span className={`px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${
                                                             isApproved
                                                                 ? 'bg-green-500/15 text-green-700 dark:text-green-400 border border-green-500/30'
                                                                 : isNeedWork
                                                                 ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30'
                                                                 : 'bg-primary/10 text-primary border border-primary/20'
                                                         }`}>
                                                             <span className="material-symbols-outlined text-[14px]">
                                                                 {isApproved ? 'check_circle' : isNeedWork ? 'cancel' : 'pending'}
                                                             </span>
                                                             <span>{isApproved ? 'Approved' : isNeedWork ? 'Need Work' : task.submission.status}</span>
                                                         </span>
                                                     ) : (
                                                         <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-error-container text-error border border-error/20 flex items-center gap-1">
                                                             <span className="material-symbols-outlined text-[14px]">schedule</span>
                                                             <span>Pending</span>
                                                         </span>
                                                     )}
                                                 </div>
                                             </div>

                                             {/* Description */}
                                             <p className="font-body-md text-on-surface-variant text-xs leading-relaxed mb-3.5 whitespace-pre-wrap">
                                                 {task.description || "No detailed description provided."}
                                             </p>

                                             {/* Resubmission alert */}
                                             {isNeedWork && (
                                                 <div className="mb-3.5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 text-xs space-y-1">
                                                     <div className="flex items-center gap-1.5 font-bold">
                                                         <span className="material-symbols-outlined text-[16px]">assignment_return</span>
                                                         <span>Resubmission Requested (Need Work)</span>
                                                     </div>
                                                     {task.submission.staff_comments && (
                                                         <p className="italic">"{task.submission.staff_comments}"</p>
                                                     )}
                                                 </div>
                                             )}

                                             {/* Teacher Feedback for Approved Tasks */}
                                             {isApproved && hasStaffComments && (
                                                 <div className="mb-3.5 p-3 rounded-xl bg-green-500/10 border border-green-500/30 text-on-surface text-xs space-y-1">
                                                     <div className="flex items-center gap-1.5 font-bold text-green-700 dark:text-green-400">
                                                         <span className="material-symbols-outlined text-[16px]">forum</span>
                                                         <span>Instructor Feedback (Approved)</span>
                                                     </div>
                                                     <p className="italic text-on-surface-variant">"{task.submission.staff_comments}"</p>
                                                 </div>
                                             )}

                                             {/* Card Footer: Due Date & Action */}
                                             <div className="flex items-center justify-between pt-3 border-t border-outline-variant/40 mt-2">
                                                 <div className="flex items-center gap-2">
                                                     <span className={`px-2 py-0.5 rounded-md text-[11px] font-semibold flex items-center gap-1 ${
                                                         urgency.color === 'error' ? 'bg-error/10 text-error' :
                                                         urgency.color === 'warning' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' :
                                                         urgency.color === 'primary' ? 'bg-primary/10 text-primary' :
                                                         urgency.color === 'success' ? 'bg-green-500/15 text-green-700 dark:text-green-400' :
                                                         'bg-surface-container text-on-surface-variant'
                                                     }`}>
                                                         <span className="material-symbols-outlined text-[13px]">{urgency.icon}</span>
                                                         <span>{urgency.label}</span>
                                                     </span>
                                                     {task.due_date && (
                                                         <span className="text-[11px] text-on-surface-variant/80 hidden sm:inline">
                                                             Due {new Date(task.due_date).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                                                         </span>
                                                     )}
                                                 </div>

                                                 <button
                                                     type="button"
                                                     onClick={() => {
                                                         setActiveTaskForSubmission(task);
                                                         setSubmissionContent(task.submission?.submission_content || '');
                                                     }}
                                                     className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 ${
                                                         isPending 
                                                             ? 'bg-primary text-on-primary hover:bg-primary/90 shadow-xs' 
                                                             : 'bg-surface-container hover:bg-surface-container-high text-on-surface'
                                                     }`}
                                                 >
                                                     <span className="material-symbols-outlined text-[16px]">
                                                         {isPending ? 'send' : 'visibility'}
                                                     </span>
                                                     <span>{task.submission ? (isNeedWork ? 'Resubmit' : 'View Submission') : 'Submit Work'}</span>
                                                 </button>
                                             </div>
                                         </div>
                                     );
                                 })
                            )}
                        </div>
                    </div>

                    {/* Stats & Tips Sidebar */}
                    <div className="lg:col-span-4 space-y-4">
                        {/* Summary Widget */}
                        <div className="bg-surface-container-lowest rounded-2xl p-5 border border-outline-variant custom-shadow space-y-4">
                            <h3 className="font-label-lg font-bold text-on-surface text-sm flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary text-[20px]">analytics</span>
                                <span>Assignment Summary</span>
                            </h3>

                            <div className="grid grid-cols-2 gap-2.5">
                                <div className="p-3.5 rounded-xl bg-primary/10 border border-primary/20 text-center">
                                    <span className="font-display-sm font-extrabold text-primary block leading-tight">{pendingTasks.length}</span>
                                    <span className="text-[11px] font-semibold text-primary/80">Pending Action</span>
                                </div>
                                <div className="p-3.5 rounded-xl bg-green-500/10 border border-green-500/20 text-center">
                                    <span className="font-display-sm font-extrabold text-green-600 block leading-tight">{submittedTasks.length}</span>
                                    <span className="text-[11px] font-semibold text-green-700/80 dark:text-green-400">Completed</span>
                                </div>
                            </div>
                        </div>

                        {/* Submission Guidelines */}
                        <div className="bg-surface-container-lowest rounded-2xl p-5 border border-outline-variant custom-shadow space-y-3">
                            <h4 className="font-label-md font-bold text-on-surface text-xs flex items-center gap-1.5">
                                <span className="material-symbols-outlined text-amber-500 text-[18px]">lightbulb</span>
                                <span>Submission Guidelines</span>
                            </h4>
                            <ul className="text-xs text-on-surface-variant space-y-2 leading-relaxed">
                                <li className="flex items-start gap-1.5">
                                    <span className="material-symbols-outlined text-[15px] text-primary shrink-0 mt-0.5">check_circle</span>
                                    <span>Provide a public Google Docs, Notion, or GitHub link, or paste written answers directly.</span>
                                </li>
                                <li className="flex items-start gap-1.5">
                                    <span className="material-symbols-outlined text-[15px] text-primary shrink-0 mt-0.5">check_circle</span>
                                    <span>Check back regularly for instructor grading and constructive review notes.</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Submission / View Modal */}
                {activeTaskForSubmission && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
                        <div className="bg-surface rounded-3xl p-6 max-w-[540px] w-full shadow-2xl border border-outline-variant/60 max-h-[90vh] overflow-y-auto custom-scrollbar relative">
                            {/* Modal Header */}
                            <div className="flex justify-between items-start mb-4 pb-3 border-b border-outline-variant/40">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <h2 className="font-headline-sm text-on-surface font-bold text-lg">
                                            {activeTaskForSubmission.title}
                                        </h2>
                                        {activeTaskForSubmission.level && (
                                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${getLevelBadgeClass(activeTaskForSubmission.level)}`}>
                                                {activeTaskForSubmission.level}
                                            </span>
                                        )}
                                    </div>
                                    {activeTaskForSubmission.due_date && (
                                        <p className="text-xs text-error font-medium flex items-center gap-1">
                                            <span className="material-symbols-outlined text-[14px]">event</span>
                                            <span>Due: {new Date(activeTaskForSubmission.due_date).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</span>
                                        </p>
                                    )}
                                </div>
                                <button 
                                    onClick={() => setActiveTaskForSubmission(null)}
                                    className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-container text-on-surface-variant transition-colors cursor-pointer"
                                >
                                    <span className="material-symbols-outlined text-[18px]">close</span>
                                </button>
                            </div>

                            {/* Task Instructions */}
                            <div className="bg-surface-container-low p-3.5 rounded-xl border border-outline-variant/50 text-xs mb-4">
                                <h4 className="font-bold text-on-surface mb-1 flex items-center gap-1">
                                    <span className="material-symbols-outlined text-[15px] text-primary">description</span>
                                    <span>Instructions</span>
                                </h4>
                                <p className="text-on-surface-variant whitespace-pre-wrap leading-relaxed">{activeTaskForSubmission.description || 'No instructions provided.'}</p>
                            </div>

                            {/* Submission Form or Existing Review */}
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block font-label-md text-on-surface mb-1 font-semibold text-xs">Your Name *</label>
                                    <input 
                                        type="text"
                                        required
                                        value={studentName}
                                        onChange={(e) => setStudentName(e.target.value)}
                                        className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-3.5 py-2 text-xs text-on-surface focus:outline-none focus:border-primary transition-colors"
                                        placeholder="Enter your full name"
                                    />
                                </div>

                                <div>
                                    <label className="block font-label-md text-on-surface mb-1 font-semibold text-xs">Submission Content or Resource Link *</label>
                                    <p className="text-[11px] text-on-surface-variant mb-1.5">Paste a URL to your work (Google Drive, Doc, Figma) or write your answer directly below.</p>
                                    <textarea 
                                        required
                                        value={submissionContent}
                                        onChange={(e) => setSubmissionContent(e.target.value)}
                                        className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-3.5 py-2 text-xs text-on-surface focus:outline-none focus:border-primary transition-colors min-h-[120px] resize-none"
                                        placeholder="https://docs.google.com/... or type your solution here"
                                    />
                                </div>

                                <div className="flex justify-end gap-2.5 pt-3 border-t border-outline-variant/40 mt-4">
                                    <button
                                        type="button"
                                        onClick={() => setActiveTaskForSubmission(null)}
                                        className="px-4 py-2 rounded-xl text-xs font-semibold text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
                                    >
                                        Close
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSubmitting || !submissionContent.trim() || !studentName.trim()}
                                        className="px-5 py-2 rounded-xl text-xs font-semibold text-on-primary bg-primary hover:opacity-90 transition-all disabled:opacity-50 flex items-center gap-1.5 shadow-md cursor-pointer"
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
                                                <span>Submitting...</span>
                                            </>
                                        ) : (
                                            <>
                                                <span className="material-symbols-outlined text-[16px]">send</span>
                                                <span>{activeTaskForSubmission.submission ? 'Update Submission' : 'Submit Assignment'}</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </section>
    );
}
