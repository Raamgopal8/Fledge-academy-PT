'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useCEOContext } from '@/app/ceo/CEOContext';
export default function CEOTopNav() {
    const { setIsMobileNavOpen } = useCEOContext();
    const [profile, setProfile] = useState(null);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) return;
                const res = await fetch('http://localhost:8000/api/user/profile', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setProfile(data);
                }
            } catch (err) {
                console.error(err);
            }
        };
        fetchProfile();
    }, []);

    return (
        <header className="sticky top-0 z-40 glass-header border-b border-outline-variant/10">
            <div className="flex justify-between items-center w-full px-gutter max-w-[1440px] mx-auto h-16 gap-sm md:gap-lg">
                <div className="flex items-center gap-sm md:gap-lg flex-grow md:flex-grow-0">
                    <button 
                        onClick={() => setIsMobileNavOpen(true)}
                        className="material-symbols-outlined text-on-surface hover:bg-surface-container-high p-2 rounded-full transition-colors shrink-0"
                    >
                        menu
                    </button>
                    <span className="font-display-lg text-headline-md text-primary hidden lg:block shrink-0">Academy's Overview</span>
                </div>
                
                <div className="flex items-center gap-md">
                    <Link href="/settings" className="material-symbols-outlined text-on-surface-variant hover:text-primary transition-colors hover:scale-110 active:scale-95">settings</Link>
                    <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-primary-container cursor-pointer hover:scale-105 transition-transform flex items-center justify-center bg-surface-container">
                        {profile?.profile_image_url ? (
                            <img 
                                src={profile.profile_image_url} 
                                alt={profile.name || "CEO Profile"}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <span className="material-symbols-outlined text-on-surface-variant">person</span>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
}
