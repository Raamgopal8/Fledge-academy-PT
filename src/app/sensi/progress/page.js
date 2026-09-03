'use client';
import { useState, useEffect } from 'react';
import { useSensiContext } from '@/app/sensi/SensiContext';

export default function StudentProgress() {
    const { selectedBatch } = useSensiContext();
    const [submissions, setSubmissions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All'); // 'All', 'Pending Review', 'Reviewed', 'Needs Work'
    
    // Quick Review Modal State
    const [activeSubmission, setActiveSubmission] = useState(null);
    const [reviewComment, setReviewComment] = useState('');
    const [reviewStatus, setReviewStatus] = useState('Reviewed');
    const [isSavingReview, setIsSavingReview] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    const fetchProgress = async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem('token');
            if (!token) throw new Error("No authentication token found");

            const batchParam = (selectedBatch && selectedBatch !== 'All Assigned Batches' && selectedBatch !== 'All Batches') 
                ? `?batch=${encodeURIComponent(selectedBatch)}` 
                : '';

            const res = await fetch(`${process.env.NEXT_PUBLIC_TEST_API_URL || ''}/api/tests/submissions/all${batchParam}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.detail || 'Failed to fetch student progress data');
            }

            const data = await res.json();
            setSubmissions(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("Error fetching progress:", err);
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchProgress();
    }, [selectedBatch]);

    const handleSaveReview = async (e) => {
        e.preventDefault();
        if (!activeSubmission) return;
        setIsSavingReview(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${process.env.NEXT_PUBLIC_TEST_API_URL || ''}/api/tests/submissions/${activeSubmission.id}/review`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    staff_comments: reviewComment,
                    status: reviewStatus
                })
            });

            if (res.ok) {
                setActiveSubmission(null);
                window.location.reload();
            } else {
                alert('Failed to save review. Please try again.');
            }
        } catch (err) {
            console.error('Error saving review:', err);
            alert('Network error while saving review.');
        } finally {
            setIsSavingReview(false);
        }
    };

    const openReviewModal = (sub) => {
        setActiveSubmission(sub);
        setReviewComment(sub.staff_comments || '');
        const isNeed = sub.status === 'Need Work' || sub.status === 'Needs Work' || sub.status === 'Failed';
        setReviewStatus(isNeed ? 'Need Work' : 'Approved');
    };

    const getInitials = (name) => {
        if (!name) return 'S';
        const parts = name.trim().split(' ');
        if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
        return name.slice(0, 2).toUpperCase();
    };

    const isSubApproved = (s) => s === 'Approved' || s === 'Reviewed';
    const isSubNeedWork = (s) => s === 'Need Work' || s === 'Needs Work' || s === 'Failed';

    // Filter submissions
    const filteredSubmissions = submissions.filter(sub => {
        if (statusFilter !== 'All') {
            if (statusFilter === 'Pending Review') {
                if (isSubApproved(sub.status) || isSubNeedWork(sub.status)) return false;
            } else if (statusFilter === 'Approved') {
                if (!isSubApproved(sub.status)) return false;
            } else if (statusFilter === 'Need Work') {
                if (!isSubNeedWork(sub.status)) return false;
            }
        }

        if (searchTerm.trim()) {
            const q = searchTerm.toLowerCase();
            const studentMatch = (sub.student_name || '').toLowerCase().includes(q);
            const titleMatch = (sub.test_title || '').toLowerCase().includes(q);
            const commentMatch = (sub.staff_comments || '').toLowerCase().includes(q);
            const emailMatch = (sub.student_email || '').toLowerCase().includes(q);
            return studentMatch || titleMatch || commentMatch || emailMatch;
        }

        return true;
    });

    // Aggregated Metrics
    const totalSubmissions = submissions.length;
    const approvedSubmissions = submissions.filter(s => isSubApproved(s.status)).length;
    const needsWorkSubmissions = submissions.filter(s => isSubNeedWork(s.status)).length;
    const pendingSubmissions = submissions.filter(s => !isSubApproved(s.status) && !isSubNeedWork(s.status)).length;
    const completionRate = totalSubmissions > 0 ? Math.round((approvedSubmissions / totalSubmissions) * 100) : 0;

    if (isLoading && submissions.length === 0) {
        return (
            <div className="flex-1 p-gutter min-h-[50vh] flex items-center justify-center">
                <div className="flex flex-col items-center gap-3 text-primary">
                    <span className="material-symbols-outlined text-[48px] animate-spin">progress_activity</span>
                    <p className="font-label-lg text-sm text-on-surface-variant font-medium">Loading Student Progress...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-[1440px] mx-auto p-4 md:px-8 lg:px-12 md:py-8 space-y-6 md:space-y-8 relative pb-32 animate-fade-in">
            {/* Header */}
            <section className="flex flex-col md:flex-row md:items-center justify-between gap-md mb-lg">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="material-symbols-outlined text-primary text-3xl">trending_up</span>
                        <h1 className="text-3xl md:text-4xl font-bold tracking-tight bg-gradient-to-r from-[#6FB7E4] via-[#5D8BCC] to-[#465AA3] text-transparent bg-clip-text">
                            Student Progress & Review
                        </h1>
                    </div>
                    <p className="font-body-md text-on-surface-variant max-w-2xl mt-1">
                        Track assessment submissions, monitor completion rates, and provide grading feedback.
                    </p>
                </div>

                {selectedBatch && selectedBatch !== 'All Assigned Batches' && (
                    <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold shadow-2xs">
                        <span className="material-symbols-outlined text-[16px]">groups</span>
                        <span>{selectedBatch}</span>
                    </div>
                )}
            </section>

            {successMessage && (
                <div className="bg-green-500/10 text-green-700 dark:text-green-400 p-4 rounded-2xl flex items-center gap-2.5 border border-green-500/30">
                    <span className="material-symbols-outlined text-[22px]">check_circle</span>
                    <span className="text-sm font-medium">{successMessage}</span>
                </div>
            )}

            {error && (
                <div className="p-lg bg-error-container text-on-error-container rounded-2xl flex items-center gap-md">
                    <span className="material-symbols-outlined text-[32px]">error</span>
                    <div>
                        <h3 className="font-headline-md font-bold">Error Loading Data</h3>
                        <p className="font-body-md text-xs">{error}</p>
                    </div>
                </div>
            )}

            {/* KPI Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {/* Total Submissions */}
                <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-3xl p-5 custom-shadow hover:shadow-md transition-shadow relative overflow-hidden group">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Total Submissions</p>
                            <h2 className="text-3xl font-extrabold text-on-surface mt-1">{totalSubmissions}</h2>
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center group-hover:scale-105 transition-transform">
                            <span className="material-symbols-outlined text-[26px]">assignment_turned_in</span>
                        </div>
                    </div>
                    <div className="mt-3 flex items-center gap-1.5 text-xs text-on-surface-variant">
                        <span className="font-bold text-primary">{completionRate}%</span>
                        <span>pass rate across all tasks</span>
                    </div>
                </div>

                {/* Approved Pass */}
                <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-3xl p-5 custom-shadow hover:shadow-md transition-shadow relative overflow-hidden group">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Approved</p>
                            <h2 className="text-3xl font-extrabold text-green-600 dark:text-green-400 mt-1">{approvedSubmissions}</h2>
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-green-500/15 text-green-600 dark:text-green-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                            <span className="material-symbols-outlined text-[26px]">check_circle</span>
                        </div>
                    </div>
                    <div className="mt-3 text-xs text-green-700 dark:text-green-400 font-medium">
                        Approved & feedback given
                    </div>
                </div>

                {/* Need Work */}
                <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-3xl p-5 custom-shadow hover:shadow-md transition-shadow relative overflow-hidden group">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Need Work</p>
                            <h2 className="text-3xl font-extrabold text-amber-600 dark:text-amber-400 mt-1">{needsWorkSubmissions}</h2>
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                            <span className="material-symbols-outlined text-[26px]">error</span>
                        </div>
                    </div>
                    <div className="mt-3 text-xs text-amber-700 dark:text-amber-400 font-medium">
                        Requires revision from student
                    </div>
                </div>

                {/* Pending Review */}
                <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-3xl p-5 custom-shadow hover:shadow-md transition-shadow relative overflow-hidden group">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Pending Review</p>
                            <h2 className="text-3xl font-extrabold text-primary mt-1">{pendingSubmissions}</h2>
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center group-hover:scale-105 transition-transform">
                            <span className="material-symbols-outlined text-[26px]">pending_actions</span>
                        </div>
                    </div>
                    <div className="mt-3 text-xs text-primary font-medium">
                        Awaiting instructor review
                    </div>
                </div>
            </div>

            {/* Main Progress Log Card */}
            <div className="bg-surface-container-lowest border border-outline-variant rounded-3xl p-6 custom-shadow space-y-5">
                {/* Search & Filter Controls */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-outline-variant/50">
                    {/* Status Filter Tabs */}
                    <div className="flex flex-wrap items-center gap-2">
                        {[
                            { key: 'All', label: 'All Submissions', count: totalSubmissions },
                            { key: 'Pending Review', label: 'Pending', count: pendingSubmissions },
                            { key: 'Approved', label: 'Approved (Pass)', count: approvedSubmissions },
                            { key: 'Need Work', label: 'Need Work', count: needsWorkSubmissions },
                        ].map(tab => (
                            <button
                                key={tab.key}
                                onClick={() => setStatusFilter(tab.key)}
                                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                                    statusFilter === tab.key
                                        ? 'bg-primary text-on-primary shadow-xs font-bold'
                                        : 'bg-surface-container-low border border-outline-variant/60 text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                                }`}
                            >
                                <span>{tab.label}</span>
                                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                                    statusFilter === tab.key ? 'bg-on-primary/20 text-on-primary' : 'bg-outline-variant/40 text-on-surface-variant'
                                }`}>
                                    {tab.count}
                                </span>
                            </button>
                        ))}
                    </div>

                    {/* Search Bar */}
                    <div className="relative min-w-[260px]">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-on-surface-variant">search</span>
                        <input 
                            type="text" 
                            placeholder="Search student, test, or feedback..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-surface-container-low border border-outline-variant rounded-xl text-xs text-on-surface focus:outline-none focus:border-primary transition-colors"
                        />
                    </div>
                </div>

                {/* Submissions Table */}
                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse min-w-[700px]">
                        <thead>
                            <tr className="border-b border-outline-variant/60 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
                                <th className="py-3 px-4">Student</th>
                                <th className="py-3 px-4">Assessment / Test</th>
                                <th className="py-3 px-4">Submitted At</th>
                                <th className="py-3 px-4">Status</th>
                                <th className="py-3 px-4">Instructor Feedback</th>
                                <th className="py-3 px-4 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-outline-variant/40">
                            {filteredSubmissions.length > 0 ? (
                                filteredSubmissions.map((sub) => {
                                    const isReviewed = sub.status === 'Reviewed';
                                    const isNeedsWork = sub.status === 'Needs Work';
                                    const isPending = !isReviewed && !isNeedsWork;

                                    return (
                                        <tr key={sub.id} className="hover:bg-surface-container-low/60 transition-colors group">
                                            {/* Student Info */}
                                            <td className="py-3.5 px-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary/20 to-primary/40 text-primary flex items-center justify-center font-bold text-xs ring-2 ring-primary/10 shrink-0">
                                                        {getInitials((sub.student_name && !['unknown', 'unkown', 'null', 'none', ''].includes(sub.student_name.trim().toLowerCase())) ? sub.student_name : (sub.student_email ? sub.student_email.split('@')[0] : 'Student'))}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="font-bold text-xs text-on-surface group-hover:text-primary transition-colors truncate">
                                                            {(sub.student_name && !['unknown', 'unkown', 'null', 'none', ''].includes(sub.student_name.trim().toLowerCase())) ? sub.student_name : (sub.student_email ? sub.student_email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : 'Student')}
                                                        </div>
                                                        {sub.student_email && (
                                                            <div className="text-[10px] text-on-surface-variant/80 truncate">
                                                                {sub.student_email}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Test Title & Level */}
                                            <td className="py-3.5 px-4">
                                                <div className="font-semibold text-xs text-on-surface line-clamp-1">
                                                    {sub.test_title || 'Assessment'}
                                                </div>
                                                <div className="flex items-center gap-1.5 mt-0.5">
                                                    {sub.test_level && (
                                                        <span className="text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.2 rounded border border-primary/20">
                                                            {sub.test_level}
                                                        </span>
                                                    )}
                                                    {sub.test_batch && (
                                                        <span className="text-[10px] font-medium text-on-surface-variant bg-surface-container px-1.5 py-0.2 rounded border border-outline-variant/40">
                                                            {sub.test_batch}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Submitted Date */}
                                            <td className="py-3.5 px-4 text-xs text-on-surface-variant whitespace-nowrap">
                                                <div className="flex items-center gap-1 font-medium">
                                                    <span className="material-symbols-outlined text-[14px]">calendar_today</span>
                                                    <span>{sub.submitted_at ? new Date(sub.submitted_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recent'}</span>
                                                </div>
                                                <div className="text-[10px] text-outline pl-4">
                                                    {sub.submitted_at ? new Date(sub.submitted_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                                </div>
                                            </td>

                                            {/* Status Badge */}
                                            <td className="py-3.5 px-4 whitespace-nowrap">
                                                <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold inline-flex items-center gap-1 border ${
                                                    isSubApproved(sub.status) 
                                                        ? 'bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/30' 
                                                        : isSubNeedWork(sub.status) 
                                                        ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30' 
                                                        : 'bg-primary/10 text-primary border-primary/20'
                                                }`}>
                                                    <span className="material-symbols-outlined text-[13px]">
                                                        {isSubApproved(sub.status) ? 'check_circle' : isSubNeedWork(sub.status) ? 'cancel' : 'pending'}
                                                    </span>
                                                    <span>{isSubApproved(sub.status) ? 'Approved' : isSubNeedWork(sub.status) ? 'Need Work' : (sub.status || 'Pending Review')}</span>
                                                </span>
                                            </td>

                                            {/* Feedback Preview */}
                                            <td className="py-3.5 px-4 max-w-[220px]">
                                                {sub.staff_comments ? (
                                                    <p className="text-xs text-on-surface-variant truncate italic" title={sub.staff_comments}>
                                                        "{sub.staff_comments}"
                                                    </p>
                                                ) : (
                                                    <span className="text-[11px] text-outline italic">No feedback provided yet</span>
                                                )}
                                            </td>

                                            {/* Action Button */}
                                            <td className="py-3.5 px-4 text-right whitespace-nowrap">
                                                <button
                                                    type="button"
                                                    onClick={() => openReviewModal(sub)}
                                                    className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-primary/10 text-primary hover:bg-primary hover:text-on-primary transition-all inline-flex items-center gap-1 cursor-pointer shadow-2xs"
                                                >
                                                    <span className="material-symbols-outlined text-[15px]">rate_review</span>
                                                    <span>{sub.staff_comments ? 'Edit Review' : 'Review Assessment'}</span>
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan="6" className="py-12 text-center text-on-surface-variant">
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <span className="material-symbols-outlined text-4xl text-outline/40">inbox</span>
                                            <p className="text-xs font-medium">
                                                {searchTerm ? 'No submissions match your search.' : 'No student progress submissions found.'}
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Quick Review Modal */}
            {activeSubmission && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-surface rounded-3xl p-6 max-w-[550px] w-full shadow-2xl border border-outline-variant/60 max-h-[90vh] overflow-y-auto custom-scrollbar relative space-y-4">
                        {/* Modal Header */}
                        <div className="flex justify-between items-start pb-3 border-b border-outline-variant/40">
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="material-symbols-outlined text-primary text-[22px]">grading</span>
                                    <h2 className="font-headline-sm text-on-surface font-bold text-lg">Review Submission</h2>
                                </div>
                                <p className="text-xs text-on-surface-variant mt-0.5">
                                    {activeSubmission.test_title} • <span className="font-semibold text-primary">{activeSubmission.student_name}</span>
                                </p>
                            </div>
                            <button 
                                onClick={() => setActiveSubmission(null)}
                                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-container text-on-surface-variant transition-colors cursor-pointer"
                            >
                                <span className="material-symbols-outlined text-[18px]">close</span>
                            </button>
                        </div>

                        {/* Student Submission Content Box */}
                        <div className="bg-surface-container-low p-4 rounded-2xl border border-outline-variant/60 space-y-1.5">
                            <div className="flex justify-between items-center">
                                <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider flex items-center gap-1">
                                    <span className="material-symbols-outlined text-[14px] text-primary">description</span>
                                    <span>Student's Answer / Work</span>
                                </span>
                                {activeSubmission.test_level && (
                                    <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">
                                        {activeSubmission.test_level}
                                    </span>
                                )}
                            </div>

                            {activeSubmission.submission_content && activeSubmission.submission_content.startsWith('http') ? (
                                <a 
                                    href={activeSubmission.submission_content} 
                                    target="_blank" 
                                    rel="noreferrer"
                                    className="text-primary hover:underline break-all text-xs font-semibold flex items-center gap-1.5 pt-1"
                                >
                                    <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                                    <span>{activeSubmission.submission_content}</span>
                                </a>
                            ) : (
                                <p className="text-xs text-on-surface whitespace-pre-wrap leading-relaxed pt-1">
                                    {activeSubmission.submission_content || 'No text content provided.'}
                                </p>
                            )}
                        </div>

                        {/* Grading Form */}
                        <form onSubmit={handleSaveReview} className="space-y-4">
                            {/* Outcome Status Selector */}
                            <div>
                                <label className="block text-xs font-bold text-on-surface mb-1.5">Review Outcome</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setReviewStatus('Approved')}
                                        className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                                            reviewStatus === 'Approved'
                                                ? 'bg-green-500/15 text-green-700 dark:text-green-400 border-green-500 ring-1 ring-green-500 shadow-2xs'
                                                : 'border-outline-variant text-on-surface-variant hover:bg-surface-container'
                                        }`}
                                    >
                                        <span className="material-symbols-outlined text-[16px]">check_circle</span>
                                        <span>Approved</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setReviewStatus('Need Work')}
                                        className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                                            reviewStatus === 'Need Work'
                                                ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500 ring-1 ring-amber-500 shadow-2xs'
                                                : 'border-outline-variant text-on-surface-variant hover:bg-surface-container'
                                        }`}
                                    >
                                        <span className="material-symbols-outlined text-[16px]">cancel</span>
                                        <span>Need Work</span>
                                    </button>
                                </div>
                            </div>

                            {/* Instructor Feedback Comments */}
                            <div>
                                <label className="block text-xs font-bold text-on-surface mb-1.5">Instructor Feedback *</label>
                                <textarea
                                    required
                                    rows={4}
                                    value={reviewComment}
                                    onChange={(e) => setReviewComment(e.target.value)}
                                    placeholder="Provide detailed feedback, praise, corrections, or grading notes..."
                                    className="w-full bg-surface-container-low border border-outline-variant rounded-2xl p-3.5 text-xs text-on-surface focus:outline-none focus:border-primary transition-colors resize-none"
                                />
                            </div>

                            {/* Modal Actions */}
                            <div className="flex justify-end gap-2.5 pt-3 border-t border-outline-variant/40">
                                <button
                                    type="button"
                                    onClick={() => setActiveSubmission(null)}
                                    className="px-4 py-2 rounded-xl text-xs font-semibold text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSavingReview || !reviewComment.trim()}
                                    className="px-5 py-2 rounded-xl text-xs font-bold text-on-primary bg-primary hover:opacity-90 transition-all disabled:opacity-50 flex items-center gap-1.5 shadow-md cursor-pointer"
                                >
                                    {isSavingReview ? (
                                        <>
                                            <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
                                            <span>Saving...</span>
                                        </>
                                    ) : (
                                        <>
                                            <span className="material-symbols-outlined text-[16px]">save</span>
                                            <span>Save Review & Feedback</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
