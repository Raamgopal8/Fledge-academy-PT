'use client';

import { useState, useRef, useEffect } from 'react';

export default function CommunityChat({ role }) {
    const [messages, setMessages] = useState([
        { id: 1, user: 'System', text: `Welcome to the ${role} Community Chat!`, time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) },
    ]);
    const [newMessage, setNewMessage] = useState('');
    const [isAudioEnabled, setIsAudioEnabled] = useState(false);
    const [isVideoEnabled, setIsVideoEnabled] = useState(false);
    const [isScreenSharing, setIsScreenSharing] = useState(false);
    const [mediaError, setMediaError] = useState(null);
    const [permissionStatus, setPermissionStatus] = useState('idle'); // idle, requesting, granted, denied

    const videoRef = useRef(null);
    const screenRef = useRef(null);
    const localStreamRef = useRef(null);
    const screenStreamRef = useRef(null);

    // Cleanup streams on unmount
    useEffect(() => {
        return () => {
            if (localStreamRef.current) {
                localStreamRef.current.getTracks().forEach(track => track.stop());
            }
            if (screenStreamRef.current) {
                screenStreamRef.current.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    const requestMediaPermissions = async (type) => {
        setMediaError(null);
        setPermissionStatus('requesting');
        try {
            if (type === 'camera') {
                const stream = await navigator.mediaDevices.getUserMedia({ 
                    video: true, 
                    audio: true 
                });
                localStreamRef.current = stream;
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                }
                setIsVideoEnabled(true);
                setIsAudioEnabled(true);
                setPermissionStatus('granted');
            } else if (type === 'screen') {
                const stream = await navigator.mediaDevices.getDisplayMedia({
                    video: true
                });
                screenStreamRef.current = stream;
                if (screenRef.current) {
                    screenRef.current.srcObject = stream;
                }
                setIsScreenSharing(true);
                setPermissionStatus('granted');

                // Handle screen share stop from browser UI
                stream.getVideoTracks()[0].onended = () => {
                    stopScreenShare();
                };
            }
        } catch (err) {
            console.error("Error accessing media devices.", err);
            setPermissionStatus('denied');
            if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                setMediaError('Permission denied. Please allow access to your camera/microphone or screen.');
            } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
                setMediaError('No camera/microphone found on this device.');
            } else {
                setMediaError('Could not access media devices. Ensure you are on a secure context (HTTPS/localhost).');
            }
        }
    };

    const stopMedia = () => {
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track => track.stop());
            localStreamRef.current = null;
            if (videoRef.current) videoRef.current.srcObject = null;
        }
        setIsVideoEnabled(false);
        setIsAudioEnabled(false);
        setPermissionStatus('idle');
    };

    const stopScreenShare = () => {
        if (screenStreamRef.current) {
            screenStreamRef.current.getTracks().forEach(track => track.stop());
            screenStreamRef.current = null;
            if (screenRef.current) screenRef.current.srcObject = null;
        }
        setIsScreenSharing(false);
    };

    const toggleAudio = () => {
        if (!localStreamRef.current) return;
        const audioTrack = localStreamRef.current.getAudioTracks()[0];
        if (audioTrack) {
            audioTrack.enabled = !audioTrack.enabled;
            setIsAudioEnabled(audioTrack.enabled);
        }
    };

    const toggleVideo = () => {
        if (!localStreamRef.current) return;
        const videoTrack = localStreamRef.current.getVideoTracks()[0];
        if (videoTrack) {
            videoTrack.enabled = !videoTrack.enabled;
            setIsVideoEnabled(videoTrack.enabled);
        }
    };

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;
        
        setMessages([...messages, {
            id: Date.now(),
            user: 'You',
            text: newMessage,
            time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
        }]);
        setNewMessage('');
    };

    return (
        <div className="flex flex-col h-[calc(100vh-120px)] bg-surface-container-low rounded-2xl border border-outline-variant overflow-hidden shadow-sm">
            
            {/* Header */}
            <div className="p-md border-b border-outline-variant bg-surface flex justify-between items-center">
                <div>
                    <h2 className="font-headline-md text-headline-md text-on-surface">Community Chat</h2>
                    <p className="font-body-sm text-on-surface-variant">Live discussion and collaboration</p>
                </div>
                <div className="flex items-center gap-sm">
                    {/* Media Controls */}
                    {permissionStatus === 'granted' && (isVideoEnabled || isAudioEnabled) ? (
                        <>
                            <button 
                                onClick={toggleAudio}
                                className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${isAudioEnabled ? 'bg-primary-container text-primary' : 'bg-error-container text-error'}`}
                                title={isAudioEnabled ? "Mute" : "Unmute"}
                            >
                                <span className="material-symbols-outlined">{isAudioEnabled ? 'mic' : 'mic_off'}</span>
                            </button>
                            <button 
                                onClick={toggleVideo}
                                className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${isVideoEnabled ? 'bg-primary-container text-primary' : 'bg-error-container text-error'}`}
                                title={isVideoEnabled ? "Turn off camera" : "Turn on camera"}
                            >
                                <span className="material-symbols-outlined">{isVideoEnabled ? 'videocam' : 'videocam_off'}</span>
                            </button>
                            <button 
                                onClick={stopMedia}
                                className="w-10 h-10 rounded-full bg-error text-on-error flex items-center justify-center transition-transform hover:scale-105"
                                title="Leave Call"
                            >
                                <span className="material-symbols-outlined">call_end</span>
                            </button>
                        </>
                    ) : (
                        <button 
                            onClick={() => requestMediaPermissions('camera')}
                            className="flex items-center gap-xs px-4 py-2 bg-primary text-on-primary rounded-lg font-label-md hover:bg-primary/90 transition-colors"
                            disabled={permissionStatus === 'requesting'}
                        >
                            <span className="material-symbols-outlined text-[18px]">videocam</span>
                            {permissionStatus === 'requesting' ? 'Requesting...' : 'Join Video/Audio'}
                        </button>
                    )}

                    {!isScreenSharing ? (
                        <button 
                            onClick={() => requestMediaPermissions('screen')}
                            className="flex items-center gap-xs px-4 py-2 border border-primary text-primary rounded-lg font-label-md hover:bg-primary-container transition-colors"
                        >
                            <span className="material-symbols-outlined text-[18px]">screen_share</span>
                            Share Screen
                        </button>
                    ) : (
                        <button 
                            onClick={stopScreenShare}
                            className="flex items-center gap-xs px-4 py-2 bg-error text-on-error rounded-lg font-label-md hover:opacity-90 transition-colors"
                        >
                            <span className="material-symbols-outlined text-[18px]">stop_screen_share</span>
                            Stop Sharing
                        </button>
                    )}
                </div>
            </div>

            {/* Error Message */}
            {mediaError && (
                <div className="mx-md mt-md p-sm bg-error-container text-on-error-container rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-sm">
                        <span className="material-symbols-outlined">error</span>
                        <span className="font-body-sm">{mediaError}</span>
                    </div>
                    <button onClick={() => setMediaError(null)} className="material-symbols-outlined text-[18px]">close</button>
                </div>
            )}

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                
                {/* Media Area (Video / Screen Share) */}
                <div className={`flex flex-col bg-black transition-all duration-300 ${(isVideoEnabled || isAudioEnabled || isScreenSharing) ? 'md:w-2/3 p-md border-r border-outline-variant' : 'w-0 overflow-hidden'}`}>
                    <div className="flex-1 rounded-xl overflow-hidden relative bg-surface-container-highest flex items-center justify-center">
                        {isScreenSharing && (
                            <div className="absolute inset-0 z-10 w-full h-full flex flex-col">
                                <video 
                                    ref={screenRef} 
                                    autoPlay 
                                    playsInline 
                                    className="w-full h-full object-contain bg-black"
                                />
                                <div className="absolute bottom-4 left-4 bg-black/60 px-3 py-1 rounded-full text-white font-label-sm backdrop-blur-md flex items-center gap-xs">
                                    <span className="material-symbols-outlined text-[16px]">screen_share</span> You are sharing your screen
                                </div>
                            </div>
                        )}
                        
                        {(isVideoEnabled || isAudioEnabled) && (
                            <div className={`absolute z-20 ${isScreenSharing ? 'bottom-4 right-4 w-48 h-36 rounded-xl border-2 border-outline shadow-xl' : 'inset-0 w-full h-full'} overflow-hidden bg-black transition-all duration-300`}>
                                <video 
                                    ref={videoRef} 
                                    autoPlay 
                                    playsInline 
                                    muted // Always mute local video to prevent echo
                                    className={`w-full h-full ${isScreenSharing ? 'object-cover' : 'object-contain'}`}
                                />
                                {!isVideoEnabled && isAudioEnabled && (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-surface-container-highest text-primary">
                                        <div className="w-16 h-16 rounded-full bg-primary-container flex items-center justify-center mb-2">
                                            <span className="material-symbols-outlined text-[32px]">person</span>
                                        </div>
                                        <span className="font-label-md text-on-surface">Audio Only</span>
                                    </div>
                                )}
                                <div className="absolute bottom-2 left-2 bg-black/60 px-2 py-0.5 rounded text-white font-label-sm backdrop-blur-md">
                                    You {isAudioEnabled ? '' : '(Muted)'}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Chat Area */}
                <div className="flex-1 flex flex-col bg-surface">
                    {/* Chat Messages */}
                    <div className="flex-1 p-md overflow-y-auto space-y-md custom-scrollbar">
                        {messages.map((msg) => (
                            <div key={msg.id} className={`flex flex-col ${msg.user === 'You' ? 'items-end' : 'items-start'}`}>
                                <div className="flex items-baseline gap-2 mb-1">
                                    <span className="font-label-sm text-on-surface">{msg.user}</span>
                                    <span className="text-[10px] text-outline">{msg.time}</span>
                                </div>
                                <div className={`px-4 py-2 rounded-2xl max-w-[85%] font-body-md ${
                                    msg.user === 'You' 
                                        ? 'bg-primary text-on-primary rounded-tr-sm' 
                                        : msg.user === 'System'
                                            ? 'bg-surface-variant text-on-surface-variant w-full text-center rounded-xl font-label-md'
                                            : 'bg-surface-container-high text-on-surface rounded-tl-sm'
                                }`}>
                                    {msg.text}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Chat Input */}
                    <div className="p-sm bg-surface-container-low border-t border-outline-variant">
                        <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                            <input
                                type="text"
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                placeholder="Type a message..."
                                className="flex-1 bg-surface rounded-full px-4 py-2 border border-outline-variant focus:outline-none focus:border-primary font-body-md text-on-surface"
                            />
                            <button 
                                type="submit"
                                disabled={!newMessage.trim()}
                                className="w-10 h-10 rounded-full bg-primary text-on-primary flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors"
                            >
                                <span className="material-symbols-outlined text-[20px]">send</span>
                            </button>
                        </form>
                    </div>
                </div>

            </div>
        </div>
    );
}
