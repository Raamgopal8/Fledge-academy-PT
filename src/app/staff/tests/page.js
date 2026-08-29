'use client';
import { useState, useEffect } from 'react';
import { useStaffContext } from '@/app/staff/StaffContext';

const LEVELS = [
    { value: 'Level 5', label: 'Level 5 (Beginner)', color: 'bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/30' },
    { value: 'Level 4', label: 'Level 4 (Elementary)', color: 'bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30' },
    { value: 'Level 3', label: 'Level 3 (Intermediate)', color: 'bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 border-yellow-500/30' },
    { value: 'Level 2', label: 'Level 2 (Pre-Advanced)', color: 'bg-orange-500/15 text-orange-700 dark:text-orange-400 border-orange-500/30' },
    { value: 'Level 1', label: 'Level 1 (Advanced)', color: 'bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30' },
];

export default function StaffTests() {
    const { selectedBatch, staffBatches } = useStaffContext();
    const [tests, setTests] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [testToDelete, setTestToDelete] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    // Filtering
    const [filterLevel, setFilterLevel] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');
    
    // New Test Form
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [level, setLevel] = useState('Level 5');
    const [batch, setBatch] = useState(selectedBatch && selectedBatch !== 'All Assigned Batches' && selectedBatch !== 'All Batches' ? selectedBatch : 'Batch - 1');
    const [dueDate, setDueDate] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (selectedBatch && selectedBatch !== 'All Assigned Batches' && selectedBatch !== 'All Batches') {
            setBatch(selectedBatch);
        } else if (staffBatches && staffBatches.length > 0 && !batch) {
            setBatch(staffBatches[0]);
        }
    }, [selectedBatch, staffBatches]);

    useEffect(() => {
        fetchTests();
    }, [selectedBatch]);
    
    // Submissions View
    const [activeTest, setActiveTest] = useState(null);
    const [submissions, setSubmissions] = useState([]);
    const [isReviewing, setIsReviewing] = useState(null); // submission ID
    const [reviewComment, setReviewComment] = useState('');
    const [isSubmittingReview, setIsSubmittingReview] = useState(false);

    const fetchTests = async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem('token');
            const batchParam = (selectedBatch && selectedBatch !== 'All Assigned Batches' && selectedBatch !== 'All Batches') 
                ? `?batch=${encodeURIComponent(selectedBatch)}` 
                : '';
            const res = await fetch(`${process.env.NEXT_PUBLIC_TEST_API_URL || ''}/api/tests${batchParam}`, {
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

    const handleCreateTest = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setErrorMessage('');
        setSuccessMessage('');
        try {
            const token = localStorage.getItem('token');
            const payload = {
                title,
                description,
                level,
                batch: batch.trim() || 'All Batches',
                batches: batch.trim() ? [batch.trim()] : ['All Batches'],
                due_date: dueDate ? new Date(dueDate).toISOString() : null
            };

            const res = await fetch(`${process.env.NEXT_PUBLIC_TEST_API_URL || ''}/api/tests`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                setIsCreating(false);
                setTitle('');
                setDescription('');
                setLevel('Level 5');
                setDueDate('');
                setSuccessMessage('Test published successfully!');
                await fetchTests();
                setTimeout(() => setSuccessMessage(''), 4000);
            } else {
                const errData = await res.json().catch(() => ({}));
                setErrorMessage(errData.detail || 'Failed to create test');
            }
        } catch (err) {
            console.error(err);
            setErrorMessage('Network error creating test.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const confirmDelete = async () => {
        if (!testToDelete) return;
        setIsDeleting(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${process.env.NEXT_PUBLIC_TEST_API_URL || ''}/api/tests/${testToDelete.id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (res.ok) {
                setSuccessMessage(`Test "${testToDelete.title}" deleted.`);
                setTestToDelete(null);
                await fetchTests();
                setTimeout(() => setSuccessMessage(''), 4000);
            } else {
                alert('Failed to delete test.');
            }
        } catch (err) {
            console.error('Error deleting test:', err);
        } finally {
            setIsDeleting(false);
        }
    };

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

    const handleReviewSubmit = async (subId) => {
        setIsSubmittingReview(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${process.env.NEXT_PUBLIC_TEST_API_URL || ''}/api/tests/submissions/${subId}/review`, {
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
                fetchSubmissions(activeTest);
            } else {
                alert("Failed to submit review");
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsSubmittingReview(false);
        }
    };

    const getLevelBadgeClass = (lvl) => {
        const match = LEVELS.find(l => l.value === lvl);
        return match ? match.color : 'bg-primary/10 text-primary border-primary/20';
    };

    const filteredTests = tests.filter(t => {
        if (filterLevel !== 'All' && t.level !== filterLevel) return false;
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            const titleMatch = (t.title || '').toLowerCase().includes(q);
            const descMatch = (t.description || '').toLowerCase().includes(q);
            const batchMatch = (t.batch || '').toLowerCase().includes(q);
            return titleMatch || descMatch || batchMatch;
        }
        return true;
    });

    if (activeTest) {
        return (
            <section className="max-w-[1440px] mx-auto p-gutter space-y-lg animate-fade-in">
                <button 
                    onClick={() => setActiveTest(null)}
                    className="flex items-center gap-2 text-on-surface hover:text-primary transition-colors font-label-md mb-4 cursor-pointer"
                >
                    <span className="material-symbols-outlined">arrow_back</span>
                    <span>Back to Tests</span>
                </button>
                
                <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 custom-shadow space-y-2">
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                                <h2 className="font-headline-md text-on-surface font-bold text-xl">{activeTest.title}</h2>
                                {activeTest.level && (
                                    <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold border ${getLevelBadgeClass(activeTest.level)}`}>
                                        {activeTest.level}
                                    </span>
                                )}
                                {activeTest.batch && (
                                    <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-primary/10 text-primary border border-primary/20 flex items-center gap-1">
                                        <span className="material-symbols-outlined text-[12px]">groups</span>
                                        {activeTest.batch}
                                    </span>
                                )}
                            </div>
                            <p className="text-on-surface-variant font-body-md text-xs whitespace-pre-wrap">{activeTest.description}</p>
                        </div>
                        <span className="px-3 py-1 rounded-full bg-secondary-container text-on-secondary-container text-xs font-bold shrink-0">
                            {submissions.length} Submissions
                        </span>
                    </div>
                </div>

                <div className="space-y-4">
                    {submissions.length === 0 ? (
                        <div className="flex flex-col items-center justify-center text-center p-12 bg-surface-container-lowest rounded-2xl border border-dashed border-outline-variant min-h-[250px]">
                            <span className="material-symbols-outlined text-5xl text-outline/40 mb-2">inbox</span>
                            <h3 className="font-headline-sm text-on-surface-variant font-bold text-base">No submissions yet</h3>
                            <p className="font-body-md text-outline text-xs mt-1">Students haven't submitted coursework for this test yet.</p>
                        </div>
                    ) : (
                        submissions.map(sub => (
                            <div key={sub.id} className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant custom-shadow space-y-3">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="font-title-md text-on-surface font-bold text-sm">{sub.student_name}</h3>
                                        <p className="text-xs text-on-surface-variant font-medium mt-0.5">{new Date(sub.submitted_at).toLocaleString()}</p>
                                    </div>
                                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${sub.status === 'Reviewed' ? 'bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/30' : 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30'}`}>
                                        {sub.status}
                                    </span>
                                </div>
                                
                                <div className="bg-surface-container-low p-3.5 rounded-xl border border-outline-variant/60">
                                    <h4 className="text-xs font-bold text-on-surface-variant mb-1 flex items-center gap-1">
                                        <span className="material-symbols-outlined text-[15px] text-primary">description</span>
                                        <span>Student Submission</span>
                                    </h4>
                                    {sub.submission_content.startsWith('http') ? (
                                        <a href={sub.submission_content} target="_blank" rel="noreferrer" className="text-primary hover:underline break-all inline-flex items-center gap-1 font-semibold text-xs">
                                            <span className="material-symbols-outlined text-[15px]">open_in_new</span>
                                            {sub.submission_content}
                                        </a>
                                    ) : (
                                        <p className="whitespace-pre-wrap font-body-md text-on-surface text-xs leading-relaxed">{sub.submission_content}</p>
                                    )}
                                </div>

                                {sub.status === 'Reviewed' && sub.staff_comments ? (
                                    <div className="bg-primary/5 p-3.5 rounded-xl border border-primary/20 text-xs">
                                        <h4 className="font-bold text-primary mb-1 flex items-center gap-1">
                                            <span className="material-symbols-outlined text-[16px]">reviews</span>
                                            <span>Your Instructor Feedback</span>
                                        </h4>
                                        <p className="whitespace-pre-wrap text-on-surface leading-relaxed">{sub.staff_comments}</p>
                                    </div>
                                ) : (
                                    isReviewing === sub.id ? (
                                        <div className="space-y-3 mt-3 border-t border-outline-variant/40 pt-3">
                                            <textarea
                                                className="w-full bg-surface-container-low border border-outline-variant rounded-xl p-3 text-xs focus:outline-none focus:border-primary text-on-surface resize-none min-h-[80px]"
                                                placeholder="Write feedback and grading notes for the student..."
                                                value={reviewComment}
                                                onChange={e => setReviewComment(e.target.value)}
                                            ></textarea>
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => { setIsReviewing(null); setReviewComment(''); }}
                                                    className="px-3.5 py-1.5 rounded-xl text-xs font-semibold border border-outline-variant text-on-surface hover:bg-surface-container"
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    type="button"
                                                    disabled={isSubmittingReview || !reviewComment.trim()}
                                                    onClick={() => handleReviewSubmit(sub.id)}
                                                    className="px-4 py-1.5 rounded-xl text-xs font-bold bg-primary text-on-primary hover:bg-primary/90 transition-all disabled:opacity-50 flex items-center gap-1"
                                                >
                                                    {isSubmittingReview ? 'Submitting...' : 'Submit Feedback'}
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex justify-end pt-2 border-t border-outline-variant/30">
                                            <button
                                                type="button"
                                                onClick={() => { setIsReviewing(sub.id); setReviewComment(sub.staff_comments || ''); }}
                                                className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-primary/10 text-primary hover:bg-primary hover:text-on-primary transition-all flex items-center gap-1 cursor-pointer"
                                            >
                                                <span className="material-symbols-outlined text-[15px]">rate_review</span>
                                                <span>{sub.staff_comments ? 'Edit Review' : 'Add Review'}</span>
                                            </button>
                                        </div>
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
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-md mb-md">
                <div>
                    <div className="flex items-center gap-sm mb-xs">
                        <span className="material-symbols-outlined text-primary text-3xl">assignment</span>
                        <h1 className="text-3xl md:text-4xl font-bold tracking-tight bg-gradient-to-r from-[#6FB7E4] via-[#5D8BCC] to-[#465AA3] text-transparent bg-clip-text">
                            Tests & Assignments
                        </h1>
                    </div>
                    <p className="font-body-lg text-on-surface-variant max-w-2xl">
                        Create coursework, assign tests to specific batches, and grade student submissions.
                    </p>
                </div>
                
                <button 
                    onClick={() => {
                        setIsCreating(true);
                        if (selectedBatch && selectedBatch !== 'All Assigned Batches' && selectedBatch !== 'All Batches') {
                            setBatch(selectedBatch);
                        } else if (staffBatches && staffBatches.length > 0) {
                            setBatch(staffBatches[0]);
                        }
                    }}
                    className="bg-primary text-on-primary px-5 py-2.5 rounded-full font-label-lg hover:bg-primary/90 transition-all flex items-center gap-2 shadow-md cursor-pointer active:scale-95"
                >
                    <span className="material-symbols-outlined text-[20px]">add</span>
                    <span>Create Test</span>
                </button>
            </div>

            {successMessage && (
                <div className="bg-green-500/10 text-green-700 dark:text-green-400 p-4 rounded-2xl flex items-center gap-2.5 border border-green-500/30">
                    <span className="material-symbols-outlined text-[22px]">check_circle</span>
                    <span className="text-sm font-medium">{successMessage}</span>
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
                        {LEVELS.map(l => (
                            <option key={l.value} value={l.value}>{l.value}</option>
                        ))}
                    </select>
                </div>

                <div className="relative min-w-[220px]">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[16px] text-on-surface-variant">search</span>
                    <input 
                        type="text"
                        placeholder="Search assignments..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 bg-surface-container border border-outline-variant rounded-xl text-xs text-on-surface focus:outline-none focus:border-primary"
                    />
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="min-h-[400px]">
                {isLoading ? (
                    <div className="flex flex-col justify-center items-center h-64 bg-surface-container-lowest border border-outline-variant rounded-2xl gap-3">
                        <span className="material-symbols-outlined text-4xl text-primary animate-spin">progress_activity</span>
                        <p className="text-xs text-on-surface-variant">Loading tests...</p>
                    </div>
                ) : filteredTests.length === 0 ? (
                    <div className="flex flex-col items-center justify-center text-center p-12 bg-surface-container-lowest rounded-2xl border border-dashed border-outline-variant h-64 custom-shadow">
                        <span className="material-symbols-outlined text-6xl text-outline/40 mb-3">assignment</span>
                        <h3 className="font-headline-sm text-on-surface-variant font-bold">No Tests Found</h3>
                        <p className="font-body-md text-outline text-xs mt-1">
                            Click "Create Test" to assign coursework to your students.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredTests.map(test => (
                            <div key={test.id} className="group relative bg-surface-container-lowest rounded-2xl p-5 flex flex-col justify-between border border-outline-variant hover:border-primary/50 hover:shadow-lg transition-all duration-300">
                                <div>
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shadow-xs">
                                            <span className="material-symbols-outlined text-[28px]">assignment</span>
                                        </div>
                                        <button 
                                            type="button"
                                            onClick={() => setTestToDelete(test)}
                                            className="text-outline hover:text-error hover:bg-error-container/20 p-1.5 rounded-lg transition-colors cursor-pointer"
                                            title="Delete Test"
                                        >
                                            <span className="material-symbols-outlined text-[18px]">delete</span>
                                        </button>
                                    </div>

                                    <h3 className="font-headline-sm text-on-surface font-bold text-base break-words group-hover:text-primary transition-colors mb-1.5 line-clamp-2" title={test.title}>
                                        {test.title}
                                    </h3>

                                    <p className="font-body-md text-on-surface-variant text-xs mb-3 line-clamp-2 leading-relaxed">
                                        {test.description || 'No description provided.'}
                                    </p>

                                    {/* Badges */}
                                    <div className="flex flex-wrap items-center gap-1.5 mb-4">
                                        {test.level && (
                                            <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold border ${getLevelBadgeClass(test.level)}`}>
                                                {test.level}
                                            </span>
                                        )}
                                        {test.batch && (
                                            <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-primary/10 text-primary border border-primary/20 flex items-center gap-1">
                                                <span className="material-symbols-outlined text-[12px]">groups</span>
                                                {test.batch}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center justify-between pt-3 border-t border-outline-variant/40 mt-auto">
                                    <div className="flex flex-col">
                                        <span className="text-[11px] font-medium text-on-surface-variant/80 flex items-center gap-1">
                                            <span className="material-symbols-outlined text-[13px]">calendar_today</span>
                                            {test.created_at ? new Date(test.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'Recent'}
                                        </span>
                                        {test.due_date && (
                                            <span className="text-[10px] font-bold text-error flex items-center gap-0.5 mt-0.5">
                                                <span className="material-symbols-outlined text-[12px]">schedule</span>
                                                Due {new Date(test.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                            </span>
                                        )}
                                    </div>
                                    <button 
                                        onClick={() => fetchSubmissions(test)}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary/10 text-primary hover:bg-primary hover:text-on-primary text-xs font-bold transition-all shadow-2xs cursor-pointer"
                                    >
                                        <span>Submissions</span>
                                        <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Create Test Modal */}
            {isCreating && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-surface rounded-3xl p-6 max-w-[500px] w-full shadow-2xl border border-outline-variant/60 max-h-[90vh] overflow-y-auto custom-scrollbar relative">
                        <div className="flex justify-between items-center mb-5 pb-3 border-b border-outline-variant/40">
                            <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary text-[24px]">assignment_add</span>
                                <h2 className="font-headline-sm text-on-surface font-bold text-lg">Create New Test</h2>
                            </div>
                            <button 
                                onClick={() => setIsCreating(false)}
                                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-container text-on-surface-variant transition-colors cursor-pointer"
                            >
                                <span className="material-symbols-outlined text-[18px]">close</span>
                            </button>
                        </div>

                        {errorMessage && (
                            <div className="bg-error/10 text-error p-3 rounded-xl text-xs mb-4 flex items-center gap-2">
                                <span className="material-symbols-outlined text-[18px]">error</span>
                                <span>{errorMessage}</span>
                            </div>
                        )}
                        
                        <form onSubmit={handleCreateTest} className="space-y-4">
                            {/* Title */}
                            <div>
                                <label className="block font-label-md text-on-surface mb-1 font-semibold text-xs">Test Title *</label>
                                <input 
                                    type="text" 
                                    required
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-3.5 py-2.5 text-xs text-on-surface focus:outline-none focus:border-primary transition-colors"
                                    placeholder="e.g. JLPT N5 Grammar Assessment - Unit 1"
                                />
                            </div>
                            
                            {/* Japanese Level */}
                            <div>
                                <label className="block font-label-md text-on-surface mb-1 font-semibold text-xs">Target Level</label>
                                <div className="grid grid-cols-3 gap-1.5">
                                    {LEVELS.map(lvl => (
                                        <button
                                            key={lvl.value}
                                            type="button"
                                            onClick={() => setLevel(lvl.value)}
                                            className={`py-1.5 px-2 rounded-xl border text-xs font-semibold transition-all text-center ${
                                                level === lvl.value
                                                    ? `${lvl.color} border-current ring-1 ring-primary font-bold shadow-2xs`
                                                    : 'border-outline-variant/60 text-on-surface-variant hover:bg-surface-container'
                                            }`}
                                        >
                                            {lvl.value}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Target Batch with quick suggestions */}
                            <div>
                                <label className="block font-label-md text-on-surface mb-1 font-semibold text-xs">Target Batch</label>
                                <input 
                                    type="text" 
                                    value={batch}
                                    onChange={(e) => setBatch(e.target.value)}
                                    className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-3.5 py-2 text-xs text-on-surface focus:outline-none focus:border-primary transition-colors mb-1.5"
                                    placeholder="e.g. Batch - 1 or All Batches"
                                />
                                <div className="flex flex-wrap gap-1.5 items-center">
                                    <span className="text-[10px] text-on-surface-variant font-medium mr-1">Assigned batches:</span>
                                    {(staffBatches && staffBatches.length > 0 ? staffBatches : ['Batch - 1', 'Batch - 2', 'Batch - 3', 'Batch - 4']).map((b) => (
                                        <button
                                            key={b}
                                            type="button"
                                            onClick={() => setBatch(b)}
                                            className={`text-[10px] px-2.5 py-0.5 rounded-full border transition-all cursor-pointer ${
                                                batch === b
                                                    ? 'bg-primary text-on-primary border-primary font-bold'
                                                    : 'border-outline-variant hover:bg-surface-container text-on-surface'
                                            }`}
                                        >
                                            {b}
                                        </button>
                                    ))}
                                    <button
                                        type="button"
                                        onClick={() => setBatch('All Batches')}
                                        className={`text-[10px] px-2.5 py-0.5 rounded-full border transition-all cursor-pointer ${
                                            batch === 'All Batches'
                                                ? 'bg-primary text-on-primary border-primary font-bold'
                                                : 'border-outline-variant hover:bg-surface-container text-on-surface'
                                        }`}
                                    >
                                        All Batches
                                    </button>
                                </div>
                            </div>

                            {/* Description / Instructions */}
                            <div>
                                <label className="block font-label-md text-on-surface mb-1 font-semibold text-xs">Instructions & Questions *</label>
                                <textarea 
                                    required
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-3.5 py-2 text-xs text-on-surface focus:outline-none focus:border-primary transition-colors min-h-[100px] resize-none"
                                    placeholder="Detail the questions, assignment guidelines, and instructions..."
                                />
                            </div>

                            {/* Deadline */}
                            <div>
                                <label className="block font-label-md text-on-surface mb-1 font-semibold text-xs">Deadline (Optional)</label>
                                <input 
                                    type="datetime-local" 
                                    value={dueDate}
                                    onChange={(e) => setDueDate(e.target.value)}
                                    className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-3.5 py-2 text-xs text-on-surface focus:outline-none focus:border-primary transition-colors"
                                />
                            </div>
                            
                            {/* Modal Actions */}
                            <div className="flex justify-end gap-2.5 pt-4 border-t border-outline-variant/40 mt-4">
                                <button 
                                    type="button"
                                    onClick={() => setIsCreating(false)}
                                    className="px-4 py-2 rounded-xl text-xs font-semibold text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit"
                                    disabled={isSubmitting || !title.trim() || !description.trim()}
                                    className="px-5 py-2 rounded-xl text-xs font-semibold text-on-primary bg-primary hover:opacity-90 transition-all disabled:opacity-50 flex items-center gap-2 shadow-md cursor-pointer"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
                                            <span>Publishing...</span>
                                        </>
                                    ) : (
                                        <>
                                            <span className="material-symbols-outlined text-[16px]">publish</span>
                                            <span>Publish Test</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {testToDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-surface rounded-2xl shadow-2xl p-6 w-full max-w-[420px] border border-outline-variant/60 relative">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-xl bg-error-container text-error flex items-center justify-center shrink-0">
                                <span className="material-symbols-outlined text-[24px]">warning</span>
                            </div>
                            <div>
                                <h3 className="font-headline-sm text-on-surface font-bold text-lg">Delete Test?</h3>
                                <p className="text-xs text-on-surface-variant">This will also remove all student submissions for this test.</p>
                            </div>
                        </div>

                        <div className="p-3 bg-surface-container-low rounded-xl border border-outline-variant/50 my-4 text-xs space-y-1">
                            <p className="font-bold text-on-surface text-sm line-clamp-1">{testToDelete.title}</p>
                            <div className="flex gap-1.5 pt-1">
                                {testToDelete.level && <span className="font-semibold text-primary">{testToDelete.level}</span>}
                                {testToDelete.batch && <span className="font-semibold text-on-surface-variant">• {testToDelete.batch}</span>}
                            </div>
                        </div>

                        <div className="flex justify-end gap-2.5 mt-5">
                            <button
                                type="button"
                                onClick={() => setTestToDelete(null)}
                                disabled={isDeleting}
                                className="px-4 py-2 rounded-xl border border-outline-variant text-on-surface hover:bg-surface-container text-xs font-semibold transition-colors cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={confirmDelete}
                                disabled={isDeleting}
                                className="px-4 py-2 rounded-xl bg-error text-on-error hover:bg-error/90 text-xs font-semibold transition-all flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
                            >
                                {isDeleting ? (
                                    <>
                                        <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
                                        <span>Deleting...</span>
                                    </>
                                ) : (
                                    <>
                                        <span className="material-symbols-outlined text-[16px]">delete</span>
                                        <span>Delete Test</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}
