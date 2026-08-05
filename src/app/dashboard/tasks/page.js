'use client';
import { useState, useEffect } from 'react';

export default function StudentTasks() {
    const [tasks, setTasks] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('pending'); // 'pending', 'submitted'
    const [submittingId, setSubmittingId] = useState(null);
    const [submissionContent, setSubmissionContent] = useState('');

    useEffect(() => {
        fetchTasks();
    }, []);

    const fetchTasks = async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${process.env.NEXT_PUBLIC_TEST_API_URL || 'http://localhost:8003'}/api/tests`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setTasks(data);
            } else {
                throw new Error('Failed to fetch tasks');
            }
        } catch (err) {
            console.error('Error fetching tasks:', err);
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (taskId) => {
        if (!submissionContent.trim()) return;
        
        setSubmittingId(taskId);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${process.env.NEXT_PUBLIC_TEST_API_URL || 'http://localhost:8003'}/api/tests/${taskId}/submit`, {
                method: 'POST',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ submission_content: submissionContent })
            });

            if (res.ok) {
                setSubmissionContent('');
                fetchTasks(); // Refresh tasks
            } else {
                const errorData = await res.json();
                alert(`Error: ${errorData.detail || 'Submission failed'}`);
            }
        } catch (err) {
            console.error('Error submitting task:', err);
            alert('Failed to submit task. Please try again.');
        } finally {
            setSubmittingId(null);
        }
    };

    const pendingTasks = tasks.filter(t => !t.submission);
    const submittedTasks = tasks.filter(t => t.submission);
    const displayedTasks = activeTab === 'pending' ? pendingTasks : submittedTasks;

    return (
        <section className="max-w-[1440px] mx-auto p-gutter space-y-lg animate-fade-in">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-md mb-lg">
                <div>
                    <div className="flex items-center gap-sm mb-xs">
                        <span className="material-symbols-outlined text-primary text-3xl">
                            assignment
                        </span>
                        <h1 className="font-display-sm md:font-display-md text-on-surface">
                            My Tasks
                        </h1>
                    </div>
                    <p className="font-body-lg text-on-surface-variant max-w-2xl">
                        Manage your assignments and deadlines
                    </p>
                </div>
            </div>

            {/* Content Area */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-md">
                
                {/* Main Task List */}
                <div className="md:col-span-8 flex flex-col gap-md">
                    <div className="bg-white border border-outline-variant rounded-2xl p-lg custom-shadow min-h-[500px] flex flex-col">
                        
                        {/* Tabs */}
                        <div className="flex gap-md mb-md border-b border-outline-variant">
                            <button 
                                onClick={() => setActiveTab('pending')}
                                className={`pb-sm font-label-lg transition-colors border-b-2 ${activeTab === 'pending' ? 'text-primary border-primary' : 'text-on-surface-variant border-transparent hover:text-on-surface'}`}
                            >
                                Pending ({pendingTasks.length})
                            </button>
                            <button 
                                onClick={() => setActiveTab('submitted')}
                                className={`pb-sm font-label-lg transition-colors border-b-2 ${activeTab === 'submitted' ? 'text-primary border-primary' : 'text-on-surface-variant border-transparent hover:text-on-surface'}`}
                            >
                                Submitted ({submittedTasks.length})
                            </button>
                        </div>
                        
                        {/* Task List */}
                        <div className="flex-1 flex flex-col gap-md">
                            {isLoading ? (
                                <div className="flex justify-center items-center h-64">
                                    <span className="material-symbols-outlined text-4xl text-primary animate-spin">refresh</span>
                                </div>
                            ) : error ? (
                                <div className="flex justify-center text-error p-xl">
                                    <p>{error}</p>
                                </div>
                            ) : displayedTasks.length === 0 ? (
                                <div className="flex-1 flex flex-col items-center justify-center text-center p-xl bg-surface-container/30 rounded-xl border border-dashed border-outline-variant">
                                    <span className="material-symbols-outlined text-6xl text-outline/50 mb-md">
                                        {activeTab === 'pending' ? 'task_alt' : 'assignment'}
                                    </span>
                                    <h3 className="font-headline-sm text-on-surface-variant mb-xs">
                                        {activeTab === 'pending' ? "You're all caught up!" : "No submissions yet"}
                                    </h3>
                                    <p className="font-body-md text-outline">
                                        {activeTab === 'pending' 
                                            ? "Great job! You don't have any pending tasks right now."
                                            : "Tasks you submit will appear here along with staff feedback."}
                                    </p>
                                </div>
                            ) : (
                                displayedTasks.map(task => (
                                    <div key={task.id} className="bg-surface-container-lowest rounded-xl p-md border border-outline-variant shadow-sm hover:shadow-md transition-shadow">
                                        <div className="flex justify-between items-start mb-sm">
                                            <h3 className="font-headline-sm text-on-surface">{task.title}</h3>
                                            <span className={`px-2 py-1 rounded text-xs font-bold ${task.submission ? 'bg-primary-container text-on-primary-container' : 'bg-error-container text-on-error-container'}`}>
                                                {task.submission ? task.submission.status : 'Pending'}
                                            </span>
                                        </div>
                                        <p className="font-body-md text-on-surface-variant mb-md">
                                            {task.description || "No detailed description provided."}
                                        </p>
                                        <div className="flex items-center gap-2 mb-md">
                                            <span className="material-symbols-outlined text-[16px] text-outline">calendar_today</span>
                                            <span className="text-sm font-label-md text-on-surface-variant">
                                                Due: {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No deadline'}
                                            </span>
                                        </div>

                                        {/* Action Area */}
                                        {activeTab === 'pending' && (
                                            <div className="mt-md pt-md border-t border-outline-variant">
                                                <textarea 
                                                    className="w-full p-sm rounded-lg border border-outline focus:border-primary focus:ring-1 focus:ring-primary outline-none bg-surface-container-lowest text-on-surface resize-none h-24 mb-sm"
                                                    placeholder="Type your submission content or link here..."
                                                    onChange={(e) => setSubmissionContent(e.target.value)}
                                                ></textarea>
                                                <div className="flex justify-end">
                                                    <button 
                                                        onClick={() => handleSubmit(task.id)}
                                                        disabled={submittingId === task.id || !submissionContent.trim()}
                                                        className="px-md py-sm bg-primary text-on-primary rounded-lg font-label-md shadow-sm hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-xs transition-colors"
                                                    >
                                                        {submittingId === task.id ? (
                                                            <span className="material-symbols-outlined animate-spin text-[18px]">refresh</span>
                                                        ) : (
                                                            <span className="material-symbols-outlined text-[18px]">send</span>
                                                        )}
                                                        Submit Task
                                                    </button>
                                                </div>
                                            </div>
                                        )}

                                        {/* Feedback Area */}
                                        {activeTab === 'submitted' && task.submission && task.submission.staff_comments && (
                                            <div className="mt-md pt-md border-t border-outline-variant bg-surface-variant/30 -mx-md -mb-md p-md rounded-b-xl">
                                                <h4 className="font-label-md text-on-surface flex items-center gap-xs mb-xs">
                                                    <span className="material-symbols-outlined text-[18px] text-primary">forum</span>
                                                    Staff Feedback
                                                </h4>
                                                <p className="font-body-md text-on-surface-variant italic">
                                                    "{task.submission.staff_comments}"
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Sidebar Area */}
                <div className="md:col-span-4 flex flex-col gap-md">
                    {/* Stats Card */}
                    <div className="bg-primary-container text-on-primary-container rounded-2xl p-md shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
                        <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary/10 rounded-full group-hover:scale-150 transition-transform duration-500 ease-out"></div>
                        <h3 className="font-label-md opacity-80 mb-sm">Tasks Pending</h3>
                        <div className="flex items-end gap-sm">
                            <span className="font-display-md leading-none">{pendingTasks.length}</span>
                            <span className="font-label-sm mb-1 opacity-80">Requires action</span>
                        </div>
                    </div>

                    <div className="bg-secondary-container text-on-secondary-container rounded-2xl p-md shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
                        <div className="absolute -right-4 -top-4 w-24 h-24 bg-secondary/10 rounded-full group-hover:scale-150 transition-transform duration-500 ease-out"></div>
                        <h3 className="font-label-md opacity-80 mb-sm">Tasks Completed</h3>
                        <div className="flex items-end gap-sm">
                            <span className="font-display-md leading-none">{submittedTasks.length}</span>
                            <span className="font-label-sm mb-1 opacity-80">Submitted successfully</span>
                        </div>
                    </div>
                </div>

            </div>
        </section>
    );
}
