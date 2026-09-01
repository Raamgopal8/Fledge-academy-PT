'use client';
import { useState, useEffect } from 'react';
import { useAdminContext } from '../AdminContext';

export default function CEOTests() {
    const { searchQuery: globalSearch, selectedBatch } = useAdminContext();
    const [tests, setTests] = useState([]);
    const [allSubmissionsCount, setAllSubmissionsCount] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    
    // Submissions View
    const [activeTest, setActiveTest] = useState(null);
    const [submissions, setSubmissions] = useState([]);
    const [isLoadingSubmissions, setIsLoadingSubmissions] = useState(false);

    const fetchTests = async () => {
        setIsRefreshing(true);
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            const headers = { 'Authorization': `Bearer ${token}` };
            const batchParam = (selectedBatch && selectedBatch !== 'All Batches' && selectedBatch !== 'Global' && selectedBatch !== 'Global Access') 
                ? `?batch=${encodeURIComponent(selectedBatch)}` 
                : '';

            // Clean endpoint URL without trailing slash before query string
            const res = await fetch(`${process.env.NEXT_PUBLIC_TEST_API_URL || ''}/api/tests${batchParam}`, {
                headers
            });

            if (res.ok) {
                const data = await res.json();
                setTests(Array.isArray(data) ? data : []);
            } else {
                console.error('Failed to fetch tests:', res.status, res.statusText);
            }
        } catch (err) {
            console.error('Error fetching tests:', err);
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    };

    useEffect(() => {
        fetchTests();
    }, [selectedBatch]);

    const fetchSubmissions = async (test) => {
        setIsLoadingSubmissions(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${process.env.NEXT_PUBLIC_TEST_API_URL || ''}/api/tests/${test.id}/submissions`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setSubmissions(Array.isArray(data) ? data : []);
                setActiveTest(test);
            } else {
                alert('Failed to fetch submissions for this test');
            }
        } catch (err) {
            console.error('Error fetching submissions:', err);
            alert('Error fetching submissions from server.');
        } finally {
            setIsLoadingSubmissions(false);
        }
    };

    const effectiveSearch = (searchQuery || globalSearch || '').toLowerCase();
    const filteredTests = tests.filter(test => {
        if (!effectiveSearch) return true;
        const matchesTitle = (test.title || '').toLowerCase().includes(effectiveSearch);
        const matchesDesc = (test.description || '').toLowerCase().includes(effectiveSearch);
        const matchesLevel = (test.level || '').toLowerCase().includes(effectiveSearch);
        const matchesBatch = (test.batch || '').toLowerCase().includes(effectiveSearch);
        return matchesTitle || matchesDesc || matchesLevel || matchesBatch;
    });

    if (isLoading) return (
        <div className="p-4 md:p-gutter min-h-screen text-center flex flex-col items-center justify-center gap-3">
            <span className="material-symbols-outlined animate-spin text-4xl text-primary">progress_activity</span>
            <p className="text-sm font-semibold text-on-surface-variant">Loading tests from database...</p>
        </div>
    );

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
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                            <h2 className="text-lg sm:text-xl font-bold text-on-surface">{activeTest.title}</h2>
                            {activeTest.level && (
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary border border-primary/20">
                                    {activeTest.level}
                                </span>
                            )}
                            {activeTest.batch && (
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-secondary/10 text-secondary border border-secondary/20">
                                    {activeTest.batch}
                                </span>
                            )}
                        </div>
                        <p className="text-on-surface-variant text-xs sm:text-sm whitespace-pre-wrap">{activeTest.description || 'No description provided.'}</p>
                    </div>

                    <div className="space-y-3">
                    {isLoadingSubmissions ? (
                        <div className="text-center py-12 flex flex-col items-center gap-2">
                            <span className="material-symbols-outlined animate-spin text-3xl text-primary">progress_activity</span>
                            <p className="text-xs text-on-surface-variant">Loading student submissions...</p>
                        </div>
                    ) : submissions.length === 0 ? (
                        <div className="text-center py-12 bg-surface-container-low/60 rounded-2xl border border-outline-variant/60">
                            <span className="material-symbols-outlined text-[40px] text-on-surface-variant mb-2 opacity-50">inbox</span>
                            <p className="text-on-surface-variant text-xs sm:text-sm font-medium">No student submissions recorded for this test yet.</p>
                        </div>
                    ) : (
                        submissions.map(sub => {
                            const isApproved = sub.status === 'Approved' || sub.status === 'Reviewed';
                            const isNeedWork = sub.status === 'Need Work' || sub.status === 'Needs Work' || sub.status === 'Failed';

                            return (
                                <div key={sub.id} className="bg-surface-container-low/60 p-4 rounded-2xl border border-outline-variant/60 shadow-xs space-y-3">
                                    <div className="flex justify-between items-start gap-2">
                                        <div>
                                            <h3 className="text-xs sm:text-sm font-bold text-on-surface">{sub.student_name || 'Student'}</h3>
                                            <p className="text-[10px] sm:text-xs text-on-surface-variant">
                                                {sub.submitted_at ? new Date(sub.submitted_at).toLocaleString() : 'Recently'}
                                            </p>
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
                                    
                                    <div className="bg-surface-container-lowest p-3 rounded-xl border border-outline-variant/60">
                                        <h4 className="text-[10px] sm:text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">Student Submission:</h4>
                                        {sub.submission_content && sub.submission_content.startsWith('http') ? (
                                            <a href={sub.submission_content} target="_blank" rel="noreferrer" className="text-primary hover:underline break-all text-xs sm:text-sm font-medium flex items-center gap-1">
                                                <span className="material-symbols-outlined text-[15px]">open_in_new</span>
                                                <span>{sub.submission_content}</span>
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
                    <p className="font-body-md text-on-surface-variant max-w-2xl">Monitor all tests and student submissions across the academy database.</p>
                </div>

                <div className="flex items-center gap-2 self-start md:self-auto flex-wrap">
                    {/* Search Input */}
                    <div className="relative w-full sm:w-64">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[18px]">
                            search
                        </span>
                        <input
                            type="text"
                            placeholder="Search tests..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-surface-container-lowest border border-outline-variant rounded-xl text-xs sm:text-sm text-on-surface focus:border-primary outline-none transition-all"
                        />
                    </div>

                    <button 
                        onClick={fetchTests}
                        disabled={isRefreshing}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-on-surface text-xs sm:text-sm font-semibold transition-all active:scale-95 shadow-xs cursor-pointer"
                        title="Refresh tests from database"
                    >
                        <span className={`material-symbols-outlined text-[18px] ${isRefreshing ? 'animate-spin text-primary' : ''}`}>
                            refresh
                        </span>
                        <span>{isRefreshing ? 'Syncing...' : 'Refresh'}</span>
                    </button>
                </div>
            </section>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 w-full max-w-full">
                {filteredTests.map(test => (
                    <div key={test.id} className="bg-surface-container-lowest p-5 md:p-6 rounded-3xl border border-outline-variant/60 custom-shadow hover:shadow-md hover:border-primary/50 transition-all group flex flex-col justify-between">
                        <div>
                            <div className="flex items-center gap-1.5 flex-wrap mb-2">
                                {test.level && (
                                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-primary/10 text-primary border border-primary/20">
                                        {test.level}
                                    </span>
                                )}
                                {test.batch && (
                                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-surface-container-high text-on-surface-variant border border-outline-variant/40">
                                        {test.batch}
                                    </span>
                                )}
                            </div>
                            <h3 className="text-sm sm:text-base font-bold text-on-surface mb-1">{test.title}</h3>
                            <p className="text-on-surface-variant text-xs line-clamp-3 mb-3 flex-1">{test.description || 'No description.'}</p>
                        </div>
                        
                        <div className="flex justify-between items-center mt-auto pt-3 border-t border-outline-variant">
                            <div className="flex flex-col min-w-0 mr-2">
                                <span className="text-[10px] sm:text-xs text-on-surface-variant truncate">
                                    Posted: {test.created_at ? new Date(test.created_at).toLocaleDateString() : 'N/A'}
                                </span>
                                {test.due_date && (
                                    <span className="text-[10px] sm:text-xs font-semibold text-error mt-0.5 truncate">
                                        Due: {new Date(test.due_date).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                                    </span>
                                )}
                            </div>
                            <button 
                                onClick={() => fetchSubmissions(test)}
                                className="text-primary text-xs sm:text-sm font-semibold flex items-center gap-1 group-hover:underline shrink-0 cursor-pointer"
                            >
                                View Analytics
                                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                            </button>
                        </div>
                    </div>
                ))}
            </div>
            
            {filteredTests.length === 0 && (
                <div className="text-center py-12 sm:py-20 bg-surface-container-low rounded-2xl sm:rounded-3xl border border-outline-variant">
                    <span className="material-symbols-outlined text-[48px] sm:text-[64px] text-on-surface-variant mb-2 opacity-50">assignment</span>
                    <h3 className="text-base sm:text-xl font-bold text-on-surface mb-1">No Tests Found</h3>
                    <p className="text-on-surface-variant text-xs sm:text-sm">
                        {searchQuery ? 'No tests match your search query.' : 'There are currently no assignments or tests in the database.'}
                    </p>
                </div>
            )}
        </div>
    );
}
