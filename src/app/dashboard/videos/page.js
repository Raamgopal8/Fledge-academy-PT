'use client';
import { useState, useEffect, useRef } from 'react';
import { CategoryBadge } from '@/app/components/CategoryColorPicker';

const LEVEL_COLORS = {
    'Level 5': 'bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/30',
    'Level 4': 'bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30',
    'Level 3': 'bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 border-yellow-500/30',
    'Level 2': 'bg-orange-500/15 text-orange-700 dark:text-orange-400 border-orange-500/30',
    'Level 1': 'bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30',
};

export default function StudentVideos() {
    const [videos, setVideos] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isObscured, setIsObscured] = useState(false);
    const [watermarkText, setWatermarkText] = useState('Protected Student Content');
    const [studentInfo, setStudentInfo] = useState({ level: '', batch: '' });

    // Active Player & Layout States
    const [activeVideo, setActiveVideo] = useState(null);
    const [viewMode, setViewMode] = useState('cinema'); // 'cinema' | 'grid'
    const [isTheaterMode, setIsTheaterMode] = useState(false);
    const [mobileTab, setMobileTab] = useState('overview'); // 'overview' | 'playlist'
    const [watchedVideos, setWatchedVideos] = useState({});
    const [isFullscreen, setIsFullscreen] = useState(false);

    // YouTube-style Mobile Video Player States
    const videoRef = useRef(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [showControls, setShowControls] = useState(true);
    const [isMuted, setIsMuted] = useState(false);
    const [playbackRate, setPlaybackRate] = useState(1);
    const [showSettings, setShowSettings] = useState(false);
    const [doubleTapFeedback, setDoubleTapFeedback] = useState(null); // 'left' | 'right' | null
    const [gdriveFallback, setGdriveFallback] = useState(false);

    // Filter states
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [categories, setCategories] = useState(['All']);
    const [searchQuery, setSearchQuery] = useState('');

    const playerContainerRef = useRef(null);
    const playlistContainerRef = useRef(null);

    useEffect(() => {
        fetchStudentInfoAndVideos();

        // Load watched history from localStorage
        try {
            const savedWatched = localStorage.getItem('fledge_watched_videos');
            if (savedWatched) {
                setWatchedVideos(JSON.parse(savedWatched));
            }
        } catch (e) { }

        // 1. Disable right-click
        const handleContextMenu = (e) => e.preventDefault();
        document.addEventListener('contextmenu', handleContextMenu);

        // 2. Obscure on visibility loss (when switching tabs/windows)
        const handleVisibilityChange = () => {
            setIsObscured(document.hidden);
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);

        // 3. Obscure on blur (when window loses focus)
        const handleBlur = () => {
            // If the user is interacting with an iframe, don't blur
            if (document.activeElement?.tagName === 'IFRAME') {
                return;
            }
            setIsObscured(true);
        };
        const handleFocus = () => setIsObscured(false);
        window.addEventListener('blur', handleBlur);
        window.addEventListener('focus', handleFocus);

        // 4. Block screenshots / DevTools / Save shortcuts
        const handleKeyDown = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
                e.preventDefault();
            }
            if (
                e.key === 'PrintScreen' ||
                (e.ctrlKey && e.key.toLowerCase() === 'p') || // Print
                (e.metaKey && e.shiftKey && (e.key === '3' || e.key === '4' || e.key === '5')) || // Mac screenshots
                (e.metaKey && e.shiftKey && e.key.toLowerCase() === 's') || // Windows Snipping Tool
                e.key === 'F12' || // DevTools
                (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'i') || // DevTools
                (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'c') // DevTools Inspector
            ) {
                e.preventDefault();
                setIsObscured(true);
                try {
                    navigator.clipboard.writeText('Screenshots are disabled for protected educational content.');
                } catch (err) { }
                setTimeout(() => setIsObscured(false), 3000);
            }

            // Keyboard navigation shortcuts
            if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
                if (e.key.toLowerCase() === 't') {
                    setIsTheaterMode(prev => !prev);
                }
                if (e.key.toLowerCase() === 'f') {
                    toggleFullscreen();
                }
            }
        };

        const handleKeyUp = (e) => {
            if (e.key === 'PrintScreen') {
                try {
                    navigator.clipboard.writeText('Screenshots are disabled for protected educational content.');
                } catch (err) { }
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        document.addEventListener('keyup', handleKeyUp);

        // 5. Prevent copy, cut, drag
        const preventCopy = (e) => {
            e.preventDefault();
            try {
                navigator.clipboard.writeText('Educational content is protected.');
            } catch (err) { }
        };
        document.addEventListener('copy', preventCopy);
        document.addEventListener('cut', preventCopy);
        document.addEventListener('dragstart', preventCopy);

        // 6. Watermark info from auth token
        try {
            const token = localStorage.getItem('token');
            if (token) {
                const payload = JSON.parse(atob(token.split('.')[1]));
                if (payload.sub) {
                    setWatermarkText(payload.sub);
                }
            }
        } catch (e) { }

        // 7. Fullscreen change listener
        const handleFullscreenChange = () => {
            const isFs = Boolean(
                document.fullscreenElement ||
                document.webkitFullscreenElement ||
                document.mozFullScreenElement ||
                document.msFullscreenElement
            );
            setIsFullscreen(isFs);
        };

        document.addEventListener('fullscreenchange', handleFullscreenChange);
        document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
        document.addEventListener('mozfullscreenchange', handleFullscreenChange);
        document.addEventListener('MSFullscreenChange', handleFullscreenChange);

        return () => {
            document.removeEventListener('contextmenu', handleContextMenu);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('blur', handleBlur);
            window.removeEventListener('focus', handleFocus);
            document.removeEventListener('keydown', handleKeyDown);
            document.removeEventListener('keyup', handleKeyUp);
            document.removeEventListener('copy', preventCopy);
            document.removeEventListener('cut', preventCopy);
            document.removeEventListener('dragstart', preventCopy);
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
            document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
            document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
            document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
        };
    }, []);

    const fetchStudentInfoAndVideos = async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem('token');
            let level = localStorage.getItem('level');
            let batch = localStorage.getItem('batch');

            if (!level || !batch) {
                try {
                    const profRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/user/profile`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (profRes.ok) {
                        const prof = await profRes.json();
                        level = prof.level || level || '';
                        batch = prof.batch || batch || '';
                        localStorage.setItem('level', level);
                        if (batch) localStorage.setItem('batch', batch);
                    }
                } catch (e) {
                    console.error("Profile fetch fallback error:", e);
                }
            }

            level = level || '';
            batch = batch || '';
            setStudentInfo({ level, batch });

            const videoApiBase = process.env.NEXT_PUBLIC_VIDEO_API_URL || '';
            const queryParams = new URLSearchParams();
            if (level) queryParams.append('level', level);
            if (batch) queryParams.append('batch', batch);

            const res = await fetch(`${videoApiBase}/api/videos/?${queryParams.toString()}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!res.ok) throw new Error('Failed to fetch videos');
            const data = await res.json();
            setVideos(data);

            // Set initial active video
            if (data && data.length > 0) {
                setActiveVideo(data[0]);
            }

            // Extract unique categories
            const uniqueCategories = ['All', ...new Set(data.map(v => v.category).filter(Boolean))];
            setCategories(uniqueCategories);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const getEmbedUrl = (url) => {
        if (!url) return '';
        const cleanUrl = url.trim();

        // 1. Google Drive Links
        if (cleanUrl.includes('drive.google.com')) {
            const fileMatch = cleanUrl.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
            if (fileMatch && fileMatch[1]) {
                return `https://drive.google.com/file/d/${fileMatch[1]}/preview`;
            }
            const idMatch = cleanUrl.match(/[?&]id=([a-zA-Z0-9_-]+)/);
            if (idMatch && idMatch[1]) {
                return `https://drive.google.com/file/d/${idMatch[1]}/preview`;
            }
            return cleanUrl;
        }

        // 2. YouTube Links
        if (cleanUrl.includes('youtube.com/watch')) {
            const match = cleanUrl.match(/[?&]v=([a-zA-Z0-9_-]+)/);
            if (match && match[1]) {
                return `https://www.youtube.com/embed/${match[1]}?rel=0&modestbranding=1&controls=1&enablejsapi=1&playsinline=1`;
            }
        }
        if (cleanUrl.includes('youtu.be/')) {
            const match = cleanUrl.match(/youtu\.be\/([a-zA-Z0-9_-]+)/);
            if (match && match[1]) {
                return `https://www.youtube.com/embed/${match[1]}?rel=0&modestbranding=1&controls=1&enablejsapi=1&playsinline=1`;
            }
        }
        if (cleanUrl.includes('youtube.com/embed/')) {
            return cleanUrl;
        }
        if (cleanUrl.includes('youtube.com/shorts/')) {
            const match = cleanUrl.match(/shorts\/([a-zA-Z0-9_-]+)/);
            if (match && match[1]) {
                return `https://www.youtube.com/embed/${match[1]}?rel=0&modestbranding=1&controls=1&enablejsapi=1&playsinline=1`;
            }
        }

        // 3. Vimeo Links
        if (cleanUrl.includes('vimeo.com/')) {
            const match = cleanUrl.match(/vimeo\.com\/([0-9]+)/);
            if (match && match[1]) {
                return `https://player.vimeo.com/video/${match[1]}?title=0&byline=0&portrait=0`;
            }
        }

        return cleanUrl;
    };

    const getDirectStreamSource = (url) => {
        if (!url) return null;
        const clean = url.trim();
        if (clean.includes('drive.google.com')) {
            const fileMatch = clean.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
            if (fileMatch && fileMatch[1]) {
                return {
                    fileId: fileMatch[1],
                    streamUrl: `https://drive.google.com/uc?export=download&id=${fileMatch[1]}`,
                    lh3Url: `https://lh3.googleusercontent.com/d/${fileMatch[1]}`
                };
            }
            const idMatch = clean.match(/[?&]id=([a-zA-Z0-9_-]+)/);
            if (idMatch && idMatch[1]) {
                return {
                    fileId: idMatch[1],
                    streamUrl: `https://drive.google.com/uc?export=download&id=${idMatch[1]}`,
                    lh3Url: `https://lh3.googleusercontent.com/d/${idMatch[1]}`
                };
            }
        }
        return null;
    };

    const isIframeEmbed = (url) => {
        if (!url) return false;
        const clean = url.toLowerCase();
        // If Google Drive fallback was triggered due to stream error, render iframe
        if (clean.includes('drive.google.com')) {
            return gdriveFallback;
        }
        return clean.includes('youtube.com') ||
            clean.includes('youtu.be') ||
            clean.includes('vimeo.com');
    };

    const getYouTubeThumbnail = (url) => {
        if (!url) return null;
        let videoId = null;
        if (url.includes('youtube.com/watch')) {
            const match = url.match(/[?&]v=([a-zA-Z0-9_-]+)/);
            if (match && match[1]) videoId = match[1];
        } else if (url.includes('youtu.be/')) {
            const match = url.match(/youtu\.be\/([a-zA-Z0-9_-]+)/);
            if (match && match[1]) videoId = match[1];
        } else if (url.includes('youtube.com/embed/')) {
            const match = url.match(/embed\/([a-zA-Z0-9_-]+)/);
            if (match && match[1]) videoId = match[1];
        }
        return videoId ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg` : null;
    };

    const toggleFullscreen = async () => {
        const elem = playerContainerRef.current || document.getElementById('student-video-player-stage');
        if (!elem) return;

        const isNativeFullscreen = Boolean(
            document.fullscreenElement ||
            document.webkitFullscreenElement ||
            document.mozFullScreenElement ||
            document.msFullscreenElement
        );

        if (!isNativeFullscreen) {
            try {
                if (elem.requestFullscreen) {
                    await elem.requestFullscreen();
                } else if (elem.webkitRequestFullscreen) {
                    await elem.webkitRequestFullscreen();
                } else if (elem.mozRequestFullScreen) {
                    await elem.mozRequestFullScreen();
                } else if (elem.msRequestFullscreen) {
                    await elem.msRequestFullscreen();
                }
            } catch (err) {
                console.warn("Fullscreen request error:", err);
            }
        } else {
            try {
                if (document.exitFullscreen) {
                    await document.exitFullscreen();
                } else if (document.webkitExitFullscreen) {
                    await document.webkitExitFullscreen();
                } else if (document.mozCancelFullScreen) {
                    await document.mozCancelFullScreen();
                } else if (document.msExitFullscreen) {
                    await document.msExitFullscreen();
                }
            } catch (err) {
                console.warn("Exit fullscreen error:", err);
            }
        }
    };

    const toggleWatched = (videoId) => {
        setWatchedVideos(prev => {
            const updated = { ...prev, [videoId]: !prev[videoId] };
            try {
                localStorage.setItem('fledge_watched_videos', JSON.stringify(updated));
            } catch (e) { }
            return updated;
        });
    };

    const getLevelBadgeClass = (lvl) => {
        return LEVEL_COLORS[lvl] || 'bg-primary/10 text-primary border-primary/20';
    };

    // Filtered Video List
    const filteredVideos = videos.filter(video => {
        if (selectedCategory !== 'All' && video.category !== selectedCategory) return false;
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            const titleMatch = (video.title || '').toLowerCase().includes(q);
            const catMatch = (video.category || '').toLowerCase().includes(q);
            return titleMatch || catMatch;
        }
        return true;
    });

    // Update active video if current active is filtered out
    useEffect(() => {
        if (filteredVideos.length > 0) {
            const currentStillValid = activeVideo && filteredVideos.some(v => (v.id || v._id) === (activeVideo.id || activeVideo._id));
            if (!currentStillValid) {
                setActiveVideo(filteredVideos[0]);
            }
        }
    }, [selectedCategory, searchQuery, videos]);

    // Current video index in playlist
    const currentActiveIndex = activeVideo
        ? filteredVideos.findIndex(v => (v.id || v._id) === (activeVideo.id || activeVideo._id))
        : -1;
    const hasPrev = currentActiveIndex > 0;
    const hasNext = currentActiveIndex >= 0 && currentActiveIndex < filteredVideos.length - 1;

    // Auto-hide overlay controls during playback
    useEffect(() => {
        if (!showControls || !isPlaying) return;
        const timeout = setTimeout(() => setShowControls(false), 2500);
        return () => clearTimeout(timeout);
    }, [showControls, isPlaying]);

    // Reset player state when activeVideo changes
    useEffect(() => {
        setIsPlaying(false);
        setCurrentTime(0);
        setDuration(0);
        setShowControls(true);
        setShowSettings(false);
        setDoubleTapFeedback(null);
        setGdriveFallback(false);
        if (videoRef.current) {
            videoRef.current.playbackRate = playbackRate;
        }
    }, [activeVideo?.id, activeVideo?._id, activeVideo?.video_url]);

    const togglePlay = (e) => {
        e?.stopPropagation();
        if (!videoRef.current) return;
        if (isPlaying) {
            videoRef.current.pause();
            setIsPlaying(false);
            setShowControls(true);
        } else {
            videoRef.current.play().then(() => {
                setIsPlaying(true);
            }).catch(err => {
                console.warn("Autoplay error:", err);
            });
        }
    };

    const handleTimeUpdate = () => {
        if (videoRef.current) {
            setCurrentTime(videoRef.current.currentTime);
        }
    };

    const handleLoadedMetadata = () => {
        if (videoRef.current) {
            setDuration(videoRef.current.duration || 0);
        }
    };

    const handleSeek = (e) => {
        e.stopPropagation();
        const time = parseFloat(e.target.value);
        if (videoRef.current) {
            videoRef.current.currentTime = time;
            setCurrentTime(time);
        }
    };

    const toggleMute = (e) => {
        e?.stopPropagation();
        if (!videoRef.current) return;
        const nextMuted = !videoRef.current.muted;
        videoRef.current.muted = nextMuted;
        setIsMuted(nextMuted);
    };

    const handleSpeedChange = (speed) => {
        setPlaybackRate(speed);
        if (videoRef.current) {
            videoRef.current.playbackRate = speed;
        }
        setShowSettings(false);
    };

    // YouTube Double-Tap to Skip Logic (10s back / 10s forward)
    const handleVideoTap = (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const width = rect.width;

        if (e.detail === 2) {
            if (!videoRef.current) return;
            if (clickX > width / 2) {
                videoRef.current.currentTime = Math.min((videoRef.current.duration || 10000), videoRef.current.currentTime + 10);
                setDoubleTapFeedback('right');
            } else {
                videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 10);
                setDoubleTapFeedback('left');
            }
            setTimeout(() => setDoubleTapFeedback(null), 600);
        } else if (e.detail === 1) {
            setShowControls(prev => !prev);
            setShowSettings(false);
        }
    };

    const formatTime = (timeInSeconds) => {
        if (!timeInSeconds || isNaN(timeInSeconds)) return '0:00';
        const mins = Math.floor(timeInSeconds / 60);
        const secs = Math.floor(timeInSeconds % 60);
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    const handleSelectVideo = (video) => {
        setActiveVideo(video);
        // Scroll player into view on mobile
        if (typeof window !== 'undefined' && window.innerWidth < 768 && playerContainerRef.current) {
            playerContainerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    const handlePrevVideo = () => {
        if (hasPrev) {
            handleSelectVideo(filteredVideos[currentActiveIndex - 1]);
        }
    };

    const handleNextVideo = () => {
        if (hasNext) {
            handleSelectVideo(filteredVideos[currentActiveIndex + 1]);
        }
    };

    const isCurrentWatched = activeVideo ? Boolean(watchedVideos[activeVideo.id || activeVideo._id]) : false;

    return (
        <>
            <style jsx>{`
                @keyframes floatWatermark {
                    0% { transform: translate(0px, 0px) rotate(-30deg); }
                    33% { transform: translate(25px, -15px) rotate(-34deg); }
                    66% { transform: translate(-15px, 25px) rotate(-26deg); }
                    100% { transform: translate(0px, 0px) rotate(-30deg); }
                }
                .watermark-text {
                    animation: floatWatermark 10s infinite alternate ease-in-out;
                }
                .no-select-drm {
                    -webkit-touch-callout: none;
                    -webkit-user-select: none;
                    -khtml-user-select: none;
                    -moz-user-select: none;
                    -ms-user-select: none;
                    user-select: none;
                }
                :fullscreen, :-webkit-full-screen, :-moz-full-screen, :-ms-fullscreen {
                    width: 100vw !important;
                    height: 100vh !important;
                    width: 100dvw !important;
                    height: 100dvh !important;
                    background-color: #000000 !important;
                    display: flex !important;
                    align-items: center !important;
                    justify-content: center !important;
                    margin: 0 !important;
                    padding: 0 !important;
                    border: none !important;
                    border-radius: 0 !important;
                }
                :fullscreen iframe, :-webkit-full-screen iframe, :-moz-full-screen iframe, :-ms-fullscreen iframe,
                :fullscreen video, :-webkit-full-screen video, :-moz-full-screen video, :-ms-fullscreen video {
                    width: 100% !important;
                    height: 100% !important;
                    border: none !important;
                    border-radius: 0 !important;
                }
                @keyframes pulseGlow {
                    0%, 100% { opacity: 0.4; }
                    50% { opacity: 0.8; }
                }
                .ambient-glow {
                    animation: pulseGlow 6s infinite ease-in-out;
                }
                @keyframes soundwave {
                    0%, 100% { height: 4px; }
                    50% { height: 16px; }
                }
                .wave-bar-1 { animation: soundwave 1s infinite ease-in-out; }
                .wave-bar-2 { animation: soundwave 1.2s infinite ease-in-out 0.2s; }
                .wave-bar-3 { animation: soundwave 0.8s infinite ease-in-out 0.4s; }
            `}</style>

            <section className={`max-w-[1520px] mx-auto p-3 sm:p-4 md:px-8 lg:px-10 md:py-6 space-y-5 md:space-y-6 relative animate-fade-in no-select-drm ${isObscured ? 'blur-2xl select-none pointer-events-none opacity-40' : ''}`}>

                {/* Security Focus Loss Alert */}
                {isObscured && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-xl">
                        <div className="text-center p-6 max-w-md bg-surface-container-lowest border border-outline-variant/60 rounded-3xl shadow-2xl">
                            <div className="w-16 h-16 rounded-full bg-error/10 text-error flex items-center justify-center mx-auto mb-4">
                                <span className="material-symbols-outlined text-3xl">lock</span>
                            </div>
                            <h2 className="font-headline-sm text-lg font-bold text-on-surface">Screen Recording / Focus Lost</h2>
                            <p className="font-body-md text-xs text-on-surface-variant mt-2 leading-relaxed">
                                Content playback paused. Please return focus to this window to continue your lecture.
                            </p>
                        </div>
                    </div>
                )}

                {/* Security Floating DRM Watermark Overlay */}
                <div className="fixed inset-0 z-40 pointer-events-none overflow-hidden opacity-[0.035] dark:opacity-[0.05] flex flex-wrap gap-14 justify-center items-center mix-blend-difference no-select-drm">
                    {Array.from({ length: 36 }).map((_, i) => (
                        <div key={i} className="watermark-text text-2xl md:text-3xl font-bold whitespace-nowrap tracking-wider text-outline">
                            {watermarkText}
                        </div>
                    ))}
                </div>

                {/* Top Header & View Controls */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-outline-variant/40">
                    <div>
                        <div className="flex items-center gap-2.5 mb-1">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#6FB7E4] to-[#265998] flex items-center justify-center text-white shadow-xs">
                                <span className="material-symbols-outlined text-[20px]">smart_display</span>
                            </div>
                            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-[#6FB7E4] via-[#5D8BCC] to-[#465AA3]">
                                Video Classroom
                            </h1>
                        </div>
                        <p className="font-body-sm text-xs md:text-sm text-on-surface-variant max-w-2xl">
                            Master your Japanese lessons with interactive recorded video lectures & practice sessions.
                        </p>
                    </div>

                    {/* Level Badge + Mode Switcher */}
                    <div className="flex items-center gap-2.5 self-start sm:self-auto flex-wrap">
                        {studentInfo.level && (
                            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border shadow-2xs ${getLevelBadgeClass(studentInfo.level)}`}>
                                <span className="material-symbols-outlined text-[15px]">school</span>
                                <span>{studentInfo.level}</span>
                            </div>
                        )}

                        {/* View Switcher: Cinema Mode vs Grid Mode */}
                        <div className="bg-surface-container-low p-1 rounded-2xl border border-outline-variant/60 flex items-center gap-1 shadow-2xs">
                            <button
                                type="button"
                                onClick={() => setViewMode('cinema')}
                                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${viewMode === 'cinema'
                                        ? 'bg-surface-container-lowest text-primary shadow-xs font-bold'
                                        : 'text-on-surface-variant hover:text-on-surface'
                                    }`}
                                title="Cinema Theater Player View"
                            >
                                <span className="material-symbols-outlined text-[16px]">theaters</span>
                                <span className="hidden sm:inline">Cinema View</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setViewMode('grid')}
                                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${viewMode === 'grid'
                                        ? 'bg-surface-container-lowest text-primary shadow-xs font-bold'
                                        : 'text-on-surface-variant hover:text-on-surface'
                                    }`}
                                title="Browse Video Catalog Grid"
                            >
                                <span className="material-symbols-outlined text-[16px]">grid_view</span>
                                <span className="hidden sm:inline">Browse Grid</span>
                            </button>
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="bg-error/10 text-error p-4 rounded-2xl flex items-center gap-3 border border-error/30">
                        <span className="material-symbols-outlined text-[20px]">error</span>
                        <span className="text-xs font-medium">{error}</span>
                    </div>
                )}

                {/* Loading State */}
                {isLoading ? (
                    <div className="flex flex-col justify-center items-center h-80 bg-surface-container-lowest border border-outline-variant/60 rounded-3xl gap-3 shadow-xs">
                        <span className="material-symbols-outlined animate-spin text-4xl text-primary">progress_activity</span>
                        <p className="text-xs text-on-surface-variant font-medium">Loading your video classroom...</p>
                    </div>
                ) : filteredVideos.length === 0 ? (
                    <div className="flex flex-col items-center justify-center text-center p-12 bg-surface-container-lowest rounded-3xl border border-dashed border-outline-variant h-80 space-y-3">
                        <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant/40">
                            <span className="material-symbols-outlined text-4xl">videocam_off</span>
                        </div>
                        <h3 className="font-headline-sm text-base font-bold text-on-surface">No videos available</h3>
                        <p className="font-body-sm text-xs text-on-surface-variant max-w-sm">
                            No lessons match your current filters. Clear the search or check back soon for new lecture uploads.
                        </p>
                        {(searchQuery || selectedCategory !== 'All') && (
                            <button
                                onClick={() => {
                                    setSearchQuery('');
                                    setSelectedCategory('All');
                                }}
                                className="px-4 py-2 bg-primary/10 text-primary border border-primary/20 rounded-xl text-xs font-bold hover:bg-primary/20 transition-all cursor-pointer"
                            >
                                Reset Filters
                            </button>
                        )}
                    </div>
                ) : (
                    <>
                        {/* ========================================================================= */}
                        {/* 1. CINEMA VIEW (DESKTOP SPLIT STAGE + MOBILE STICKY STAGE)                 */}
                        {/* ========================================================================= */}
                        {viewMode === 'cinema' && activeVideo && (
                            <div className="space-y-6">
                                <div className={`grid grid-cols-1 ${isTheaterMode ? 'lg:grid-cols-1' : 'lg:grid-cols-12'} gap-6 items-start`}>

                                    {/* ----------------------------------------------------------------- */}
                                    {/* MAIN VIDEO PLAYER COLUMN (Left 7-8 cols on Desktop)                */}
                                    {/* ----------------------------------------------------------------- */}
                                    <div className={`${isTheaterMode ? 'w-full' : 'lg:col-span-8 xl:col-span-8'} space-y-4`}>

                                        {/* Video Stage Frame with Ambient Backdrop */}
                                        <div className="relative group">
                                            {/* Ambient backdrop glow */}
                                            <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 via-[#5D8BCC]/20 to-primary/10 rounded-3xl blur-xl ambient-glow pointer-events-none -z-10" />

                                            <div
                                                ref={playerContainerRef}
                                                id="student-video-player-stage"
                                                onContextMenu={(e) => e.preventDefault()}
                                                onClick={handleVideoTap}
                                                className="aspect-video w-full bg-black rounded-2xl md:rounded-3xl overflow-hidden shadow-2xl relative select-none flex items-center justify-center border border-outline-variant/40 ring-1 ring-white/10 group cursor-pointer"
                                            >
                                                {/* Player Embed or YouTube-Style HTML5 Video Player */}
                                                {isIframeEmbed(activeVideo.video_url) ? (
                                                    <iframe
                                                        src={getEmbedUrl(activeVideo.video_url)}
                                                        title={activeVideo.title}
                                                        className="w-full h-full border-0 pointer-events-auto"
                                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                                                    />
                                                ) : (
                                                    <>
                                                        {/* Native HTML5 Video Element with Google Drive direct stream support */}
                                                        {(() => {
                                                            const gdriveSource = getDirectStreamSource(activeVideo.video_url);
                                                            return (
                                                                <video
                                                                    ref={videoRef}
                                                                    key={activeVideo.id || activeVideo._id || activeVideo.video_url}
                                                                    src={gdriveSource ? gdriveSource.streamUrl : activeVideo.video_url}
                                                                    poster={activeVideo.thumbnail_url || getYouTubeThumbnail(activeVideo.video_url) || ''}
                                                                    playsInline
                                                                    controlsList="nodownload"
                                                                    onTimeUpdate={handleTimeUpdate}
                                                                    onLoadedMetadata={handleLoadedMetadata}
                                                                    onError={() => {
                                                                        if (gdriveSource) {
                                                                            console.warn("Direct stream failed, switching to preview iframe fallback");
                                                                            setGdriveFallback(true);
                                                                        }
                                                                    }}
                                                                    onEnded={() => {
                                                                        setIsPlaying(false);
                                                                        setShowControls(true);
                                                                        if (hasNext) handleNextVideo();
                                                                    }}
                                                                    className="w-full h-full object-contain pointer-events-none"
                                                                >
                                                                    {gdriveSource && (
                                                                        <>
                                                                            <source src={gdriveSource.streamUrl} type="video/mp4" />
                                                                            <source src={gdriveSource.lh3Url} type="video/mp4" />
                                                                        </>
                                                                    )}
                                                                </video>
                                                            );
                                                        })()}

                                                        {/* Double-Tap Skip Feedback Ripple Indicator */}
                                                        {doubleTapFeedback && (
                                                            <div className={`absolute inset-y-0 w-1/3 flex items-center justify-center pointer-events-none z-30 transition-opacity duration-300 ${doubleTapFeedback === 'left' ? 'left-0 bg-white/10 rounded-r-full' : 'right-0 bg-white/10 rounded-l-full'
                                                                }`}>
                                                                <div className="flex flex-col items-center text-white animate-pulse">
                                                                    <span className="material-symbols-outlined text-4xl">
                                                                        {doubleTapFeedback === 'left' ? 'replay_10' : 'forward_10'}
                                                                    </span>
                                                                    <span className="text-[11px] font-bold tracking-wider">10 seconds</span>
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* YouTube-Style Mobile UI Controls Overlay Layer */}
                                                        <div
                                                            className={`absolute inset-0 bg-black/50 flex flex-col justify-between transition-opacity duration-200 z-20 ${showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
                                                                }`}
                                                            onClick={(e) => e.stopPropagation()}
                                                        >
                                                            {/* Top Bar: Title & Settings */}
                                                            <div className="p-3 sm:p-4 flex items-center justify-between bg-gradient-to-b from-black/80 via-black/30 to-transparent">
                                                                <div className="flex items-center gap-2 max-w-[75%]">
                                                                    <h3 className="text-white text-xs sm:text-sm font-bold truncate drop-shadow-md">
                                                                        {activeVideo.title}
                                                                    </h3>
                                                                </div>
                                                                <div className="relative">
                                                                    <button
                                                                        type="button"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            setShowSettings(prev => !prev);
                                                                        }}
                                                                        className="text-white p-1.5 hover:bg-white/20 rounded-full transition cursor-pointer active:scale-90"
                                                                        title="Playback Settings"
                                                                    >
                                                                        <span className="material-symbols-outlined text-[20px]">settings</span>
                                                                    </button>

                                                                    {/* Settings Dropdown Popup */}
                                                                    {showSettings && (
                                                                        <div className="absolute right-0 top-10 w-36 bg-black/90 backdrop-blur-md rounded-xl p-2 border border-white/20 shadow-2xl text-white text-xs z-50 animate-scale-up">
                                                                            <p className="text-[10px] text-white/60 font-semibold px-2 py-1 uppercase tracking-wider">Speed</p>
                                                                            {[0.5, 0.75, 1, 1.25, 1.5, 2].map(speed => (
                                                                                <button
                                                                                    key={speed}
                                                                                    type="button"
                                                                                    onClick={() => handleSpeedChange(speed)}
                                                                                    className={`w-full text-left px-2 py-1.5 rounded-lg flex items-center justify-between text-xs font-medium hover:bg-white/20 transition cursor-pointer ${playbackRate === speed ? 'text-red-500 font-bold' : 'text-white'
                                                                                        }`}
                                                                                >
                                                                                    <span>{speed === 1 ? 'Normal' : `${speed}x`}</span>
                                                                                    {playbackRate === speed && (
                                                                                        <span className="material-symbols-outlined text-[14px]">check</span>
                                                                                    )}
                                                                                </button>
                                                                            ))}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            {/* Center Control Deck: -10s, Play/Pause, +10s */}
                                                            <div className="flex items-center justify-center gap-6 sm:gap-10 text-white">
                                                                <button
                                                                    type="button"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        if (videoRef.current) {
                                                                            videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 10);
                                                                        }
                                                                    }}
                                                                    className="p-2 sm:p-2.5 rounded-full hover:bg-white/20 active:scale-90 transition cursor-pointer"
                                                                    title="Skip 10s Backward"
                                                                >
                                                                    <span className="material-symbols-outlined text-2xl sm:text-3xl">replay_10</span>
                                                                </button>

                                                                <button
                                                                    type="button"
                                                                    onClick={togglePlay}
                                                                    className="p-3.5 sm:p-4 bg-black/60 hover:bg-black/80 border border-white/30 rounded-full active:scale-95 transition shadow-2xl cursor-pointer hover:scale-105"
                                                                    title={isPlaying ? "Pause" : "Play"}
                                                                >
                                                                    <span className="material-symbols-outlined text-3xl sm:text-4xl">
                                                                        {isPlaying ? 'pause' : 'play_arrow'}
                                                                    </span>
                                                                </button>

                                                                <button
                                                                    type="button"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        if (videoRef.current) {
                                                                            videoRef.current.currentTime = Math.min((videoRef.current.duration || 10000), videoRef.current.currentTime + 10);
                                                                        }
                                                                    }}
                                                                    className="p-2 sm:p-2.5 rounded-full hover:bg-white/20 active:scale-90 transition cursor-pointer"
                                                                    title="Skip 10s Forward"
                                                                >
                                                                    <span className="material-symbols-outlined text-2xl sm:text-3xl">forward_10</span>
                                                                </button>
                                                            </div>

                                                            {/* Bottom Panel: Time, Audio & YouTube-Style Red Progress Slider */}
                                                            <div className="w-full p-3 sm:p-4 bg-gradient-to-t from-black/90 via-black/50 to-transparent space-y-2">
                                                                {/* YouTube-Style Red Progress Timeline Slider */}
                                                                <div className="relative w-full flex items-center group">
                                                                    <input
                                                                        type="range"
                                                                        min="0"
                                                                        max={duration || 100}
                                                                        step="0.1"
                                                                        value={currentTime}
                                                                        onChange={handleSeek}
                                                                        className="w-full h-1 sm:h-1.5 bg-white/30 rounded-lg appearance-none cursor-pointer accent-red-600 focus:outline-none transition-all hover:h-2"
                                                                        style={{
                                                                            background: `linear-gradient(to right, #dc2626 0%, #dc2626 ${(currentTime / (duration || 1)) * 100}%, rgba(255,255,255,0.3) ${(currentTime / (duration || 1)) * 100}%, rgba(255,255,255,0.3) 100%)`
                                                                        }}
                                                                    />
                                                                </div>

                                                                {/* Audio, Time Display, & Fullscreen Button */}
                                                                <div className="flex items-center justify-between text-white text-xs">
                                                                    <div className="flex items-center gap-3">
                                                                        <button
                                                                            type="button"
                                                                            onClick={toggleMute}
                                                                            className="p-1 hover:bg-white/20 rounded-full transition cursor-pointer"
                                                                            title={isMuted ? "Unmute" : "Mute"}
                                                                        >
                                                                            <span className="material-symbols-outlined text-[18px]">
                                                                                {isMuted ? 'volume_off' : 'volume_up'}
                                                                            </span>
                                                                        </button>
                                                                        <span className="text-[11px] font-medium tracking-wide">
                                                                            {formatTime(currentTime)} <span className="text-white/50">/</span> {formatTime(duration)}
                                                                        </span>
                                                                    </div>

                                                                    <button
                                                                        type="button"
                                                                        onClick={toggleFullscreen}
                                                                        className="p-1 hover:bg-white/20 rounded-full transition cursor-pointer"
                                                                        title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
                                                                    >
                                                                        <span className="material-symbols-outlined text-[18px]">
                                                                            {isFullscreen ? 'fullscreen_exit' : 'fullscreen'}
                                                                        </span>
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </>
                                                )}

                                                {/* In-Player Floating Security Watermark */}
                                                {watermarkText && (
                                                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-[0.14] mix-blend-difference select-none z-10">
                                                        <p className="text-white transform -rotate-12 font-extrabold text-sm sm:text-lg md:text-xl tracking-wider whitespace-nowrap drop-shadow-lg">
                                                            {watermarkText}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Player Control Toolbar & Lesson Stepper */}
                                        <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-2xl p-3 sm:p-4 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
                                            {/* Lesson Stepper Prev/Next */}
                                            <div className="flex items-center gap-2">
                                                <button
                                                    type="button"
                                                    disabled={!hasPrev}
                                                    onClick={handlePrevVideo}
                                                    className="px-3 py-1.5 rounded-xl border border-outline-variant/60 bg-surface-container-low text-on-surface hover:bg-surface-container disabled:opacity-40 disabled:pointer-events-none text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer"
                                                >
                                                    <span className="material-symbols-outlined text-[16px]">chevron_left</span>
                                                    <span className="hidden sm:inline">Previous</span>
                                                </button>

                                                <div className="px-3 py-1 bg-surface-container-low rounded-xl text-[11px] font-bold text-on-surface-variant border border-outline-variant/40">
                                                    Lesson {currentActiveIndex + 1} of {filteredVideos.length}
                                                </div>

                                                <button
                                                    type="button"
                                                    disabled={!hasNext}
                                                    onClick={handleNextVideo}
                                                    className="px-3 py-1.5 rounded-xl bg-primary text-on-primary hover:bg-primary/90 disabled:opacity-40 disabled:pointer-events-none text-xs font-bold flex items-center gap-1 transition-all cursor-pointer shadow-2xs"
                                                >
                                                    <span className="hidden sm:inline">Next</span>
                                                    <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                                                </button>
                                            </div>

                                            {/* Mode & Utility Toggles */}
                                            <div className="flex items-center gap-2">
                                                {/* Mark as Watched Toggle */}
                                                <button
                                                    type="button"
                                                    onClick={() => toggleWatched(activeVideo.id || activeVideo._id)}
                                                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all cursor-pointer ${isCurrentWatched
                                                            ? 'bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/30'
                                                            : 'bg-surface-container-low text-on-surface-variant border-outline-variant/60 hover:bg-surface-container'
                                                        }`}
                                                    title="Mark lesson as completed"
                                                >
                                                    <span className="material-symbols-outlined text-[16px]">
                                                        {isCurrentWatched ? 'check_circle' : 'radio_button_unchecked'}
                                                    </span>
                                                    <span className="hidden sm:inline">{isCurrentWatched ? 'Completed' : 'Mark Watched'}</span>
                                                </button>

                                                {/* Theater Mode Toggle (Desktop only) */}
                                                <button
                                                    type="button"
                                                    onClick={() => setIsTheaterMode(prev => !prev)}
                                                    className={`hidden lg:flex px-3 py-1.5 rounded-xl text-xs font-semibold items-center gap-1.5 border border-outline-variant/60 bg-surface-container-low hover:bg-surface-container text-on-surface-variant transition-all cursor-pointer ${isTheaterMode ? 'bg-primary/10 text-primary border-primary/30 font-bold' : ''
                                                        }`}
                                                    title="Toggle Theater Mode (T)"
                                                >
                                                    <span className="material-symbols-outlined text-[16px]">
                                                        {isTheaterMode ? 'fit_screen' : 'crop_landscape'}
                                                    </span>
                                                    <span>{isTheaterMode ? 'Default View' : 'Theater View'}</span>
                                                </button>

                                                {/* Fullscreen Button */}
                                                <button
                                                    type="button"
                                                    onClick={toggleFullscreen}
                                                    className="p-1.5 rounded-xl border border-outline-variant/60 bg-surface-container-low hover:bg-surface-container text-on-surface-variant transition-all cursor-pointer"
                                                    title="Fullscreen (F)"
                                                >
                                                    <span className="material-symbols-outlined text-[18px]">
                                                        {isFullscreen ? 'fullscreen_exit' : 'fullscreen'}
                                                    </span>
                                                </button>
                                            </div>
                                        </div>

                                        {/* Mobile Navigation Tabs (Overview vs Playlist) */}
                                        <div className="lg:hidden flex border-b border-outline-variant/60 bg-surface-container-lowest rounded-2xl p-1 gap-1 shadow-2xs">
                                            <button
                                                type="button"
                                                onClick={() => setMobileTab('overview')}
                                                className={`flex-1 py-2 rounded-xl text-xs font-bold text-center transition-all cursor-pointer flex items-center justify-center gap-1.5 ${mobileTab === 'overview'
                                                        ? 'bg-primary text-on-primary shadow-xs'
                                                        : 'text-on-surface-variant hover:bg-surface-container'
                                                    }`}
                                            >
                                                <span className="material-symbols-outlined text-[16px]">info</span>
                                                <span>Lesson Details</span>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setMobileTab('playlist')}
                                                className={`flex-1 py-2 rounded-xl text-xs font-bold text-center transition-all cursor-pointer flex items-center justify-center gap-1.5 ${mobileTab === 'playlist'
                                                        ? 'bg-primary text-on-primary shadow-xs'
                                                        : 'text-on-surface-variant hover:bg-surface-container'
                                                    }`}
                                            >
                                                <span className="material-symbols-outlined text-[16px]">playlist_play</span>
                                                <span>Course Playlist ({filteredVideos.length})</span>
                                            </button>
                                        </div>

                                        {/* Lesson Details Card (Desktop or Mobile Overview Tab) */}
                                        {(mobileTab === 'overview' || typeof window !== 'undefined' && window.innerWidth >= 1024) && (
                                            <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-3xl p-5 md:p-6 space-y-4 shadow-sm">
                                                <div>
                                                    <div className="flex flex-wrap items-center gap-2 mb-2">
                                                        {activeVideo.category && (
                                                            <CategoryBadge
                                                                category={activeVideo.category}
                                                                color={activeVideo.category_color}
                                                            />
                                                        )}
                                                        {activeVideo.level && (
                                                            <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${getLevelBadgeClass(activeVideo.level)}`}>
                                                                {activeVideo.level}
                                                            </span>
                                                        )}
                                                        {activeVideo.created_at && (
                                                            <span className="text-[11px] text-on-surface-variant flex items-center gap-1 ml-auto">
                                                                <span className="material-symbols-outlined text-[13px]">schedule</span>
                                                                {new Date(activeVideo.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                                            </span>
                                                        )}
                                                    </div>

                                                    <h2 className="text-lg md:text-2xl font-bold text-on-surface leading-snug">
                                                        {activeVideo.title}
                                                    </h2>
                                                </div>

                                                {/* Study Advice & Guidelines */}
                                                <div className="p-4 bg-surface-container-low/70 rounded-2xl border border-outline-variant/40 space-y-2">
                                                    <div className="flex items-center gap-1.5 text-xs font-bold text-primary">
                                                        <span className="material-symbols-outlined text-[16px]">lightbulb</span>
                                                        <span>Learning Note</span>
                                                    </div>
                                                    <p className="text-xs text-on-surface-variant leading-relaxed">
                                                        Take notes actively while watching. Replay grammar patterns or vocabulary drills as needed, and practice sentences aloud to solidify pronunciation.
                                                    </p>
                                                </div>

                                                {/* Keyboard shortcuts reminder for desktop */}
                                                <div className="hidden lg:flex items-center gap-4 text-[11px] text-on-surface-variant pt-2 border-t border-outline-variant/40">
                                                    <span className="font-semibold">Shortcuts:</span>
                                                    <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 bg-surface-container rounded border border-outline-variant text-[10px] font-mono">F</kbd> Fullscreen</span>
                                                    <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 bg-surface-container rounded border border-outline-variant text-[10px] font-mono">T</kbd> Theater Mode</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* ----------------------------------------------------------------- */}
                                    {/* PLAYLIST SIDEBAR COLUMN (Right 4-5 cols or Below on Theater)       */}
                                    {/* ----------------------------------------------------------------- */}
                                    <div className={`${isTheaterMode ? 'w-full' : 'lg:col-span-4 xl:col-span-4'} ${mobileTab === 'playlist' ? 'block' : 'hidden lg:block'}`}>
                                        <div
                                            ref={playlistContainerRef}
                                            className="bg-surface-container-lowest border border-outline-variant/60 rounded-3xl p-4 md:p-5 shadow-sm space-y-4 lg:sticky lg:top-4 max-h-[860px] flex flex-col"
                                        >
                                            {/* Playlist Header & Search */}
                                            <div className="space-y-3 pb-3 border-b border-outline-variant/40">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <span className="material-symbols-outlined text-primary text-[20px]">queue_music</span>
                                                        <h3 className="font-headline-sm text-sm md:text-base font-bold text-on-surface">
                                                            Course Lessons
                                                        </h3>
                                                    </div>
                                                    <span className="text-[11px] font-bold text-primary px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20">
                                                        {filteredVideos.length} Available
                                                    </span>
                                                </div>

                                                {/* Search inside Playlist */}
                                                <div className="relative">
                                                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[16px] text-on-surface-variant">search</span>
                                                    <input
                                                        type="text"
                                                        placeholder="Search lessons..."
                                                        value={searchQuery}
                                                        onChange={(e) => setSearchQuery(e.target.value)}
                                                        className="w-full pl-8 pr-3 py-1.5 bg-surface-container-low border border-outline-variant rounded-xl text-xs text-on-surface focus:outline-none focus:border-primary transition-colors"
                                                    />
                                                    {searchQuery && (
                                                        <button
                                                            onClick={() => setSearchQuery('')}
                                                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface text-[14px]"
                                                        >
                                                            ✕
                                                        </button>
                                                    )}
                                                </div>

                                                {/* Category Filter Pills */}
                                                {categories.length > 1 && (
                                                    <div className="flex gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
                                                        {categories.map(cat => (
                                                            <button
                                                                key={cat}
                                                                type="button"
                                                                onClick={() => setSelectedCategory(cat)}
                                                                className={`px-3 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap transition-all cursor-pointer ${selectedCategory === cat
                                                                        ? 'bg-primary text-on-primary font-bold shadow-2xs'
                                                                        : 'bg-surface-container-low border border-outline-variant/60 text-on-surface-variant hover:bg-surface-container'
                                                                    }`}
                                                            >
                                                                {cat}
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Playlist Items List */}
                                            <div className="overflow-y-auto space-y-2 pr-1 custom-scrollbar flex-1 max-h-[580px]">
                                                {filteredVideos.map((video, idx) => {
                                                    const isSelected = activeVideo && (video.id || video._id) === (activeVideo.id || activeVideo._id);
                                                    const isWatched = Boolean(watchedVideos[video.id || video._id]);
                                                    const ytThumb = getYouTubeThumbnail(video.video_url);

                                                    return (
                                                        <div
                                                            key={video.id || video._id || idx}
                                                            onClick={() => handleSelectVideo(video)}
                                                            className={`group p-2.5 rounded-2xl border transition-all cursor-pointer flex gap-3 items-center relative ${isSelected
                                                                    ? 'bg-primary/10 border-primary/60 shadow-xs ring-1 ring-primary/40'
                                                                    : 'bg-surface-container-low/60 border-outline-variant/50 hover:bg-surface-container hover:border-outline-variant'
                                                                }`}
                                                        >
                                                            {/* Thumbnail / Index box */}
                                                            <div className="relative w-24 sm:w-28 aspect-video rounded-xl overflow-hidden bg-black flex-shrink-0 flex items-center justify-center border border-outline-variant/30">
                                                                {video.thumbnail_url || ytThumb ? (
                                                                    <img
                                                                        src={video.thumbnail_url || ytThumb}
                                                                        alt={video.title}
                                                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                                                        loading="lazy"
                                                                    />
                                                                ) : (
                                                                    <div className="w-full h-full bg-gradient-to-br from-[#265998] to-[#111416] flex items-center justify-center">
                                                                        <span className="material-symbols-outlined text-white/70 text-[22px]">play_circle</span>
                                                                    </div>
                                                                )}

                                                                {/* Playing Soundwave Overlay */}
                                                                {isSelected ? (
                                                                    <div className="absolute inset-0 bg-primary/60 backdrop-blur-[2px] flex items-center justify-center gap-1">
                                                                        <div className="w-1 bg-white rounded-full wave-bar-1" />
                                                                        <div className="w-1 bg-white rounded-full wave-bar-2" />
                                                                        <div className="w-1 bg-white rounded-full wave-bar-3" />
                                                                    </div>
                                                                ) : (
                                                                    <div className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-black/70 rounded text-[9px] font-bold text-white">
                                                                        #{idx + 1}
                                                                    </div>
                                                                )}
                                                            </div>

                                                            {/* Title & Metadata */}
                                                            <div className="flex-1 min-w-0 pr-1">
                                                                <div className="flex items-center gap-1.5 mb-1">
                                                                    {video.level && (
                                                                        <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold border ${getLevelBadgeClass(video.level)}`}>
                                                                            {video.level}
                                                                        </span>
                                                                    )}
                                                                    {isWatched && (
                                                                        <span className="material-symbols-outlined text-green-600 dark:text-green-400 text-[14px]" title="Completed">
                                                                            check_circle
                                                                        </span>
                                                                    )}
                                                                </div>

                                                                <h4 className={`text-xs font-bold line-clamp-2 transition-colors ${isSelected ? 'text-primary font-extrabold' : 'text-on-surface group-hover:text-primary'
                                                                    }`}>
                                                                    {video.title}
                                                                </h4>

                                                                {video.category && (
                                                                    <p className="text-[10px] text-on-surface-variant mt-1 truncate">
                                                                        {video.category}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ========================================================================= */}
                        {/* 2. BROWSE GRID VIEW (CATALOG EXPLORATION)                                  */}
                        {/* ========================================================================= */}
                        {viewMode === 'grid' && (
                            <div className="space-y-6">
                                {/* Filter Bar */}
                                <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-3xl p-4 sm:p-5 shadow-2xs space-y-3">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                        {/* Category Pills */}
                                        {categories.length > 1 && (
                                            <div className="flex gap-2 overflow-x-auto pb-1 custom-scrollbar">
                                                {categories.map(cat => (
                                                    <button
                                                        key={cat}
                                                        type="button"
                                                        onClick={() => setSelectedCategory(cat)}
                                                        className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${selectedCategory === cat
                                                                ? 'bg-primary text-on-primary shadow-xs font-bold'
                                                                : 'bg-surface-container-low border border-outline-variant/60 text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                                                            }`}
                                                    >
                                                        {cat}
                                                    </button>
                                                ))}
                                            </div>
                                        )}

                                        {/* Search Input */}
                                        <div className="relative min-w-[240px]">
                                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-on-surface-variant">search</span>
                                            <input
                                                type="text"
                                                placeholder="Search lessons..."
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                className="w-full pl-9 pr-4 py-2 bg-surface-container-low border border-outline-variant rounded-xl text-xs text-on-surface focus:outline-none focus:border-primary transition-colors"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Video Grid */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                                    {filteredVideos.map((video, idx) => {
                                        const ytThumb = getYouTubeThumbnail(video.video_url);
                                        const isWatched = Boolean(watchedVideos[video.id || video._id]);

                                        return (
                                            <div
                                                key={video.id || video._id || idx}
                                                className="group bg-surface-container-lowest rounded-3xl overflow-hidden border border-outline-variant/60 hover:border-primary/60 hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
                                            >
                                                {/* Thumbnail Header with Play Overlay */}
                                                <div
                                                    onClick={() => {
                                                        setActiveVideo(video);
                                                        setViewMode('cinema');
                                                    }}
                                                    className="relative aspect-video bg-black overflow-hidden cursor-pointer flex items-center justify-center"
                                                >
                                                    {video.thumbnail_url || ytThumb ? (
                                                        <img
                                                            src={video.thumbnail_url || ytThumb}
                                                            alt={video.title}
                                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                            loading="lazy"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full bg-gradient-to-tr from-[#111416] via-[#265998] to-[#5D8BCC] flex items-center justify-center">
                                                            <span className="material-symbols-outlined text-white/60 text-5xl">smart_display</span>
                                                        </div>
                                                    )}

                                                    {/* Gradient & Play Button Overlay */}
                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />

                                                    <div className="absolute inset-0 flex items-center justify-center">
                                                        <div className="w-12 h-12 rounded-full bg-primary/90 text-white flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform backdrop-blur-sm">
                                                            <span className="material-symbols-outlined text-2xl">play_arrow</span>
                                                        </div>
                                                    </div>

                                                    {/* Badges Top Left & Right */}
                                                    <div className="absolute top-2.5 left-2.5 z-10 flex items-center gap-1.5">
                                                        {video.level && (
                                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border backdrop-blur-md ${getLevelBadgeClass(video.level)}`}>
                                                                {video.level}
                                                            </span>
                                                        )}
                                                    </div>

                                                    {isWatched && (
                                                        <div className="absolute top-2.5 right-2.5 z-10 bg-green-500 text-white p-1 rounded-full shadow-md flex items-center justify-center" title="Lesson Completed">
                                                            <span className="material-symbols-outlined text-[14px]">check</span>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Card Content Details */}
                                                <div className="p-4 flex flex-col flex-1 justify-between gap-3">
                                                    <div>
                                                        <h3
                                                            onClick={() => {
                                                                setActiveVideo(video);
                                                                setViewMode('cinema');
                                                            }}
                                                            className="font-headline-sm text-on-surface font-bold text-sm line-clamp-2 group-hover:text-primary transition-colors cursor-pointer"
                                                            title={video.title}
                                                        >
                                                            {video.title}
                                                        </h3>
                                                    </div>

                                                    <div className="flex items-center justify-between pt-2 border-t border-outline-variant/40">
                                                        {video.category && (
                                                            <CategoryBadge
                                                                category={video.category}
                                                                color={video.category_color}
                                                            />
                                                        )}

                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setActiveVideo(video);
                                                                setViewMode('cinema');
                                                            }}
                                                            className="text-xs font-bold text-primary flex items-center gap-1 hover:underline cursor-pointer ml-auto"
                                                        >
                                                            <span>Watch</span>
                                                            <span className="material-symbols-outlined text-[14px]">play_circle</span>
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </section>
        </>
    );
}
