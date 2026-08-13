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
            const res = await fetch(`${process.env.NEXT_PUBLIC_TEST_API_URL || 'http://localhost:8003'}/api/tests/submissions/all`, {
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
            const res = await fetch(`${process.env.NEXT_PUBLIC_TEST_API_URL || 'http://localhost:8003'}/api/tests/submissions/${subId}/review`, {
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
        <section className="max-w-[1440px] mx-auto p-gutter space-y-lg animate-fade-in">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-md mb-lg">
                <div>
                    <div className="flex items-center gap-sm mb-xs">
                        <h1 className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#6FB7E4] via-[#5D8BCC] to-[#465AA3]">
                            Test Activities
                        </h1>
                    </div>
                    <p className="font-body-lg text-on-surface-variant max-w-2xl mt-2">
                        Monitor and grade recent student submissions.
                    </p>
                </div>
            </div>

                <div className="space-y-md">
                    {submissions.length === 0 ? (
                        <div className="text-center py-10 bg-surface-container-low rounded-2xl border border-outline-variant">
                            <span className="material-symbols-outlined text-[48px] text-on-surface-variant mb-4 opacity-50">inbox</span>
                            <p className="text-on-surface-variant font-body-md">No test activities to show.</p>
                        </div>
                    ) : (
                        submissions.map(sub => (
                            <div key={sub.id} className="bg-surface p-md rounded-2xl border border-outline-variant shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="font-title-md text-on-surface">{sub.student_name}</h3>
                                            <span className="text-on-surface-variant">•</span>
                                            <span className="text-sm text-on-surface-variant font-medium">{sub.test_title}</span>
                                        </div>
                                        <p className="text-xs text-on-surface-variant">{new Date(sub.submitted_at).toLocaleString()}</p>
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${
                                        sub.status === 'Reviewed' ? 'bg-primary-container/30 text-primary border-primary/20' : 
                                        sub.status === 'Needs Work' ? 'bg-error-container/30 text-error border-error/20' :
                                        'bg-tertiary-container/30 text-tertiary border-tertiary/20'
                                    }`}>
                                        {sub.status}
                                    </span>
                                </div>
                                
                                <div className="bg-surface-container-lowest p-sm rounded-xl mb-4 border border-outline-variant">
                                    <h4 className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2">Student Submission</h4>
                                    {sub.submission_content.startsWith('http') ? (
                                        <a href={sub.submission_content} target="_blank" rel="noreferrer" className="text-primary hover:underline break-all font-body-md flex items-center gap-2">
                                            <span className="material-symbols-outlined text-[18px]">link</span>
                                            {sub.submission_content}
                                        </a>
                                    ) : (
                                        <p className="whitespace-pre-wrap font-body-md text-on-surface">{sub.submission_content}</p>
                                    )}
                                </div>

                                {sub.staff_comments ? (
                                    <div className={`p-sm rounded-xl border ${sub.status === 'Needs Work' ? 'bg-error/5 border-error/20' : 'bg-primary/5 border-primary/20'}`}>
                                        <div className="flex justify-between items-start mb-2">
                                            <h4 className={`text-xs font-semibold uppercase tracking-wider ${sub.status === 'Needs Work' ? 'text-error' : 'text-primary'}`}>
                                                Your Review
                                            </h4>
                                            <button 
                                                onClick={() => { setIsReviewing(sub.id); setReviewComment(sub.staff_comments); }}
                                                className="text-xs text-on-surface-variant hover:text-primary transition-colors flex items-center gap-1"
                                            >
                                                <span className="material-symbols-outlined text-[14px]">edit</span>
                                                Edit
                                            </button>
                                        </div>
                                        <p className="whitespace-pre-wrap font-body-md text-on-surface">{sub.staff_comments}</p>
                                    </div>
                                ) : (
                                    !isReviewing && (
                                        <button 
                                            onClick={() => { setIsReviewing(sub.id); setReviewComment(''); }}
                                            className="mt-2 text-sm flex items-center gap-1 text-primary hover:bg-primary/10 px-4 py-2 rounded-lg transition-colors border border-primary/20 font-medium"
                                        >
                                            <span className="material-symbols-outlined text-[18px]">rate_review</span>
                                            Review Submission
                                        </button>
                                    )
                                )}

                                {isReviewing === sub.id && (
                                    <div className="space-y-3 mt-4 border-t border-outline-variant pt-4">
                                        <textarea
                                            className="w-full bg-surface-container-lowest border border-outline rounded-xl p-4 min-h-[120px] focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none font-body-md text-on-surface"
                                            placeholder="Write your constructive feedback here..."
                                            value={reviewComment}
                                            onChange={(e) => setReviewComment(e.target.value)}
                                        ></textarea>
                                        <div className="flex gap-2 justify-end">
                                            <button onClick={() => setIsReviewing(null)} className="px-4 py-2 rounded-lg text-on-surface font-medium hover:bg-surface-container transition-colors">Cancel</button>
                                            <button 
                                                onClick={() => handleReviewSubmit(sub.id, 'Needs Work')} 
                                                className="px-4 py-2 rounded-lg bg-error-container text-on-error-container font-medium hover:bg-error-container/80 transition-colors shadow-sm"
                                            >
                                                Request Resubmission
                                            </button>
                                            <button 
                                                onClick={() => handleReviewSubmit(sub.id, 'Reviewed')} 
                                                className="px-4 py-2 rounded-lg bg-primary text-on-primary font-medium hover:bg-primary/90 transition-colors shadow-sm"
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
            </section>
    );
}
