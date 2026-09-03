'use client';

import React, { useState, useRef, useEffect } from 'react';

export default function OptimizedVideoPlayer({ video, watermarkText }) {
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [useFallbackIframe, setUseFallbackIframe] = useState(false);
    const containerRef = useRef(null);

    const videoUrl = (video?.video_url || '').trim();
    const posterUrl = video?.thumbnail_url || '';
    const videoTitle = video?.title || 'Course Video';

    // Parse URL for proper direct stream / embed formats
    const parseVideoSource = (url) => {
        if (!url) return { type: 'unknown', src: '' };

        // 1. Google Drive Links -> Convert to direct streaming source
        if (url.includes('drive.google.com')) {
            const fileMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
            if (fileMatch && fileMatch[1]) {
                const fileId = fileMatch[1];
                return { 
                    type: 'gdrive',
                    fileId,
                    src: `https://drive.google.com/uc?export=download&id=${fileId}`,
                    fallbackSrc: `https://drive.google.com/file/d/${fileId}/preview` 
                };
            }
            const idMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
            if (idMatch && idMatch[1]) {
                const fileId = idMatch[1];
                return { 
                    type: 'gdrive',
                    fileId,
                    src: `https://drive.google.com/uc?export=download&id=${fileId}`,
                    fallbackSrc: `https://drive.google.com/file/d/${fileId}/preview` 
                };
            }
            return { type: 'gdrive', src: url, fallbackSrc: url };
        }

        // 2. YouTube Links
        if (url.includes('youtube.com/watch')) {
            const match = url.match(/[?&]v=([a-zA-Z0-9_-]+)/);
            if (match && match[1]) {
                return { 
                    type: 'youtube', 
                    src: `https://www.youtube.com/embed/${match[1]}?rel=0&modestbranding=1&controls=1&playsinline=1` 
                };
            }
        }
        if (url.includes('youtu.be/')) {
            const match = url.match(/youtu\.be\/([a-zA-Z0-9_-]+)/);
            if (match && match[1]) {
                return { 
                    type: 'youtube', 
                    src: `https://www.youtube.com/embed/${match[1]}?rel=0&modestbranding=1&controls=1&playsinline=1` 
                };
            }
        }

        // 3. Vimeo Links
        if (url.includes('vimeo.com/')) {
            const match = url.match(/vimeo\.com\/([0-9]+)/);
            if (match && match[1]) {
                return { 
                    type: 'vimeo', 
                    src: `https://player.vimeo.com/video/${match[1]}?playsinline=1` 
                };
            }
        }

        // 4. Direct HTML5 Video Files
        if (
            url.endsWith('.mp4') || 
            url.endsWith('.webm') || 
            url.endsWith('.ogg') || 
            url.includes('/raw/') || 
            (!url.includes('drive.google.com') && !url.includes('youtube') && !url.includes('youtu.be') && !url.includes('vimeo') && !url.includes('embed'))
        ) {
            return { type: 'html5', src: url };
        }

        return { type: 'iframe', src: url };
    };

    const source = parseVideoSource(videoUrl);

    const toggleFullscreen = async () => {
        const elem = containerRef.current;
        if (!elem) return;

        const isNativeFullscreen = Boolean(
            document.fullscreenElement || 
            document.webkitFullscreenElement || 
            document.mozFullScreenElement || 
            document.msFullscreenElement
        );

        if (!isNativeFullscreen && !isFullscreen) {
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

                // Attempt to auto-lock landscape on supported mobile devices
                if (typeof window !== 'undefined' && screen.orientation && screen.orientation.lock) {
                    screen.orientation.lock('landscape').catch(() => {});
                }
            } catch (err) {
                console.warn("Fullscreen request error, falling back to overlay state:", err);
                setIsFullscreen(true);
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

                if (typeof window !== 'undefined' && screen.orientation && screen.orientation.unlock) {
                    screen.orientation.unlock();
                }
            } catch (err) {
                console.warn("Exit fullscreen error:", err);
            }
            setIsFullscreen(false);
        }
    };

    useEffect(() => {
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
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
            document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
            document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
            document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
        };
    }, []);

    return (
        <div 
            ref={containerRef}
            id={`video-player-${video.id || video._id}`}
            onContextMenu={(e) => e.preventDefault()}
            className={`w-full bg-black select-none transition-all ${
                isFullscreen 
                    ? 'fixed inset-0 z-[9999] w-screen h-screen m-0 p-0 rounded-none flex items-center justify-center' 
                    : 'relative w-full pb-[56.25%] h-0 overflow-hidden rounded-t-2xl'
            }`}
        >
            {/* 1. Native HTML5 Video & Direct Google Drive Stream */}
            {(source.type === 'html5' || (source.type === 'gdrive' && !useFallbackIframe)) && (
                <video
                    src={source.src}
                    poster={posterUrl}
                    controls
                    playsInline
                    controlsList="nodownload" 
                    disablePictureInPicture
                    onError={() => {
                        if (source.type === 'gdrive') {
                            setUseFallbackIframe(true);
                        }
                    }}
                    className="absolute top-0 left-0 w-full h-full object-contain select-none z-10"
                >
                    <source src={source.src} type="video/mp4" />
                    {source.fileId && (
                        <source src={`https://lh3.googleusercontent.com/d/${source.fileId}`} type="video/mp4" />
                    )}
                    Your browser does not support HTML5 video.
                </video>
            )}

            {/* 2. Google Drive Fallback / YouTube / Vimeo / Iframe Embed */}
            {((source.type !== 'html5' && source.type !== 'gdrive') || (source.type === 'gdrive' && useFallbackIframe)) && source.src && (
                <iframe 
                    src={useFallbackIframe && source.fallbackSrc ? source.fallbackSrc : source.src} 
                    className="absolute top-0 left-0 w-full h-full border-0 z-10"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen" 
                    allowFullScreen
                    playsInline
                    title={videoTitle}
                />
            )}

            {/* Floating Security Watermark Overlay */}
            {watermarkText && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-[0.14] mix-blend-overlay animate-pulse select-none z-20">
                    <p className="text-white transform -rotate-12 font-bold text-lg sm:text-xl md:text-2xl whitespace-nowrap drop-shadow-md">
                        {watermarkText}
                    </p>
                </div>
            )}

            {/* Top-Right Fullscreen Toggle Button */}
            <div className={`absolute z-40 flex items-center justify-center pointer-events-auto ${isFullscreen ? 'top-4 right-4' : 'top-2 right-2'}`}>
                <button
                    type="button"
                    onClick={toggleFullscreen}
                    className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-black/75 hover:bg-black text-white flex items-center justify-center backdrop-blur-md transition-all shadow-md active:scale-90 cursor-pointer border border-white/20"
                    title={isFullscreen ? "Exit Fullscreen" : "Toggle Fullscreen"}
                    aria-label={isFullscreen ? "Exit Fullscreen" : "Toggle Fullscreen"}
                >
                    <span className="material-symbols-outlined text-[18px] sm:text-[20px]">
                        {isFullscreen ? 'fullscreen_exit' : 'fullscreen'}
                    </span>
                </button>
            </div>
        </div>
    );
}
