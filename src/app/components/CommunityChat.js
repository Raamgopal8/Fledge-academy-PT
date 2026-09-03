'use client';

import { useState, useEffect, useRef } from 'react';

export default function CommunityChat({ role, overrideBatch }) {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [userName, setUserName] = useState('Anonymous');
    const [userEmail, setUserEmail] = useState('Anonymous');
    const [userRole, setUserRole] = useState(role || 'student');
    const [userLevel, setUserLevel] = useState('');
    const [userBatch, setUserBatch] = useState('');
    const [userProfileImage, setUserProfileImage] = useState('');
    const [avatarMap, setAvatarMap] = useState({});

    // Audio Message Studio States
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [audioUrl, setAudioUrl] = useState(null);
    const [audioBlob, setAudioBlob] = useState(null);
    const [isSendingAudio, setIsSendingAudio] = useState(false);
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const recordingTimerRef = useRef(null);

    // Edit & Delete States
    const [editingMessageId, setEditingMessageId] = useState(null);
    const [editingContent, setEditingContent] = useState('');
    const [isSavingEdit, setIsSavingEdit] = useState(false);
    const [deletingMessageId, setDeletingMessageId] = useState(null);

    const chatScrollRef = useRef(null);

    const formatRole = (r) => {
        const clean = (r || 'student').toLowerCase();
        if (clean === 'ceo' || clean === 'admin') return 'Admin';
        if (clean === 'staff' || clean === 'sensi') return 'Sensi';
        return 'Student';
    };

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const email = localStorage.getItem('userEmail') || localStorage.getItem('email') || 'Anonymous';
            setUserEmail(email);
            const name = localStorage.getItem('userName') || email?.split('@')[0] || 'Anonymous';
            setUserName(name);
            const profileImg = localStorage.getItem('userProfileImage') || '';
            setUserProfileImage(profileImg);
            const level = localStorage.getItem('level') || 'Level 5';
            const batch = overrideBatch !== undefined ? overrideBatch : (localStorage.getItem('batch') || '');
            setUserBatch(batch);
            setUserLevel(level);

            const storedRole = localStorage.getItem('role') || role || 'student';
            setUserRole(storedRole.toLowerCase());

            const token = localStorage.getItem('token');
            if (token) {
                fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/user/profile`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                })
                .then(res => res.ok ? res.json() : null)
                .then(data => {
                    if (data) {
                        if (data.profile_image_url) {
                            setUserProfileImage(data.profile_image_url);
                            localStorage.setItem('userProfileImage', data.profile_image_url);
                        }
                        if (data.name) {
                            setUserName(data.name);
                            localStorage.setItem('userName', data.name);
                        }
                    }
                })
                .catch(err => console.error("Error fetching user profile:", err));

                fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/user/classroom/members`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                })
                .then(res => res.ok ? res.json() : null)
                .then(members => {
                    if (Array.isArray(members)) {
                        const map = {};
                        members.forEach(m => {
                            if (m.profile_image_url) {
                                if (m.email) map[m.email] = m.profile_image_url;
                                if (m.name) map[m.name] = m.profile_image_url;
                                if (m.id) map[m.id] = m.profile_image_url;
                            }
                        });
                        setAvatarMap(map);
                    }
                })
                .catch(err => console.error("Error fetching members:", err));
            }
        }
    }, [overrideBatch, role]);

    const fetchMessages = async () => {
        try {
            const currentLevel = userLevel || (typeof window !== 'undefined' ? (localStorage.getItem('level') || 'Level 5') : 'Level 5');
            const currentBatch = userBatch !== undefined && userBatch !== '' 
                ? userBatch 
                : (overrideBatch !== undefined ? overrideBatch : (typeof window !== 'undefined' ? (localStorage.getItem('batch') || '') : ''));
            const communityApiBase = process.env.NEXT_PUBLIC_COMMUNITY_API_URL || '';
            const res = await fetch(`${communityApiBase}/api/community/messages?level=${encodeURIComponent(currentLevel)}&batch=${encodeURIComponent(currentBatch)}&t=${Date.now()}`);
            if (res.ok) {
                const data = await res.json();
                setMessages(data);
            }
        } catch (error) {
            console.error("Failed to fetch messages:", error);
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    };

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await fetchMessages();
    };

    useEffect(() => {
        if (userLevel && userBatch !== undefined) {
            fetchMessages();
            const interval = setInterval(fetchMessages, 4000);
            return () => clearInterval(interval);
        }
    }, [userLevel, userBatch]);

    // 1. Send Text Message
    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        const contentToSend = newMessage.trim();
        setNewMessage('');

        try {
            const effectiveRole = role || formatRole(userRole);
            const msgData = {
                content: contentToSend,
                author_id: userEmail,
                author_name: userName,
                author_image: userProfileImage || localStorage.getItem('userProfileImage') || '',
                role: formatRole(effectiveRole),
                level: userLevel,
                ...(userBatch ? { batch: userBatch } : {})
            };

            const communityApiBase = process.env.NEXT_PUBLIC_COMMUNITY_API_URL || '';
            const res = await fetch(`${communityApiBase}/api/community/messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(msgData)
            });

            if (res.ok) {
                fetchMessages();
            }
        } catch (error) {
            console.error("Failed to send message:", error);
        }
    };

    // 2. Audio Message Studio: Recording
    const startRecording = async () => {
        audioChunksRef.current = [];
        setRecordingTime(0);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = () => {
                const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                const url = URL.createObjectURL(blob);
                setAudioBlob(blob);
                setAudioUrl(url);

                if (recordingTimerRef.current) {
                    clearInterval(recordingTimerRef.current);
                }
                stream.getTracks().forEach((track) => track.stop());
            };

            mediaRecorder.start(100);
            setIsRecording(true);

            recordingTimerRef.current = setInterval(() => {
                setRecordingTime(prev => prev + 1);
            }, 1000);
        } catch (error) {
            console.error("Error accessing microphone:", error);
            alert("Microphone access denied or unsupported by your browser.");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            if (recordingTimerRef.current) {
                clearInterval(recordingTimerRef.current);
            }
        }
    };

    const resetRecorder = () => {
        if (audioUrl) {
            URL.revokeObjectURL(audioUrl);
        }
        setAudioUrl(null);
        setAudioBlob(null);
        setRecordingTime(0);
    };

    // 3. Audio Message Studio: Upload
    const sendAudioMessage = async () => {
        if (!audioBlob) return;

        setIsSendingAudio(true);
        try {
            const effectiveRole = role || formatRole(userRole);
            const formData = new FormData();
            formData.append('audio', audioBlob, 'voice-message.webm');
            formData.append('audio_file', audioBlob, 'voice-message.webm');
            formData.append('author_id', userEmail);
            formData.append('author_name', userName);
            formData.append('author_image', userProfileImage || localStorage.getItem('userProfileImage') || '');
            formData.append('role', formatRole(effectiveRole));
            formData.append('level', userLevel);
            if (userBatch) formData.append('batch', userBatch);

            const communityApiBase = process.env.NEXT_PUBLIC_COMMUNITY_API_URL || '';
            const res = await fetch(`${communityApiBase}/api/community/messages/audio`, {
                method: 'POST',
                body: formData
            });

            if (res.ok) {
                resetRecorder();
                fetchMessages();
            } else {
                throw new Error("Failed to send audio message");
            }
        } catch (error) {
            console.error("Upload error:", error);
            alert("Failed to send audio message.");
        } finally {
            setIsSendingAudio(false);
        }
    };

    // 4. Edit Message
    const startEditing = (msg) => {
        setEditingMessageId(msg._id || msg.id);
        setEditingContent(msg.content || '');
    };

    const cancelEditing = () => {
        setEditingMessageId(null);
        setEditingContent('');
    };

    const saveEditedMessage = async (messageId) => {
        if (!editingContent.trim()) return;
        setIsSavingEdit(true);
        try {
            const communityApiBase = process.env.NEXT_PUBLIC_COMMUNITY_API_URL || '';
            const res = await fetch(`${communityApiBase}/api/community/messages/${messageId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: editingContent.trim() })
            });

            if (res.ok) {
                setEditingMessageId(null);
                setEditingContent('');
                fetchMessages();
            } else {
                alert("Failed to update message.");
            }
        } catch (err) {
            console.error("Error updating message:", err);
            alert("An error occurred while updating message.");
        } finally {
            setIsSavingEdit(false);
        }
    };

    // 5. Delete Message
    const handleDeleteMessage = async (messageId) => {
        if (!window.confirm("Are you sure you want to delete this message?")) return;
        setDeletingMessageId(messageId);
        try {
            const communityApiBase = process.env.NEXT_PUBLIC_COMMUNITY_API_URL || '';
            const res = await fetch(`${communityApiBase}/api/community/messages/${messageId}`, {
                method: 'DELETE'
            });

            if (res.ok) {
                setMessages(prev => prev.filter(m => (m._id !== messageId && m.id !== messageId)));
            } else {
                alert("Failed to delete message.");
            }
        } catch (err) {
            console.error("Error deleting message:", err);
            alert("An error occurred while deleting message.");
        } finally {
            setDeletingMessageId(null);
        }
    };

    const formatTimer = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    return (
        <div className="flex flex-col h-full flex-1 min-h-0 bg-surface-container-lowest dark:bg-slate-950 rounded-3xl border border-outline-variant/80 overflow-hidden shadow-elevation-2 w-full">
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-outline-variant/60 bg-surface-container-low dark:bg-slate-900 flex justify-between items-center z-10 shadow-xs">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-primary to-blue-500 text-on-primary flex items-center justify-center font-bold shadow-xs">
                        <span className="material-symbols-outlined text-[24px]">forum</span>
                    </div>
                    <div>
                        <h2 className="text-xl sm:text-2xl font-bold tracking-tight bg-gradient-to-r from-[#6FB7E4] via-[#5D8BCC] to-[#465AA3] text-transparent bg-clip-text">
                            Community Discussion
                        </h2>
                        <p className="font-body-xs text-on-surface-variant">
                            Live discussion and collaboration with peers
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={handleRefresh}
                        disabled={isRefreshing}
                        className="w-9 h-9 rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface-variant flex items-center justify-center transition-all cursor-pointer active:scale-95 disabled:opacity-75"
                        title="Refresh Messages"
                    >
                        <span className={`material-symbols-outlined text-[18px] ${isRefreshing ? 'animate-spin text-primary' : ''}`}>
                            sync
                        </span>
                    </button>
                </div>
            </div>

            {/* Chat Scroll Area */}
            <div 
                ref={chatScrollRef}
                className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4 custom-scrollbar bg-surface/50 dark:bg-slate-950/60"
            >
                {isLoading && (
                    <div className="flex flex-col items-center justify-center py-20 text-on-surface-variant gap-2">
                        <span className="material-symbols-outlined text-4xl text-primary animate-spin">progress_activity</span>
                        <p className="font-body-sm font-semibold">Loading community discussion...</p>
                    </div>
                )}

                {!isLoading && messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-24 text-on-surface-variant text-center">
                        <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center mb-3 text-outline">
                            <span className="material-symbols-outlined text-3xl">chat_bubble_outline</span>
                        </div>
                        <h4 className="font-bold text-sm text-on-surface">No messages yet</h4>
                        <p className="text-xs text-outline mt-1 max-w-[280px]">
                            Start the conversation by sending a text or voice message to your batch peers.
                        </p>
                    </div>
                )}

                {messages.map((msg) => {
                    const msgId = msg._id || msg.id;
                    const isYou = msg.author_id === userEmail;
                    const canManage = isYou || userRole === 'ceo' || userRole === 'admin';
                    const isCurrentlyEditing = editingMessageId === msgId;
                    const isCurrentlyDeleting = deletingMessageId === msgId;

                    const time = msg.created_at ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
                    const avatarUrl = msg.author_image || (isYou ? userProfileImage : (avatarMap[msg.author_id] || avatarMap[msg.author_name] || null));
                    const initial = (msg.author_name && msg.author_name !== 'Anonymous')
                        ? msg.author_name.charAt(0).toUpperCase()
                        : (msg.author_id && msg.author_id !== 'Anonymous' ? msg.author_id.charAt(0).toUpperCase() : 'U');

                    const displayRole = formatRole(msg.role);

                    return (
                        <div 
                            key={msgId} 
                            className={`group relative flex gap-2 sm:gap-3 max-w-[94%] sm:max-w-[80%] ${isYou ? 'ml-auto flex-row-reverse' : 'mr-auto flex-row'}`}
                        >
                            {/* Avatar */}
                            <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full overflow-hidden shrink-0 flex items-center justify-center text-xs font-bold shadow-xs mt-0.5 ${
                                isYou 
                                    ? 'bg-primary/20 text-primary border border-primary/30' 
                                    : 'bg-surface-container-highest text-on-surface-variant border border-outline-variant/60'
                            }`}>
                                {avatarUrl ? (
                                    <img 
                                        src={avatarUrl} 
                                        alt={isYou ? 'You' : (msg.author_name || 'User')} 
                                        className="w-full h-full object-cover" 
                                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                    />
                                ) : (
                                    <span>{initial}</span>
                                )}
                            </div>

                            {/* Message Container */}
                            <div className={`flex flex-col ${isYou ? 'items-end' : 'items-start'} flex-1 min-w-0 max-w-full`}>
                                {/* Header / Sender Info */}
                                <div className="flex items-center gap-1.5 sm:gap-2 mb-1 px-1 flex-wrap">
                                    <span className="font-label-sm font-bold text-on-surface text-xs truncate">
                                        {isYou ? 'You' : msg.author_name}
                                    </span>
                                    <span className={`text-[9px] sm:text-[10px] font-semibold px-1.5 sm:px-2 py-0.2 sm:py-0.5 rounded-full uppercase ${
                                        displayRole === 'Admin' 
                                            ? 'bg-purple-100 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/40' 
                                            : (displayRole === 'Sensi' 
                                                ? 'bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/40' 
                                                : 'bg-surface-container-high text-on-surface-variant')
                                    }`}>
                                        {displayRole}
                                    </span>
                                    <span className="text-[10px] text-outline shrink-0">{time}</span>
                                    {msg.is_edited && (
                                        <span className="text-[10px] italic text-on-surface-variant/70 font-medium">
                                            (edited)
                                        </span>
                                    )}
                                </div>

                                {/* Message Content / Edit Mode */}
                                {isCurrentlyEditing ? (
                                    <div className="w-full min-w-[240px] sm:min-w-[260px] bg-surface-container-lowest dark:bg-slate-900 p-3 rounded-2xl border border-primary/40 shadow-lg space-y-2">
                                        <textarea
                                            value={editingContent}
                                            onChange={(e) => setEditingContent(e.target.value)}
                                            rows={2}
                                            className="w-full bg-surface-container-low dark:bg-slate-800 p-2.5 rounded-xl text-xs sm:text-sm text-on-surface outline-none border border-outline-variant focus:border-primary resize-none custom-scrollbar"
                                            placeholder="Edit your message..."
                                            autoFocus
                                        />
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                type="button"
                                                onClick={cancelEditing}
                                                disabled={isSavingEdit}
                                                className="px-3 py-1 rounded-lg text-xs font-semibold text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => saveEditedMessage(msgId)}
                                                disabled={isSavingEdit || !editingContent.trim()}
                                                className="px-3.5 py-1 rounded-lg text-xs font-bold bg-primary text-on-primary hover:bg-primary/90 shadow-xs transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1"
                                            >
                                                {isSavingEdit ? (
                                                    <>
                                                        <span className="material-symbols-outlined text-[14px] animate-spin">sync</span>
                                                        <span>Saving...</span>
                                                    </>
                                                ) : (
                                                    <span>Save</span>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className={`relative px-3 sm:px-4 py-2 sm:py-2.5 rounded-2xl sm:rounded-3xl font-body-md shadow-xs break-words leading-relaxed max-w-full ${
                                        isYou 
                                            ? 'bg-primary text-on-primary rounded-tr-xs' 
                                            : 'bg-surface-container-high dark:bg-slate-900 text-on-surface rounded-tl-xs border border-outline-variant/40'
                                    }`}>
                                        {msg.audio_url ? (
                                            <div className="flex flex-col gap-1 py-0.5 max-w-full">
                                                <div className="flex items-center gap-1.5 text-[11px] sm:text-xs font-bold opacity-90">
                                                    <span className="material-symbols-outlined text-[15px] sm:text-[18px]">graphic_eq</span>
                                                    <span>Voice Message</span>
                                                </div>
                                                <div className="w-full max-w-[190px] xs:max-w-[210px] sm:max-w-[260px]">
                                                    <audio 
                                                        controls 
                                                        src={msg.audio_url} 
                                                        className="w-full h-8 custom-audio-player rounded-lg" 
                                                    />
                                                </div>
                                            </div>
                                        ) : (
                                            <span className="text-xs sm:text-sm whitespace-pre-wrap">{msg.content}</span>
                                        )}
                                    </div>
                                )}

                                {/* Hover Action Toolbar (Edit / Delete) */}
                                {canManage && !isCurrentlyEditing && (
                                    <div className={`flex items-center gap-1 mt-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity ${isYou ? 'justify-end' : 'justify-start'}`}>
                                        {!msg.audio_url && (
                                            <button
                                                type="button"
                                                onClick={() => startEditing(msg)}
                                                className="p-1.5 sm:p-1 rounded-lg text-on-surface-variant hover:text-primary hover:bg-surface-container transition-colors cursor-pointer active:scale-95"
                                                title="Edit message"
                                            >
                                                <span className="material-symbols-outlined text-[16px] sm:text-[15px]">edit</span>
                                            </button>
                                        )}
                                        <button
                                            type="button"
                                            onClick={() => handleDeleteMessage(msgId)}
                                            disabled={isCurrentlyDeleting}
                                            className="p-1.5 sm:p-1 rounded-lg text-on-surface-variant hover:text-error hover:bg-surface-container transition-colors cursor-pointer active:scale-95"
                                            title="Delete message"
                                        >
                                            <span className="material-symbols-outlined text-[16px] sm:text-[15px]">
                                                {isCurrentlyDeleting ? 'sync' : 'delete'}
                                            </span>
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Audio Message Studio Preview Card (if audio is recorded and ready to send) */}
            {audioUrl && (
                <div className="p-3 sm:p-4 bg-surface-container-low dark:bg-slate-900 border-t border-outline-variant/80 flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-emerald-500/15 text-emerald-600 flex items-center justify-center">
                                <span className="material-symbols-outlined text-[18px]">mic</span>
                            </div>
                            <div>
                                <h4 className="text-xs font-bold text-on-surface">Audio Message Studio</h4>
                                <p className="text-[10px] text-on-surface-variant">Preview your voice note before sending</p>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={resetRecorder}
                            className="text-on-surface-variant hover:text-error p-1 rounded-full hover:bg-surface-container transition-colors cursor-pointer"
                            title="Discard Recording"
                        >
                            <span className="material-symbols-outlined text-[18px]">close</span>
                        </button>
                    </div>

                    <div className="flex items-center gap-3">
                        <audio src={audioUrl} controls className="flex-1 h-10 rounded-xl" />
                        
                        <div className="flex items-center gap-2 shrink-0">
                            <button
                                type="button"
                                onClick={sendAudioMessage}
                                disabled={isSendingAudio}
                                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                            >
                                <span className={`material-symbols-outlined text-[16px] ${isSendingAudio ? 'animate-spin' : ''}`}>
                                    {isSendingAudio ? 'sync' : 'send'}
                                </span>
                                <span>{isSendingAudio ? 'Sending...' : 'Send Message'}</span>
                            </button>
                            <button
                                type="button"
                                onClick={resetRecorder}
                                disabled={isSendingAudio}
                                className="px-3 py-2 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-semibold text-xs transition-all flex items-center gap-1 cursor-pointer"
                            >
                                <span className="material-symbols-outlined text-[16px]">delete</span>
                                <span>Discard</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Recording Active Bar */}
            {isRecording && (
                <div className="p-3 bg-error/10 border-t border-error/30 flex items-center justify-between animate-pulse">
                    <div className="flex items-center gap-3">
                        <span className="w-3 h-3 rounded-full bg-error animate-ping"></span>
                        <span className="text-xs font-bold text-error">Recording voice message... ({formatTimer(recordingTime)})</span>
                    </div>
                    <button
                        type="button"
                        onClick={stopRecording}
                        className="px-4 py-1.5 rounded-xl bg-error text-white text-xs font-bold hover:bg-error/90 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                        <span className="material-symbols-outlined text-[16px]">stop</span>
                        <span>Stop Recording</span>
                    </button>
                </div>
            )}

            {/* Main Chat Input Bar */}
            {!audioUrl && !isRecording && (
                <div className="p-3 sm:p-4 bg-surface-container-low dark:bg-slate-900 border-t border-outline-variant/80">
                    <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                        <button 
                            type="button"
                            onClick={startRecording}
                            className="w-10 h-10 rounded-2xl flex items-center justify-center transition-all bg-surface-container-high hover:bg-primary hover:text-white text-on-surface-variant cursor-pointer active:scale-95 shadow-xs shrink-0"
                            title="Record Voice Note"
                        >
                            <span className="material-symbols-outlined text-[20px]">mic</span>
                        </button>
                        <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Type a message"
                            className="flex-1 bg-surface-container-lowest dark:bg-slate-950 rounded-2xl px-4 py-2.5 border border-outline-variant focus:outline-none focus:border-primary font-body-md text-on-surface text-xs sm:text-sm transition-all shadow-xs"
                        />
                        <button 
                            type="submit"
                            disabled={!newMessage.trim()}
                            className="w-10 h-10 rounded-2xl bg-primary text-on-primary flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed hover:bg-primary/90 transition-all active:scale-95 shadow-xs shrink-0 cursor-pointer"
                            title="Send Message"
                        >
                            <span className="material-symbols-outlined text-[20px]">send</span>
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
}
