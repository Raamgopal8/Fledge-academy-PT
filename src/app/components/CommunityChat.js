'use client';

import { useState, useEffect, useRef } from 'react';

export default function CommunityChat({ role, overrideBatch }) {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [userName, setUserName] = useState('Anonymous');
    const [userEmail, setUserEmail] = useState('Anonymous');
    const [isRecording, setIsRecording] = useState(false);
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);

    const [userLevel, setUserLevel] = useState('Level 5');
    const [userBatch, setUserBatch] = useState('');

    const [userProfileImage, setUserProfileImage] = useState('');
    const [avatarMap, setAvatarMap] = useState({});

    useEffect(() => {
        // Run only on client side
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

            // Fetch profile directly to get latest icon
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

                // Fetch classroom members for avatar lookup
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
    }, [overrideBatch]);

    const fetchMessages = async () => {
        try {
            const communityApiBase = process.env.NEXT_PUBLIC_COMMUNITY_API_URL || '';
            const res = await fetch(`${communityApiBase}/api/community/messages?level=${encodeURIComponent(userLevel)}&batch=${encodeURIComponent(userBatch)}`);
            if (res.ok) {
                const data = await res.json();
                setMessages(data);
            }
        } catch (error) {
            console.error("Failed to fetch messages:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (userLevel && userBatch !== undefined) {
            fetchMessages();
            const interval = setInterval(fetchMessages, 5000); // Poll every 5 seconds
            return () => clearInterval(interval);
        }
    }, [userLevel, userBatch]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;
        
        try {
            const msgData = {
                content: newMessage,
                author_id: userEmail,
                author_name: userName,
                author_image: userProfileImage || localStorage.getItem('userProfileImage') || '',
                role: role || 'user',
                level: userLevel,
                ...(userBatch ? { batch: userBatch } : {})
            };
            
            setNewMessage('');
            
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

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(stream);
            audioChunksRef.current = [];

            mediaRecorderRef.current.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    audioChunksRef.current.push(e.data);
                }
            };

            mediaRecorderRef.current.onstop = async () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                await handleSendAudio(audioBlob);
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorderRef.current.start();
            setIsRecording(true);
        } catch (error) {
            console.error("Error accessing microphone:", error);
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };

    const handleSendAudio = async (audioBlob) => {
        try {
            const formData = new FormData();
            formData.append('audio_file', audioBlob, 'audio.webm');
            formData.append('author_id', userEmail);
            formData.append('author_name', userName);
            formData.append('author_image', userProfileImage || localStorage.getItem('userProfileImage') || '');
            formData.append('role', role || 'user');
            formData.append('level', userLevel);
            if (userBatch) formData.append('batch', userBatch);

            const communityApiBase = process.env.NEXT_PUBLIC_COMMUNITY_API_URL || '';
            const res = await fetch(`${communityApiBase}/api/community/messages/audio`, {
                method: 'POST',
                body: formData
            });

            if (res.ok) {
                fetchMessages();
            }
        } catch (error) {
            console.error("Failed to send audio message:", error);
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-140px)] bg-surface-container-lowest rounded-2xl border border-outline-variant overflow-hidden shadow-sm w-full">
            {/* Header */}
            <div className="p-md border-b border-outline-variant bg-surface flex justify-between items-center z-10 shadow-xs">
                <div>
                    <h2 className="text-3xl md:text-4xl font-bold tracking-tight bg-gradient-to-r from-[#6FB7E4] via-[#5D8BCC] to-[#465AA3] text-transparent bg-clip-text">Community Chat</h2>
                    <p className="font-body-sm text-on-surface-variant">Live discussion and collaboration with peers</p>
                </div>
                <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-3xl">forum</span>
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col bg-surface overflow-hidden">
                <div className="flex-1 p-md overflow-y-auto space-y-md custom-scrollbar">
                    {isLoading && <div className="text-center text-on-surface-variant py-4 font-body-md">Loading messages...</div>}
                    {!isLoading && messages.length === 0 && (
                        <div className="text-center text-on-surface-variant py-4 font-body-md">No messages yet. Be the first to say hello!</div>
                    )}
                    {messages.map((msg) => {
                        const isYou = msg.author_id === userEmail;
                        const time = new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                        const avatarUrl = msg.author_image || (isYou ? userProfileImage : (avatarMap[msg.author_id] || avatarMap[msg.author_name] || null));
                        const initial = (msg.author_name && msg.author_name !== 'Anonymous') 
                            ? msg.author_name.charAt(0).toUpperCase() 
                            : (msg.author_id && msg.author_id !== 'Anonymous' ? msg.author_id.charAt(0).toUpperCase() : 'U');

                        return (
                            <div key={msg._id} className={`flex gap-3 max-w-[85%] ${isYou ? 'ml-auto flex-row-reverse' : 'mr-auto flex-row'}`}>
                                {/* Avatar Icon */}
                                <div className={`w-9 h-9 rounded-full overflow-hidden shrink-0 flex items-center justify-center text-xs font-bold shadow-sm mt-0.5 ${
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

                                {/* Message Content */}
                                <div className={`flex flex-col ${isYou ? 'items-end' : 'items-start'} flex-1 min-w-0`}>
                                    <div className="flex items-baseline gap-2 mb-1">
                                        <span className="font-label-sm font-semibold text-on-surface truncate">
                                            {isYou ? 'You' : msg.author_name} <span className="font-normal text-xs text-on-surface-variant/80">({msg.role})</span>
                                        </span>
                                        <span className="text-[10px] text-outline shrink-0">{time}</span>
                                    </div>
                                    <div className={`px-4 py-2.5 rounded-2xl font-body-md shadow-sm break-words ${
                                        isYou 
                                            ? 'bg-primary text-on-primary rounded-tr-xs' 
                                            : 'bg-surface-container-high text-on-surface rounded-tl-xs'
                                    }`}>
                                        {msg.audio_url ? (
                                            <audio controls src={msg.audio_url} className="max-w-[250px] h-10" />
                                        ) : (
                                            msg.content
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Chat Input */}
                <div className="p-sm bg-surface-container-low border-t border-outline-variant">
                    <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                        <button 
                            type="button"
                            onClick={isRecording ? stopRecording : startRecording}
                            className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                                isRecording ? 'bg-error text-on-error animate-pulse' : 'bg-surface-container-high text-on-surface hover:bg-surface-container-highest'
                            }`}
                        >
                            <span className="material-symbols-outlined text-[20px]">{isRecording ? 'stop' : 'mic'}</span>
                        </button>
                        <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder={isRecording ? "Recording audio..." : "Type a message..."}
                            disabled={isRecording}
                            className="flex-1 bg-surface rounded-full px-4 py-2 border border-outline-variant focus:outline-none focus:border-primary font-body-md text-on-surface disabled:opacity-50"
                        />
                        <button 
                            type="submit"
                            disabled={!newMessage.trim() || isRecording}
                            className="w-10 h-10 rounded-full bg-primary text-on-primary flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors"
                        >
                            <span className="material-symbols-outlined text-[20px]">send</span>
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
