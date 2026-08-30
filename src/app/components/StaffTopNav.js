'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useStaffContext } from '@/app/staff/StaffContext';
import ProfileSettingsModal from './ProfileSettingsModal';
import StaffBatchSelectionModal from './StaffBatchSelectionModal';
import ThemeToggle from './ThemeToggle';
import NotificationBell from './NotificationBell';

export default function StaffTopNav() {
    const [profile, setProfile] = useState(null);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const { 
        setIsMobileNavOpen, 
        selectedBatch, 
        setSelectedBatch, 
        staffBatches, 
        setStaffBatches, 
        setIsBatchModalOpen 
    } = useStaffContext();

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
                    const bList = data.batches && data.batches.length > 0 
                        ? data.batches 
                        : (data.batch ? [data.batch] : []);
                    setStaffBatches(bList);
                }
            } catch (err) {
                console.error(err);
            }
        };
        fetchProfile();
    }, []);

    return (
        <header className="sticky top-0 z-20 bg-gradient-to-r from-[#465AA3] via-[#5D8BCC] to-[#6FB7E4] border-b border-outline-variant/10 shadow-md">
            <div className="flex justify-between items-center w-full px-4 md:px-8 lg:px-12 max-w-[1440px] mx-auto h-12 gap-sm md:gap-lg">
                <div className="flex items-center gap-sm md:gap-lg flex-grow md:flex-grow-0">
                    <button 
                        onClick={() => setIsMobileNavOpen(true)}
                        className="material-symbols-outlined text-white hover:bg-white/10 p-2 rounded-full transition-colors shrink-0 cursor-pointer"
                    >
                        menu
                    </button>
                    <img src="/fledgeacad.png" alt="Logo" className="h-18 w-auto object-contain shrink-0 hidden md:block brightness-0 invert" />
                </div>
                
                <div className="flex items-center gap-2 md:gap-md text-white">
                    {/* Batch Switcher Button */}
                    <button 
                        onClick={() => setIsBatchModalOpen(true)}
                        className="bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-xl font-label-md transition-colors flex items-center gap-1.5 text-xs sm:text-sm border border-white/20 hover:border-white/40 shadow-xs cursor-pointer active:scale-95 max-w-[140px] sm:max-w-none"
                        title="Switch Batch"
                    >
                        <span className="material-symbols-outlined text-[18px] shrink-0">swap_horiz</span>
                        <span className="truncate">{selectedBatch || (staffBatches && staffBatches.length > 0 ? staffBatches[0] : 'Select Batch')}</span>
                    </button>

                    <NotificationBell />
                    <ThemeToggle />

                    <button onClick={() => setIsSettingsOpen(true)} className="w-8 h-8 sm:w-10 sm:h-10 rounded-full overflow-hidden border-2 border-white/30 cursor-pointer hover:scale-105 transition-transform flex items-center justify-center bg-white/10 shrink-0">
                        {profile?.profile_image_url ? (
                            <img 
                                className="w-full h-full object-cover" 
                                alt={profile.name || "Profile"} 
                                src={profile.profile_image_url} 
                            />
                        ) : (
                            <span className="material-symbols-outlined text-white">person</span>
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
            <StaffBatchSelectionModal />
        </header>
    );
}
