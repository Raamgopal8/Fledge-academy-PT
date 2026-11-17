'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAdminContext } from '@/app/admin/AdminContext';
import ProfileSettingsModal from './ProfileSettingsModal';
import ThemeToggle from './ThemeToggle';
import NotificationBell from './NotificationBell';
import { useRouter } from 'next/navigation';
import { performLogout } from '../utils/activityLogger';

export default function AdminTopNav() {
    const context = useAdminContext();
    const setIsMobileNavOpen = context?.setIsMobileNavOpen || (() => {});
    const isSidebarCollapsed = context?.isSidebarCollapsed || false;
    const setIsSidebarCollapsed = context?.setIsSidebarCollapsed || (() => {});
    const selectedBatch = context?.selectedBatch;
    const setSelectedBatch = context?.setSelectedBatch || (() => {});
    const selectedLevel = context?.selectedLevel || 'All Levels';
    const setIsBatchModalOpen = context?.setIsBatchModalOpen || (() => {});
    const router = useRouter();
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
                <div className="flex items-center gap-2 md:gap-md flex-shrink-0">
                    {/* Toggle button: Toggles collapsed icon rail on desktop, drawer on mobile */}
                    <button 
                        onClick={() => {
                            if (window.innerWidth < 768) {
                                setIsMobileNavOpen(true);
                            } else {
                                setIsSidebarCollapsed(!isSidebarCollapsed);
                            }
                        }}
                        className="material-symbols-outlined text-white hover:bg-white/10 p-1.5 md:p-2 rounded-full transition-colors shrink-0 cursor-pointer"
                        title={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                    >
                        {isSidebarCollapsed ? "menu" : "menu_open"}
                    </button>
                   
                </div>
                
                <div className="flex items-center gap-1.5 sm:gap-md text-white min-w-0">
                    <button 
                        onClick={() => setIsBatchModalOpen(true)}
                        className="bg-white/20 hover:bg-white/30 px-2.5 py-1 sm:px-sm sm:py-xs rounded-lg font-label-md transition-colors flex items-center gap-1.5 text-xs sm:text-sm border border-white/20 hover:border-white/40 shadow-xs cursor-pointer active:scale-95 max-w-[200px] sm:max-w-none truncate"
                        title="Change Level & Batch Scope"
                    >
                        <span className="material-symbols-outlined text-[15px] sm:text-[16px] shrink-0">tune</span>
                        <span className="truncate">
                            {selectedLevel === 'All Levels' ? 'Global Lvl' : selectedLevel} • {selectedBatch === 'All Batches' ? 'Global Batch' : (selectedBatch || 'No Batch')}
                        </span>
                    </button>
                    <NotificationBell />
                    <ThemeToggle />
                    <button onClick={() => setIsSettingsOpen(true)} className="w-8 h-8 sm:w-10 sm:h-10 rounded-full overflow-hidden border-2 border-white/30 cursor-pointer hover:scale-105 transition-transform flex items-center justify-center bg-white/10 shrink-0">
                        {profile?.profile_image_url ? (
                            <img 
                                src={profile.profile_image_url} 
                                alt={profile.name || "Admin Profile"}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <span className="material-symbols-outlined text-[18px] sm:text-[24px] text-white">person</span>
                        )}
                    </button>
                    <button type="button" onClick={()=>performLogout(router)} className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border border-white/20 hover:border-white/40 bg-white/10 hover:bg-red-500/80 transition-all flex items-center justify-center cursor-pointer active:scale-95 shrink-0"
                        title="Logout">
                            <span className="material-symbols-outlined text-[18px] sm:text-[20px] text-white">logout</span>                      
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
