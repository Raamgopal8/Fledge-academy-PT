'use client';
import { useState, useEffect } from 'react';
import { useCEOContext } from '../CEOContext';

export default function CEOTests() {
    const { selectedBatch } = useCEOContext();
    const [tests, setTests] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    
    // Submissions View
    const [activeTest, setActiveTest] = useState(null);
    const [submissions, setSubmissions] = useState([]);

    const fetchTests = async () => {
        try {
            const token = localStorage.getItem('token');
            const batchQuery = (selectedBatch && selectedBatch !== 'All Batches') ? `?batch=${encodeURIComponent(selectedBatch)}` : '';
            const res = await fetch(`${process.env.NEXT_PUBLIC_TEST_API_URL || ''}/api/tests/${batchQuery}`, {
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
    }, [selectedBatch]);

    const fetchSubmissions = async (test) => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${process.env.NEXT_PUBLIC_TEST_API_URL || ''}/api/tests/${test.id}/submissions`, {
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

    if (isLoading) return <div className="p-4 md:p-gutter min-h-screen text-center flex items-center justify-center"><span className="material-symbols-outlined animate-spin text-4xl text-primary">progress_activity</span></div>;

    if (activeTest) {
        return (
            <div className="max-w-[1440px] mx-auto p-gutter space-y-lg relative pb-32 animate-fade-in">
                <button 
                    onClick={() => setActiveTest(null)}
                    className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-on-surface hover:text-primary transition-colors mb-2 cursor-pointer"
                >
                    <span className="material-symbols-outlined text-[20px]">arrow_back</span>
                    <span>Back to Tests</span>
                </button>
                
                <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-3xl p-5 md:p-6 custom-shadow hover:shadow-md transition-all flex flex-col">
                    <div className="mb-4 border-b border-outline-variant/60 pb-3">
                        <h2 className="text-lg sm:text-xl font-bold text-on-surface mb-1">{activeTest.title} - Submissions Overview</h2>
                        <p className="text-on-surface-variant text-xs sm:text-sm whitespace-pre-wrap">{activeTest.description}</p>
                    </div>

                    <div className="space-y-3">
                    {submissions.length === 0 ? (
                        <div className="text-center py-12 bg-surface-container-low/60 rounded-2xl border border-outline-variant/60">
                            <span className="material-symbols-outlined text-[40px] text-on-surface-variant mb-2 opacity-50">inbox</span>
                            <p className="text-on-surface-variant text-xs sm:text-sm">No submissions yet.</p>
                        </div>
                    ) : (
                        submissions.map(sub => {
                            const isApproved = sub.status === 'Approved' || sub.status === 'Reviewed';
                            const isNeedWork = sub.status === 'Need Work' || sub.status === 'Needs Work' || sub.status === 'Failed';

                            return (
                                <div key={sub.id} className="bg-surface-container-low/60 p-4 rounded-2xl border border-outline-variant/60 shadow-xs">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <h3 className="text-xs sm:text-sm font-bold text-on-surface">{sub.student_name || 'Student'}</h3>
                                            <p className="text-[10px] sm:text-xs text-on-surface-variant">{new Date(sub.submitted_at).toLocaleString()}</p>
                                        </div>
                                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-semibold border ${
                                            isApproved 
                                                ? 'bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/30' 
                                                : isNeedWork 
                                                ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30' 
                                                : 'bg-primary/10 text-primary border-primary/20'
                                        }`}>
                                            {isApproved ? 'Approved' : isNeedWork ? 'Need Work' : (sub.status || 'Pending Review')}
                                        </span>
                                    </div>
                                    
                                    <div className="bg-surface-container-lowest p-3 rounded-xl mb-2 border border-outline-variant/60">
                                        <h4 className="text-[10px] sm:text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">Student Submission:</h4>
                                        {sub.submission_content && sub.submission_content.startsWith('http') ? (
                                            <a href={sub.submission_content} target="_blank" rel="noreferrer" className="text-primary hover:underline break-all text-xs sm:text-sm">
                                                {sub.submission_content}
                                            </a>
                                        ) : (
                                            <p className="whitespace-pre-wrap text-xs sm:text-sm text-on-surface">{sub.submission_content || 'No text content.'}</p>
                                        )}
                                    </div>

                                    {sub.staff_comments && (
                                        <div className={`p-3 rounded-xl border ${isApproved ? 'bg-green-500/10 border-green-500/30' : 'bg-amber-500/10 border-amber-500/30'}`}>
                                            <h4 className={`text-[10px] sm:text-xs font-bold uppercase tracking-wider mb-1 ${isApproved ? 'text-green-700 dark:text-green-400' : 'text-amber-700 dark:text-amber-400'}`}>
                                                Staff Review ({isApproved ? 'Approved' : 'Need Work'}):
                                            </h4>
                                            <p className="whitespace-pre-wrap text-xs sm:text-sm text-on-surface">{sub.staff_comments}</p>
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-[1440px] mx-auto p-gutter space-y-lg relative pb-32 animate-fade-in">
            <section className="flex flex-col md:flex-row md:items-center justify-between gap-md mb-lg">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="material-symbols-outlined text-primary text-3xl">assignment</span>
                        <h1 className="text-3xl md:text-4xl font-bold tracking-tight bg-gradient-to-r from-[#6FB7E4] via-[#5D8BCC] to-[#465AA3] text-transparent bg-clip-text">Test Analytics Overview</h1>
                    </div>
                    <p className="font-body-md text-on-surface-variant max-w-2xl">Monitor all tests and student submissions across the academy.</p>
                </div>
            </section>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 w-full max-w-full">
                {tests.map(test => (
                    <div key={test.id} className="bg-surface-container-lowest p-5 md:p-6 rounded-3xl border border-outline-variant/60 custom-shadow hover:shadow-md hover:border-primary/50 transition-all group flex flex-col justify-between">
                        <div>
                            <h3 className="text-sm sm:text-base font-bold text-on-surface mb-1">{test.title}</h3>
                            <p className="text-on-surface-variant text-xs line-clamp-3 mb-3 flex-1">{test.description}</p>
                        </div>
                        
                        <div className="flex justify-between items-center mt-auto pt-3 border-t border-outline-variant">
                            <div className="flex flex-col min-w-0 mr-2">
                                <span className="text-[10px] sm:text-xs text-on-surface-variant truncate">
                                    Posted: {new Date(test.created_at).toLocaleDateString()}
                                </span>
                                {test.due_date && (
                                    <span className="text-[10px] sm:text-xs font-semibold text-error mt-0.5 truncate">
                                        Due: {new Date(test.due_date).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                                    </span>
                                )}
                            </div>
                            <button 
                                onClick={() => fetchSubmissions(test)}
                                className="text-primary text-xs sm:text-sm font-semibold flex items-center gap-1 group-hover:underline shrink-0"
                            >
                                View Analytics
                                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                            </button>
                        </div>
                    </div>
                ))}
            </div>
            
            {tests.length === 0 && (
                <div className="text-center py-12 sm:py-20 bg-surface-container-low rounded-2xl sm:rounded-3xl border border-outline-variant">
                    <span className="material-symbols-outlined text-[48px] sm:text-[64px] text-on-surface-variant mb-2 opacity-50">assignment</span>
                    <h3 className="text-base sm:text-xl font-bold text-on-surface mb-1">No Tests Active</h3>
                    <p className="text-on-surface-variant text-xs sm:text-sm">There are currently no assignments or tests posted by the staff.</p>
                </div>
            )}
        </div>
    );
}
