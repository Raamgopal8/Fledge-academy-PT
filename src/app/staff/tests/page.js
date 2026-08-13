'use client';
import { useState, useEffect } from 'react';

export default function StaffTests() {
    const [tests, setTests] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    
    // New Test Form
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [level, setLevel] = useState('N5');
    const [dueDate, setDueDate] = useState('');
    
    // Submissions View
    const [activeTest, setActiveTest] = useState(null);
    const [submissions, setSubmissions] = useState([]);
    const [isReviewing, setIsReviewing] = useState(null); // submission ID
    const [reviewComment, setReviewComment] = useState('');

    const fetchTests = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${process.env.NEXT_PUBLIC_TEST_API_URL || 'http://localhost:8003'}/api/tests/`, {
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

    const handleCreateTest = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${process.env.NEXT_PUBLIC_TEST_API_URL || 'http://localhost:8003'}/api/tests/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ title, description, level, due_date: dueDate ? new Date(dueDate).toISOString() : null })
            });

            if (res.ok) {
                setIsCreating(false);
                setTitle('');
                setDescription('');
                setLevel('N5');
                setDueDate('');
                fetchTests();
            } else {
                alert("Failed to create test");
            }
        } catch (err) {
            console.error(err);
        }
    };

    const fetchSubmissions = async (test) => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${process.env.NEXT_PUBLIC_TEST_API_URL || 'http://localhost:8003'}/api/tests/${test.id}/submissions`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setSubmissions(data);
                setActiveTest(test);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleReviewSubmit = async (subId) => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${process.env.NEXT_PUBLIC_TEST_API_URL || 'http://localhost:8003'}/api/tests/submissions/${subId}/review`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ staff_comments: reviewComment, status: "Reviewed" })
            });

            if (res.ok) {
                setIsReviewing(null);
                setReviewComment('');
                fetchSubmissions(activeTest); // Refresh submissions
            } else {
                alert("Failed to submit review");
            }
        } catch (err) {
            console.error(err);
        }
    };

    if (isLoading) return <div className="p-gutter min-h-screen text-center"><span className="material-symbols-outlined animate-spin text-4xl">progress_activity</span></div>;

    if (activeTest) {
        return (
            <section className="max-w-[1440px] mx-auto p-gutter space-y-lg animate-fade-in">
                <button 
                    onClick={() => setActiveTest(null)}
                    className="flex items-center gap-2 text-on-surface hover:text-primary transition-colors font-label-md mb-4"
                >
                    <span className="material-symbols-outlined">arrow_back</span>
                    Back to Tests
                </button>
                
                <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-lg custom-shadow">
                    <h2 className="font-headline-md text-on-surface mb-2">{activeTest.title} - Submissions</h2>
                    <p className="text-on-surface-variant font-body-md whitespace-pre-wrap">{activeTest.description}</p>
                </div>

                <div className="space-y-md">
                    {submissions.length === 0 ? (
                        <div className="flex flex-col items-center justify-center text-center p-xl bg-surface-container/30 rounded-xl border border-dashed border-outline-variant min-h-[300px]">
                            <span className="material-symbols-outlined text-6xl text-outline/50 mb-md">inbox</span>
                            <h3 className="font-headline-sm text-on-surface-variant mb-xs">No submissions yet</h3>
                            <p className="font-body-md text-outline">Students haven't submitted anything for this test yet.</p>
                        </div>
                    ) : (
                        submissions.map(sub => (
                            <div key={sub.id} className="bg-surface-container-lowest p-md rounded-xl border border-outline-variant custom-shadow">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="font-title-md text-on-surface">{sub.student_name}</h3>
                                        <p className="text-xs text-on-surface-variant font-label-sm mt-1">{new Date(sub.submitted_at).toLocaleString()}</p>
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border ${sub.status === 'Reviewed' ? 'bg-primary-container/30 text-primary border-primary/20' : 'bg-tertiary-container/30 text-tertiary border-tertiary/20'}`}>
                                        {sub.status}
                                    </span>
                                </div>
                                
                                <div className="bg-surface-container-low p-sm rounded-lg mb-4 border border-outline-variant">
                                    <h4 className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2">Student Submission:</h4>
                                    {sub.submission_content.startsWith('http') ? (
                                        <a href={sub.submission_content} target="_blank" rel="noreferrer" className="text-primary hover:underline break-all inline-flex items-center gap-1 font-medium">
                                            <span className="material-symbols-outlined text-[16px]">link</span>
                                            {sub.submission_content}
                                        </a>
                                    ) : (
                                        <p className="whitespace-pre-wrap font-body-md text-on-surface">{sub.submission_content}</p>
                                    )}
                                </div>

                                {sub.status === 'Reviewed' && sub.staff_comments ? (
                                    <div className="bg-primary/5 p-sm rounded-lg border border-primary/20">
                                        <h4 className="text-xs font-semibold text-primary uppercase tracking-wider mb-2">Your Review:</h4>
                                        <p className="whitespace-pre-wrap font-body-md text-on-surface">{sub.staff_comments}</p>
                                    </div>
                                ) : (
                                    isReviewing === sub.id ? (
                                        <div className="space-y-3 mt-4 border-t border-outline-variant pt-4">
                                            <textarea
                                                className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl p-4 min-h-[100px] focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 text-on-surface transition-all resize-none"
                                                placeholder="Write your feedback here..."
                                                value={reviewComment}
                                                onChange={(e) => setReviewComment(e.target.value)}
                                            ></textarea>
                                            <div className="flex gap-3 justify-end">
                                                <button onClick={() => setIsReviewing(null)} className="px-6 py-2.5 rounded-full font-label-md text-on-surface bg-surface-container hover:bg-surface-container-highest transition-colors">Cancel</button>
                                                <button onClick={() => handleReviewSubmit(sub.id)} className="px-6 py-2.5 rounded-full font-label-md text-on-primary bg-primary hover:opacity-90 transition-colors shadow-sm active:scale-95 flex items-center gap-2">
                                                    <span className="material-symbols-outlined text-[18px]">send</span>
                                                    Submit Review
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <button 
                                            onClick={() => { setIsReviewing(sub.id); setReviewComment(''); }}
                                            className="mt-2 text-sm flex items-center gap-2 text-primary hover:bg-primary/10 px-4 py-2 rounded-full transition-colors font-medium border border-outline-variant"
                                        >
                                            <span className="material-symbols-outlined text-[18px]">rate_review</span>
                                            Review Submission
                                        </button>
                                    )
                                )}
                            </div>
                        ))
                    )}
                </div>
            </section>
        );
    }

    return (
        <section className="max-w-[1440px] mx-auto p-gutter space-y-lg animate-fade-in">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-md mb-lg">
                <div>
                    <div className="flex items-center gap-sm mb-xs">
                        <h1 className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#6FB7E4] via-[#5D8BCC] to-[#465AA3]">
                            Manage Tests & Assignments
                        </h1>
                    </div>
                    <p className="font-body-lg text-on-surface-variant max-w-2xl">
                        Create tests and review student submissions.
                    </p>
                </div>
                
                <div className="flex gap-sm">
                    <button 
                        onClick={() => setIsCreating(!isCreating)}
                        className="flex items-center gap-xs px-md py-sm rounded-lg bg-primary text-on-primary hover:opacity-90 transition-colors active:scale-95 font-label-md shadow-sm"
                    >
                        <span className="material-symbols-outlined text-[18px]">{isCreating ? 'close' : 'add'}</span>
                        {isCreating ? 'Cancel' : 'Create Test'}
                    </button>
                </div>
            </div>

            {isCreating && (
                <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-lg custom-shadow animate-fade-in mb-8">
                    <h2 className="font-display-sm text-on-surface mb-6">Post New Test</h2>
                    <form onSubmit={handleCreateTest} className="space-y-6">
                        <div>
                            <label className="block font-label-md text-on-surface mb-2">Title *</label>
                            <input
                                required
                                type="text"
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                                className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-3 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 text-on-surface transition-all"
                                placeholder="e.g. End of Semester Project"
                            />
                        </div>
                        <div>
                            <label className="block font-label-md text-on-surface mb-2">Level</label>
                            <select 
                                value={level}
                                onChange={(e) => setLevel(e.target.value)}
                                className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-3 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 text-on-surface transition-all"
                            >
                                <option value="N5">N5</option>
                                <option value="N4">N4</option>
                                <option value="N3">N3</option>
                            </select>
                        </div>
                        <div>
                            <label className="block font-label-md text-on-surface mb-2">Description / Questions *</label>
                            <textarea
                                required
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-3 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 text-on-surface min-h-[150px] transition-all resize-none"
                                placeholder="Detail the requirements, questions, and expectations..."
                            ></textarea>
                        </div>
                        <div>
                            <label className="block font-label-md text-on-surface mb-2">Deadline (Optional)</label>
                            <input
                                type="datetime-local"
                                value={dueDate}
                                onChange={e => setDueDate(e.target.value)}
                                className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-3 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 text-on-surface transition-all"
                            />
                        </div>
                        <div className="flex justify-end pt-6 border-t border-outline-variant/30 mt-6">
                            <button type="submit" className="px-6 py-2.5 rounded-full font-label-md text-on-primary bg-primary hover:opacity-90 transition-colors shadow-sm active:scale-95 flex items-center gap-2">
                                <span className="material-symbols-outlined text-[18px]">publish</span>
                                Publish Test
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {tests.map(test => (
                    <div key={test.id} className="group relative bg-surface-container-low rounded-2xl p-6 flex flex-col justify-between border border-outline-variant hover:border-primary/50 hover:shadow-lg transition-all duration-300 overflow-hidden">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-bl-full -z-10 transition-transform group-hover:scale-110"></div>
                        <div>
                            <div className="flex justify-between items-start mb-4">
                                <div className="w-14 h-14 rounded-2xl bg-primary-container text-primary flex items-center justify-center shadow-sm">
                                    <span className="material-symbols-outlined text-3xl">assignment</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 mb-2">
                                <h3 className="font-headline-sm text-on-surface break-words group-hover:text-primary transition-colors pr-2 flex-1">{test.title}</h3>
                                {test.level && (
                                    <span className="px-2 py-1 text-xs font-bold rounded-md bg-secondary-container text-on-secondary-container shrink-0">
                                        {test.level}
                                    </span>
                                )}
                            </div>
                            <p className="font-body-md text-on-surface-variant mb-4 flex-1 line-clamp-3 break-words">{test.description}</p>
                        </div>
                        <div className="flex items-center justify-between mt-2 pt-4 border-t border-outline-variant/50">
                            <div className="flex flex-col">
                                <span className="text-xs font-label-md text-outline flex items-center gap-1">
                                    <span className="material-symbols-outlined text-[14px]">calendar_today</span>
                                    {new Date(test.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                                </span>
                                {test.due_date && (
                                    <span className="text-xs font-label-md text-error flex items-center gap-1 mt-1">
                                        <span className="material-symbols-outlined text-[14px]">schedule</span>
                                        Due: {new Date(test.due_date).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                                    </span>
                                )}
                            </div>
                            <button 
                                onClick={() => fetchSubmissions(test)}
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary hover:bg-primary hover:text-on-primary transition-colors font-label-md shadow-sm cursor-pointer relative z-50 pointer-events-auto"
                            >
                                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                                View
                            </button>
                        </div>
                    </div>
                ))}
            </div>
            
            {!isCreating && tests.length === 0 && (
                <div className="flex flex-col items-center justify-center text-center p-xl bg-surface-container/30 rounded-xl border border-dashed border-outline-variant min-h-[300px]">
                    <span className="material-symbols-outlined text-6xl text-outline/50 mb-md">assignment</span>
                    <h3 className="font-headline-sm text-on-surface-variant mb-xs">No Tests Created</h3>
                    <p className="font-body-md text-outline">Create your first test to get started.</p>
                </div>
            )}
        </section>
    );
}
