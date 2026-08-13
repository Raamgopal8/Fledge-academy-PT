'use client';
import { useState, useEffect } from 'react';

export default function StudentTests() {
    const [tests, setTests] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTest, setActiveTest] = useState(null);
    
    const [submissionContent, setSubmissionContent] = useState('');
    const [studentName, setStudentName] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

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

    const handleSubmitTest = async (e) => {
        e.preventDefault();
        if (!submissionContent.trim() || !studentName.trim() || !activeTest) return;

        setIsSubmitting(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${process.env.NEXT_PUBLIC_TEST_API_URL || 'http://localhost:8003'}/api/tests/${activeTest.id}/submit`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ student_name: studentName, submission_content: submissionContent })
            });

            if (res.ok) {
                setSubmissionContent('');
                setStudentName('');
                setActiveTest(null);
                fetchTests(); // refresh the list to get new status
            } else {
                const data = await res.json();
                alert(data.detail || "Failed to submit test");
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) return <div className="p-gutter min-h-screen text-center"><span className="material-symbols-outlined animate-spin text-4xl">progress_activity</span></div>;

    if (activeTest) {
        return (
            <div className="p-gutter max-w-[1000px] mx-auto space-y-lg min-h-screen">
                <button 
                    onClick={() => { setActiveTest(null); setSubmissionContent(''); setStudentName(''); }}
                    className="flex items-center gap-2 text-on-surface hover:text-primary transition-colors mb-4"
                >
                    <span className="material-symbols-outlined">arrow_back</span>
                    Back to Tests
                </button>
                
                <div className="bg-surface-container p-xl rounded-3xl border border-outline-variant shadow-sm space-y-md">
                    <div>
                        <h2 className="font-display-sm text-on-surface mb-2">{activeTest.title}</h2>
                        <div className="flex gap-2">
                            <span className="text-sm font-medium text-on-surface-variant bg-surface-container-highest px-3 py-1 rounded-full">
                                Posted {new Date(activeTest.created_at).toLocaleDateString()}
                            </span>
                            {activeTest.due_date && (
                                <span className="text-sm font-medium text-error bg-error/10 px-3 py-1 rounded-full">
                                    Due {new Date(activeTest.due_date).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                                </span>
                            )}
                        </div>
                    </div>
                    
                    <div className="bg-surface p-lg rounded-2xl border border-outline-variant">
                        <h3 className="font-label-lg uppercase tracking-wider text-on-surface-variant mb-4">Instructions</h3>
                        <p className="text-on-surface font-body-lg whitespace-pre-wrap">{activeTest.description}</p>
                    </div>

                    {!activeTest.submission ? (
                        <form onSubmit={handleSubmitTest} className="space-y-md border-t border-outline-variant pt-lg">
                            <div>
                                <label className="block text-sm font-semibold text-on-surface mb-2">Your Name</label>
                                <input
                                    type="text"
                                    required
                                    value={studentName}
                                    onChange={e => setStudentName(e.target.value)}
                                    className="w-full bg-surface border border-outline rounded-xl p-4 focus:outline-none focus:border-primary shadow-inner mb-6"
                                    placeholder="Enter your full name"
                                />
                                <label className="block text-sm font-semibold text-on-surface mb-2">Your Submission</label>
                                <p className="text-sm text-on-surface-variant mb-4">Provide a link to your work (e.g. Google Doc, GitHub, Figma) or paste your answer directly.</p>
                                <textarea
                                    required
                                    value={submissionContent}
                                    onChange={e => setSubmissionContent(e.target.value)}
                                    className="w-full bg-surface border border-outline rounded-xl p-4 min-h-[200px] focus:outline-none focus:border-primary shadow-inner"
                                    placeholder="https://link-to-your-work.com/..."
                                ></textarea>
                            </div>
                            <div className="flex justify-end">
                                <button 
                                    type="submit" 
                                    disabled={isSubmitting}
                                    className="h-12 px-8 rounded-full bg-primary text-on-primary font-label-lg hover:bg-primary/90 shadow-md active:scale-95 transition-all disabled:opacity-50"
                                >
                                    {isSubmitting ? 'Submitting...' : 'Submit Work'}
                                </button>
                            </div>
                        </form>
                    ) : (
                        <div className="border-t border-outline-variant pt-lg space-y-md">
                            <div className="flex justify-between items-center">
                                <h3 className="font-title-lg text-on-surface">Your Submission Status</h3>
                                <span className={`px-4 py-1.5 rounded-full text-sm font-medium ${
                                    activeTest.submission.status === 'Reviewed' 
                                    ? 'bg-primary-container text-on-primary-container' 
                                    : 'bg-tertiary-container text-on-tertiary-container'
                                }`}>
                                    {activeTest.submission.status}
                                </span>
                            </div>
                            
                            {activeTest.submission.status === 'Reviewed' && activeTest.submission.staff_comments && (
                                <div className="bg-primary/5 p-md rounded-2xl border border-primary/20">
                                    <h4 className="text-sm font-semibold text-primary uppercase tracking-wider mb-2 flex items-center gap-2">
                                        <span className="material-symbols-outlined text-[18px]">reviews</span>
                                        Staff Feedback
                                    </h4>
                                    <p className="whitespace-pre-wrap font-body-lg text-on-surface">{activeTest.submission.staff_comments}</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="p-gutter max-w-[1200px] mx-auto space-y-lg min-h-screen">
            <div className="border-b border-outline-variant pb-md">
                <h1 className="text-3xl md:text-4xl font-bold mb-lg text-transparent bg-clip-text bg-gradient-to-r from-[#6FB7E4] via-[#5D8BCC] to-[#465AA3]">Tests & Assignments</h1>
                <p className="font-body-lg text-on-surface-variant mt-2">View and submit your ongoing coursework.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-md">
                {tests.map(test => (
                    <div key={test.id} className="bg-surface p-lg rounded-2xl border border-outline-variant shadow-sm hover:shadow-md transition-shadow group flex flex-col">
                        <div className="flex justify-between items-start mb-2">
                            <div className="flex flex-col">
                                <h3 className="font-title-lg text-on-surface">{test.title}</h3>
                                {test.due_date && (
                                    <span className="text-xs font-medium text-error mt-1">
                                        Due: {new Date(test.due_date).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                                    </span>
                                )}
                            </div>
                            {test.submission && (
                                <span className="material-symbols-outlined text-primary" title="Submitted">task_alt</span>
                            )}
                        </div>
                        <p className="text-on-surface-variant font-body-sm line-clamp-3 mb-6 flex-1">{test.description}</p>
                        
                        <button 
                            onClick={() => setActiveTest(test)}
                            className="w-full h-10 rounded-lg bg-surface-container-highest text-on-surface font-label-md flex justify-center items-center gap-2 hover:bg-secondary-container hover:text-on-secondary-container transition-colors"
                        >
                            {test.submission ? 'View Submission' : 'Start Assignment'}
                        </button>
                    </div>
                ))}
            </div>
            
            {tests.length === 0 && (
                <div className="text-center py-20 bg-surface-container-low rounded-3xl border border-outline-variant">
                    <span className="material-symbols-outlined text-[64px] text-on-surface-variant mb-4 opacity-50">task</span>
                    <h3 className="font-headline-sm text-on-surface mb-2">No active assignments</h3>
                    <p className="text-on-surface-variant font-body-md">You're all caught up!</p>
                </div>
            )}
        </div>
    );
}
