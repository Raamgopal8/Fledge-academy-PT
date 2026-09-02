'use client';
import { useState, useEffect, useRef } from 'react';

export default function AnnouncementChat({ role, overrideBatch }) {
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

    const [userLevel, setUserLevel] = useState('Level 5');
    const [userBatch, setUserBatch] = useState('');

    useEffect(() => {
        // Run only on client side
        if (typeof window !== 'undefined') {
            const level = localStorage.getItem('level') || 'Level 5';
            const batch = overrideBatch !== undefined ? overrideBatch : (localStorage.getItem('batch') || '');
            setUserBatch(batch);
            setUserLevel(level);
        }
    }, [overrideBatch]);

    const fetchAnnouncements = async () => {
        try {
            const token = localStorage.getItem('token');
            const annApiBase = process.env.NEXT_PUBLIC_ANNOUNCEMENT_API_URL || '';
            const res = await fetch(`${annApiBase}/api/announcement?level=${encodeURIComponent(userLevel)}&batch=${encodeURIComponent(userBatch)}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Failed to fetch announcements');
            const data = await res.json();
            // Backend returns newest first. Reverse for chat layout (oldest at top).
            setAnnouncements(data.reverse());
        } catch (err) {
            console.error("Error fetching announcements:", err);
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (userLevel && userBatch !== undefined) {
            fetchAnnouncements();
        }
    }, [userLevel, userBatch]);

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
        <div className="flex flex-col h-[calc(100vh-140px)] bg-surface-container-lowest rounded-2xl border border-outline-variant overflow-hidden shadow-sm w-full relative">
            {/* Header */}
            <div className="p-md border-b border-outline-variant bg-surface flex justify-between items-center z-10 shadow-xs">
                <div>
                    <h2 className="text-3xl md:text-4xl font-bold tracking-tight bg-gradient-to-r from-[#6FB7E4] via-[#5D8BCC] to-[#465AA3] text-transparent bg-clip-text">Announcements</h2>
                    <p className="font-body-sm text-on-surface-variant">
                        {isAdmin ? 'Broadcast and manage announcements for the academy.' : 'Important updates from the Admin.'}
                    </p>
                </div>
                <div className="flex items-center gap-2">
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
                                            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity mt-1">
                                                <button 
                                                    onClick={() => {
                                                        setEditingId(annId);
                                                        setEditContent(ann.content);
                                                    }}
                                                    className="text-on-surface-variant hover:text-primary p-1.5 rounded-lg hover:bg-surface-container transition-colors cursor-pointer"
                                                    title="Edit Announcement"
                                                >
                                                    <span className="material-symbols-outlined text-[18px]">edit</span>
                                                </button>
                                                <button 
                                                    onClick={() => setDeletingId(annId)}
                                                    className="text-on-surface-variant hover:text-error p-1.5 rounded-lg hover:bg-error/10 transition-colors cursor-pointer"
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
                                placeholder="Type an announcement to broadcast..."
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
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
                    <div className="bg-surface-container-lowest border border-outline-variant rounded-3xl p-6 shadow-2xl max-w-sm w-full space-y-4 animate-scale-up">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-error/15 text-error flex items-center justify-center">
                                <span className="material-symbols-outlined text-[24px]">delete</span>
                            </div>
                            <div>
                                <h3 className="font-bold text-base text-on-surface">Delete Announcement?</h3>
                                <p className="text-xs text-on-surface-variant">This announcement will be removed for all users.</p>
                            </div>
                        </div>

                        <div className="flex justify-end gap-2.5 pt-2">
                            <button
                                type="button"
                                onClick={() => setDeletingId(null)}
                                disabled={isDeleting}
                                className="px-4 py-2 rounded-xl text-xs font-semibold text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={() => handleDeleteMessage(deletingId)}
                                disabled={isDeleting}
                                className="px-4 py-2 rounded-xl text-xs font-bold bg-error text-white hover:bg-error/90 transition-all shadow-md active:scale-95 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                            >
                                {isDeleting ? (
                                    <>
                                        <span className="material-symbols-outlined animate-spin text-[16px]">progress_activity</span>
                                        <span>Deleting...</span>
                                    </>
                                ) : (
                                    <>
                                        <span className="material-symbols-outlined text-[16px]">delete</span>
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
