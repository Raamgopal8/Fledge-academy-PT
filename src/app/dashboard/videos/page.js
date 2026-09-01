'use client';
import { useState, useEffect } from 'react';
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
    const [watermarkText, setWatermarkText] = useState('Protected Content');
    const [studentInfo, setStudentInfo] = useState({ level: 'Level 5', batch: '' });
    const [mobileFullscreenId, setMobileFullscreenId] = useState(null);

    // Filter states
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [categories, setCategories] = useState(['All']);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchStudentInfoAndVideos();

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
            // If the user is just interacting with the YouTube iframe, don't blur
            if (document.activeElement?.tagName === 'IFRAME') {
                return;
            }
            setIsObscured(true);
        };
        const handleFocus = () => setIsObscured(false);
        window.addEventListener('blur', handleBlur);
        window.addEventListener('focus', handleFocus);

        // 5. Block Ctrl+S / Cmd+S save shortcuts
        const handleKeyDown = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
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
                    navigator.clipboard.writeText('Screenshots are disabled for protected content.');
                } catch (err) {}
                setTimeout(() => setIsObscured(false), 3000);
            }
        };
        const handleKeyUp = (e) => {
            if (e.key === 'PrintScreen') {
                try {
                    navigator.clipboard.writeText('Screenshots are disabled for protected content.');
                } catch (err) {}
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        document.addEventListener('keyup', handleKeyUp);

        // 6. Prevent copying and dragging
        const preventCopy = (e) => {
            e.preventDefault();
            try {
                navigator.clipboard.writeText('Content is protected.');
            } catch (err) {}
        };
        document.addEventListener('copy', preventCopy);
        document.addEventListener('cut', preventCopy);
        document.addEventListener('dragstart', preventCopy);

        // Get user data for watermark
        try {
            const token = localStorage.getItem('token');
            if (token) {
                const payload = JSON.parse(atob(token.split('.')[1]));
                if (payload.sub) {
                    setWatermarkText(payload.sub);
                }
            }
        } catch (e) {}

        // 7. Listen to fullscreen change and handle orientation locking
        const handleFullscreenChange = () => {
            const isFs = Boolean(document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement);
            if (isFs) {
                if ('orientation' in screen && screen?.orientation?.lock) {
                    screen.orientation.lock('landscape').catch(() => {});
                }
            } else {
                setMobileFullscreenId(null);
                if ('orientation' in screen && screen?.orientation?.unlock) {
                    try {
                        screen.orientation.unlock();
                    } catch (e) {}
                }
            }
        };

        // 8. Mobile Auto-Rotate listener
        const handleOrientationChange = () => {
            if (typeof window === 'undefined' || !('orientation' in screen)) return;
            const isLandscape = screen.orientation.type.startsWith('landscape');
            const fsElem = document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement;

            if (isLandscape && !fsElem) {
                const firstPlayer = document.querySelector('[id^="video-player-"]');
                if (firstPlayer) {
                    firstPlayer.requestFullscreen?.().catch(() => {});
                }
            } else if (!isLandscape && fsElem) {
                document.exitFullscreen?.().catch(() => {});
            }
        };

        document.addEventListener('fullscreenchange', handleFullscreenChange);
        document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
        document.addEventListener('mozfullscreenchange', handleFullscreenChange);
        document.addEventListener('MSFullscreenChange', handleFullscreenChange);

        if (typeof window !== 'undefined' && 'orientation' in screen && screen.orientation.addEventListener) {
            screen.orientation.addEventListener('change', handleOrientationChange);
        }

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
            if (typeof window !== 'undefined' && 'orientation' in screen && screen.orientation.removeEventListener) {
                screen.orientation.removeEventListener('change', handleOrientationChange);
            }
        };
    }, []);

    const fetchStudentInfoAndVideos = async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem('token');
            let level = localStorage.getItem('level');
            let batch = localStorage.getItem('batch');

            // If level or batch not set in localStorage, fetch from profile
            if (!level || !batch) {
                try {
                    const profRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/user/profile`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (profRes.ok) {
                        const prof = await profRes.json();
                        level = prof.level || level || 'Level 5';
                        batch = prof.batch || batch || '';
                        localStorage.setItem('level', level);
                        if (batch) localStorage.setItem('batch', batch);
                    }
                } catch (e) {
                    console.error("Profile fetch fallback error:", e);
                }
            }

            level = level || 'Level 5';
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
            // Match /file/d/FILE_ID
            const fileMatch = cleanUrl.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
            if (fileMatch && fileMatch[1]) {
                return `https://drive.google.com/file/d/${fileMatch[1]}/preview`;
            }
            // Match ?id=FILE_ID or &id=FILE_ID
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
                return `https://www.youtube.com/embed/${match[1]}?rel=0&modestbranding=1&controls=1`;
            }
        }
        if (cleanUrl.includes('youtu.be/')) {
            const match = cleanUrl.match(/youtu\.be\/([a-zA-Z0-9_-]+)/);
            if (match && match[1]) {
                return `https://www.youtube.com/embed/${match[1]}?rel=0&modestbranding=1&controls=1`;
            }
        }

        // 3. Vimeo Links
        if (cleanUrl.includes('vimeo.com/')) {
            const match = cleanUrl.match(/vimeo\.com\/([0-9]+)/);
            if (match && match[1]) {
                return `https://player.vimeo.com/video/${match[1]}`;
            }
        }

        return cleanUrl;
    };

    const isMobileDevice = () => {
        if (typeof window === 'undefined') return false;
        return window.innerWidth <= 768 || /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(navigator.userAgent);
    };

    const toggleFullscreen = async (containerId) => {
        const elem = document.getElementById(containerId);
        if (!elem) return;

        const isNativeFullscreen = Boolean(document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement);
        const isCustomMobileFs = mobileFullscreenId === containerId;

        if (!isNativeFullscreen && !isCustomMobileFs) {
            // ENTER FULLSCREEN
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
                console.warn("Native fullscreen request warning:", err);
            }

            setMobileFullscreenId(containerId);
            try {
                if (screen?.orientation?.lock) {
                    await screen.orientation.lock('landscape');
                } else if (screen?.lockOrientation) {
                    screen.lockOrientation('landscape');
                }
            } catch (err) {}
        } else {
            // EXIT FULLSCREEN -> Return to normal view
            setMobileFullscreenId(null);
            try {
                if (screen?.orientation?.unlock) {
                    screen.orientation.unlock();
                } else if (screen?.unlockOrientation) {
                    screen.unlockOrientation();
                }
            } catch (err) {}

            if (isNativeFullscreen) {
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
                    console.warn("Exit fullscreen warning:", err);
                }
            }
        }
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

    return (
        <>
            <style jsx>{`
                @keyframes floatWatermark {
                    0% { transform: translate(0px, 0px) rotate(-30deg); }
                    33% { transform: translate(30px, -20px) rotate(-35deg); }
                    66% { transform: translate(-20px, 30px) rotate(-25deg); }
                    100% { transform: translate(0px, 0px) rotate(-30deg); }
                }
                .watermark-text {
                    animation: floatWatermark 8s infinite alternate ease-in-out;
                }
                .no-select-mobile {
                    -webkit-touch-callout: none;
                    -webkit-user-select: none;
                    -khtml-user-select: none;
                    -moz-user-select: none;
                    -ms-user-select: none;
                    user-select: none;
                }
                @media (max-width: 768px) {
                    .mobile-landscape-fullscreen {
                        position: fixed !important;
                        top: 0 !important;
                        left: 0 !important;
                        right: 0 !important;
                        bottom: 0 !important;
                        width: 100vw !important;
                        height: 100vh !important;
                        width: 100dvw !important;
                        height: 100dvh !important;
                        max-width: 100vw !important;
                        max-height: 100vh !important;
                        max-width: 100dvw !important;
                        max-height: 100dvh !important;
                        transform: none !important;
                        z-index: 999999 !important;
                        background: black !important;
                        border-radius: 0 !important;
                        margin: 0 !important;
                        padding: 0 !important;
                    }
                }
                :fullscreen, :-webkit-full-screen, :-moz-full-screen, :-ms-fullscreen {
                    width: 100vw !important;
                    height: 100vh !important;
                    width: 100dvw !important;
                    height: 100dvh !important;
                    background-color: black !important;
                    display: flex !important;
                    align-items: center !important;
                    justify-content: center !important;
                    margin: 0 !important;
                    padding: 0 !important;
                    border: none !important;
                }
                :fullscreen iframe, :-webkit-full-screen iframe, :-moz-full-screen iframe, :-ms-fullscreen iframe {
                    width: 100% !important;
                    height: 100% !important;
                    border: none !important;
                }
            `}</style>
            <section className={`max-w-[1440px] mx-auto p-gutter space-y-lg animate-fade-in no-select-mobile ${isObscured ? 'blur-xl select-none pointer-events-none opacity-50' : ''}`}>
                {isObscured && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-md">
                        <div className="text-center">
                            <span className="material-symbols-outlined text-6xl text-error mb-4">security</span>
                            <h2 className="font-display-sm text-on-surface">Screen Recording / Focus Lost</h2>
                            <p className="font-body-lg text-on-surface-variant mt-2">Please return to the window to continue watching.</p>
                        </div>
                    </div>
                )}
                
                {/* Watermark overlay */}
                <div className="fixed inset-0 z-40 pointer-events-none overflow-hidden opacity-[0.04] flex flex-wrap gap-12 justify-center items-center mix-blend-difference no-select-mobile">
                    {Array.from({ length: 40 }).map((_, i) => (
                        <div key={i} className="watermark-text text-3xl font-bold whitespace-nowrap">
                            {watermarkText}
                        </div>
                    ))}
                </div>

                {/* Header with Student Level and Batch Badges */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-md mb-lg">
                    <div>
                        <div className="flex items-center gap-sm mb-xs">
                            <span className="material-symbols-outlined text-primary text-3xl">smart_display</span>
                            <h1 className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#6FB7E4] via-[#5D8BCC] to-[#465AA3]">
                                Video Library
                            </h1>
                        </div>
                        <p className="font-body-lg text-on-surface-variant max-w-2xl">
                            Watch recorded lectures, tutorials, and specialized lessons for your batch and level.
                        </p>
                    </div>

                    {/* Active Student Level Indicator (Batch is hidden in UI) */}
                    <div className="flex items-center gap-2">
                        {studentInfo.level && (
                            <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold shadow-2xs">
                                <span className="material-symbols-outlined text-[16px]">school</span>
                                <span>{studentInfo.level}</span>
                            </div>
                        )}
                    </div>
                </div>

                {error && (
                    <div className="bg-error/10 text-error p-md rounded-xl flex items-center gap-sm border border-error/30">
                        <span className="material-symbols-outlined">error</span>
                        <span>{error}</span>
                    </div>
                )}

                {/* Filter and Video Grid */}
                <div className="rounded-3xl bg-surface-container-lowest p-lg overflow-hidden border border-outline-variant shadow-sm hover:shadow-md transition-shadow min-h-[400px] space-y-6">
                    {/* Category Filter & Search Bar */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-outline-variant/50">
                        {/* Category Filter Tabs */}
                        {!isLoading && categories.length > 1 ? (
                            <div className="flex gap-2 overflow-x-auto pb-1 custom-scrollbar">
                                {categories.map(category => (
                                    <button
                                        key={category}
                                        onClick={() => setSelectedCategory(category)}
                                        className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                                            selectedCategory === category 
                                                ? 'bg-primary text-on-primary shadow-xs font-bold' 
                                                : 'bg-surface-container-low border border-outline-variant/60 text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                                        }`}
                                    >
                                        {category}
                                    </button>
                                ))}
                            </div>
                        ) : <div />}

                        {/* Search Input */}
                        <div className="relative min-w-[220px]">
                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-on-surface-variant">search</span>
                            <input 
                                type="text"
                                placeholder="Search lesson videos..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-9 pr-4 py-1.5 bg-surface-container-low border border-outline-variant rounded-xl text-xs text-on-surface focus:outline-none focus:border-primary transition-colors"
                            />
                        </div>
                    </div>

                    {/* Video Grid */}
                    <div>
                        {isLoading ? (
                            <div className="flex flex-col justify-center items-center h-64 gap-3">
                                <span className="material-symbols-outlined animate-spin text-4xl text-primary">progress_activity</span>
                                <p className="text-xs text-on-surface-variant font-medium">Loading your course videos...</p>
                            </div>
                        ) : filteredVideos.length === 0 ? (
                            <div className="flex flex-col items-center justify-center text-center p-xl bg-surface-container/30 rounded-2xl border border-dashed border-outline-variant h-64">
                                <span className="material-symbols-outlined text-6xl text-outline/40 mb-3">videocam_off</span>
                                <h3 className="font-headline-sm text-on-surface-variant font-bold">No videos available</h3>
                                <p className="font-body-md text-outline text-xs mt-1">Check back later or contact your instructor for new lessons.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {filteredVideos.map(video => (
                                    <div key={video.id} className="group relative bg-surface-container-low rounded-2xl overflow-hidden border border-outline-variant hover:border-primary/50 hover:shadow-lg transition-all duration-300 flex flex-col">
                                        {/* Video Player Container */}
                                        <div 
                                            id={`video-player-${video.id}`} 
                                            onContextMenu={(e) => e.preventDefault()}
                                            className={`aspect-video w-full bg-black relative overflow-hidden group select-none flex items-center justify-center ${mobileFullscreenId === `video-player-${video.id}` ? 'mobile-landscape-fullscreen' : ''}`}
                                        >
                                            {video.video_url && (video.video_url.endsWith('.mp4') || video.video_url.endsWith('.webm') || video.video_url.endsWith('.ogg') || video.video_url.includes('/raw/') || (!video.video_url.includes('drive.google.com') && !video.video_url.includes('youtube') && !video.video_url.includes('youtu.be') && !video.video_url.includes('vimeo') && !video.video_url.includes('embed'))) ? (
                                                <video
                                                    src={video.video_url}
                                                    poster={video.thumbnail_url}
                                                    controls
                                                    playsInline
                                                    controlsList="nodownload nofullscreen" 
                                                    disablePictureInPicture
                                                    className="w-full h-full object-contain select-none z-10"
                                                />
                                            ) : (
                                                <iframe 
                                                    src={getEmbedUrl(video.video_url)} 
                                                    className="absolute top-0 left-0 w-full h-full border-0 z-10"
                                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen" 
                                                    allowFullScreen
                                                    title={video.title}
                                                ></iframe>
                                            )}

                                            {/* Video-specific floating watermark */}
                                            <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-[0.15] mix-blend-overlay animate-pulse select-none z-20">
                                                <p className="text-white transform -rotate-12 font-bold text-xl md:text-2xl whitespace-nowrap drop-shadow-md">
                                                    {watermarkText}
                                                </p>
                                            </div>

                                            {/* Top-Right Fullscreen Enable Button */}
                                            <div className="absolute top-1.5 right-1.5 z-40 flex items-center justify-center pointer-events-auto">
                                                <button
                                                    type="button"
                                                    onClick={() => toggleFullscreen(`video-player-${video.id}`)}
                                                    className="w-10 h-10 rounded-full bg-black/90 hover:bg-black hover:scale-105 text-white flex items-center justify-center backdrop-blur-md transition-all shadow-lg active:scale-95 cursor-pointer border border-white/20"
                                                    title={mobileFullscreenId === `video-player-${video.id}` ? "Exit Fullscreen" : "Toggle Fullscreen (Landscape)"}
                                                    aria-label="Toggle Fullscreen"
                                                >
                                                    <span className="material-symbols-outlined text-[20px]">
                                                        {mobileFullscreenId === `video-player-${video.id}` ? 'fullscreen_exit' : 'fullscreen'}
                                                    </span>
                                                </button>
                                            </div>
                                        </div>

                                        {/* Card Info & Badges */}
                                        <div className="p-5 flex flex-col flex-1">
                                            <h3 className="font-headline-sm text-on-surface font-bold text-base line-clamp-2 group-hover:text-primary transition-colors mb-3" title={video.title}>
                                                {video.title}
                                            </h3>

                                            {/* Level & Category Badges (Batch hidden in UI) */}
                                            <div className="flex flex-wrap items-center gap-1.5 mt-auto pt-2 border-t border-outline-variant/40">
                                                {video.category && (
                                                    <CategoryBadge 
                                                        category={video.category} 
                                                        color={video.category_color} 
                                                    />
                                                )}
                                                {video.level && (
                                                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${getLevelBadgeClass(video.level)}`}>
                                                        {video.level}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </section>
        </>
    );
}
