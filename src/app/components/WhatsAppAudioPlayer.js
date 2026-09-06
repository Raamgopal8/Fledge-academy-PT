'use client';

import { useState, useRef, useEffect, useMemo } from 'react';

// Deterministic waveform bar heights (percentage 20% to 100%)
const DEFAULT_WAVE_PATTERN = [
    30, 55, 80, 45, 95, 70, 35, 60, 85, 100,
    65, 40, 75, 50, 90, 80, 35, 60, 95, 55,
    75, 85, 40, 65, 50, 80, 45, 90, 60, 35,
    55, 75, 40, 60
];

export default function WhatsAppAudioPlayer({
    src,
    time = '',
    avatarUrl = '',
    userName = '',
    isYou = false,
    showAvatar = true,
    className = '',
    onEnded
}) {
    const audioRef = useRef(null);
    const waveformRef = useRef(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [hasError, setHasError] = useState(false);

    // Generate unique wave pattern if audio src has hash
    const wavePattern = useMemo(() => {
        if (!src) return DEFAULT_WAVE_PATTERN;
        let hash = 0;
        for (let i = 0; i < src.length; i++) {
            hash = ((hash << 5) - hash) + src.charCodeAt(i);
            hash |= 0;
        }
        return DEFAULT_WAVE_PATTERN.map((val, idx) => {
            const mod = Math.abs((hash + idx * 17) % 55);
            return Math.min(100, Math.max(22, (val + mod) % 100));
        });
    }, [src]);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const handleLoadedMetadata = () => {
            if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
                setDuration(audio.duration);
            }
            setIsLoading(false);
        };

        const handleDurationChange = () => {
            if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
                setDuration(audio.duration);
            }
        };

        const handleTimeUpdate = () => {
            setCurrentTime(audio.currentTime);
            if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
                setDuration(audio.duration);
            }
        };

        const handleEnded = () => {
            setIsPlaying(false);
            setCurrentTime(0);
            if (onEnded) onEnded();
        };

        const handleWaiting = () => setIsLoading(true);
        const handleCanPlay = () => setIsLoading(false);
        const handleError = () => {
            setIsLoading(false);
            setHasError(true);
        };

        audio.addEventListener('loadedmetadata', handleLoadedMetadata);
        audio.addEventListener('durationchange', handleDurationChange);
        audio.addEventListener('timeupdate', handleTimeUpdate);
        audio.addEventListener('ended', handleEnded);
        audio.addEventListener('waiting', handleWaiting);
        audio.addEventListener('canplay', handleCanPlay);
        audio.addEventListener('error', handleError);

        return () => {
            audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
            audio.removeEventListener('durationchange', handleDurationChange);
            audio.removeEventListener('timeupdate', handleTimeUpdate);
            audio.removeEventListener('ended', handleEnded);
            audio.removeEventListener('waiting', handleWaiting);
            audio.removeEventListener('canplay', handleCanPlay);
            audio.removeEventListener('error', handleError);
        };
    }, [onEnded]);

    // Format seconds into m:ss
    const formatTime = (secs) => {
        if (!secs || isNaN(secs) || !isFinite(secs)) return '0:00';
        const m = Math.floor(secs / 60);
        const s = Math.floor(secs % 60);
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    const togglePlay = async () => {
        const audio = audioRef.current;
        if (!audio || hasError) return;

        try {
            if (isPlaying) {
                audio.pause();
                setIsPlaying(false);
            } else {
                setIsLoading(true);
                await audio.play();
                setIsPlaying(true);
                setIsLoading(false);
            }
        } catch (err) {
            console.error('Audio playback error:', err);
            setIsPlaying(false);
            setIsLoading(false);
        }
    };

    // Seek when clicking on waveform
    const handleSeek = (e) => {
        const audio = audioRef.current;
        const barContainer = waveformRef.current;
        if (!audio || !barContainer || !duration) return;

        const rect = barContainer.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const percentage = Math.max(0, Math.min(1, clickX / rect.width));
        const targetTime = percentage * duration;

        audio.currentTime = targetTime;
        setCurrentTime(targetTime);
    };

    const progress = duration > 0 ? currentTime / duration : 0;
    const currentBarIndex = Math.floor(progress * wavePattern.length);

    return (
        <div className={`flex items-center gap-2 sm:gap-3 py-1 px-1 select-none min-w-[220px] xs:min-w-[250px] sm:min-w-[290px] max-w-full ${className}`}>
            <audio ref={audioRef} src={src} preload="metadata" />

            {/* 1. Play / Pause Button */}
            <button
                type="button"
                onClick={togglePlay}
                disabled={hasError}
                aria-label={isPlaying ? 'Pause voice message' : 'Play voice message'}
                className={`w-8 h-8 sm:w-9 sm:h-9 shrink-0 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                    isYou 
                        ? 'text-slate-950 hover:bg-black/10 active:scale-95' 
                        : 'text-on-surface/80 hover:text-on-surface hover:bg-black/5 dark:hover:bg-white/10 active:scale-95'
                }`}
            >
                {isLoading ? (
                    <span className="material-symbols-outlined text-[22px] sm:text-[24px] animate-spin text-primary">
                        sync
                    </span>
                ) : hasError ? (
                    <span className="material-symbols-outlined text-[20px] text-error" title="Failed to load audio">
                        error
                    </span>
                ) : isPlaying ? (
                    <span className={`material-symbols-outlined text-[26px] sm:text-[28px] fill-current ${isYou ? 'text-slate-950' : 'text-on-surface'}`}>
                        pause
                    </span>
                ) : (
                    <span className={`material-symbols-outlined text-[26px] sm:text-[28px] fill-current ${isYou ? 'text-slate-950' : 'text-on-surface'}`}>
                        play_arrow
                    </span>
                )}
            </button>

            {/* 2. Center: Waveform & Timestamps */}
            <div className="flex-1 flex flex-col justify-center min-w-0">
                {/* Waveform Bars Container */}
                <div
                    ref={waveformRef}
                    onClick={handleSeek}
                    className="h-7 sm:h-8 flex items-center gap-[2px] sm:gap-[2.5px] cursor-pointer group/wave py-1"
                    title="Click to seek"
                >
                    {wavePattern.map((heightPercent, idx) => {
                        const isPlayed = idx <= currentBarIndex && (isPlaying || currentTime > 0);
                        return (
                            <div
                                key={idx}
                                style={{ height: `${heightPercent}%` }}
                                className={`flex-1 rounded-full transition-colors duration-100 ${
                                    isPlayed
                                        ? (isYou ? 'bg-[#193b68]' : 'bg-[#265998] dark:bg-[#6FB7E4]')
                                        : (isYou ? 'bg-white/80 group-hover/wave:bg-white' : 'bg-slate-300 dark:bg-slate-600 group-hover/wave:bg-slate-400 dark:group-hover/wave:bg-slate-500')
                                }`}
                            />
                        );
                    })}
                </div>

                {/* Sub-label: Duration / Playhead & Message Timestamp */}
                <div className={`flex items-center justify-between text-[10px] sm:text-[11px] font-semibold px-0.5 mt-0.5 leading-none ${
                    isYou ? 'text-slate-900/85' : 'text-on-surface-variant/75'
                }`}>
                    <span>
                        {isPlaying || currentTime > 0 ? formatTime(currentTime) : (duration ? formatTime(duration) : '0:00')}
                    </span>
                    {time && (
                        <span className="opacity-90 ml-2">{time}</span>
                    )}
                </div>
            </div>

            {/* 3. Right: Avatar with Voice Note Mic Badge */}
            {showAvatar && (
                <div className="relative shrink-0 w-10 h-10 sm:w-11 sm:h-11">
                    {/* Circular Avatar Container */}
                    <div className="w-full h-full rounded-full overflow-hidden bg-blue-100 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs shadow-xs border border-black/5 dark:border-white/10">
                        {avatarUrl ? (
                            <img
                                src={avatarUrl}
                                alt={userName || 'User'}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                    if (e.currentTarget.nextSibling) {
                                        e.currentTarget.nextSibling.style.display = 'flex';
                                    }
                                }}
                            />
                        ) : null}
                        <span
                            className="material-symbols-outlined text-[24px] sm:text-[26px] text-blue-600 dark:text-blue-400"
                            style={{ display: avatarUrl ? 'none' : 'flex' }}
                        >
                            person
                        </span>
                    </div>

                    {/* Microphone Badge at Bottom-Left */}
                    <div
                        className="absolute -bottom-0.5 -left-0.5 w-4 h-4 sm:w-4.5 sm:h-4.5 rounded-full bg-white dark:bg-slate-800 shadow-xs border border-black/10 dark:border-white/10 flex items-center justify-center"
                        title="Voice Note"
                    >
                        <span className="material-symbols-outlined text-[11px] sm:text-[12px] text-[#265998] dark:text-[#6FB7E4] font-bold leading-none">
                            mic
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
}
