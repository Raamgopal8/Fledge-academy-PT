'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';

export default function OptimizedVideoPlayer({ video, watermarkText }) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(1);
    const [isMuted, setIsMuted] = useState(false);
    const [playbackRate, setPlaybackRate] = useState(1);
    const [showSpeedMenu, setShowSpeedMenu] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showControls, setShowControls] = useState(true);
    const [useFallbackIframe, setUseFallbackIframe] = useState(false);
    const [isBuffering, setIsBuffering] = useState(false);

    const containerRef = useRef(null);
    const videoRef = useRef(null);
    const controlsTimeoutRef = useRef(null);

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
    const isHtml5Compatible = (source.type === 'html5' || source.type === 'gdrive') && !useFallbackIframe;

    // Format seconds to mm:ss or hh:mm:ss
    const formatTime = (secs) => {
        if (!secs || isNaN(secs)) return '0:00';
        const totalSeconds = Math.floor(secs);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;

        const formattedSeconds = seconds < 10 ? `0${seconds}` : seconds;
        if (hours > 0) {
            const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
            return `${hours}:${formattedMinutes}:${formattedSeconds}`;
        }
        return `${minutes}:${formattedSeconds}`;
    };

    // Fullscreen Toggle
    const enterFullscreen = async () => {
        const elem = containerRef.current;
        if (!elem) return;

        setIsFullscreen(true);

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

            if (typeof window !== 'undefined' && screen.orientation && screen.orientation.lock) {
                screen.orientation.lock('landscape').catch(() => {});
            }
        } catch (err) {
            console.warn("Fullscreen request error, overlay active:", err);
        }
    };

    const exitFullscreen = async () => {
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
    };

    const toggleFullscreen = () => {
        if (isFullscreen) {
            exitFullscreen();
        } else {
            enterFullscreen();
        }
    };

    // Auto-hide controls
    const triggerControls = useCallback(() => {
        setShowControls(true);
        if (controlsTimeoutRef.current) {
            clearTimeout(controlsTimeoutRef.current);
        }
        if (isPlaying) {
            controlsTimeoutRef.current = setTimeout(() => {
                setShowControls(false);
                setShowSpeedMenu(false);
            }, 3000);
        }
    }, [isPlaying]);

    // Play / Pause & Auto Fullscreen
    const togglePlay = () => {
        const video = videoRef.current;
        if (!video) return;

        if (video.paused) {
            video.play().then(() => {
                setIsPlaying(true);
                if (!isFullscreen) {
                    enterFullscreen();
                }
            }).catch(() => {});
        } else {
            video.pause();
            setIsPlaying(false);
        }
        triggerControls();
    };

    // Seek +/- 10s
    const skipTime = (amount) => {
        const video = videoRef.current;
        if (!video) return;
        video.currentTime = Math.max(0, Math.min(video.duration || 0, video.currentTime + amount));
        triggerControls();
    };

    // Scrub / Seek Progress Bar
    const handleSeek = (e) => {
        const video = videoRef.current;
        if (!video || !duration) return;
        const newTime = parseFloat(e.target.value);
        video.currentTime = newTime;
        setCurrentTime(newTime);
        triggerControls();
    };

    // Volume Change
    const handleVolumeChange = (e) => {
        const newVol = parseFloat(e.target.value);
        setVolume(newVol);
        setIsMuted(newVol === 0);
        if (videoRef.current) {
            videoRef.current.volume = newVol;
            videoRef.current.muted = newVol === 0;
        }
        triggerControls();
    };

    // Mute Toggle
    const toggleMute = () => {
        const video = videoRef.current;
        if (!video) return;
        if (isMuted) {
            video.muted = false;
            setIsMuted(false);
            if (volume === 0) {
                setVolume(1);
                video.volume = 1;
            }
        } else {
            video.muted = true;
            setIsMuted(true);
        }
        triggerControls();
    };

    // Speed Switcher
    const handleSpeedChange = (rate) => {
        setPlaybackRate(rate);
        if (videoRef.current) {
            videoRef.current.playbackRate = rate;
        }
        setShowSpeedMenu(false);
        triggerControls();
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
            if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
        };
    }, []);

    const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

    return (
        <div 
            ref={containerRef}
            id={`video-player-${video.id || video._id}`}
            onContextMenu={(e) => e.preventDefault()}
            onMouseMove={triggerControls}
            onTouchStart={triggerControls}
            className={`w-full bg-black select-none group relative transition-all ${
                isFullscreen 
                    ? 'fixed inset-0 z-[9999] w-screen h-screen m-0 p-0 rounded-none flex items-center justify-center' 
                    : 'relative w-full pb-[56.25%] h-0 overflow-hidden rounded-t-2xl'
            }`}
        >
            {/* 1. Direct HTML5 / Google Drive Stream Player */}
            {isHtml5Compatible && (
                <>
                    <video
                        ref={videoRef}
                        src={source.src}
                        poster={posterUrl}
                        playsInline
                        preload="metadata"
                        onClick={togglePlay}
                        onTimeUpdate={() => {
                            if (videoRef.current) {
                                setCurrentTime(videoRef.current.currentTime);
                            }
                        }}
                        onLoadedMetadata={() => {
                            if (videoRef.current) {
                                setDuration(videoRef.current.duration);
                            }
                        }}
                        onWaiting={() => setIsBuffering(true)}
                        onPlaying={() => {
                            setIsBuffering(false);
                            setIsPlaying(true);
                        }}
                        onPause={() => setIsPlaying(false)}
                        onEnded={() => setIsPlaying(false)}
                        onError={() => {
                            if (source.type === 'gdrive') {
                                setUseFallbackIframe(true);
                            }
                        }}
                        className="absolute top-0 left-0 w-full h-full object-contain cursor-pointer z-10"
                    >
                        <source src={source.src} type="video/mp4" />
                        {source.fileId && (
                            <source src={`https://lh3.googleusercontent.com/d/${source.fileId}`} type="video/mp4" />
                        )}
                    </video>

                    {/* Buffering Indicator */}
                    {isBuffering && (
                        <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
                            <div className="w-12 h-12 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center">
                                <span className="material-symbols-outlined text-3xl text-primary animate-spin">progress_activity</span>
                            </div>
                        </div>
                    )}

                    {/* Big Center Play Indicator (when paused) */}
                    {!isPlaying && !isBuffering && (
                        <div 
                            onClick={togglePlay}
                            className="absolute inset-0 z-20 flex items-center justify-center cursor-pointer bg-black/35 hover:bg-black/45 transition-colors"
                        >
                            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-primary text-white flex items-center justify-center shadow-xl transition-transform hover:scale-110 active:scale-95">
                                <span className="material-symbols-outlined text-3xl sm:text-4xl translate-x-0.5">play_arrow</span>
                            </div>
                        </div>
                    )}

                    {/* Bottom Control Bar */}
                    <div 
                        className={`absolute bottom-0 left-0 right-0 z-30 bg-gradient-to-t from-black/95 via-black/70 to-transparent p-2.5 sm:p-4 transition-opacity duration-300 flex flex-col gap-1.5 ${
                            showControls || !isPlaying ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
                        }`}
                    >
                        {/* Interactive Progress Bar */}
                        <div className="relative w-full flex items-center h-4 cursor-pointer">
                            <input
                                type="range"
                                min="0"
                                max={duration || 100}
                                step="0.1"
                                value={currentTime}
                                onChange={handleSeek}
                                className="w-full h-1.5 bg-white/30 rounded-lg appearance-none cursor-pointer accent-primary hover:h-2 transition-all"
                                style={{
                                    background: `linear-gradient(to right, #5D8BCC ${progressPercentage}%, rgba(255, 255, 255, 0.3) ${progressPercentage}%)`
                                }}
                            />
                        </div>

                        {/* Controls Row */}
                        <div className="flex items-center justify-between text-white text-xs sm:text-sm">
                            {/* Left Controls: Play/Pause, -10s, +10s, Volume, Time */}
                            <div className="flex items-center gap-1.5 sm:gap-3">
                                {/* Play / Pause */}
                                <button
                                    type="button"
                                    onClick={togglePlay}
                                    className="p-1.5 hover:text-primary transition-colors cursor-pointer touch-manipulation"
                                    title={isPlaying ? "Pause" : "Play"}
                                >
                                    <span className="material-symbols-outlined text-[22px] sm:text-[26px]">
                                        {isPlaying ? 'pause' : 'play_arrow'}
                                    </span>
                                </button>

                                {/* Rewind 10s */}
                                <button
                                    type="button"
                                    onClick={() => skipTime(-10)}
                                    className="p-1.5 hover:text-primary transition-colors cursor-pointer touch-manipulation"
                                    title="Rewind 10s"
                                >
                                    <span className="material-symbols-outlined text-[19px] sm:text-[23px]">
                                        replay_10
                                    </span>
                                </button>

                                {/* Forward 10s */}
                                <button
                                    type="button"
                                    onClick={() => skipTime(10)}
                                    className="p-1.5 hover:text-primary transition-colors cursor-pointer touch-manipulation"
                                    title="Forward 10s"
                                >
                                    <span className="material-symbols-outlined text-[19px] sm:text-[23px]">
                                        forward_10
                                    </span>
                                </button>

                                {/* Volume / Mute */}
                                <div className="flex items-center gap-1">
                                    <button
                                        type="button"
                                        onClick={toggleMute}
                                        className="p-1.5 hover:text-primary transition-colors cursor-pointer touch-manipulation"
                                        title={isMuted ? "Unmute" : "Mute"}
                                    >
                                        <span className="material-symbols-outlined text-[19px] sm:text-[23px]">
                                            {isMuted || volume === 0 ? 'volume_off' : volume < 0.5 ? 'volume_down' : 'volume_up'}
                                        </span>
                                    </button>
                                    <input
                                        type="range"
                                        min="0"
                                        max="1"
                                        step="0.05"
                                        value={isMuted ? 0 : volume}
                                        onChange={handleVolumeChange}
                                        className="w-12 sm:w-16 h-1 bg-white/30 rounded-lg appearance-none cursor-pointer accent-primary hidden md:inline-block"
                                    />
                                </div>

                                {/* Timestamp */}
                                <span className="text-[10px] sm:text-xs text-white/90 font-mono tracking-tight ml-0.5">
                                    {formatTime(currentTime)} / {formatTime(duration)}
                                </span>
                            </div>

                            {/* Right Controls: Playback Speed, Fullscreen */}
                            <div className="flex items-center gap-1.5 sm:gap-3 relative">
                                {/* Playback Speed */}
                                <div className="relative">
                                    <button
                                        type="button"
                                        onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                                        className="px-2 py-1 rounded-md hover:bg-white/10 text-xs font-bold text-white/90 hover:text-white transition-colors cursor-pointer touch-manipulation"
                                        title="Playback Speed"
                                    >
                                        {playbackRate}x
                                    </button>

                                    {showSpeedMenu && (
                                        <div className="absolute bottom-full right-0 mb-2 bg-slate-900/95 border border-white/15 rounded-xl py-1 shadow-2xl backdrop-blur-md flex flex-col min-w-[75px] z-50">
                                            {[0.75, 1, 1.25, 1.5, 2].map((rate) => (
                                                <button
                                                    key={rate}
                                                    type="button"
                                                    onClick={() => handleSpeedChange(rate)}
                                                    className={`px-3 py-1.5 text-xs text-left transition-colors cursor-pointer ${
                                                        playbackRate === rate ? 'bg-primary text-white font-bold' : 'text-white/80 hover:bg-white/10'
                                                    }`}
                                                >
                                                    {rate}x
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Fullscreen Button */}
                                <button
                                    type="button"
                                    onClick={toggleFullscreen}
                                    className="p-1.5 hover:text-primary transition-colors cursor-pointer touch-manipulation"
                                    title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
                                >
                                    <span className="material-symbols-outlined text-[22px] sm:text-[26px]">
                                        {isFullscreen ? 'fullscreen_exit' : 'fullscreen'}
                                    </span>
                                </button>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* 2. Fallback / YouTube / Vimeo Iframe Embed */}
            {!isHtml5Compatible && source.src && (
                <div className="absolute inset-0 w-full h-full">
                    <iframe 
                        src={useFallbackIframe && source.fallbackSrc ? source.fallbackSrc : source.src} 
                        className="w-full h-full border-0"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen" 
                        allowFullScreen
                        playsInline
                        title={videoTitle}
                    />
                    {/* Floating Fullscreen Trigger for Iframe */}
                    <div className="absolute bottom-3 right-3 z-30">
                        <button
                            type="button"
                            onClick={toggleFullscreen}
                            className="p-2 rounded-full bg-black/75 hover:bg-black text-white backdrop-blur-md transition-all shadow-md active:scale-90 cursor-pointer border border-white/20"
                            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
                        >
                            <span className="material-symbols-outlined text-[20px]">
                                {isFullscreen ? 'fullscreen_exit' : 'fullscreen'}
                            </span>
                        </button>
                    </div>
                </div>
            )}

            {/* Floating Security Watermark Overlay */}
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
