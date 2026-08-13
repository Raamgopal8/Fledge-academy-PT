'use client';
import { useState, useEffect } from 'react';

export default function StudentPathway() {
    const [profile, setProfile] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

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
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-primary">
                <span className="material-symbols-outlined text-[48px] animate-spin">progress_activity</span>
                <p className="font-label-lg">Loading Pathway...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-lg bg-error-container text-on-error-container rounded-xl flex items-center gap-md max-w-3xl mx-auto mt-10">
                <span className="material-symbols-outlined text-[32px]">error</span>
                <div>
                    <h3 className="font-headline-md">Error Loading Data</h3>
                    <p className="font-body-md">{error}</p>
                </div>
            </div>
        );
    }

    const currentLevel = profile?.level || 'N5';
    
    const levels = [
        { id: 'N3', title: 'N3', index: 3 },
        { id: 'N4', title: 'N4', index: 2 },
        { id: 'N5', title: 'N5', index: 1 }
    ];

    const currentLevelIndex = levels.find(l => l.id === currentLevel)?.index || 1;

    return (
        <section className="p-gutter max-w-3xl mx-auto space-y-lg min-h-[80vh] flex flex-col pt-10">
            <div className="mb-xl text-center">
                <div className="flex items-center justify-center gap-sm mb-xs">
                    <span className="material-symbols-outlined text-primary text-4xl">route</span>
                    <h1 className="text-3xl md:text-4xl font-bold tracking-tight bg-gradient-to-r from-[#6FB7E4] via-[#5D8BCC] to-[#465AA3] text-transparent bg-clip-text">Learning Pathway</h1>
                </div>
                <p className="font-body-lg text-on-surface-variant max-w-2xl mx-auto">Track your progression through the curriculum.</p>
            </div>

            <div className="bento-card rounded-3xl bg-white p-xl border border-outline-variant shadow-sm mx-auto w-full max-w-md relative">
                <div className="flex flex-col gap-0 relative z-10">
                    {levels.map((level, idx) => {
                        const isCompleted = level.index < currentLevelIndex;
                        const isCurrent = level.index === currentLevelIndex;
                        const isLocked = level.index > currentLevelIndex;
                        
                        // We need a gap between items, we can achieve this with margin bottom except last item.
                        // Wait, instead of gap-0, let's use gap-0 and pad each item so the lines connect seamlessly.

                        return (
                            <div key={level.id} className={`flex items-start gap-md md:gap-lg ${isLocked ? 'opacity-60' : 'opacity-100'} transition-opacity pb-8 last:pb-0 relative`}>
                                {/* Node Icon/Badge */}
                                <div className="flex flex-col items-center relative z-10">
                                    <div className={`relative flex items-center justify-center w-16 h-16 rounded-full border-4 shadow-sm bg-surface flex-shrink-0 z-20
                                        ${isCompleted ? 'border-primary text-primary' : 
                                          isCurrent ? 'border-secondary bg-secondary-container text-on-secondary-container' : 
                                          'border-outline-variant text-on-surface-variant bg-surface-container-lowest'}`}>
                                        
                                        {isCompleted ? (
                                            <span className="material-symbols-outlined text-[32px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                                        ) : isCurrent ? (
                                            <span className="material-symbols-outlined text-[32px]" style={{ fontVariationSettings: "'FILL' 1" }}>stars</span>
                                        ) : (
                                            <span className="material-symbols-outlined text-[28px]">lock</span>
                                        )}
                                    </div>
                                    
                                    {/* Connecting Line to the next node down (rendered if not the last node) */}
                                    {idx !== levels.length - 1 && (
                                        <div className={`absolute top-16 w-1 h-[calc(100%+2rem)] -z-10
                                            ${isCompleted || isCurrent ? 'bg-primary' : 'bg-surface-container-high'}
                                        `} />
                                    )}
                                </div>
                                
                                {/* Node Content */}
                                <div className="flex-1 pt-3 pb-8">
                                    <div className="flex flex-wrap items-center gap-2 mb-1">
                                        <h3 className={`font-headline-sm ${isCurrent ? 'text-primary font-bold' : 'text-on-surface'}`}>
                                            {level.title}
                                        </h3>
                                        {isCurrent && (
                                            <span className="bg-primary text-on-primary px-2 py-0.5 rounded-full text-xs font-medium tracking-wide">
                                                CURRENT
                                            </span>
                                        )}
                                        {isCompleted && (
                                            <span className="bg-tertiary-container text-on-tertiary-container px-2 py-0.5 rounded-full text-xs font-medium tracking-wide">
                                                COMPLETED
                                            </span>
                                        )}
                                    </div>
                                    <p className="font-body-md text-on-surface-variant">
                                        {isCompleted ? 'Successfully finished this level.' : 
                                         isCurrent ? 'You are currently learning here.' : 
                                         'Unlock this by completing previous levels.'}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
