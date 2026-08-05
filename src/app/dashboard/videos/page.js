'use client';
import { useState, useEffect } from 'react';

export default function StudentVideos() {
    const [videos, setVideos] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isObscured, setIsObscured] = useState(false);
    const [watermarkText, setWatermarkText] = useState('Protected Content');

    // Filter states
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [categories, setCategories] = useState(['All']);

    useEffect(() => {
        fetchVideos();

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

        // 4. Block common screen capture and dev tools shortcuts
        const handleKeyDown = (e) => {
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
                // Attempt to clear clipboard if it's a screenshot attempt
                try {
                    navigator.clipboard.writeText('Screenshots are disabled for protected content.');
                } catch (err) {}
                
                setTimeout(() => setIsObscured(false), 3000); // Obscure for 3 seconds
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

        // 5. Prevent copying and dragging
        const preventCopy = (e) => {
            e.preventDefault();
            try {
                navigator.clipboard.writeText('Content is protected.');
            } catch (err) {}
        };
        document.addEventListener('copy', preventCopy);
        document.addEventListener('cut', preventCopy);
        document.addEventListener('dragstart', preventCopy);

        // Get user data for watermark if available
        try {
            const token = localStorage.getItem('token');
            if (token) {
                // simple jwt decode for email, if structure allows
                const payload = JSON.parse(atob(token.split('.')[1]));
                if (payload.sub) {
                    setWatermarkText(payload.sub);
                }
            }
        } catch (e) {
            // ignore
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
        };
    }, []);

    const fetchVideos = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('http://localhost:8006/api/videos/', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!res.ok) throw new Error('Failed to fetch videos');
            const data = await res.json();
            setVideos(data);
            
            // Extract unique categories
            const uniqueCategories = ['All', ...new Set(data.map(v => v.category))];
            setCategories(uniqueCategories);
            
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const getEmbedUrl = (url) => {
        if (!url) return '';
        // Handle standard youtube links and youtu.be links
        try {
            const urlObj = new URL(url);
            let videoId = '';
            if (urlObj.hostname.includes('youtube.com')) {
                videoId = urlObj.searchParams.get('v');
            } else if (urlObj.hostname.includes('youtu.be')) {
                videoId = urlObj.pathname.slice(1);
            }
            if (videoId) {
                // Stricter YouTube params to hide controls, title, and disable keyboard
                return `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&controls=0&disablekb=1&fs=0&iv_load_policy=3`;
            }
        } catch (e) {
            // Invalid URL
        }
        return url;
    };

    const filteredVideos = selectedCategory === 'All' 
        ? videos 
        : videos.filter(v => v.category === selectedCategory);

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
                    -webkit-touch-callout: none; /* iOS Safari */
                    -webkit-user-select: none; /* Safari */
                     -khtml-user-select: none; /* Konqueror HTML */
                       -moz-user-select: none; /* Old versions of Firefox */
                        -ms-user-select: none; /* Internet Explorer/Edge */
                            user-select: none; /* Non-prefixed version, currently supported by Chrome, Edge, Opera and Firefox */
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
                
                {/* Watermark overlay across the whole page to deter recording */}
                <div className="fixed inset-0 z-40 pointer-events-none overflow-hidden opacity-[0.04] flex flex-wrap gap-12 justify-center items-center mix-blend-difference no-select-mobile">
                    {Array.from({ length: 40 }).map((_, i) => (
                        <div key={i} className="watermark-text text-3xl font-bold whitespace-nowrap">
                            {watermarkText}
                        </div>
                    ))}
                </div>
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-md mb-lg">
                <div>
                    <div className="flex items-center gap-sm mb-xs">
                        <span className="material-symbols-outlined text-primary text-3xl">
                            smart_display
                        </span>
                        <h1 className="font-display-sm md:font-display-md text-on-surface">
                            Video Library
                        </h1>
                    </div>
                    <p className="font-body-lg text-on-surface-variant max-w-2xl">
                        Watch recorded lectures and tutorials
                    </p>
                </div>
            </div>

            {error && (
                <div className="bg-error/10 text-error p-md rounded-lg flex items-center gap-sm">
                    <span className="material-symbols-outlined">error</span>
                    {error}
                </div>
            )}

            {/* Category Filter */}
            {!isLoading && videos.length > 0 && (
                <div className="flex gap-sm overflow-x-auto pb-sm custom-scrollbar">
                    {categories.map(category => (
                        <button
                            key={category}
                            onClick={() => setSelectedCategory(category)}
                            className={`px-lg py-sm rounded-full font-label-md whitespace-nowrap transition-colors ${
                                selectedCategory === category 
                                    ? 'bg-primary text-on-primary' 
                                    : 'bg-surface-container border border-outline-variant text-on-surface hover:bg-surface-container-high'
                            }`}
                        >
                            {category}
                        </button>
                    ))}
                </div>
            )}

            {/* Video Grid */}
            <div className="mt-md">
                {isLoading ? (
                    <div className="flex justify-center p-xl">
                        <span className="material-symbols-outlined animate-spin text-4xl text-primary">progress_activity</span>
                    </div>
                ) : videos.length === 0 ? (
                    <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-xl text-center custom-shadow">
                        <span className="material-symbols-outlined text-6xl text-outline/50 mb-md">videocam_off</span>
                        <h3 className="font-headline-sm text-on-surface-variant">No videos available</h3>
                        <p className="font-body-md text-outline mt-sm">Check back later for new content.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-lg">
                        {filteredVideos.map(video => (
                            <div key={video.id} className="bg-surface-container-lowest border border-outline-variant rounded-2xl overflow-hidden custom-shadow flex flex-col hover:shadow-md transition-shadow">
                                <div className="aspect-video w-full bg-black relative overflow-hidden group">
                                    <iframe 
                                        src={getEmbedUrl(video.video_url)} 
                                        className="absolute top-0 left-0 w-full h-full border-0"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                                        allowFullScreen
                                        title={video.title}
                                    ></iframe>
                                    {/* Video-specific floating watermark */}
                                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-[0.15] mix-blend-overlay animate-pulse select-none">
                                        <p className="text-white transform -rotate-12 font-bold text-xl md:text-2xl whitespace-nowrap drop-shadow-md">
                                            {watermarkText}
                                        </p>
                                    </div>
                                </div>
                                <div className="p-md flex flex-col flex-1">
                                    <div className="flex justify-between items-start gap-sm mb-sm">
                                        <h3 className="font-headline-sm text-on-surface line-clamp-2">{video.title}</h3>
                                    </div>
                                    <div className="inline-block bg-secondary-container text-on-secondary-container px-sm py-xs rounded text-xs font-label-sm w-fit mt-auto">
                                        {video.category}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </section>
        </>
    );
}
