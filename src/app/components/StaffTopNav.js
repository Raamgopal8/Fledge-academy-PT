'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useStaffContext } from '@/app/staff/StaffContext';
import ProfileSettingsModal from './ProfileSettingsModal';
import ThemeToggle from './ThemeToggle';

export default function StaffTopNav() {
    const [profile, setProfile] = useState(null);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const { setIsMobileNavOpen } = useStaffContext();

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

    return (
        <header className="h-16 bg-surface shadow-sm sticky top-0 z-40 flex justify-between items-center px-gutter w-full">
            <div className="flex items-center gap-sm md:gap-md w-full md:w-auto">
                <button 
                    onClick={() => setIsMobileNavOpen(true)}
                    className="p-2 text-on-surface-variant hover:bg-surface-container-high rounded-full transition-colors active:scale-95 shrink-0"
                >
                    <span className="material-symbols-outlined">menu</span>
                </button>
            </div>
            <div className="flex items-center gap-sm">
                <ThemeToggle />
                <button onClick={() => setIsSettingsOpen(true)} className="h-8 w-8 rounded-full overflow-hidden ml-sm bg-surface-container-high border border-outline-variant cursor-pointer hover:ring-2 hover:ring-primary hover:ring-offset-2 transition-all flex items-center justify-center">
                    {profile?.profile_image_url ? (
                        <img 
                            className="h-full w-full object-cover" 
                            alt={profile.name || "Profile"} 
                            src={profile.profile_image_url} 
                        />
                    ) : (
                        <span className="material-symbols-outlined text-on-surface-variant text-[20px]">person</span>
                    )}
                </button>
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
