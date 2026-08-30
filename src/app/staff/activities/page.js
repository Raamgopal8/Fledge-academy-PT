'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function StaffActivities() {
    const [submissions, setSubmissions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isReviewing, setIsReviewing] = useState(null); // submission ID
    const [reviewComment, setReviewComment] = useState('');

    const fetchSubmissions = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${process.env.NEXT_PUBLIC_TEST_API_URL || ''}/api/tests/submissions/all`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setSubmissions(data);
            }
        } catch (err) {
            console.error('Error fetching submissions:', err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchSubmissions();
    }, []);

    const handleReviewSubmit = async (subId, status) => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${process.env.NEXT_PUBLIC_TEST_API_URL || ''}/api/tests/submissions/${subId}/review`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ staff_comments: reviewComment, status: status })
            });

            if (res.ok) {
                setIsReviewing(null);
                setReviewComment('');
                fetchSubmissions(); // Refresh submissions
            } else {
                alert("Failed to submit review");
            }
        } catch (err) {
            console.error(err);
        }
    };

    if (isLoading) return <div className="p-gutter min-h-screen text-center"><span className="material-symbols-outlined animate-spin text-4xl">progress_activity</span></div>;

    return (
        <div className="max-w-[1440px] mx-auto p-gutter space-y-lg relative pb-32 animate-fade-in w-full max-w-full overflow-x-hidden">
            {/* Header */}
            <section className="flex flex-col md:flex-row md:items-center justify-between gap-md mb-lg">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="material-symbols-outlined text-primary text-3xl">assignment_turned_in</span>
                        <h1 className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#6FB7E4] via-[#5D8BCC] to-[#465AA3]">
                            Test Activities
                        </h1>
                    </div>
                    <p className="font-body-md text-on-surface-variant max-w-2xl">
                        Monitor and grade recent student submissions.
                    </p>
                </div>
            </section>

            <div className="space-y-4 w-full max-w-full">
                {submissions.length === 0 ? (
                    <div className="text-center py-12 bg-surface-container-lowest rounded-3xl border border-dashed border-outline-variant/60 custom-shadow">
                        <span className="material-symbols-outlined text-5xl text-outline/40 mb-3">inbox</span>
                        <p className="text-on-surface-variant text-xs">No test activities to show.</p>
                    </div>
                ) : (
                    submissions.map(sub => (
                        <div key={sub.id} className="bg-surface-container-lowest p-5 md:p-6 rounded-3xl border border-outline-variant/60 custom-shadow hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                                        <h3 className="font-bold text-sm text-on-surface">{sub.student_name}</h3>
                                        <span className="text-on-surface-variant text-xs">•</span>
                                        <span className="text-xs text-on-surface-variant font-medium">{sub.test_title}</span>
                                    </div>
                                    <p className="text-[11px] text-on-surface-variant">{new Date(sub.submitted_at).toLocaleString()}</p>
                                </div>
                                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                                    sub.status === 'Reviewed' ? 'bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/30' : 
                                    sub.status === 'Needs Work' ? 'bg-error/15 text-error border-error/30' :
                                    'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30'
                                }`}>
                                    {sub.status}
                                </span>
                            </div>
                            
                            <div className="bg-surface-container-low p-3.5 rounded-2xl mb-4 border border-outline-variant/40">
                                <h4 className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-1.5 flex items-center gap-1">
                                    <span className="material-symbols-outlined text-[14px] text-primary">description</span>
                                    <span>Student Submission</span>
                                </h4>
                                {sub.submission_content.startsWith('http') ? (
                                    <a href={sub.submission_content} target="_blank" rel="noreferrer" className="text-primary hover:underline break-all text-xs font-semibold flex items-center gap-1.5">
                                        <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                                        {sub.submission_content}
                                    </a>
                                ) : (
                                    <p className="whitespace-pre-wrap text-xs text-on-surface leading-relaxed">{sub.submission_content}</p>
                                )}
                            </div>

                            {sub.staff_comments ? (
                                <div className={`p-3.5 rounded-2xl border ${sub.status === 'Needs Work' ? 'bg-error/5 border-error/20' : 'bg-primary/5 border-primary/20'}`}>
                                    <div className="flex justify-between items-start mb-1.5">
                                        <h4 className={`text-[11px] font-bold uppercase tracking-wider ${sub.status === 'Needs Work' ? 'text-error' : 'text-primary'}`}>
                                            Your Review
                                        </h4>
                                        <button 
                                            onClick={() => { setIsReviewing(sub.id); setReviewComment(sub.staff_comments); }}
                                            className="text-xs font-semibold text-primary hover:underline transition-colors flex items-center gap-1 cursor-pointer"
                                        >
                                            <span className="material-symbols-outlined text-[14px]">edit</span>
                                            Edit
                                        </button>
                                    </div>
                                    <p className="whitespace-pre-wrap text-xs text-on-surface leading-relaxed">{sub.staff_comments}</p>
                                </div>
                            ) : (
                                !isReviewing && (
                                    <button 
                                        onClick={() => { setIsReviewing(sub.id); setReviewComment(''); }}
                                        className="text-xs font-bold flex items-center gap-1 text-primary hover:bg-primary/10 px-3.5 py-1.5 rounded-xl transition-colors border border-primary/30 cursor-pointer"
                                    >
                                        <span className="material-symbols-outlined text-[16px]">rate_review</span>
                                        Review Submission
                                    </button>
                                )
                            )}

                            {isReviewing === sub.id && (
                                <div className="space-y-3 mt-4 border-t border-outline-variant/40 pt-4">
                                    <textarea
                                        className="w-full bg-surface-container-low border border-outline-variant rounded-2xl p-3 text-xs focus:outline-none focus:border-primary resize-none text-on-surface"
                                        placeholder="Write your constructive feedback here..."
                                        rows="3"
                                        value={reviewComment}
                                        onChange={(e) => setReviewComment(e.target.value)}
                                    ></textarea>
                                    <div className="flex gap-2 justify-end">
                                        <button onClick={() => setIsReviewing(null)} className="px-3.5 py-1.5 rounded-xl text-xs text-on-surface font-semibold hover:bg-surface-container transition-colors cursor-pointer">Cancel</button>
                                        <button 
                                            onClick={() => handleReviewSubmit(sub.id, 'Needs Work')} 
                                            className="px-4 py-1.5 rounded-xl text-xs font-bold bg-error/15 text-error border border-error/30 hover:bg-error/25 transition-colors cursor-pointer"
                                        >
                                            Request Resubmission
                                        </button>
                                        <button 
                                            onClick={() => handleReviewSubmit(sub.id, 'Reviewed')} 
                                            className="px-4 py-1.5 rounded-xl text-xs font-bold bg-primary text-on-primary hover:bg-primary/90 transition-colors shadow-xs cursor-pointer"
                                        >
                                            Mark as Reviewed
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
