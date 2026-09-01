'use client';
import { useState, useEffect } from 'react';
import { useAdminContext } from '../AdminContext';
import CategoryColorPicker, { CategoryBadge } from '../../components/CategoryColorPicker';

const LEVELS = [
    { value: 'Level 5', label: 'Level 5 (Beginner)', color: 'bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/30' },
    { value: 'Level 4', label: 'Level 4 (Elementary)', color: 'bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30' },
    { value: 'Level 3', label: 'Level 3 (Intermediate)', color: 'bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 border-yellow-500/30' },
    { value: 'Level 2', label: 'Level 2 (Pre-Advanced)', color: 'bg-orange-500/15 text-orange-700 dark:text-orange-400 border-orange-500/30' },
    { value: 'Level 1', label: 'Level 1 (Advanced)', color: 'bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30' },
];

const SUGGESTED_CATEGORIES = [
    'Grammar Lesson',
    'Vocabulary & Kanji',
    'Listening Practice',
    'JLPT Preparation',
    'Culture & Expressions',
    'Conversation Practice'
];

export default function CEOVideos() {
    const { selectedBatch, availableBatches } = useAdminContext();
    const [videos, setVideos] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState('');
    const [videoToDelete, setVideoToDelete] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [activeVideo, setActiveVideo] = useState(null);
    const [mobileFullscreen, setMobileFullscreen] = useState(false);

    // Filtering states
    const [filterLevel, setFilterLevel] = useState('All');
    const [filterCategory, setFilterCategory] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');

    // Upload Form State
    const [formData, setFormData] = useState({
        title: '',
        category: '',
        category_color: '#4F46E5',
        video_url: '',
        level: 'Level 5',
        batch: (selectedBatch && selectedBatch !== 'All Batches' && selectedBatch !== 'Global' && selectedBatch !== 'Global Access') 
            ? selectedBatch 
            : (availableBatches && availableBatches.length > 0 ? availableBatches[0] : 'All Batches')
    });

    useEffect(() => {
        if (selectedBatch && selectedBatch !== 'All Batches' && selectedBatch !== 'Global' && selectedBatch !== 'Global Access') {
            setFormData(prev => ({ ...prev, batch: selectedBatch }));
        }
    }, [selectedBatch]);

    useEffect(() => {
        fetchVideos();
    }, [selectedBatch]);

    const fetchVideos = async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem('token');
            const batchParam = (selectedBatch && selectedBatch !== 'All Batches' && selectedBatch !== 'Global' && selectedBatch !== 'Global Access')
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
                title: formData.title,
                category: formData.category || 'General',
                category_color: formData.category_color,
                video_url: formData.video_url,
                level: formData.level,
                batch: formData.batch.trim()
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
                const data = await res.json();
                throw new Error(data.detail || 'Failed to add video');
            }

            setSuccessMessage('Video successfully uploaded!');
            setFormData({
                title: '',
                category: '',
                category_color: '#4F46E5',
                video_url: '',
                level: 'Level 5',
                batch: (selectedBatch && selectedBatch !== 'All Batches' && selectedBatch !== 'Global' && selectedBatch !== 'Global Access') 
                    ? selectedBatch 
                    : (availableBatches && availableBatches.length > 0 ? availableBatches[0] : 'All Batches')
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
        setError(null);
        try {
            const token = localStorage.getItem('token');
            const videoApiBase = process.env.NEXT_PUBLIC_VIDEO_API_URL || '';
            const res = await fetch(`${videoApiBase}/api/videos/${videoToDelete.id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (!res.ok) {
                let errorText = 'Failed to delete video';
                try {
                    const errData = await res.json();
                    errorText = errData.detail || errorText;
                } catch (e) {}
                throw new Error(errorText);
            }
            
            setSuccessMessage(`Video "${videoToDelete.title}" deleted successfully.`);
            setVideoToDelete(null);
            await fetchVideos();
            setTimeout(() => setSuccessMessage(''), 4000);
        } catch (err) {
            console.error("Delete error:", err);
            setError(err.message);
        } finally {
            setIsDeleting(false);
        }
    };

    const getYouTubeThumbnail = (url) => {
        if (!url) return null;
        try {
            let videoId = '';
            if (url.includes('youtu.be/')) {
                videoId = url.split('youtu.be/')[1]?.split('?')[0];
            } else if (url.includes('youtube.com/watch')) {
                const urlObj = new URL(url);
                videoId = urlObj.searchParams.get('v');
            } else if (url.includes('youtube.com/embed/')) {
                videoId = url.split('youtube.com/embed/')[1]?.split('?')[0];
            }
            if (videoId) {
                return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
            }
        } catch (e) {
            return null;
        }
        return null;
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

    const getLevelBadgeClass = (lvl) => {
        const match = LEVELS.find(l => l.value === lvl);
        return match ? match.color : 'bg-primary/10 text-primary border-primary/20';
    };

    // Filtered Video List
    const filteredVideos = videos.filter(video => {
        if (filterLevel !== 'All' && video.level !== filterLevel) return false;
        if (filterCategory !== 'All' && video.category !== filterCategory) return false;
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            const titleMatch = (video.title || '').toLowerCase().includes(q);
            const catMatch = (video.category || '').toLowerCase().includes(q);
            const batchMatch = (video.batch || '').toLowerCase().includes(q);
            return titleMatch || catMatch || batchMatch;
        }
        return true;
    });

    const uniqueCategories = ['All', ...new Set(videos.map(v => v.category).filter(Boolean))];

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
            <div className="max-w-[1440px] mx-auto p-gutter space-y-lg relative pb-32 animate-fade-in">
            {/* Header */}
            <section className="flex flex-col md:flex-row md:items-center justify-between gap-md mb-lg">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="material-symbols-outlined text-primary text-3xl">
                            video_library
                        </span>
                        <h1 className="text-3xl md:text-4xl font-bold tracking-tight bg-gradient-to-r from-[#6FB7E4] via-[#5D8BCC] to-[#465AA3] text-transparent bg-clip-text">
                            Video Library
                        </h1>
                    </div>
                    <p className="font-body-md text-on-surface-variant max-w-2xl">
                        Upload and manage learning video resources targeted by Japanese level and student batches.
                    </p>
                </div>
            </section>

            {error && (
                <div className="bg-error/10 text-error p-4 rounded-2xl flex items-center gap-2 border border-error/30 text-xs sm:text-sm">
                    <span className="material-symbols-outlined text-[20px]">error</span>
                    <span>{error}</span>
                </div>
            )}

            {successMessage && (
                <div className="bg-green-500/10 text-green-700 dark:text-green-400 p-4 rounded-2xl flex items-center gap-2 border border-green-500/30 text-xs sm:text-sm">
                    <span className="material-symbols-outlined text-[20px]">check_circle</span>
                    <span>{successMessage}</span>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start w-full max-w-full">
                {/* Upload Form */}
                <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-3xl p-5 md:p-6 custom-shadow hover:shadow-md transition-all space-y-4 w-full">
                    <div className="flex items-center gap-2 pb-2 border-b border-outline-variant/60">
                        <span className="material-symbols-outlined text-primary text-[20px] sm:text-[22px]">upload_file</span>
                        <h2 className="text-base sm:text-lg font-bold text-on-surface">Add Video Resource</h2>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Title */}
                        <div>
                            <label className="block font-label-md text-on-surface mb-1 font-semibold text-sm">Video Title</label>
                            <input 
                                type="text"
                                name="title"
                                value={formData.title}
                                onChange={handleInputChange}
                                required
                                className="w-full px-3.5 py-2.5 bg-surface-container border border-outline-variant rounded-xl focus:border-primary focus:outline-none transition-colors text-sm text-on-surface"
                                placeholder="e.g. Master Kanji Radicals Fast"
                            />
                        </div>

                        {/* Category with Suggestions & Custom Color Picker */}
                        <div>
                            <label className="block font-label-md text-on-surface mb-1 font-semibold text-sm">Category / Custom Label</label>
                            <input 
                                type="text"
                                name="category"
                                value={formData.category}
                                onChange={handleInputChange}
                                required
                                className="w-full px-3.5 py-2.5 bg-surface-container border border-outline-variant rounded-xl focus:border-primary focus:outline-none transition-colors text-sm text-on-surface mb-2"
                                placeholder="e.g. Grammar Lesson, Kanji Mastery, JLPT"
                            />
                            <div className="flex flex-wrap gap-1 mb-3">
                                {SUGGESTED_CATEGORIES.map(cat => (
                                    <button
                                        key={cat}
                                        type="button"
                                        onClick={() => setFormData(prev => ({ ...prev, category: cat }))}
                                        className={`text-[10px] px-2.5 py-0.5 rounded-full border transition-all cursor-pointer ${
                                            formData.category === cat
                                                ? 'bg-primary text-on-primary border-primary font-bold'
                                                : 'border-outline-variant/70 text-on-surface-variant hover:bg-surface-container-high'
                                        }`}
                                    >
                                        + {cat}
                                    </button>
                                ))}
                            </div>

                            {/* Interactive Color Selector */}
                            <CategoryColorPicker 
                                categoryName={formData.category}
                                selectedColor={formData.category_color}
                                onColorChange={(newColor) => setFormData(prev => ({ ...prev, category_color: newColor }))}
                            />
                        </div>

                        {/* Target Level */}
                        <div>
                            <label className="block font-label-md text-on-surface mb-1.5 font-semibold text-sm">Target Japanese Level</label>
                            <div className="grid grid-cols-2 gap-1.5">
                                {LEVELS.map(lvl => (
                                    <button
                                        key={lvl.value}
                                        type="button"
                                        onClick={() => setFormData(prev => ({ ...prev, level: lvl.value }))}
                                        className={`py-2 px-2.5 rounded-xl border text-xs font-semibold transition-all text-left flex items-center justify-between ${
                                            formData.level === lvl.value
                                                ? `${lvl.color} border-current ring-1 ring-primary shadow-2xs font-bold`
                                                : 'border-outline-variant/60 text-on-surface-variant hover:bg-surface-container'
                                        }`}
                                    >
                                        <span>{lvl.value}</span>
                                        {formData.level === lvl.value && (
                                            <span className="material-symbols-outlined text-[14px]">check</span>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Target Batch */}
                        <div>
                            <label className="block font-label-md text-on-surface mb-1 font-semibold text-sm">Target Batch</label>
                            <input 
                                type="text"
                                name="batch"
                                value={formData.batch}
                                onChange={handleInputChange}
                                required
                                className="w-full px-3.5 py-2.5 bg-surface-container border border-outline-variant rounded-xl focus:border-primary focus:outline-none transition-colors text-sm text-on-surface mb-2"
                                placeholder="e.g. Batch - 1, Batch - 2, or All Batches"
                            />
                            {/* Quick Batch Suggestions */}
                            {availableBatches && availableBatches.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 items-center">
                                    <span className="text-[11px] text-on-surface-variant font-medium mr-1">Quick select:</span>
                                    {availableBatches.map((b) => (
                                        <button
                                            key={b}
                                            type="button"
                                            onClick={() => setFormData(prev => ({ ...prev, batch: b }))}
                                            className={`text-[11px] px-2.5 py-0.5 rounded-full border transition-all cursor-pointer ${
                                                formData.batch === b
                                                    ? 'bg-primary text-on-primary border-primary font-semibold'
                                                    : 'border-outline-variant hover:bg-surface-container text-on-surface'
                                            }`}
                                        >
                                            {b}
                                        </button>
                                    ))}
                                    <button
                                        type="button"
                                        onClick={() => setFormData(prev => ({ ...prev, batch: 'All Batches' }))}
                                        className={`text-[11px] px-2.5 py-0.5 rounded-full border transition-all cursor-pointer ${
                                            formData.batch === 'All Batches'
                                                ? 'bg-primary text-on-primary border-primary font-semibold'
                                                : 'border-outline-variant hover:bg-surface-container text-on-surface'
                                        }`}
                                    >
                                        All Batches
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* YouTube URL */}
                        <div>
                            <label className="block font-label-md text-on-surface mb-1 font-semibold text-sm">Video URL (Google Drive, YouTube, Vimeo, MP4)</label>
                            <input 
                                type="url"
                                name="video_url"
                                value={formData.video_url}
                                onChange={handleInputChange}
                                required
                                className="w-full px-3.5 py-2.5 bg-surface-container border border-outline-variant rounded-xl focus:border-primary focus:outline-none transition-colors text-sm text-on-surface"
                                placeholder="https://drive.google.com/file/d/... or YouTube URL"
                            />
                        </div>

                        {/* Live Thumbnail Preview */}
                        {getYouTubeThumbnail(formData.video_url) && (
                            <div className="rounded-xl overflow-hidden border border-outline-variant bg-black/5 aspect-video relative">
                                <img 
                                    src={getYouTubeThumbnail(formData.video_url)} 
                                    alt="Thumbnail Preview" 
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-black/20 flex items-center justify-center pointer-events-none">
                                    <span className="material-symbols-outlined text-white text-[36px] drop-shadow-md">play_circle</span>
                                </div>
                            </div>
                        )}

                        <button 
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full py-2.5 bg-primary text-on-primary rounded-xl font-label-lg hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2 font-semibold shadow-md active:scale-98 cursor-pointer mt-2"
                        >
                            {isSubmitting ? (
                                <>
                                    <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                                    <span>Adding Video...</span>
                                </>
                            ) : (
                                <>
                                    <span className="material-symbols-outlined text-[18px]">add</span>
                                    <span>Add Video Resource</span>
                                </>
                            )}
                        </button>
                    </form>
                </div>

                {/* Video List Section */}
                <div className="lg:col-span-2 space-y-4">
                    {/* Filters bar */}
                    <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-4 custom-shadow flex flex-wrap items-center justify-between gap-3">
                        <div className="flex flex-wrap items-center gap-2">
                            {/* Level Filter */}
                            <div className="flex items-center gap-1">
                                <span className="text-xs text-on-surface-variant font-medium">Level:</span>
                                <select
                                    value={filterLevel}
                                    onChange={(e) => setFilterLevel(e.target.value)}
                                    className="bg-surface-container border border-outline-variant rounded-lg px-2.5 py-1 text-xs text-on-surface focus:outline-none focus:border-primary"
                                >
                                    <option value="All">All Levels</option>
                                    {LEVELS.map(l => (
                                        <option key={l.value} value={l.value}>{l.value}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Category Filter */}
                            {uniqueCategories.length > 1 && (
                                <div className="flex items-center gap-1">
                                    <span className="text-xs text-on-surface-variant font-medium">Category:</span>
                                    <select
                                        value={filterCategory}
                                        onChange={(e) => setFilterCategory(e.target.value)}
                                        className="bg-surface-container border border-outline-variant rounded-lg px-2.5 py-1 text-xs text-on-surface focus:outline-none focus:border-primary"
                                    >
                                        {uniqueCategories.map(cat => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </div>

                        {/* Search Input */}
                        <div className="relative min-w-[180px]">
                            <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-[16px] text-on-surface-variant">search</span>
                            <input 
                                type="text"
                                placeholder="Search videos..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-8 pr-3 py-1 bg-surface-container border border-outline-variant rounded-lg text-xs text-on-surface focus:outline-none focus:border-primary"
                            />
                        </div>
                    </div>

                    {/* Videos Grid */}
                    {isLoading ? (
                        <div className="flex justify-center items-center h-64 bg-surface-container-lowest border border-outline-variant rounded-2xl">
                            <span className="material-symbols-outlined animate-spin text-4xl text-primary">progress_activity</span>
                        </div>
                    ) : filteredVideos.length === 0 ? (
                        <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-12 text-center custom-shadow">
                            <span className="material-symbols-outlined text-6xl text-outline/40 mb-3 block">videocam_off</span>
                            <h3 className="font-headline-sm text-on-surface-variant font-bold">No videos match your selection</h3>
                            <p className="font-body-md text-outline mt-1 text-sm">Upload new videos using the form on the left or change filters.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {filteredVideos.map(video => {
                                const thumb = getYouTubeThumbnail(video.video_url);
                                return (
                                    <div key={video.id} className="bg-surface-container-lowest border border-outline-variant/60 rounded-3xl overflow-hidden custom-shadow hover:shadow-md flex flex-col hover:border-primary/50 transition-all group">
                                        {/* Thumbnail Area */}
                                        <div className="relative aspect-video w-full bg-black/10 overflow-hidden cursor-pointer" onClick={() => setActiveVideo(video)}>
                                            {thumb ? (
                                                <img 
                                                    src={thumb} 
                                                    alt={video.title} 
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                />
                                            ) : (
                                                <div className="aspect-video w-full bg-primary/10 flex items-center justify-center text-primary">
                                                    <span className="material-symbols-outlined text-5xl">smart_display</span>
                                                </div>
                                            )}
                                            <div className="absolute inset-0 bg-black/30 hover:bg-black/40 flex items-center justify-center transition-colors">
                                                <div className="w-10 h-10 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                                                    <span className="material-symbols-outlined text-[22px]">play_arrow</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Content */}
                                        <div className="p-4 flex flex-col flex-1">
                                            <div className="flex items-start justify-between gap-2 mb-2">
                                                <h3 className="font-label-lg text-on-surface font-bold text-sm line-clamp-2 flex-1" title={video.title}>
                                                    {video.title}
                                                </h3>
                                                <button 
                                                    type="button"
                                                    onClick={() => setVideoToDelete(video)}
                                                    className="text-outline hover:text-error hover:bg-error-container/20 p-1.5 rounded-lg transition-colors cursor-pointer shrink-0"
                                                    title="Delete Video"
                                                >
                                                    <span className="material-symbols-outlined text-[18px]">delete</span>
                                                </button>
                                            </div>

                                            {/* Badges: Level, Batch, Category */}
                                            <div className="flex flex-wrap items-center gap-1.5 mb-3 mt-auto pt-2">
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
                                                {video.batch && (
                                                    <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-primary/10 text-primary border border-primary/20 flex items-center gap-1">
                                                        <span className="material-symbols-outlined text-[12px]">groups</span>
                                                        {video.batch}
                                                    </span>
                                                )}
                                            </div>

                                            {/* URL Link */}
                                            <div className="pt-2 border-t border-outline-variant/50">
                                                <a 
                                                    href={video.video_url} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer" 
                                                    className="text-primary hover:underline text-xs truncate flex items-center gap-1"
                                                >
                                                    <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                                                    <span className="truncate">{video.video_url}</span>
                                                </a>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            {videoToDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-surface rounded-2xl shadow-2xl p-6 w-full max-w-[440px] border border-outline-variant/60 relative">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-xl bg-error-container text-error flex items-center justify-center shrink-0">
                                <span className="material-symbols-outlined text-[24px]">warning</span>
                            </div>
                            <div>
                                <h3 className="font-headline-sm text-on-surface font-bold text-lg">Delete Video?</h3>
                                <p className="text-xs text-on-surface-variant">This action cannot be undone.</p>
                            </div>
                        </div>

                        <div className="p-3 bg-surface-container-low rounded-xl border border-outline-variant/50 my-4 text-xs space-y-1">
                            <p className="font-bold text-on-surface text-sm line-clamp-1">{videoToDelete.title}</p>
                            <p className="text-on-surface-variant truncate">{videoToDelete.video_url}</p>
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
                            id={`ceo-video-player-${activeVideo.id || activeVideo._id}`}
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
                                    onClick={() => toggleFullscreen(`ceo-video-player-${activeVideo.id || activeVideo._id}`)}
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
        </div>
        </>
    );
}
