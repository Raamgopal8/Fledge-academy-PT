'use client';
import { useState, useEffect } from 'react';

const LEVEL_COLORS = {
    'Level 5': 'bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/30',
    'Level 4': 'bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30',
    'Level 3': 'bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 border-yellow-500/30',
    'Level 2': 'bg-orange-500/15 text-orange-700 dark:text-orange-400 border-orange-500/30',
    'Level 1': 'bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30',
};

export default function StudentTests() {
    const [tests, setTests] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTest, setActiveTest] = useState(null);
    const [filterLevel, setFilterLevel] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');
    
    const [submissionContent, setSubmissionContent] = useState('');
    const [studentName, setStudentName] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [studentLevel, setStudentLevel] = useState('Level 5');
    const [successFeedback, setSuccessFeedback] = useState('');

    const fetchTests = async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem('token');
            let level = localStorage.getItem('level') || 'Level 5';
            let batch = localStorage.getItem('batch') || '';
            let name = localStorage.getItem('userName') || localStorage.getItem('name') || '';
            if (name) {
                setStudentName(name);
            } else if (token) {
                try {
                    const profRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/user/profile`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (profRes.ok) {
                        const prof = await profRes.json();
                        if (prof.name) {
                            setStudentName(prof.name);
                            localStorage.setItem('userName', prof.name);
                        }
                    }
                } catch (e) {}
            }

            setStudentLevel(level);

            const queryParams = new URLSearchParams();
            if (level) queryParams.append('level', level);
            if (batch) queryParams.append('batch', batch);

            const res = await fetch(`${process.env.NEXT_PUBLIC_TEST_API_URL || ''}/api/tests?${queryParams.toString()}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setTests(data);
            }
        } catch (err) {
            console.error('Error fetching tests:', err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchTests();
    }, []);

    const handleSubmitTest = async (e) => {
        e.preventDefault();
        const activeName = studentName.trim() || localStorage.getItem('userName') || localStorage.getItem('name') || '';
        if (!submissionContent.trim() || !activeName || !activeTest) return;

        setIsSubmitting(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${process.env.NEXT_PUBLIC_TEST_API_URL || ''}/api/tests/${activeTest.id}/submit`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ student_name: activeName, submission_content: submissionContent })
            });

            if (res.ok) {
                setSubmissionContent('');
                setActiveTest(null);
                setSuccessFeedback('Assignment submitted successfully!');
                await fetchTests();
                setTimeout(() => setSuccessFeedback(''), 4000);
            } else {
                const data = await res.json().catch(() => ({}));
                alert(data.detail || "Failed to submit test");
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsSubmitting(false);
        }
    };

    const getLevelBadgeClass = (lvl) => {
        return LEVEL_COLORS[lvl] || 'bg-primary/10 text-primary border-primary/20';
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

    const filteredTests = tests.filter(t => {
        if (filterLevel !== 'All' && t.level !== filterLevel) return false;
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            return (t.title || '').toLowerCase().includes(q) || (t.description || '').toLowerCase().includes(q);
        }
        return true;
    });

    return (
        <section className="max-w-[1440px] mx-auto p-gutter space-y-lg animate-fade-in">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-md mb-lg">
                    <div>
                        <div className="flex items-center gap-sm mb-xs">
                            <span className="material-symbols-outlined text-primary text-3xl">assignment</span>
                            <h1 className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#6FB7E4] via-[#5D8BCC] to-[#465AA3]">
                                Tests & Assignments
                            </h1>
                        </div>
                        <p className="font-body-lg text-on-surface-variant max-w-2xl">
                            View and submit your ongoing coursework.
                        </p>
                    </div>

                    {/* Active Student Level Indicator (Batch hidden in UI) */}
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

                {/* Filter Controls Bar */}
                <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-4 custom-shadow flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-on-surface-variant font-medium">Level:</span>
                        <select
                            value={filterLevel}
                            onChange={(e) => setFilterLevel(e.target.value)}
                            className="bg-surface-container border border-outline-variant rounded-lg px-2.5 py-1.5 text-xs text-on-surface focus:outline-none focus:border-primary"
                        >
                            <option value="All">All Levels</option>
                            <option value="Level 5">Level 5</option>
                            <option value="Level 4">Level 4</option>
                            <option value="Level 3">Level 3</option>
                            <option value="Level 2">Level 2</option>
                            <option value="Level 1">Level 1</option>
                        </select>
                    </div>

                    <div className="relative min-w-[220px]">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[16px] text-on-surface-variant">search</span>
                        <input 
                            type="text"
                            placeholder="Search tests..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-8 pr-3 py-1.5 bg-surface-container border border-outline-variant rounded-xl text-xs text-on-surface focus:outline-none focus:border-primary"
                        />
                    </div>
                </div>

                {/* Grid */}
                <div className="min-h-[400px]">
                    {isLoading ? (
                        <div className="flex flex-col justify-center items-center h-64 bg-surface-container-lowest border border-outline-variant rounded-2xl gap-3">
                            <span className="material-symbols-outlined text-4xl text-primary animate-spin">progress_activity</span>
                            <p className="text-xs text-on-surface-variant">Loading tests...</p>
                        </div>
                    ) : filteredTests.length === 0 ? (
                        <div className="flex flex-col items-center justify-center text-center p-12 bg-surface-container-lowest rounded-2xl border border-dashed border-outline-variant h-64 custom-shadow">
                            <span className="material-symbols-outlined text-6xl text-outline/40 mb-3">task</span>
                            <h3 className="font-headline-sm text-on-surface-variant font-bold">No active assignments</h3>
                            <p className="font-body-md text-outline text-xs mt-1">You're all caught up!</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredTests.map(test => {
                                const urgency = getTaskUrgency(test.due_date, test.submission);
                                const isApproved = test.submission && (test.submission.status === 'Approved' || test.submission.status === 'Reviewed');
                                const isNeedWork = test.submission && (test.submission.status === 'Need Work' || test.submission.status === 'Needs Work' || test.submission.status === 'Failed');

                                return (
                                    <div key={test.id} className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant hover:border-primary/50 hover:shadow-lg transition-all custom-shadow flex flex-col justify-between">
                                        <div>
                                            <div className="flex justify-between items-start mb-2 gap-2">
                                                <h3 className="font-headline-sm text-on-surface font-bold text-base line-clamp-2">{test.title}</h3>
                                                {test.level && (
                                                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border shrink-0 ${getLevelBadgeClass(test.level)}`}>
                                                        {test.level}
                                                    </span>
                                                )}
                                            </div>

                                            {test.due_date && (
                                                <div className="flex items-center gap-2 mb-2">
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
                                                    <span className="text-xs text-on-surface-variant/80">
                                                        Due: {new Date(test.due_date).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                                                    </span>
                                                </div>
                                            )}

                                            <p className="text-on-surface-variant text-xs line-clamp-3 mb-4 leading-relaxed whitespace-pre-wrap">
                                                {test.description || 'No description provided.'}
                                            </p>
                                        </div>
                                        
                                        <div className="pt-3 border-t border-outline-variant/40 mt-auto flex items-center justify-between">
                                            <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold flex items-center gap-1 ${
                                                test.submission 
                                                    ? (isApproved
                                                        ? 'bg-green-500/15 text-green-700 dark:text-green-400 border border-green-500/30' 
                                                        : isNeedWork
                                                            ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30'
                                                            : 'bg-primary/10 text-primary border border-primary/20') 
                                                    : 'bg-error-container text-error border border-error/20'
                                            }`}>
                                                <span className="material-symbols-outlined text-[13px]">
                                                    {isApproved ? 'check_circle' : isNeedWork ? 'assignment_return' : test.submission ? 'task_alt' : 'schedule'}
                                                </span>
                                                <span>
                                                    {test.submission 
                                                        ? (isApproved ? 'Approved' : (isNeedWork ? 'Need Work' : test.submission.status)) 
                                                        : 'Pending'}
                                                </span>
                                            </span>

                                            <button 
                                                onClick={() => {
                                                    setActiveTest(test);
                                                    setSubmissionContent(test.submission?.submission_content || '');
                                                }}
                                                className="px-3.5 py-1.5 rounded-xl bg-primary text-on-primary font-bold text-xs hover:opacity-90 transition-all flex items-center gap-1 shadow-xs cursor-pointer"
                                            >
                                                <span className="material-symbols-outlined text-[15px]">
                                                     {test.submission ? 'visibility' : 'send'}
                                                 </span>
                                                 <span>{test.submission ? 'View' : 'Start'}</span>
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Submission Modal */}
                {activeTest && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
                        <div className="bg-surface rounded-3xl p-6 max-w-[540px] w-full shadow-2xl border border-outline-variant/60 max-h-[90vh] overflow-y-auto custom-scrollbar relative">
                            <div className="flex justify-between items-start mb-4 pb-3 border-b border-outline-variant/40">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <h2 className="font-headline-sm text-on-surface font-bold text-lg">{activeTest.title}</h2>
                                        {activeTest.level && (
                                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${getLevelBadgeClass(activeTest.level)}`}>
                                                {activeTest.level}
                                            </span>
                                        )}
                                    </div>
                                    {activeTest.due_date && (
                                        <p className="text-xs text-error font-medium">
                                            Due: {new Date(activeTest.due_date).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                                        </p>
                                    )}
                                </div>
                                <button 
                                    onClick={() => setActiveTest(null)}
                                    className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-container text-on-surface-variant transition-colors cursor-pointer"
                                >
                                    <span className="material-symbols-outlined text-[18px]">close</span>
                                </button>
                            </div>

                            <div className="bg-surface-container-low p-3.5 rounded-xl border border-outline-variant/50 text-xs mb-4">
                                <h4 className="font-bold text-on-surface mb-1 flex items-center gap-1">
                                    <span className="material-symbols-outlined text-[15px] text-primary">description</span>
                                    <span>Instructions</span>
                                </h4>
                                <p className="text-on-surface-variant whitespace-pre-wrap leading-relaxed">{activeTest.description || 'No instructions.'}</p>
                            </div>

                            {activeTest.submission && (activeTest.submission.status === 'Approved' || activeTest.submission.status === 'Reviewed' || activeTest.submission.status === 'Need Work' || activeTest.submission.status === 'Needs Work') && activeTest.submission.staff_comments && (
                                <div className={`mb-4 p-3.5 rounded-xl border text-xs space-y-1 ${
                                    (activeTest.submission.status === 'Approved' || activeTest.submission.status === 'Reviewed')
                                        ? 'bg-green-500/10 border-green-500/30'
                                        : 'bg-amber-500/10 border-amber-500/30'
                                }`}>
                                    <h4 className={`font-bold flex items-center gap-1.5 ${
                                        (activeTest.submission.status === 'Approved' || activeTest.submission.status === 'Reviewed')
                                            ? 'text-green-700 dark:text-green-400'
                                            : 'text-amber-700 dark:text-amber-400'
                                    }`}>
                                        <span className="material-symbols-outlined text-[16px]">reviews</span>
                                        <span>Instructor Feedback ({(activeTest.submission.status === 'Approved' || activeTest.submission.status === 'Reviewed') ? 'Approved' : 'Need Work'})</span>
                                    </h4>
                                    <p className="text-on-surface italic">{activeTest.submission.staff_comments}</p>
                                </div>
                            )}

                            <form onSubmit={handleSubmitTest} className="space-y-4">
                                <div>
                                    <label className="block font-label-md text-on-surface mb-1 font-semibold text-xs">Your Name *</label>
                                    <input 
                                        type="text"
                                        required
                                        value={studentName}
                                        onChange={(e) => setStudentName(e.target.value)}
                                        className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-3.5 py-2 text-xs text-on-surface focus:outline-none focus:border-primary transition-colors"
                                        placeholder="Enter full name"
                                    />
                                </div>

                                <div>
                                    <label className="block font-label-md text-on-surface mb-1 font-semibold text-xs">Your Submission *</label>
                                    <p className="text-[11px] text-on-surface-variant mb-1.5">Provide a link (Google Doc, Notion, GitHub) or paste your solution directly.</p>
                                    <textarea 
                                        required
                                        value={submissionContent}
                                        onChange={(e) => setSubmissionContent(e.target.value)}
                                        className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-3.5 py-2 text-xs text-on-surface focus:outline-none focus:border-primary transition-colors min-h-[120px] resize-none"
                                        placeholder="https://... or solution text"
                                    />
                                </div>

                                <div className="flex justify-end gap-2.5 pt-3 border-t border-outline-variant/40 mt-4">
                                    <button
                                        type="button"
                                        onClick={() => setActiveTest(null)}
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
                                                <span>{activeTest.submission ? 'Update Submission' : 'Submit Assignment'}</span>
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
