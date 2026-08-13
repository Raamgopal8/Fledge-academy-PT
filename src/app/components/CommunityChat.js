'use client';

import { useState, useEffect, useRef } from 'react';

export default function CommunityChat({ role }) {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [userEmail, setUserEmail] = useState('Anonymous');
    const [isRecording, setIsRecording] = useState(false);
    const messagesEndRef = useRef(null);
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);

    useEffect(() => {
        // Run only on client side
        if (typeof window !== 'undefined') {
            const email = localStorage.getItem('userEmail') || localStorage.getItem('email') || 'Anonymous';
            setUserEmail(email);
        }
    }, []);

    const fetchMessages = async () => {
        try {
            const res = await fetch('http://localhost:8009/api/community/messages');
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
        fetchMessages();
        const interval = setInterval(fetchMessages, 5000); // Poll every 5 seconds
        return () => clearInterval(interval);
    }, []);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;
        
        try {
            const msgData = {
                content: newMessage,
                author_id: userEmail,
                author_name: userEmail !== 'Anonymous' ? userEmail.split('@')[0] : 'Anonymous',
                role: role || 'user'
            };
            
            setNewMessage('');
            
            const res = await fetch('http://localhost:8009/api/community/messages', {
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
            formData.append('author_name', userEmail !== 'Anonymous' ? userEmail.split('@')[0] : 'Anonymous');
            formData.append('role', role || 'user');

            const res = await fetch('http://localhost:8009/api/community/messages/audio', {
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
        <div className="flex flex-col h-[calc(100vh-120px)] bg-surface-container-low rounded-2xl border border-outline-variant overflow-hidden shadow-sm">
            {/* Header */}
            <div className="p-md border-b border-outline-variant bg-surface flex justify-between items-center">
                <div>
                    <h2 className="text-3xl md:text-4xl font-bold tracking-tight bg-gradient-to-r from-[#6FB7E4] via-[#5D8BCC] to-[#465AA3] text-transparent bg-clip-text">Community Chat</h2>
                    <p className="font-body-sm text-on-surface-variant">Live discussion and collaboration</p>
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
                        return (
                            <div key={msg._id} className={`flex flex-col ${isYou ? 'items-end' : 'items-start'}`}>
                                <div className="flex items-baseline gap-2 mb-1">
                                    <span className="font-label-sm text-on-surface">{isYou ? 'You' : msg.author_name} ({msg.role})</span>
                                    <span className="text-[10px] text-outline">{time}</span>
                                </div>
                                <div className={`px-4 py-2 rounded-2xl max-w-[85%] font-body-md ${
                                    isYou 
                                        ? 'bg-primary text-on-primary rounded-tr-sm' 
                                        : 'bg-surface-container-high text-on-surface rounded-tl-sm'
                                }`}>
                                    {msg.audio_url ? (
                                        <audio controls src={msg.audio_url} className="max-w-[250px] h-10" />
                                    ) : (
                                        msg.content
                                    )}
                                </div>
                            </div>
                        );
                    })}
                    <div ref={messagesEndRef} />
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
