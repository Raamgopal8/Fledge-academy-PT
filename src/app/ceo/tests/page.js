'use client';
import { useState, useEffect } from 'react';

export default function CEOTests() {
    const [tests, setTests] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    
    // Submissions View
    const [activeTest, setActiveTest] = useState(null);
    const [submissions, setSubmissions] = useState([]);

    const fetchTests = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('http://localhost:8000/api/tests/', {
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

    const fetchSubmissions = async (test) => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`http://localhost:8000/api/tests/${test.id}/submissions`, {
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

    if (isLoading) return <div className="p-gutter min-h-screen text-center"><span className="material-symbols-outlined animate-spin text-4xl">progress_activity</span></div>;

    if (activeTest) {
        return (
            <div className="p-gutter max-w-[1200px] mx-auto space-y-lg min-h-screen">
                <button 
                    onClick={() => setActiveTest(null)}
                    className="flex items-center gap-2 text-on-surface hover:text-primary transition-colors mb-4"
                >
                    <span className="material-symbols-outlined">arrow_back</span>
                    Back to Tests
                </button>
                
                <div className="bg-surface-container p-lg rounded-2xl border border-outline-variant shadow-sm">
                    <h2 className="font-headline-md text-on-surface mb-2">{activeTest.title} - Submissions Overview</h2>
                    <p className="text-on-surface-variant font-body-md whitespace-pre-wrap">{activeTest.description}</p>
                </div>

                <div className="space-y-md">
                    {submissions.length === 0 ? (
                        <div className="text-center py-10 bg-surface-container-low rounded-2xl border border-outline-variant">
                            <span className="material-symbols-outlined text-[48px] text-on-surface-variant mb-4 opacity-50">inbox</span>
                            <p className="text-on-surface-variant font-body-md">No submissions yet.</p>
                        </div>
                    ) : (
                        submissions.map(sub => (
                            <div key={sub.id} className="bg-surface p-md rounded-xl border border-outline-variant shadow-sm">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="font-title-md text-on-surface">{sub.student_name}</h3>
                                        <p className="text-xs text-on-surface-variant">{new Date(sub.submitted_at).toLocaleString()}</p>
                                    </div>
                                    <span className={`px-2 py-1 rounded text-xs font-medium ${sub.status === 'Reviewed' ? 'bg-primary-container text-on-primary-container' : 'bg-tertiary-container text-on-tertiary-container'}`}>
                                        {sub.status}
                                    </span>
                                </div>
                                
                                <div className="bg-surface-container-lowest p-sm rounded-lg mb-4 border border-outline-variant">
                                    <h4 className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2">Student Submission:</h4>
                                    {sub.submission_content.startsWith('http') ? (
                                        <a href={sub.submission_content} target="_blank" rel="noreferrer" className="text-primary hover:underline break-all">
                                            {sub.submission_content}
                                        </a>
                                    ) : (
                                        <p className="whitespace-pre-wrap font-body-md text-on-surface">{sub.submission_content}</p>
                                    )}
                                </div>

                                {sub.status === 'Reviewed' && sub.staff_comments && (
                                    <div className="bg-primary/5 p-sm rounded-lg border border-primary/20">
                                        <h4 className="text-xs font-semibold text-primary uppercase tracking-wider mb-2">Staff Review:</h4>
                                        <p className="whitespace-pre-wrap font-body-md text-on-surface">{sub.staff_comments}</p>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="p-gutter max-w-[1200px] mx-auto space-y-lg min-h-screen">
            <div className="flex justify-between items-end border-b border-outline-variant pb-md">
                <div>
                    <h1 className="font-display-sm text-on-surface">Test Analytics Overview</h1>
                    <p className="font-body-lg text-on-surface-variant mt-2">Monitor all tests and student submissions across the organization.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-md">
                {tests.map(test => (
                    <div key={test.id} className="bg-surface p-lg rounded-2xl border border-outline-variant shadow-sm hover:shadow-md transition-shadow group flex flex-col">
                        <h3 className="font-title-lg text-on-surface mb-2">{test.title}</h3>
                        <p className="text-on-surface-variant font-body-sm line-clamp-3 mb-4 flex-1">{test.description}</p>
                        
                        <div className="flex justify-between items-center mt-auto pt-4 border-t border-outline-variant">
                            <span className="text-xs text-on-surface-variant">
                                {new Date(test.created_at).toLocaleDateString()}
                            </span>
                            <button 
                                onClick={() => fetchSubmissions(test)}
                                className="text-primary font-label-md flex items-center gap-1 group-hover:underline"
                            >
                                View Analytics
                                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                            </button>
                        </div>
                    </div>
                ))}
            </div>
            
            {tests.length === 0 && (
                <div className="text-center py-20 bg-surface-container-low rounded-3xl border border-outline-variant">
                    <span className="material-symbols-outlined text-[64px] text-on-surface-variant mb-4 opacity-50">assignment</span>
                    <h3 className="font-headline-sm text-on-surface mb-2">No Tests Active</h3>
                    <p className="text-on-surface-variant font-body-md">There are currently no assignments or tests posted by the staff.</p>
                </div>
            )}
        </div>
    );
}
