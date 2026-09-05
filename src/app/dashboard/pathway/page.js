'use client';
import Link from 'next/link';
import { useState, useEffect } from 'react';

export default function StudentPathway() {
    const [profile, setProfile] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeNode, setActiveNode] = useState(null);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/user/profile`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!res.ok) throw new Error('Failed to fetch profile');
                const data = await res.json();
                setProfile(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };
        fetchProfile();
    }, []);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[70vh] gap-4 text-[#e9c176]">
                <div className="relative">
                    <span className="material-symbols-outlined text-[56px] animate-spin text-[#e9c176]">progress_activity</span>
                    <div className="absolute inset-0 rounded-full blur-md bg-[#e9c176]/30 animate-pulse"></div>
                </div>
                <p className="font-semibold text-lg tracking-wide text-[#e9e1d8] font-['Hanken_Grotesk']">Loading Your Pathway...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-8 bg-[#2d1214] border border-[#ffb4ab]/30 text-[#ffdad6] rounded-2xl flex items-center gap-5 max-w-2xl mx-auto mt-12 shadow-2xl backdrop-blur-md">
                <span className="material-symbols-outlined text-[36px] text-[#ffb4ab]">error</span>
                <div>
                    <h3 className="text-xl font-bold text-[#ffb4ab] font-['Noto_Serif']">Error Loading Pathway</h3>
                    <p className="text-sm text-[#e9e1d8]/80 mt-1 font-['Hanken_Grotesk']">{error}</p>
                </div>
            </div>
        );
    }

    const currentLevel = profile?.level || 'Level 5';
    
    // Mapping: Level 5 is N5 (beginner), Level 1 is N1 (mastery)
    const levelsMapping = {
        'Level 5': 1,
        'Level 4': 2,
        'Level 3': 3,
        'Level 2': 4,
        'Level 1': 5
    };
    
    const currentLevelIndex = levelsMapping[currentLevel] || 1;

    const nodes = [
        {
            id: 'N5',
            badgeText: '5',
            levelName: 'Level 5',
            title: 'Level 5 · The Beginning',
            tagline: 'Make your first Japanese moments yours.',
            subtitle: 'The Beginning',
            kanji: '初級',
            desc: 'Learn to recognise the language around you, build your first sentences and handle the little interactions that make Japan feel less unfamiliar.',
            readThis: {
                label: 'YOU CAN READ THIS',
                japanese: 'ありがとう',
                translation: '“Thank you.”'
            },
            sayThis: {
                label: 'YOU CAN SAY THIS',
                japanese: 'はじめまして。',
                translation: '“Nice to meet you.”'
            },
            realLifeUnlock: {
                label: 'REAL-LIFE UNLOCK',
                text: 'Order a simple drink without switching back to English.'
            },
            tags: ['✦ First words', 'あ Kana', '✪ Everyday Japanese'],
            lessonsCount: '48 Lessons',
            vocabCount: '800 Words',
            accent: '#a4d2a4',
            accentBg: 'rgba(164, 210, 164, 0.15)',
            accentBorder: 'rgba(164, 210, 164, 0.4)',
            index: 1,
            alignment: 'justify-center lg:justify-end'
        },
        {
            id: 'N4',
            badgeText: '4',
            badgeStatus: 'NEXT',
            levelName: 'Level 4',
            title: 'Level 4 · Finding Your Voice',
            tagline: 'Japanese stops being a script.',
            subtitle: 'Finding Your Voice',
            kanji: '中級への入口',
            desc: "You'll move from prepared answers to everyday exchanges — asking, answering, reacting and keeping a conversation going.",
            stackedCards: [
                {
                    label: "ONE DAY YOU'LL HEAR THIS",
                    japanese: "週末は何をしましたか？",
                    subtext: "And understand what is being asked without translating every word."
                },
                {
                    label: "ONE DAY YOU'LL ANSWER",
                    japanese: "友達と映画を見ました。",
                    subtext: "“I watched a movie with my friend.”"
                }
            ],
            unlockText: 'UNLOCK WHEN LEVEL 5 IS COMPLETE',
            lessonsCount: '62 Lessons',
            vocabCount: '1,500 Words',
            accent: '#8aacad',
            accentBg: 'rgba(138, 172, 173, 0.15)',
            accentBorder: 'rgba(138, 172, 173, 0.4)',
            index: 2,
            alignment: 'justify-center'
        },
        {
            id: 'N3',
            badgeText: '3',
            badgeStatus: 'AHEAD',
            levelName: 'Level 3',
            title: 'Level 3 · Seeing Further',
            tagline: 'You stop waiting for the question.',
            subtitle: 'Seeing Further',
            kanji: '中級',
            desc: "Start asking your own questions, giving opinions, explaining reasons and following conversations that aren't written for a textbook.",
            sideBySide: [
                {
                    label: 'ASK',
                    japanese: 'どうしてそう思うんですか？'
                },
                {
                    label: 'EXPLAIN',
                    japanese: '日本で働きたいので…'
                }
            ],
            quote: '"You don\'t just know the answer. You can explain why."',
            quoteHighlight: 'why.',
            unlockText: 'UNLOCK WHEN LEVEL 4 IS COMPLETE',
            lessonsCount: '75 Lessons',
            vocabCount: '3,000 Words',
            accent: '#aacdce',
            accentBg: 'rgba(170, 205, 206, 0.15)',
            accentBorder: 'rgba(170, 205, 206, 0.4)',
            index: 3,
            alignment: 'justify-center lg:justify-start'
        },
        {
            id: 'N2',
            badgeText: '2',
            badgeStatus: 'AHEAD',
            levelName: 'Level 2',
            title: 'Level 2 · Moving Independently',
            tagline: 'Japanese leaves the classroom.',
            subtitle: 'Moving Independently',
            kanji: '上級',
            desc: 'Work, messages, relationships, plans and problems become part of your language journey.',
            sideBySide: [
                {
                    label: 'AT WORK',
                    japanese: 'よろしくお願いいたします。',
                    subtext: 'Write with the right level of formality.'
                },
                {
                    label: 'IN LIFE',
                    japanese: 'ずっと一緒にいたい。',
                    subtext: 'Express something that actually matters to you.'
                }
            ],
            quote: '"You don\'t need a translation for every important moment."',
            unlockText: 'UNLOCK WHEN LEVEL 3 IS COMPLETE',
            lessonsCount: '90 Lessons',
            vocabCount: '6,000 Words',
            accent: '#e9c176',
            accentBg: 'rgba(233, 193, 118, 0.15)',
            accentBorder: 'rgba(233, 193, 118, 0.4)',
            index: 4,
            alignment: 'justify-center'
        },
        {
            id: 'N1',
            badgeText: '1',
            badgeStatus: 'THE SUMMIT',
            levelName: 'Level 1',
            title: 'Level 1 · Reading Between the Lines',
            tagline: "The words aren't always the whole message.",
            subtitle: 'Reading Between the Lines',
            kanji: '最上級',
            desc: 'Understand nuance, indirectness, formal language and complex ideas — not only what was said, but why it was said that way.',
            rowCards: [
                {
                    japanese: 'ちょっと……',
                    label: 'LOOK CLOSER',
                    subtext1: 'Literally: “a little…”',
                    subtext2: 'Sometimes it means: “That may be difficult.”'
                },
                {
                    japanese: '考えておきます。',
                    label: 'READ THE ROOM',
                    subtext1: '“I\'ll think about it.”',
                    subtext2: 'It may not be a promise.'
                }
            ],
            quote: '"Mastery is not knowing every word. It\'s understanding the space between them."',
            unlockText: 'UNLOCK WHEN LEVEL 2 IS COMPLETE',
            lessonsCount: '110 Lessons',
            vocabCount: '10,000+ Words',
            accent: '#c5a059',
            accentBg: 'rgba(197, 160, 89, 0.15)',
            accentBorder: 'rgba(197, 160, 89, 0.4)',
            index: 5,
            alignment: 'justify-center lg:justify-end'
        }
    ];

    return (
        <div className="relative zenpath-wrapper -m-4 sm:-m-6 lg:-m-8 min-h-screen bg-[#16130e] text-[#e9e1d8] overflow-x-hidden scroll-smooth selection:bg-[#e9c176]/30 selection:text-[#ffdea5]">
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Noto+Serif:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Hanken+Grotesk:wght@300;400;500;600;700&display=swap');
                
                html {
                    scroll-behavior: smooth;
                }

                .zenpath-wrapper {
                    font-family: 'Hanken Grotesk', sans-serif;
                }

                .font-serif-title {
                    font-family: 'Noto Serif', serif;
                }

                .glass-card {
                    background: rgba(22, 19, 14, 0.65);
                    backdrop-filter: blur(24px);
                    -webkit-backdrop-filter: blur(24px);
                    border: 1px solid rgba(197, 160, 89, 0.22);
                    box-shadow: 0 12px 40px -10px rgba(0, 0, 0, 0.7), 0 0 1px 1px rgba(233, 193, 118, 0.1);
                    transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
                }

                .glass-card:hover {
                    transform: translateY(-6px) scale(1.01);
                    border-color: rgba(233, 193, 118, 0.6);
                    box-shadow: 0 20px 50px -10px rgba(0, 0, 0, 0.8), 0 0 30px rgba(233, 193, 118, 0.2);
                }

                .current-node-pulse {
                    animation: floatGlow 4s ease-in-out infinite alternate;
                }

                @keyframes floatGlow {
                    0% {
                        transform: translateY(0px);
                        box-shadow: 0 12px 40px -10px rgba(0, 0, 0, 0.7), 0 0 25px rgba(233, 193, 118, 0.25);
                        border-color: rgba(233, 193, 118, 0.6);
                    }
                    100% {
                        transform: translateY(-8px);
                        box-shadow: 0 24px 50px -10px rgba(0, 0, 0, 0.8), 0 0 45px rgba(233, 193, 118, 0.45);
                        border-color: rgba(233, 193, 118, 0.9);
                    }
                }

                @keyframes pulsePath {
                    0% {
                        stroke-dashoffset: 0;
                    }
                    100% {
                        stroke-dashoffset: 60;
                    }
                }

                .animated-path {
                    stroke-dasharray: 8 6;
                    animation: pulsePath 25s linear infinite;
                }

                .shine-overlay {
                    position: relative;
                    overflow: hidden;
                }
                .shine-overlay::after {
                    content: '';
                    position: absolute;
                    top: -50%;
                    left: -60%;
                    width: 200%;
                    height: 200%;
                    background: linear-gradient(
                        60deg,
                        transparent 30%,
                        rgba(255, 255, 255, 0.05) 50%,
                        transparent 70%
                    );
                    transform: rotate(25deg);
                    transition: all 0.75s ease;
                }
                .shine-overlay:hover::after {
                    left: 100%;
                }
            `}</style>

            {/* Background Layer with Mystical Forest Artwork */}
            <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
                <img 
                    alt="Mystical forest winding path with cherry blossoms" 
                    className="w-full h-full object-cover opacity-60 scale-105 transition-transform duration-1000 ease-out" 
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuCHWGup2E6mdiBaQ3_5RzJ171ui24CmPOOnKROxNdSEWUcn0KozUGqJA4V03pZHs3g98kUZLQto-fU6WRCtfp24h9OjRkTsEspoez1MW4wG6dGUOiUUq9juwoDNBKvcGhpwBSSdCeoeVnLla16Eo2SX0tS-_-k5NW3GSrJ-oA60udGp34JRheywix_a-gdVc6cFXhPxCU3h6ExJE0dK-aEJ4tVgz0KPLr9_HI5N5cn1XDkGxHp0ToY5OP1WSP2lKfaMQA" 
                />
                <div className="absolute inset-0 bg-gradient-to-b from-[#16130e]/80 via-[#16130e]/50 to-[#16130e]/95"></div>
                <div className="absolute inset-0 bg-radial from-transparent via-[#16130e]/40 to-[#16130e]/90"></div>
            </div>

            {/* Main Scrollable Canvas */}
            <main className="relative z-10 min-h-[170vh] pb-32 pt-8 md:pt-14 px-4 sm:px-8 max-w-6xl mx-auto flex flex-col justify-between">
                
                {/* Header Banner */}
                <div className="text-center mb-12 relative z-20">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#e9c176]/10 border border-[#e9c176]/30 text-[#e9c176] text-xs font-semibold uppercase tracking-widest mb-3 backdrop-blur-md">
                        <span className="material-symbols-outlined text-sm">explore</span>
                        Curriculum Milestone Pathway
                    </div>
                    <h1 className="font-serif-title text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white mb-3 drop-shadow-md">
                        Learning Journey
                    </h1>
                    <p className="text-[#d1c5b4] text-sm sm:text-base leading-relaxed">
                        Follow the ancient road from fundamental kana to fluent mastery. Progress at your own pace through each milestone.
                    </p>
                </div>

                {/* SVG Connecting Path */}
                <div className="absolute inset-0 top-36 bottom-20 w-full pointer-events-none z-0">
                    <svg className="w-full h-full opacity-40" preserveAspectRatio="none" viewBox="0 0 100 100">
                        <defs>
                            <linearGradient id="zen-gold-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#a4d2a4" />
                                <stop offset="25%" stopColor="#8aacad" />
                                <stop offset="50%" stopColor="#aacdce" />
                                <stop offset="75%" stopColor="#e9c176" />
                                <stop offset="100%" stopColor="#c5a059" />
                            </linearGradient>
                            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                                <feGaussianBlur stdDeviation="1.5" result="blur" />
                                <feComposite in="SourceGraphic" in2="blur" operator="over" />
                            </filter>
                        </defs>
                        <path 
                            d="M 80 8 Q 68 18 64 28 Q 60 38 42 48 Q 24 58 28 68 Q 32 78 50 88 Q 68 94 75 98" 
                            fill="none" 
                            stroke="url(#zen-gold-gradient)" 
                            strokeWidth="0.8" 
                            className="animated-path"
                            filter="url(#glow)"
                        />
                    </svg>
                </div>

                {/* Nodes List */}
                <div className="relative z-10 flex flex-col gap-16 md:gap-24 my-auto py-6">
                    {nodes.map((node) => {
                        const isCompleted = node.index < currentLevelIndex;
                        const isCurrent = node.index === currentLevelIndex;
                        const isLocked = node.index > currentLevelIndex;

                        return (
                            <div 
                                key={node.id} 
                                className={`flex w-full ${node.alignment} transition-all duration-500`}
                            >
                                <div 
                                    onClick={() => setActiveNode(activeNode === node.id ? null : node.id)}
                                    className={`
                                        glass-card shine-overlay rounded-3xl p-5 sm:p-7 w-full max-w-[460px] min-w-0 cursor-pointer
                                        ${isCurrent ? 'current-node-pulse ring-2 ring-[#e9c176]/50' : ''}
                                        ${isLocked ? 'opacity-70 hover:opacity-95' : 'opacity-100'}
                                    `}
                                >
                                    {/* Header / Top Row */}
                                    <div className="flex items-start justify-between gap-4 mb-4">
                                        <div className="flex items-center gap-4">
                                            {/* Badge */}
                                            <div 
                                                className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex-shrink-0 flex items-center justify-center border shadow-inner relative transition-transform duration-300 group-hover:scale-105"
                                                style={{ 
                                                    backgroundColor: '#231f1a', 
                                                    borderColor: isCurrent ? '#e9c176' : node.accentBorder 
                                                }}
                                            >
                                                <span 
                                                    className="font-serif-title text-2xl sm:text-3xl font-bold tracking-tight"
                                                    style={{ color: node.accent }}
                                                >
                                                    {node.badgeText || node.id}
                                                </span>
                                                <span className="absolute -bottom-1.5 text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded-full bg-[#16130e] border border-white/10 text-[#d1c5b4]">
                                                    {node.kanji}
                                                </span>
                                            </div>

                                            {/* Title & Subtitle */}
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h3 className="font-serif-title text-xl sm:text-2xl font-bold text-[#e9e1d8] leading-tight">
                                                        {node.title}
                                                    </h3>
                                                </div>
                                                {node.tagline ? (
                                                    <p className="text-sm font-semibold text-[#e9e1d8] mt-1">
                                                        {node.tagline}
                                                    </p>
                                                ) : (
                                                    <p className="text-xs uppercase tracking-widest font-semibold text-[#d1c5b4] mt-0.5">
                                                        {node.subtitle}
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        {/* Status Badge */}
                                        <div className="flex-shrink-0">
                                            {isCompleted && (
                                                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#a4d2a4]/15 border border-[#a4d2a4]/40 text-[#a4d2a4] text-xs font-bold shadow-sm">
                                                    <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                                                    <span>PASSED</span>
                                                </div>
                                            )}
                                            {isCurrent && (
                                                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#e9c176]/20 border border-[#e9c176]/60 text-[#ffdea5] text-xs font-bold animate-pulse shadow-md">
                                                    <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>play_circle</span>
                                                    <span>ACTIVE</span>
                                                </div>
                                            )}
                                            {isLocked && (
                                                <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/40 border border-white/10 text-[#d1c5b4]/70 text-[11px] font-semibold tracking-wider uppercase">
                                                    {node.badgeStatus ? (
                                                        <span>~ {node.badgeStatus}</span>
                                                    ) : (
                                                        <span className="material-symbols-outlined text-sm">lock</span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Description */}
                                    <p className="text-sm sm:text-base leading-relaxed text-[#d1c5b4] mb-4 font-normal">
                                        {node.desc}
                                    </p>

                                    {/* Level 5: Read & Say */}
                                    {node.readThis && node.sayThis && (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                                            <div className="bg-[#1c1813]/80 border border-white/5 rounded-2xl p-3.5">
                                                <span className="text-[10px] uppercase font-bold tracking-wider text-[#d1c5b4]/60 block mb-1">
                                                    {node.readThis.label}
                                                </span>
                                                <div className="text-xl font-bold text-white mb-0.5">
                                                    {node.readThis.japanese}
                                                </div>
                                                <div className="text-xs text-[#d1c5b4]/80 italic">
                                                    {node.readThis.translation}
                                                </div>
                                            </div>
                                            <div className="bg-[#1c1813]/80 border border-white/5 rounded-2xl p-3.5">
                                                <span className="text-[10px] uppercase font-bold tracking-wider text-[#d1c5b4]/60 block mb-1">
                                                    {node.sayThis.label}
                                                </span>
                                                <div className="text-xl font-bold text-white mb-0.5">
                                                    {node.sayThis.japanese}
                                                </div>
                                                <div className="text-xs text-[#d1c5b4]/80 italic">
                                                    {node.sayThis.translation}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Level 5: Real Life Unlock */}
                                    {node.realLifeUnlock && (
                                        <div className="bg-[#1c1813]/80 border border-white/5 rounded-2xl p-3.5 mb-3 flex items-start gap-2.5">
                                            <div className="w-6 h-6 rounded-full bg-[#e9c176]/15 text-[#e9c176] flex items-center justify-center shrink-0 mt-0.5">
                                                <span className="text-xs">☕</span>
                                            </div>
                                            <div>
                                                <span className="text-[10px] uppercase font-bold tracking-wider text-[#d1c5b4]/60 block mb-0.5">
                                                    {node.realLifeUnlock.label}
                                                </span>
                                                <p className="text-xs text-[#d1c5b4]">
                                                    {node.realLifeUnlock.text}
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {/* Level 5: Tags */}
                                    {node.tags && node.tags.length > 0 && (
                                        <div className="flex flex-wrap items-center gap-2 mb-4">
                                            {node.tags.map((tag, tIdx) => (
                                                <span key={tIdx} className="text-[11px] font-medium px-3 py-1 rounded-full bg-black/40 border border-white/10 text-[#d1c5b4]">
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    )}

                                    {/* Level 4: Stacked Cards */}
                                    {node.stackedCards && (
                                        <div className="space-y-3 mb-4">
                                            {node.stackedCards.map((card, cIdx) => (
                                                <div key={cIdx} className="bg-[#1c1813]/80 border border-white/5 rounded-2xl p-3.5">
                                                    <span className="text-[10px] uppercase font-bold tracking-wider text-[#d1c5b4]/60 block mb-1">
                                                        {card.label}
                                                    </span>
                                                    <div className="text-lg sm:text-xl font-bold text-white mb-0.5">
                                                        {card.japanese}
                                                    </div>
                                                    <div className="text-xs text-[#d1c5b4]/80">
                                                        {card.subtext}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Levels 3 & 2: Side by Side Cards */}
                                    {node.sideBySide && (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                                            {node.sideBySide.map((card, cIdx) => (
                                                <div key={cIdx} className="bg-[#1c1813]/80 border border-white/5 rounded-2xl p-3.5 flex flex-col justify-center">
                                                    <span className="text-[10px] uppercase font-bold tracking-wider text-[#d1c5b4]/60 block mb-1">
                                                        {card.label}
                                                    </span>
                                                    <div className="text-lg sm:text-xl font-bold text-white mb-0.5">
                                                        {card.japanese}
                                                    </div>
                                                    {card.subtext && (
                                                        <div className="text-xs text-[#d1c5b4]/80 mt-0.5">
                                                            {card.subtext}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Level 1: Row Cards */}
                                    {node.rowCards && (
                                        <div className="space-y-3 mb-3">
                                            {node.rowCards.map((row, rIdx) => (
                                                <div key={rIdx} className="bg-[#1c1813]/80 border border-white/5 rounded-2xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                                    <div className="text-xl sm:text-2xl font-bold text-white shrink-0 min-w-[130px]">
                                                        {row.japanese}
                                                    </div>
                                                    <div className="border-t sm:border-t-0 sm:border-l border-white/10 pt-2 sm:pt-0 sm:pl-4 flex-1">
                                                        <span className="text-[10px] uppercase font-bold tracking-wider text-[#d1c5b4]/60 block mb-0.5">
                                                            {row.label}
                                                        </span>
                                                        <p className="text-xs text-[#d1c5b4]/60 italic mb-0.5">
                                                            {row.subtext1}
                                                        </p>
                                                        <p className="text-xs font-semibold text-[#e9e1d8]">
                                                            {row.subtext2}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Quotes for Levels 3, 2, 1 */}
                                    {node.quote && (
                                        <div className="border-l-2 border-[#e9c176]/50 pl-3.5 py-1 mb-4 text-xs italic text-[#d1c5b4] leading-relaxed">
                                            {node.quoteHighlight ? (
                                                <span>
                                                    {node.quote.split(node.quoteHighlight)[0]}
                                                    <span className="text-[#e9c176] font-semibold not-italic">{node.quoteHighlight}</span>
                                                    {node.quote.split(node.quoteHighlight)[1]}
                                                </span>
                                            ) : (
                                                <span>{node.quote}</span>
                                            )}
                                        </div>
                                    )}

                                    {/* Meta pills / footer */}
                                    <div className="flex items-center justify-between pt-4 border-t border-[#4e4639]/30 text-xs text-[#d1c5b4]/80">
                                        <div className="flex items-center gap-3">
                                            <span className="flex items-center gap-1">
                                                <span className="material-symbols-outlined text-sm text-[#e9c176]">auto_stories</span>
                                                {node.lessonsCount}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <span className="material-symbols-outlined text-sm text-[#8aacad]">translate</span>
                                                {node.vocabCount}
                                            </span>
                                        </div>

                                        {isCurrent && (
                                           <Link href={`/dashboard`} className="font-bold text-[#e9c176] flex items-center gap-1 hover:underline">
                                                Continue <span className="material-symbols-outlined text-xs">arrow_forward</span>
                                           </Link>
                                        )}
                                        {isCompleted && (
                                            <span className="font-medium text-[#a4d2a4] flex items-center gap-1">
                                                Review Materials
                                            </span>
                                        )}
                                        {isLocked && (
                                            <span className="text-[#d1c5b4]/50 italic text-[11px] tracking-wider uppercase font-medium">
                                                {node.unlockText || `Unlock at ${node.levelName}`}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Note For Your Future Self Card */}
                <div className="glass-card rounded-3xl p-5 sm:p-7 max-w-2xl mx-auto w-full flex items-center gap-5 mt-10 mb-4 border border-[#e9c176]/25 bg-[#1c1813]/85 shadow-2xl">
                    <div className="w-12 h-12 rounded-full bg-[#e9c176]/10 border border-[#e9c176]/30 flex items-center justify-center shrink-0 text-[#e9c176] font-serif-title text-xl font-bold">
                        花
                    </div>
                    <div>
                        <span className="text-[10px] uppercase font-bold tracking-widest text-[#e9c176]/80 block mb-1">
                            A NOTE FOR YOUR FUTURE SELF
                        </span>
                        <h4 className="text-base sm:text-lg font-bold text-white mb-1 font-serif-title">
                            One day, you'll stop noticing how far you've come.
                        </h4>
                        <p className="text-xs sm:text-sm text-[#d1c5b4]/80 leading-relaxed">
                            The sentence you once had to translate will become a sentence you simply understand.
                        </p>
                    </div>
                </div>

                {/* Footer indicator */}
                <div className="text-center mt-8 text-xs text-[#d1c5b4]/60">
                    <p className="tracking-wide">✦ Japanese Language Proficiency Roadmap (JLPT N5 → N1) ✦</p>
                </div>
            </main>
        </div>
    );
}
