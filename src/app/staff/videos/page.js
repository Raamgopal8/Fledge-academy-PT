'use client';
import { useState, useEffect } from 'react';
import { useStaffContext } from '@/app/staff/StaffContext';

const LEVELS = [
    { value: 'Level 5', label: 'Level 5 (Beginner)', color: 'bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/30' },
    { value: 'Level 4', label: 'Level 4 (Elementary)', color: 'bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30' },
    { value: 'Level 3', label: 'Level 3 (Intermediate)', color: 'bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 border-yellow-500/30' },
    { value: 'Level 2', label: 'Level 2 (Pre-Advanced)', color: 'bg-orange-500/15 text-orange-700 dark:text-orange-400 border-orange-500/30' },
    { value: 'Level 1', label: 'Level 1 (Advanced)', color: 'bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30' },
];

const SUGGESTED_CATEGORIES = [
    'General Japanese',
    'Kanji Mastery',
    'Grammar & Patterns',
    'Listening Practice',
    'JLPT Preparation',
    'Vocabulary & Phrases',
    'Conversation Practice'
];

export default function StaffVideos() {
    const { selectedBatch, staffBatches } = useStaffContext();
    const [videos, setVideos] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isUploadOpen, setIsUploadOpen] = useState(false);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState('');
    
    // Deletion Modal
    const [videoToDelete, setVideoToDelete] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Active video player modal
    const [activeVideo, setActiveVideo] = useState(null);

    // Filtering states
    const [filterLevel, setFilterLevel] = useState('All');
    const [filterCategory, setFilterCategory] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [mobileFullscreen, setMobileFullscreen] = useState(false);

    // Upload Form State
    const [formData, setFormData] = useState({
        title: '',
        category: '',
        video_url: '',
        level: 'Level 5',
        batch: (selectedBatch && selectedBatch !== 'All Assigned Batches' && selectedBatch !== 'All Batches') 
            ? selectedBatch 
            : (staffBatches && staffBatches.length > 0 ? staffBatches[0] : 'Batch - 1')
    });

    useEffect(() => {
        const handleFullscreenChange = () => {
            const isFs = Boolean(document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement);
            if (!isFs) {
                setMobileFullscreen(false);
                if (screen?.orientation?.unlock) {
                    try { screen.orientation.unlock(); } catch (e) {}
                }
            }
        };

        document.addEventListener('fullscreenchange', handleFullscreenChange);
        document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
        document.addEventListener('mozfullscreenchange', handleFullscreenChange);
        document.addEventListener('MSFullscreenChange', handleFullscreenChange);

        return () => {
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
            document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
            document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
            document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
        };
    }, []);

    useEffect(() => {
        if (selectedBatch && selectedBatch !== 'All Assigned Batches' && selectedBatch !== 'All Batches') {
            setFormData(prev => ({ ...prev, batch: selectedBatch }));
        } else if (staffBatches && staffBatches.length > 0 && !formData.batch) {
            setFormData(prev => ({ ...prev, batch: staffBatches[0] }));
        }
    }, [selectedBatch, staffBatches]);

    useEffect(() => {
        fetchVideos();
    }, [selectedBatch]);

    const fetchVideos = async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem('token');
            const batchParam = (selectedBatch && selectedBatch !== 'All Assigned Batches' && selectedBatch !== 'All Batches')
                ? `?batch=${encodeURIComponent(selectedBatch)}`
                : '';
            
            const videoApiBase = process.env.NEXT_PUBLIC_VIDEO_API_URL || '';
            const res = await fetch(`${videoApiBase}/api/videos/${batchParam}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!res.ok) throw new Error('Failed to fetch videos');
            const data = await res.json();
            setVideos(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);
        setSuccessMessage('');
        
        try {
            const token = localStorage.getItem('token');
            const payload = {
                title: formData.title.trim(),
                category: formData.category.trim() || 'General Japanese',
                video_url: formData.video_url.trim(),
                level: formData.level,
                batch: formData.batch.trim() || 'All Batches'
            };

            const videoApiBase = process.env.NEXT_PUBLIC_VIDEO_API_URL || '';
            const res = await fetch(`${videoApiBase}/api/videos/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.detail || 'Failed to upload video');
            }

            setSuccessMessage('Video published successfully!');
            setIsUploadOpen(false);
            setFormData({
                title: '',
                category: '',
                video_url: '',
                level: 'Level 5',
                batch: selectedBatch && selectedBatch !== 'All Assigned Batches' && selectedBatch !== 'All Batches' ? selectedBatch : (staffBatches && staffBatches.length > 0 ? staffBatches[0] : 'Batch - 1')
            });
            await fetchVideos();
            setTimeout(() => setSuccessMessage(''), 4000);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const confirmDelete = async () => {
        if (!videoToDelete) return;
        setIsDeleting(true);
        try {
            const token = localStorage.getItem('token');
            const videoId = videoToDelete.id || videoToDelete._id;
            const videoApiBase = process.env.NEXT_PUBLIC_VIDEO_API_URL || '';
            const res = await fetch(`${videoApiBase}/api/videos/${videoId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (res.ok) {
                setSuccessMessage(`Video "${videoToDelete.title}" deleted.`);
                setVideoToDelete(null);
                await fetchVideos();
                setTimeout(() => setSuccessMessage(''), 4000);
            } else {
                const errData = await res.json().catch(() => ({}));
                alert(errData.detail || 'Failed to delete video.');
            }
        } catch (err) {
            console.error('Error deleting video:', err);
            alert('Network error while deleting video.');
        } finally {
            setIsDeleting(false);
        }
    };

    const getLevelBadgeClass = (lvl) => {
        const match = LEVELS.find(l => l.value === lvl);
        return match ? match.color : 'bg-primary/10 text-primary border-primary/20';
    };

    // Extract categories
    const categories = ['All', ...Array.from(new Set(videos.map(v => v.category).filter(Boolean)))];

    // Filter videos
    const filteredVideos = videos.filter(v => {
        if (filterLevel !== 'All' && v.level !== filterLevel) return false;
        if (filterCategory !== 'All' && v.category !== filterCategory) return false;
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            const titleMatch = (v.title || '').toLowerCase().includes(q);
            const catMatch = (v.category || '').toLowerCase().includes(q);
            const batchMatch = (v.batch || '').toLowerCase().includes(q);
            return titleMatch || catMatch || batchMatch;
        }
        return true;
    });

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
                return `https://www.youtube.com/embed/${match[1]}?autoplay=1&rel=0&modestbranding=1&controls=1`;
            }
        }
        if (cleanUrl.includes('youtu.be/')) {
            const match = cleanUrl.match(/youtu\.be\/([a-zA-Z0-9_-]+)/);
            if (match && match[1]) {
                return `https://www.youtube.com/embed/${match[1]}?autoplay=1&rel=0&modestbranding=1&controls=1`;
            }
        }

        // 3. Vimeo Links
        if (cleanUrl.includes('vimeo.com/')) {
            const match = cleanUrl.match(/vimeo\.com\/([0-9]+)/);
            if (match && match[1]) {
                return `https://player.vimeo.com/video/${match[1]}?autoplay=1`;
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

        if (!isNativeFullscreen && !mobileFullscreen) {
            try {
                if (elem.requestFullscreen) await elem.requestFullscreen();
                else if (elem.webkitRequestFullscreen) await elem.webkitRequestFullscreen();
                else if (elem.mozRequestFullScreen) await elem.mozRequestFullScreen();
                else if (elem.msRequestFullscreen) await elem.msRequestFullscreen();
            } catch (e) {}

            setMobileFullscreen(true);
            try {
                if (screen?.orientation?.lock) {
                    await screen.orientation.lock('landscape');
                } else if (screen?.lockOrientation) {
                    screen.lockOrientation('landscape');
                }
            } catch (err) {}
        } else {
            setMobileFullscreen(false);
            try {
                if (screen?.orientation?.unlock) {
                    screen.orientation.unlock();
                } else if (screen?.unlockOrientation) {
                    screen.unlockOrientation();
                }
            } catch (err) {}

            if (isNativeFullscreen) {
                try {
                    if (document.exitFullscreen) await document.exitFullscreen();
                    else if (document.webkitExitFullscreen) await document.webkitExitFullscreen();
                    else if (document.mozCancelFullScreen) await document.mozCancelFullScreen();
                    else if (document.msExitFullscreen) await document.msExitFullscreen();
                } catch (err) {}
            }
        }
    };

    return (
        <>
            <style jsx>{`
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
            <div className="max-w-[1440px] mx-auto p-4 md:px-8 lg:px-12 md:py-8 space-y-6 md:space-y-8 relative pb-32 animate-fade-in">
            {/* Header */}
            <section className="flex flex-col md:flex-row md:items-center justify-between gap-md mb-lg">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="material-symbols-outlined text-primary text-3xl">smart_display</span>
                        <h1 className="text-3xl md:text-4xl font-bold tracking-tight bg-gradient-to-r from-[#6FB7E4] via-[#5D8BCC] to-[#465AA3] text-transparent bg-clip-text">
                            Video Library & Lessons
                        </h1>
                    </div>
                    <p className="font-body-md text-on-surface-variant max-w-2xl mt-1">
                        Publish video lessons, organize modules by Japanese proficiency level, and manage recorded sessions.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={() => {
                        setIsUploadOpen(true);
                        if (selectedBatch && selectedBatch !== 'All Assigned Batches' && selectedBatch !== 'All Batches') {
                            setFormData(prev => ({ ...prev, batch: selectedBatch }));
                        }
                    }}
                    className="bg-primary text-on-primary px-5 py-2.5 rounded-2xl font-label-md text-sm hover:bg-primary/90 transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer active:scale-95"
                >
                    <span className="material-symbols-outlined text-[20px]">add</span>
                    <span>Upload Video</span>
                </button>
            </section>

            {successMessage && (
                <div className="bg-green-500/10 text-green-700 dark:text-green-400 p-4 rounded-2xl flex items-center gap-2.5 border border-green-500/30">
                    <span className="material-symbols-outlined text-[22px]">check_circle</span>
                    <span className="text-sm font-medium">{successMessage}</span>
                </div>
            )}

            {error && (
                <div className="p-4 bg-error/10 text-error rounded-2xl flex items-center gap-2 border border-error/30">
                    <span className="material-symbols-outlined">error</span>
                    <span className="text-xs font-medium">{error}</span>
                </div>
            )}

            {/* Filter Controls Bar */}
            <div className="bg-surface-container-lowest border border-outline-variant rounded-3xl p-5 custom-shadow space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    {/* Level Filter */}
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs text-on-surface-variant font-bold">Level:</span>
                        <div className="flex flex-wrap gap-1.5">
                            {['All', ...LEVELS.map(l => l.value)].map(lvl => (
                                <button
                                    key={lvl}
                                    type="button"
                                    onClick={() => setFilterLevel(lvl)}
                                    className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                                        filterLevel === lvl
                                            ? 'bg-primary text-on-primary shadow-xs font-bold'
                                            : 'bg-surface-container-low border border-outline-variant/60 text-on-surface-variant hover:bg-surface-container'
                                    }`}
                                >
                                    {lvl}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Search Bar */}
                    <div className="relative min-w-[240px]">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-on-surface-variant">search</span>
                        <input
                            type="text"
                            placeholder="Search videos, topics..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-4 py-1.5 bg-surface-container-low border border-outline-variant rounded-xl text-xs text-on-surface focus:outline-none focus:border-primary transition-colors"
                        />
                    </div>
                </div>

                {/* Category Pills */}
                {categories.length > 2 && (
                    <div className="flex gap-2 overflow-x-auto pb-1 pt-2 border-t border-outline-variant/40 custom-scrollbar">
                        {categories.map(cat => (
                            <button
                                key={cat}
                                type="button"
                                onClick={() => setFilterCategory(cat)}
                                className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                                    filterCategory === cat
                                        ? 'bg-secondary-container text-on-secondary-container font-bold'
                                        : 'text-on-surface-variant hover:bg-surface-container'
                                }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Video Cards Grid */}
            <div className="min-h-[400px]">
                {isLoading ? (
                    <div className="flex flex-col justify-center items-center h-64 bg-surface-container-lowest border border-outline-variant rounded-3xl gap-3">
                        <span className="material-symbols-outlined text-4xl text-primary animate-spin">progress_activity</span>
                        <p className="text-xs text-on-surface-variant font-medium">Loading video lessons...</p>
                    </div>
                ) : filteredVideos.length === 0 ? (
                    <div className="flex flex-col items-center justify-center text-center p-12 bg-surface-container-lowest rounded-3xl border border-dashed border-outline-variant h-64 custom-shadow">
                        <span className="material-symbols-outlined text-6xl text-outline/40 mb-3">video_library</span>
                        <h3 className="font-headline-sm text-on-surface-variant font-bold">No Videos Found</h3>
                        <p className="font-body-md text-outline text-xs mt-1">
                            Click "Upload Video" to add a new lesson for your students.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredVideos.map(video => (
                            <div
                                key={video.id || video._id}
                                className="group relative bg-surface-container-lowest rounded-3xl overflow-hidden border border-outline-variant/60 hover:border-primary/50 hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
                            >
                                {/* Thumbnail / Video Preview Shell */}
                                <div className="relative aspect-video bg-surface-container-high overflow-hidden flex items-center justify-center group-hover:scale-[1.02] transition-transform">
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent z-10"></div>
                                    
                                    <span className="material-symbols-outlined text-5xl text-white/80 z-20 group-hover:text-white group-hover:scale-110 transition-all drop-shadow-md">
                                        play_circle
                                    </span>

                                    {/* Action Buttons Top Bar */}
                                    <div className="absolute top-2.5 right-2.5 z-30 flex items-center gap-1">
                                        <button
                                            type="button"
                                            onClick={() => setVideoToDelete(video)}
                                            className="w-8 h-8 rounded-full bg-black/40 hover:bg-error text-white flex items-center justify-center backdrop-blur-sm transition-all cursor-pointer"
                                            title="Delete Video"
                                        >
                                            <span className="material-symbols-outlined text-[16px]">delete</span>
                                        </button>
                                    </div>

                                    {/* Play Overlay trigger */}
                                    <button
                                        type="button"
                                        onClick={() => setActiveVideo(video)}
                                        className="absolute inset-0 z-20 cursor-pointer w-full h-full text-left"
                                        aria-label={`Play ${video.title}`}
                                    />
                                </div>

                                {/* Content Details */}
                                <div className="p-5 flex flex-col flex-1">
                                    <h3 
                                        className="font-headline-sm text-on-surface font-bold text-sm line-clamp-2 group-hover:text-primary transition-colors mb-2 cursor-pointer" 
                                        title={video.title}
                                        onClick={() => setActiveVideo(video)}
                                    >
                                        {video.title}
                                    </h3>

                                    {/* Badges */}
                                    <div className="flex flex-wrap items-center gap-1.5 mt-auto pt-3 border-t border-outline-variant/40">
                                        {video.level && (
                                            <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold border ${getLevelBadgeClass(video.level)}`}>
                                                {video.level}
                                            </span>
                                        )}
                                        {video.batch && (
                                            <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-primary/10 text-primary border border-primary/20 flex items-center gap-1">
                                                <span className="material-symbols-outlined text-[12px]">groups</span>
                                                {video.batch}
                                            </span>
                                        )}
                                        {video.category && (
                                            <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-secondary-container text-on-secondary-container">
                                                {video.category}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Card Footer */}
                                <div className="px-5 py-3 bg-surface-container-low/40 border-t border-outline-variant/40 flex items-center justify-between">
                                    <span className="text-[10px] text-outline flex items-center gap-1">
                                        <span className="material-symbols-outlined text-[12px]">calendar_today</span>
                                        {video.created_at ? new Date(video.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'Recent'}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => setActiveVideo(video)}
                                        className="text-xs font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer"
                                    >
                                        <span>Watch</span>
                                        <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Video Player Modal */}
            {activeVideo && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
                    <div className="bg-surface rounded-3xl overflow-hidden max-w-[900px] w-full shadow-2xl border border-outline-variant/60 relative">
                        <div className="p-4 bg-surface-container flex items-center justify-between border-b border-outline-variant/40">
                            <div>
                                <h3 className="font-bold text-sm text-on-surface line-clamp-1">{activeVideo.title}</h3>
                                <div className="flex items-center gap-2 mt-0.5">
                                    {activeVideo.level && <span className="text-[10px] font-semibold text-primary">{activeVideo.level}</span>}
                                    {activeVideo.batch && <span className="text-[10px] text-on-surface-variant">• {activeVideo.batch}</span>}
                                </div>
                            </div>
                            <button
                                onClick={() => setActiveVideo(null)}
                                className="w-8 h-8 rounded-full hover:bg-surface-container-high text-on-surface-variant flex items-center justify-center cursor-pointer"
                            >
                                <span className="material-symbols-outlined text-[18px]">close</span>
                            </button>
                        </div>
                        
                        <div 
                            id={`staff-video-player-${activeVideo.id || activeVideo._id}`}
                            className={`aspect-video w-full bg-black relative group ${mobileFullscreen ? 'mobile-landscape-fullscreen' : ''}`}
                        >
                            {getEmbedUrl(activeVideo.video_url)?.includes('http') ? (
                                <iframe
                                    src={getEmbedUrl(activeVideo.video_url)}
                                    title={activeVideo.title}
                                    className="w-full h-full border-0"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                                    allowFullScreen
                                />
                            ) : (
                                <video
                                    src={activeVideo.video_url}
                                    controls
                                    autoPlay
                                    className="w-full h-full object-contain"
                                />
                            )}

                            {/* Top-Right Drive Pop-Out / Share Blocker & Fullscreen Button */}
                            <div className="absolute top-2 right-2 z-40 flex items-center justify-center pointer-events-auto">
                                <button
                                    type="button"
                                    onClick={() => toggleFullscreen(`staff-video-player-${activeVideo.id || activeVideo._id}`)}
                                    className="w-8 h-8 rounded-full bg-black/80 hover:bg-black hover:scale-110 text-white flex items-center justify-center backdrop-blur-md transition-all shadow-md active:scale-125 cursor-pointer border border-white/20"
                                    title={mobileFullscreen ? "Exit Fullscreen" : "Toggle Fullscreen (Landscape)"}
                                    aria-label="Toggle Fullscreen"
                                >
                                    <span className="material-symbols-outlined text-[18px]">
                                        {mobileFullscreen ? 'fullscreen_exit' : 'fullscreen'}
                                    </span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Upload Video Modal */}
            {isUploadOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-surface rounded-3xl p-6 max-w-[520px] w-full shadow-2xl border border-outline-variant/60 max-h-[90vh] overflow-y-auto custom-scrollbar relative">
                        <div className="flex justify-between items-center mb-5 pb-3 border-b border-outline-variant/40">
                            <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary text-[24px]">video_call</span>
                                <h2 className="font-headline-sm text-on-surface font-bold text-lg">Upload Video Lesson</h2>
                            </div>
                            <button
                                onClick={() => setIsUploadOpen(false)}
                                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-container text-on-surface-variant transition-colors cursor-pointer"
                            >
                                <span className="material-symbols-outlined text-[18px]">close</span>
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Title */}
                            <div>
                                <label className="block font-semibold text-xs text-on-surface mb-1">Video Title *</label>
                                <input
                                    type="text"
                                    name="title"
                                    required
                                    value={formData.title}
                                    onChange={handleInputChange}
                                    className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-3.5 py-2 text-xs text-on-surface focus:outline-none focus:border-primary transition-colors"
                                    placeholder="e.g. JLPT N5 Grammar - Particle Usage Guide"
                                />
                            </div>

                            {/* Video URL */}
                            <div>
                                <label className="block font-semibold text-xs text-on-surface mb-1">Video URL (Google Drive, YouTube, Vimeo, MP4) *</label>
                                <input
                                    type="url"
                                    name="video_url"
                                    required
                                    value={formData.video_url}
                                    onChange={handleInputChange}
                                    className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-3.5 py-2 text-xs text-on-surface focus:outline-none focus:border-primary transition-colors"
                                    placeholder="https://drive.google.com/file/d/... or YouTube URL"
                                />
                            </div>

                            {/* Japanese Level */}
                            <div>
                                <label className="block font-semibold text-xs text-on-surface mb-1">Target Level</label>
                                <div className="grid grid-cols-3 gap-1.5">
                                    {LEVELS.map(lvl => (
                                        <button
                                            key={lvl.value}
                                            type="button"
                                            onClick={() => setFormData(prev => ({ ...prev, level: lvl.value }))}
                                            className={`py-1.5 px-2 rounded-xl border text-xs font-semibold transition-all text-center ${
                                                formData.level === lvl.value
                                                    ? `${lvl.color} border-current ring-1 ring-primary font-bold shadow-2xs`
                                                    : 'border-outline-variant/60 text-on-surface-variant hover:bg-surface-container'
                                            }`}
                                        >
                                            {lvl.value}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Target Batch */}
                            <div>
                                <label className="block font-semibold text-xs text-on-surface mb-1">Target Batch</label>
                                <input
                                    type="text"
                                    name="batch"
                                    value={formData.batch}
                                    onChange={handleInputChange}
                                    className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-3.5 py-2 text-xs text-on-surface focus:outline-none focus:border-primary transition-colors mb-1.5"
                                    placeholder="e.g. Batch - 1 or All Batches"
                                />
                                <div className="flex flex-wrap gap-1.5 items-center">
                                    <span className="text-[10px] text-on-surface-variant font-medium mr-1">Quick Select:</span>
                                    {(staffBatches && staffBatches.length > 0 ? staffBatches : ['Batch - 1', 'Batch - 2', 'Batch - 3']).map((b) => (
                                        <button
                                            key={b}
                                            type="button"
                                            onClick={() => setFormData(prev => ({ ...prev, batch: b }))}
                                            className={`text-[10px] px-2.5 py-0.5 rounded-full border transition-all cursor-pointer ${
                                                formData.batch === b
                                                    ? 'bg-primary text-on-primary border-primary font-bold'
                                                    : 'border-outline-variant hover:bg-surface-container text-on-surface'
                                            }`}
                                        >
                                            {b}
                                        </button>
                                    ))}
                                    <button
                                        type="button"
                                        onClick={() => setFormData(prev => ({ ...prev, batch: 'All Batches' }))}
                                        className={`text-[10px] px-2.5 py-0.5 rounded-full border transition-all cursor-pointer ${
                                            formData.batch === 'All Batches'
                                                ? 'bg-primary text-on-primary border-primary font-bold'
                                                : 'border-outline-variant hover:bg-surface-container text-on-surface'
                                        }`}
                                    >
                                        All Batches
                                    </button>
                                </div>
                            </div>

                            {/* Category */}
                            <div>
                                <label className="block font-semibold text-xs text-on-surface mb-1">Category</label>
                                <input
                                    type="text"
                                    name="category"
                                    value={formData.category}
                                    onChange={handleInputChange}
                                    className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-3.5 py-2 text-xs text-on-surface focus:outline-none focus:border-primary transition-colors mb-1.5"
                                    placeholder="e.g. Kanji Mastery"
                                />
                                <div className="flex flex-wrap gap-1">
                                    {SUGGESTED_CATEGORIES.slice(0, 4).map(cat => (
                                        <button
                                            key={cat}
                                            type="button"
                                            onClick={() => setFormData(prev => ({ ...prev, category: cat }))}
                                            className="text-[10px] px-2 py-0.5 rounded-md bg-surface-container-low border border-outline-variant/60 text-on-surface-variant hover:text-primary transition-colors"
                                        >
                                            {cat}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex justify-end gap-2.5 pt-4 border-t border-outline-variant/40 mt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsUploadOpen(false)}
                                    className="px-4 py-2 rounded-xl text-xs font-semibold text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting || !formData.title.trim() || !formData.video_url.trim()}
                                    className="px-5 py-2 rounded-xl text-xs font-bold text-on-primary bg-primary hover:opacity-90 transition-all disabled:opacity-50 flex items-center gap-2 shadow-md cursor-pointer"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
                                            <span>Publishing...</span>
                                        </>
                                    ) : (
                                        <>
                                            <span className="material-symbols-outlined text-[16px]">publish</span>
                                            <span>Publish Video</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {videoToDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-surface rounded-2xl shadow-2xl p-6 w-full max-w-[420px] border border-outline-variant/60 relative">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-xl bg-error-container text-error flex items-center justify-center shrink-0">
                                <span className="material-symbols-outlined text-[24px]">warning</span>
                            </div>
                            <div>
                                <h3 className="font-headline-sm text-on-surface font-bold text-lg">Delete Video Lesson?</h3>
                                <p className="text-xs text-on-surface-variant">This action cannot be undone.</p>
                            </div>
                        </div>

                        <div className="p-3 bg-surface-container-low rounded-xl border border-outline-variant/50 my-4 text-xs space-y-1">
                            <p className="font-bold text-on-surface text-sm line-clamp-1">{videoToDelete.title}</p>
                            <div className="flex gap-1.5 pt-1">
                                {videoToDelete.level && <span className="font-semibold text-primary">{videoToDelete.level}</span>}
                                {videoToDelete.batch && <span className="font-semibold text-on-surface-variant">• {videoToDelete.batch}</span>}
                            </div>
                        </div>

                        <div className="flex justify-end gap-2.5 mt-5">
                            <button
                                type="button"
                                onClick={() => setVideoToDelete(null)}
                                disabled={isDeleting}
                                className="px-4 py-2 rounded-xl border border-outline-variant text-on-surface hover:bg-surface-container text-xs font-semibold transition-colors cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={confirmDelete}
                                disabled={isDeleting}
                                className="px-4 py-2 rounded-xl bg-error text-on-error hover:bg-error/90 text-xs font-semibold transition-all flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
                            >
                                {isDeleting ? (
                                    <>
                                        <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
                                        <span>Deleting...</span>
                                    </>
                                ) : (
                                    <>
                                        <span className="material-symbols-outlined text-[16px]">delete</span>
                                        <span>Delete Video</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
        </>
    );
}
