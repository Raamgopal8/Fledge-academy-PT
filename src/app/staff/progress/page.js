'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function StudentProgress() {
    const [submissions, setSubmissions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchProgress = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) throw new Error("No authentication token found");

                const res = await fetch(`${process.env.NEXT_PUBLIC_TEST_API_URL || 'http://localhost:8003'}/api/tests/submissions/all`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (!res.ok) {
                    throw new Error('Failed to fetch student progress data');
                }

                const data = await res.json();
                setSubmissions(data);
            } catch (err) {
                console.error("Error fetching progress:", err);
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchProgress();
    }, []);

    const filteredSubmissions = submissions.filter(sub => 
        (sub.student_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (sub.test_title || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Calculate aggregated metrics
    const totalSubmissions = submissions.length;
    const reviewedSubmissions = submissions.filter(s => s.status === 'Reviewed').length;
    const needsWorkSubmissions = submissions.filter(s => s.status === 'Needs Work').length;
    const pendingSubmissions = totalSubmissions - reviewedSubmissions - needsWorkSubmissions;

    if (isLoading) {
        return (
            <div className="flex-1 p-gutter min-h-screen flex items-center justify-center">
                <div className="flex flex-col items-center gap-4 text-primary">
                    <span className="material-symbols-outlined text-[48px] animate-spin">progress_activity</span>
                    <p className="font-label-lg">Loading Student Progress...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex-1 p-gutter min-h-screen">
                <div className="p-lg bg-error-container text-on-error-container rounded-xl flex items-center gap-md">
                    <span className="material-symbols-outlined text-[32px]">error</span>
                    <div>
                        <h3 className="font-headline-md">Error Loading Data</h3>
                        <p className="font-body-md">{error}</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <section className="max-w-[1440px] mx-auto p-gutter space-y-lg animate-fade-in pb-32">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-md mb-lg">
                <div>
                    <div className="flex items-center gap-sm mb-xs">
                        <h1 className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#6FB7E4] via-[#5D8BCC] to-[#465AA3]">
                            Student Progress
                        </h1>
                    </div>
                    <p className="font-body-lg text-on-surface-variant max-w-2xl mt-1">
                        Aggregated overview of test activities, scores, and feedback.
                    </p>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-md">
                <div className="bento-card p-md">
                    <p className="font-label-md text-on-surface-variant">Total Submissions</p>
                    <h2 className="font-headline-lg text-primary mt-1">{totalSubmissions}</h2>
                </div>
                <div className="bento-card p-md">
                    <p className="font-label-md text-on-surface-variant">Reviewed (Pass)</p>
                    <h2 className="font-headline-lg text-secondary mt-1">{reviewedSubmissions}</h2>
                </div>
                <div className="bento-card p-md">
                    <p className="font-label-md text-on-surface-variant">Needs Work (Fail)</p>
                    <h2 className="font-headline-lg text-error mt-1">{needsWorkSubmissions}</h2>
                </div>
                <div className="bento-card p-md">
                    <p className="font-label-md text-on-surface-variant">Pending Review</p>
                    <h2 className="font-headline-lg text-tertiary mt-1">{pendingSubmissions}</h2>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="bento-card p-lg flex flex-col h-[600px]">
                <div className="flex justify-between items-center mb-md">
                    <h3 className="font-headline-md text-on-surface">Detailed Progress Log</h3>
                    
                    <div className="relative">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
                        <input 
                            type="text" 
                            placeholder="Search students or tests..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2 bg-surface-container border border-outline-variant rounded-lg font-body-sm focus:outline-none focus:ring-2 focus:ring-primary w-[300px]"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse">
                        <thead className="sticky top-0 bg-surface-container-lowest z-10">
                            <tr className="border-b border-outline-variant">
                                <th className="p-sm font-label-md text-on-surface-variant">Student</th>
                                <th className="p-sm font-label-md text-on-surface-variant">Test</th>
                                <th className="p-sm font-label-md text-on-surface-variant">Submitted</th>
                                <th className="p-sm font-label-md text-on-surface-variant">Status</th>
                                <th className="p-sm font-label-md text-on-surface-variant">Feedback</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredSubmissions.length > 0 ? (
                                filteredSubmissions.map((sub) => (
                                    <tr key={sub.id} className="border-b border-outline-variant hover:bg-surface-container-low transition-colors">
                                        <td className="p-sm">
                                            <div className="font-label-md text-on-surface">{sub.student_name}</div>
                                        </td>
                                        <td className="p-sm">
                                            <div className="font-body-sm text-on-surface-variant">{sub.test_title}</div>
                                        </td>
                                        <td className="p-sm font-body-sm text-on-surface-variant">
                                            {new Date(sub.submitted_at).toLocaleDateString()}
                                        </td>
                                        <td className="p-sm">
                                            <span className={`px-xs py-0.5 rounded text-xs font-medium ${
                                                sub.status === 'Reviewed' ? 'bg-primary-container text-on-primary-container' : 
                                                sub.status === 'Needs Work' ? 'bg-error-container text-on-error-container' : 
                                                'bg-secondary-container text-on-secondary-container'
                                            }`}>
                                                {sub.status || 'Pending Review'}
                                            </span>
                                        </td>
                                        <td className="p-sm">
                                            <div className="font-body-sm text-on-surface-variant truncate max-w-[250px]" title={sub.staff_comments || 'No feedback yet'}>
                                                {sub.staff_comments || '-'}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="p-md text-center text-body-md text-on-surface-variant">
                                        No matching submissions found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </section>
    );
}
