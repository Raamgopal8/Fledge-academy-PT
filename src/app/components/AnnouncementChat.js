'use client';
import { useState, useEffect, useRef } from 'react';

export default function AnnouncementChat({ role, overrideBatch, overrideLevel }) {
    const [announcements, setAnnouncements] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [newMessage, setNewMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // For editing
    const [editingId, setEditingId] = useState(null);
    const [editContent, setEditContent] = useState('');

    // For deleting (Admin only)
    const [deletingId, setDeletingId] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
    
    const chatContainerRef = useRef(null);

    const isAdmin = (role || '').toLowerCase() === 'admin' || (role || '').toLowerCase() === 'ceo';

    const [userLevel, setUserLevel] = useState(() => {
        if (overrideLevel !== undefined) {
            return (overrideLevel === 'All Levels' || overrideLevel === 'All') ? '' : (overrideLevel || '');
        }
        if (typeof window !== 'undefined') {
            const l = localStorage.getItem('adminSelectedLevel') || localStorage.getItem('sensiSelectedLevel') || localStorage.getItem('level') || 'Level 5';
            return (l === 'All Levels' || l === 'All') ? '' : l;
        }
        return 'Level 5';
    });

    const [userBatch, setUserBatch] = useState(() => {
        if (overrideBatch !== undefined) {
            return (overrideBatch === 'All Batches' || overrideBatch === 'All Assigned Batches') ? '' : (overrideBatch || '');
        }
        if (typeof window !== 'undefined') {
            const b = localStorage.getItem('adminSelectedBatch') || localStorage.getItem('sensiSelectedBatch') || localStorage.getItem('batch') || '';
            return (b === 'All Batches' || b === 'All Assigned Batches') ? '' : b;
        }
        return '';
    });

    // Sync overrideBatch / overrideLevel if prop changes or on mount
    useEffect(() => {
        if (typeof window !== 'undefined') {
            let level = userLevel;
            if (overrideLevel !== undefined) {
                level = (overrideLevel === 'All Levels' || overrideLevel === 'All') ? '' : (overrideLevel || '');
            } else {
                const l = localStorage.getItem('adminSelectedLevel') || localStorage.getItem('sensiSelectedLevel') || localStorage.getItem('level') || 'Level 5';
                level = (l === 'All Levels' || l === 'All') ? '' : l;
            }
            let batch = userBatch;
            if (overrideBatch !== undefined) {
                batch = (overrideBatch === 'All Batches' || overrideBatch === 'All Assigned Batches') ? '' : (overrideBatch || '');
            } else {
                const b = localStorage.getItem('adminSelectedBatch') || localStorage.getItem('sensiSelectedBatch') || localStorage.getItem('batch') || '';
                batch = (b === 'All Batches' || b === 'All Assigned Batches') ? '' : b;
            }
            setUserBatch(batch);
            setUserLevel(level);
        }
    }, [overrideBatch, overrideLevel]);

    const fetchAnnouncements = async (lvlParam, batchParam) => {
        try {
            const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
            let currentLevel = lvlParam !== undefined ? lvlParam : userLevel;
            let currentBatch = batchParam !== undefined ? batchParam : (overrideBatch !== undefined ? overrideBatch : userBatch);

            // Normalize batch
            if (currentBatch === 'All Batches' || currentBatch === 'All Assigned Batches') {
                currentBatch = '';
            }

            // Fallback for student/sensi if level or batch are missing from localStorage
            if (!isAdmin && typeof window !== 'undefined' && (!currentLevel || !localStorage.getItem('level')) && token) {
                try {
                    const profRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/user/profile`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (profRes.ok) {
                        const prof = await profRes.json();
                        if (prof.level) {
                            currentLevel = prof.level;
                            localStorage.setItem('level', prof.level);
                            setUserLevel(prof.level);
                        }
                        if (overrideBatch === undefined && prof.batch) {
                            currentBatch = (prof.batch === 'All Batches' || prof.batch === 'All Assigned Batches') ? '' : prof.batch;
                            localStorage.setItem('batch', prof.batch);
                            setUserBatch(currentBatch);
                        }
                    }
                } catch (pe) {
                    console.warn("Profile fetch fallback warning:", pe);
                }
            }

            currentLevel = currentLevel || 'Level 5';
            currentBatch = currentBatch || '';

            const annApiBase = process.env.NEXT_PUBLIC_ANNOUNCEMENT_API_URL || '';
            const queryParams = new URLSearchParams();
            if (currentLevel) queryParams.append('level', currentLevel);
            if (currentBatch) queryParams.append('batch', currentBatch);
            queryParams.append('t', Date.now().toString());

            const res = await fetch(`${annApiBase}/api/announcement?${queryParams.toString()}`, {
                headers: token ? { 'Authorization': `Bearer ${token}` } : {}
            });

            if (!res.ok) {
                // If 401 or backend error, log warning instead of crashing UI
                console.warn(`Announcement API returned status ${res.status}`);
                return;
            }

            const data = await res.json();
            if (Array.isArray(data)) {
                // Backend returns newest first. Reverse for chat layout (oldest at top).
                setAnnouncements([...data].reverse());
                setError(null);
            }
        } catch (err) {
            console.error("Error fetching announcements:", err);
            // Only set error if we don't already have announcements displayed
            if (announcements.length === 0) {
                setError(err.message);
            }
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchAnnouncements();
    }, [userLevel, userBatch, overrideBatch]);

    useEffect(() => {
        // Auto scroll to bottom when new messages arrive
        if (chatContainerRef.current && !editingId) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [announcements, isAdmin, editingId]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !isAdmin) return;
        
        setIsSubmitting(true);
        try {
            const token = localStorage.getItem('token');
            const title = `Admin Update - ${new Date().toLocaleDateString()}`;
            const annApiBase = process.env.NEXT_PUBLIC_ANNOUNCEMENT_API_URL || '';
            const res = await fetch(`${annApiBase}/api/announcement`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ 
                    title, 
                    content: newMessage, 
                    level: userLevel,
                    ...(userBatch ? { batch: userBatch } : {})
                })
            });

            if (!res.ok) throw new Error('Failed to send announcement');
            
            setNewMessage('');
            await fetchAnnouncements();
        } catch (err) {
            console.error("Error sending announcement:", err);
            alert("Failed to send announcement. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const handleEditMessage = async (id) => {
        if (!editContent.trim() || !isAdmin) return;
        
        try {
            const token = localStorage.getItem('token');
            const annApiBase = process.env.NEXT_PUBLIC_ANNOUNCEMENT_API_URL || '';
            const res = await fetch(`${annApiBase}/api/announcement/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ content: editContent })
            });

            if (!res.ok) throw new Error('Failed to update announcement');
            
            setEditingId(null);
            setEditContent('');
            await fetchAnnouncements();
        } catch (err) {
            console.error("Error updating announcement:", err);
            alert("Failed to update announcement. Please try again.");
        }
    };

    const handleDeleteMessage = async (id) => {
        if (!isAdmin || !id) return;
        setIsDeleting(true);
        try {
            const token = localStorage.getItem('token');
            const annApiBase = process.env.NEXT_PUBLIC_ANNOUNCEMENT_API_URL || '';
            const res = await fetch(`${annApiBase}/api/announcement/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!res.ok) throw new Error('Failed to delete announcement');
            
            // Optimistically remove from state
            setAnnouncements(prev => prev.filter(a => (a.id || a._id) !== id));
            setDeletingId(null);
        } catch (err) {
            console.error("Error deleting announcement:", err);
            alert("Failed to delete announcement. Please try again.");
        } finally {
            setIsDeleting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-primary min-h-[50vh]">
                <span className="material-symbols-outlined text-[48px] animate-spin">progress_activity</span>
                <p className="font-label-lg mt-4">Loading Announcements...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-lg bg-error-container text-on-error-container rounded-xl flex items-center gap-md m-md">
                <span className="material-symbols-outlined text-[32px]">error</span>
                <div>
                    <h3 className="font-headline-md">Error Loading Data</h3>
                    <p className="font-body-md">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full flex-1 min-h-0 bg-surface-container-lowest rounded-2xl border border-outline-variant overflow-hidden shadow-sm w-full relative">
            {/* Header */}
            <div className="p-md border-b border-outline-variant bg-surface flex justify-between items-center z-10 shadow-xs">
                <div>
                    <h2 className="text-3xl md:text-4xl font-bold tracking-tight bg-gradient-to-r from-[#6FB7E4] via-[#5D8BCC] to-[#465AA3] text-transparent bg-clip-text">Announcements</h2>
                    <p className="font-body-sm text-on-surface-variant">
                        {isAdmin ? 'Broadcast and manage announcements for the academy.' : 'Important updates from the Admin.'}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => fetchAnnouncements()}
                        className="text-on-surface-variant hover:text-primary p-1.5 rounded-lg hover:bg-surface-container transition-colors cursor-pointer active:scale-95"
                        title="Refresh Announcements"
                    >
                        <span className="material-symbols-outlined text-[22px]">refresh</span>
                    </button>
                    <span className="material-symbols-outlined text-primary text-3xl">campaign</span>
                </div>
            </div>

            {/* Chat Messages */}
            <div 
                ref={chatContainerRef}
                className="flex-1 p-md md:p-xl overflow-y-auto space-y-md custom-scrollbar bg-surface"
            >
                {announcements.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-on-surface-variant opacity-70">
                        <span className="material-symbols-outlined text-[48px] mb-2">chat_bubble_outline</span>
                        <p className="font-body-md">No announcements yet.</p>
                    </div>
                ) : (
                    announcements.map((ann) => {
                        const annId = ann.id || ann._id;
                        const date = new Date(ann.created_at);
                        const isOwn = isAdmin; // Admin authors all announcements here
                        
                        return (
                            <div key={annId} className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} group`}>
                                <div className="flex items-baseline gap-2 mb-1 px-1">
                                    <span className="font-label-sm text-on-surface-variant">{isOwn ? 'You (Admin)' : 'Admin'}</span>
                                    <span className="text-[10px] text-outline">{date.toLocaleString()}</span>
                                </div>
                                
                                {editingId === annId ? (
                                    <div className="w-full max-w-[85%] bg-surface-container border border-primary rounded-xl p-3 shadow-sm">
                                        <textarea
                                            value={editContent}
                                            onChange={(e) => setEditContent(e.target.value)}
                                            className="w-full bg-transparent focus:outline-none font-body-md text-on-surface resize-none min-h-[60px]"
                                            autoFocus
                                        />
                                        <div className="flex justify-end gap-2 mt-2">
                                            <button 
                                                onClick={() => setEditingId(null)}
                                                className="px-3 py-1 rounded hover:bg-surface-container-highest text-on-surface-variant font-label-sm cursor-pointer"
                                            >
                                                Cancel
                                            </button>
                                            <button 
                                                onClick={() => handleEditMessage(annId)}
                                                className="px-3 py-1 rounded bg-primary text-on-primary font-label-sm hover:bg-primary/90 cursor-pointer"
                                            >
                                                Save
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-start gap-2 max-w-[85%]">
                                        {isOwn && (
                                            <div className="flex items-center gap-0.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity mt-1">
                                                <button 
                                                    onClick={() => {
                                                        setEditingId(annId);
                                                        setEditContent(ann.content);
                                                    }}
                                                    className="text-on-surface-variant hover:text-primary p-2 sm:p-1.5 rounded-lg hover:bg-surface-container transition-colors cursor-pointer active:scale-95"
                                                    title="Edit Announcement"
                                                >
                                                    <span className="material-symbols-outlined text-[18px]">edit</span>
                                                </button>
                                                <button 
                                                    onClick={() => setDeletingId(annId)}
                                                    className="text-on-surface-variant hover:text-error p-2 sm:p-1.5 rounded-lg hover:bg-error/10 transition-colors cursor-pointer active:scale-95"
                                                    title="Delete Announcement"
                                                >
                                                    <span className="material-symbols-outlined text-[18px]">delete</span>
                                                </button>
                                            </div>
                                        )}
                                        <div className="flex flex-col gap-1">
                                            <div className={`px-4 py-3 font-body-md shadow-sm ${
                                                isOwn 
                                                    ? 'bg-primary text-on-primary rounded-2xl rounded-tr-sm' 
                                                    : 'bg-surface-container-high text-on-surface rounded-2xl rounded-tl-sm'
                                            }`}>
                                                <div className="whitespace-pre-wrap">{ann.content}</div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>

            {/* Chat Input (Admin Only) */}
            {isAdmin && (
                <div className="p-md bg-surface-container-low border-t border-outline-variant">
                    <form onSubmit={handleSendMessage} className="flex items-end gap-3 max-w-[1000px] mx-auto">
                        <div className="flex-1 bg-surface rounded-2xl border border-outline-variant focus-within:border-primary focus-within:ring-1 focus-within:ring-primary shadow-sm overflow-hidden flex flex-col">
                            <textarea
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                placeholder="Type a message"
                                className="w-full bg-transparent px-4 py-3 focus:outline-none font-body-md text-on-surface resize-none min-h-[52px] max-h-[150px] custom-scrollbar"
                                rows={1}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSendMessage(e);
                                    }
                                }}
                            />
                        </div>
                        <button 
                            type="submit"
                            disabled={!newMessage.trim() || isSubmitting}
                            className="w-[52px] h-[52px] rounded-full bg-primary text-on-primary flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 transition-all shadow-md hover:shadow-lg flex-shrink-0 active:scale-95 cursor-pointer"
                        >
                            {isSubmitting ? (
                                <span className="material-symbols-outlined text-[24px] animate-spin">progress_activity</span>
                            ) : (
                                <span className="material-symbols-outlined text-[24px]">send</span>
                            )}
                        </button>
                    </form>
                </div>
            )}

            {/* Delete Confirmation Modal for Admin */}
            {deletingId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
                    <div className="bg-surface-container-lowest dark:bg-slate-900 border border-outline-variant/80 rounded-3xl p-6 sm:p-7 shadow-2xl w-full max-w-[440px] sm:w-[440px] space-y-5 relative">
                        <div className="flex items-center gap-3.5">
                            <div className="w-12 h-12 rounded-2xl bg-error/15 text-error flex items-center justify-center shrink-0">
                                <span className="material-symbols-outlined text-[26px]">delete</span>
                            </div>
                            <div className="min-w-0">
                                <h3 className="font-bold text-lg text-on-surface">Delete Announcement?</h3>
                                <p className="text-xs sm:text-sm text-on-surface-variant mt-0.5">This announcement will be permanently removed for all users.</p>
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-3 pt-2 border-t border-outline-variant/40">
                            <button
                                type="button"
                                onClick={() => setDeletingId(null)}
                                disabled={isDeleting}
                                className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-on-surface border border-outline-variant hover:bg-surface-container transition-colors cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={() => handleDeleteMessage(deletingId)}
                                disabled={isDeleting}
                                className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-error text-white hover:bg-error/90 transition-all shadow-md active:scale-95 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                            >
                                {isDeleting ? (
                                    <>
                                        <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
                                        <span>Deleting...</span>
                                    </>
                                ) : (
                                    <>
                                        <span className="material-symbols-outlined text-[18px]">delete</span>
                                        <span>Delete</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
