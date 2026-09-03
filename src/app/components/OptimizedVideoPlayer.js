'use client';

import React, { useState, useRef } from 'react';

export default function OptimizedVideoPlayer({ video, watermarkText }) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [useFallbackIframe, setUseFallbackIframe] = useState(false);
    const videoRef = useRef(null);

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
                    src: `https://www.youtube.com/embed/${match[1]}?autoplay=1&rel=0&modestbranding=1&controls=1&playsinline=1` 
                };
            }
        }
        if (url.includes('youtu.be/')) {
            const match = url.match(/youtu\.be\/([a-zA-Z0-9_-]+)/);
            if (match && match[1]) {
                return { 
                    type: 'youtube', 
                    src: `https://www.youtube.com/embed/${match[1]}?autoplay=1&rel=0&modestbranding=1&controls=1&playsinline=1` 
                };
            }
        }

        // 3. Vimeo Links
        if (url.includes('vimeo.com/')) {
            const match = url.match(/vimeo\.com\/([0-9]+)/);
            if (match && match[1]) {
                return { 
                    type: 'vimeo', 
                    src: `https://player.vimeo.com/video/${match[1]}?autoplay=1&playsinline=1` 
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

    const handleStartPlayback = () => {
        setIsPlaying(true);
        if (videoRef.current) {
            videoRef.current.play().catch(() => {});
        }
    };

    return (
        <div 
            id={`video-player-${video.id || video._id}`}
            onContextMenu={(e) => e.preventDefault()}
            className="relative w-full pb-[56.25%] h-0 overflow-hidden bg-black select-none rounded-t-2xl group/player"
        >
            {/* 1. Default Poster Thumbnail & Center Play Button Overlay (when not playing) */}
            {!isPlaying && (
                <div 
                    onClick={handleStartPlayback}
                    className="absolute inset-0 z-30 cursor-pointer flex items-center justify-center bg-black/40 hover:bg-black/20 transition-all"
                >
                    {/* Thumbnail Image Background if present */}
                    {posterUrl && (
                        <img 
                            src={posterUrl} 
                            alt={videoTitle} 
                            className="absolute inset-0 w-full h-full object-cover select-none"
                        />
                    )}

                    {/* Dark gradient backdrop */}
                    <div className="absolute inset-0 bg-black/30" />

                    {/* Default Centered Play Button Box matching reference */}
                    <div className="relative z-10 w-16 h-12 sm:w-20 sm:h-14 bg-black/80 hover:bg-black/95 rounded-2xl flex items-center justify-center shadow-2xl transition-transform transform group-hover/player:scale-105 active:scale-95 border border-white/10">
                        <span className="material-symbols-outlined text-white text-3xl sm:text-4xl translate-x-0.5">
                            play_arrow
                        </span>
                    </div>
                </div>
            )}

            {/* 2. Active Video Playback */}
            {isPlaying && (
                <>
                    {/* Native HTML5 Video & Direct Google Drive Stream */}
                    {(source.type === 'html5' || (source.type === 'gdrive' && !useFallbackIframe)) && (
                        <video
                            ref={videoRef}
                            src={source.src}
                            poster={posterUrl}
                            controls
                            autoPlay
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

                    {/* Fallback Embed or YouTube / Vimeo / Iframe */}
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
                </>
            )}

            {/* 3. Floating Security Watermark Overlay */}
            {watermarkText && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-[0.14] mix-blend-overlay animate-pulse select-none z-20">
                    <p className="text-white transform -rotate-12 font-bold text-lg sm:text-xl md:text-2xl whitespace-nowrap drop-shadow-md">
                        {watermarkText}
                    </p>
                </div>
            )}
        </div>
    );
}
