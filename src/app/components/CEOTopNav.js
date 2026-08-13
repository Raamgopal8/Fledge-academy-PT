'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useCEOContext } from '@/app/ceo/CEOContext';
import ProfileSettingsModal from './ProfileSettingsModal';
import ThemeToggle from './ThemeToggle';
export default function CEOTopNav() {
    const { setIsMobileNavOpen } = useCEOContext();
    const [profile, setProfile] = useState(null);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) return;
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/user/profile`, {
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
    
    return(
        <header className="sticky top-0 z-20 bg-gradient-to-r from-[#465AA3] via-[#5D8BCC] to-[#6FB7E4] border-b border-outline-variant/10 shadow-md">
            <div className="flex justify-between items-center w-full px-gutter max-w-[1440px] mx-auto h-12 gap-sm md:gap-lg">
                <div className="flex items-center gap-sm md:gap-lg flex-grow md:flex-grow-0">
                    <button 
                        onClick={() => setIsMobileNavOpen(true)}
                        className="material-symbols-outlined text-white hover:bg-white/10 p-2 rounded-full transition-colors shrink-0"
                    >
                        menu
                    </button>
                    <img src="/fledgeacad.png" alt="Logo" className="h-18 w-auto object-contain shrink-0 hidden md:block brightness-0 invert" />
                </div>
                
                <div className="flex items-center gap-md text-white">
                    <ThemeToggle />
                    <button onClick={() => setIsSettingsOpen(true)} className="w-10 h-10 rounded-full overflow-hidden border-2 border-white/30 cursor-pointer hover:scale-105 transition-transform flex items-center justify-center bg-white/10">
                        {profile?.profile_image_url ? (
                            <img 
                                src={profile.profile_image_url} 
                                alt={profile.name || "CEO Profile"}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <span className="material-symbols-outlined text-on-surface-variant">person</span>
                        )}
                    </button>
                </div>
            </div>
            <ProfileSettingsModal 
                isOpen={isSettingsOpen} 
                onClose={() => setIsSettingsOpen(false)} 
                currentProfile={profile} 
                onProfileUpdated={setProfile} 
            />
        </header>
    );
}
