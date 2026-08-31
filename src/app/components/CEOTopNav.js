'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useCEOContext } from '@/app/ceo/CEOContext';
import ProfileSettingsModal from './ProfileSettingsModal';
import ThemeToggle from './ThemeToggle';
import NotificationBell from './NotificationBell';
export default function CEOTopNav() {
    const { setIsMobileNavOpen, selectedBatch, setSelectedBatch } = useCEOContext();
    const [profile, setProfile] = useState(null);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) return;
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/user/profile`, {
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

        const handleProfileUpdate = (e) => {
            if (e.detail) {
                setProfile(prev => ({ ...(prev || {}), ...e.detail }));
            }
        };

        window.addEventListener('fledge_profile_updated', handleProfileUpdate);
        return () => {
            window.removeEventListener('fledge_profile_updated', handleProfileUpdate);
        };
    }, []);
    
    return(
        <header className="sticky top-0 z-20 bg-gradient-to-r from-[#465AA3] via-[#5D8BCC] to-[#6FB7E4] border-b border-outline-variant/10 shadow-md w-full max-w-full overflow-hidden">
            <div className="flex justify-between items-center w-full px-3 md:px-gutter max-w-[1440px] mx-auto h-12 gap-2 md:gap-lg">
                <div className="flex items-center gap-2 md:gap-lg flex-shrink-0">
                    <button 
                        onClick={() => setIsMobileNavOpen(true)}
                        className="material-symbols-outlined text-white hover:bg-white/10 p-1.5 md:p-2 rounded-full transition-colors shrink-0"
                    >
                        menu
                    </button>
                    <img src="/fledgeacad.png" alt="Logo" className="h-14 md:h-18 w-auto object-contain shrink-0 hidden md:block brightness-0 invert" />
                </div>
                
                <div className="flex items-center gap-1.5 sm:gap-md text-white min-w-0">
                    <button 
                        onClick={() => setSelectedBatch(null)}
                        className="bg-white/20 hover:bg-white/30 px-2 py-1 sm:px-sm sm:py-xs rounded-lg font-label-md transition-colors flex items-center gap-1 text-xs sm:text-sm max-w-[130px] sm:max-w-none truncate"
                        title="Change Batch"
                    >
                        <span className="material-symbols-outlined text-[14px] sm:text-[16px] shrink-0">domain</span>
                        <span className="truncate">{selectedBatch === 'All Batches' ? 'Global' : (selectedBatch || 'Batch')}</span>
                    </button>
                    <NotificationBell />
                    <ThemeToggle />
                    <button onClick={() => setIsSettingsOpen(true)} className="w-8 h-8 sm:w-10 sm:h-10 rounded-full overflow-hidden border-2 border-white/30 cursor-pointer hover:scale-105 transition-transform flex items-center justify-center bg-white/10 shrink-0">
                        {profile?.profile_image_url ? (
                            <img 
                                src={profile.profile_image_url} 
                                alt={profile.name || "CEO Profile"}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <span className="material-symbols-outlined text-[18px] sm:text-[24px] text-white">person</span>
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
