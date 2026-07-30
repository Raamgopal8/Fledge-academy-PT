'use client';
import { useState, useEffect, useRef } from 'react';

export default function AnnouncementChat({ role }) {
    const [announcements, setAnnouncements] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [newMessage, setNewMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // For editing
    const [editingId, setEditingId] = useState(null);
    const [editContent, setEditContent] = useState('');
    
    const chatContainerRef = useRef(null);

    const isCEO = role === 'CEO';

    const fetchAnnouncements = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/announcement/`, {
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
        fetchAnnouncements();
    }, []);

    useEffect(() => {
        // Auto scroll to bottom when new messages arrive
        if (chatContainerRef.current && !editingId) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [announcements, isCEO, editingId]);



    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !isCEO) return;
        
        setIsSubmitting(true);
        try {
            const token = localStorage.getItem('token');
            const title = `CEO Update - ${new Date().toLocaleDateString()}`;
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/announcement/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ title, content: newMessage })
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
        if (!editContent.trim() || !isCEO) return;
        
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/announcement/${id}`, {
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
        <div className="flex flex-col h-[calc(100vh-140px)] bg-surface-container-low rounded-2xl border border-outline-variant overflow-hidden shadow-sm max-w-[1000px] mx-auto w-full">
            {/* Header */}
            <div className="p-md border-b border-outline-variant bg-surface flex justify-between items-center z-10 shadow-sm">
                <div>
                    <h2 className="font-headline-md text-headline-md text-on-surface">Announcements</h2>
                    <p className="font-body-sm text-on-surface-variant">
                        {isCEO ? 'Broadcast messages to the academy.' : 'Important updates from the CEO.'}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">campaign</span>
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
                        const date = new Date(ann.created_at);
                        const isOwn = isCEO; // CEO authors all announcements here
                        
                        return (
                            <div key={ann.id} className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} group`}>
                                <div className="flex items-baseline gap-2 mb-1 px-1">
                                    <span className="font-label-sm text-on-surface-variant">{isOwn ? 'You' : 'CEO'}</span>
                                    <span className="text-[10px] text-outline">{date.toLocaleString()}</span>
                                </div>
                                
                                {editingId === ann.id ? (
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
                                                className="px-3 py-1 rounded hover:bg-surface-container-highest text-on-surface-variant font-label-sm"
                                            >
                                                Cancel
                                            </button>
                                            <button 
                                                onClick={() => handleEditMessage(ann.id)}
                                                className="px-3 py-1 rounded bg-primary text-on-primary font-label-sm hover:bg-primary/90"
                                            >
                                                Save
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-start gap-2 max-w-[85%]">
                                        {isOwn && (
                                            <button 
                                                onClick={() => {
                                                    setEditingId(ann.id);
                                                    setEditContent(ann.content);
                                                }}
                                                className="text-on-surface-variant hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-full hover:bg-surface-container mt-1"
                                                title="Edit"
                                            >
                                                <span className="material-symbols-outlined text-[18px]">edit</span>
                                            </button>
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

            {/* Chat Input (CEO Only) */}
            {isCEO && (
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
                            className="w-[52px] h-[52px] rounded-full bg-primary text-on-primary flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 transition-all shadow-md hover:shadow-lg flex-shrink-0 active:scale-95"
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
        </div>
    );
}
