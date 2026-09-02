'use client';

import { useState, useEffect } from 'react';
import ProfileSettingsModal from '../../components/ProfileSettingsModal';

function formatGoogleDriveUrl(url) {
    if (!url || typeof url !== 'string') return '';
    const trimmed = url.trim();
    if (trimmed.includes('lh3.googleusercontent.com/d/')) return trimmed;
    const match = trimmed.match(/drive\.google\.com\/(?:file\/d\/([a-zA-Z0-9_-]+)|open\?id=([a-zA-Z0-9_-]+)|uc\?(?:[^&]*&)*id=([a-zA-Z0-9_-]+))/i);
    if (match) {
        const fileId = match[1] || match[2] || match[3];
        if (fileId) return `https://lh3.googleusercontent.com/d/${fileId}`;
    }
    return trimmed;
}

export default function StudentProfile() {
    const [profile, setProfile] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    const loadProfile = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            setIsLoading(false);
            return;
        }

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/user/profile`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setProfile(data);
            }
        } catch (e) {
            console.error("Failed to load profile:", e);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadProfile();

        const handleProfileUpdated = (e) => {
            if (e.detail) {
                setProfile(prev => ({ ...prev, ...e.detail }));
            }
        };

        window.addEventListener('fledge_profile_updated', handleProfileUpdated);
        return () => window.removeEventListener('fledge_profile_updated', handleProfileUpdated);
    }, []);

    const avatarUrl = profile ? formatGoogleDriveUrl(profile.profile_image_url) : '';

    return (
        <section className="max-w-[1440px] mx-auto p-4 md:px-8 lg:px-12 md:py-8 space-y-6 md:space-y-8 relative animate-fade-in">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-md mb-lg">
                <div>
                    <div className="flex items-center gap-sm mb-xs">
                        <span className="material-symbols-outlined text-primary text-3xl">
                            account_circle
                        </span>
                        <h1 className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#6FB7E4] via-[#5D8BCC] to-[#465AA3]">
                            My Profile
                        </h1>
                    </div>
                    <p className="font-body-lg text-on-surface-variant max-w-2xl">
                        Manage your student information, contact details, and academy preferences
                    </p>
                </div>
                
                <div className="flex gap-sm">
                    <button 
                        onClick={() => setIsSettingsOpen(true)}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-on-primary hover:opacity-95 transition-all shadow-md active:scale-95 font-semibold text-xs cursor-pointer"
                    >
                        <span className="material-symbols-outlined text-[18px]">edit</span>
                        Edit Profile
                    </button>
                </div>
            </div>

            {/* Profile Overview Card */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-md">
                {/* Main Identity Box */}
                <div className="md:col-span-8 flex flex-col gap-md">
                    <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-3xl p-6 sm:p-8 custom-shadow flex flex-col sm:flex-row gap-6 items-center sm:items-start">
                        <div className="w-28 h-28 rounded-3xl overflow-hidden border-4 border-primary/20 bg-surface-container shrink-0 flex items-center justify-center shadow-lg relative group">
                            {avatarUrl ? (
                                <img 
                                    src={avatarUrl} 
                                    alt="Avatar" 
                                    className="w-full h-full object-cover" 
                                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                />
                            ) : (
                                <span className="material-symbols-outlined text-5xl text-on-surface-variant">person</span>
                            )}
                        </div>

                        <div className="flex-1 text-center sm:text-left space-y-3">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                <div>
                                    <h2 className="text-2xl font-bold text-on-surface">
                                        {profile?.name || 'Student Account'}
                                    </h2>
                                    <p className="text-xs font-semibold text-primary uppercase tracking-wider mt-0.5">
                                        {profile?.role || 'Student'} • {profile?.level || 'Level 5'}
                                    </p>
                                </div>
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 w-fit self-center sm:self-auto">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                    Active Student
                                </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
                                <div className="p-3 bg-surface-container-low rounded-2xl border border-outline-variant/40">
                                    <span className="text-outline font-semibold block mb-0.5">Email Address (Locked)</span>
                                    <span className="text-on-surface font-medium truncate block select-all">{profile?.email || '—'}</span>
                                </div>

                                <div className="p-3 bg-surface-container-low rounded-2xl border border-outline-variant/40">
                                    <span className="text-outline font-semibold block mb-0.5">Phone Number</span>
                                    <span className="text-on-surface font-medium block">{profile?.phone || 'Not provided'}</span>
                                </div>

                                <div className="p-3 bg-surface-container-low rounded-2xl border border-outline-variant/40">
                                    <span className="text-outline font-semibold block mb-0.5">Batch Assignment</span>
                                    <span className="text-on-surface font-medium block">{profile?.batch || (profile?.batches && profile.batches[0]) || 'Standard Batch'}</span>
                                </div>

                                <div className="p-3 bg-surface-container-low rounded-2xl border border-outline-variant/40">
                                    <span className="text-outline font-semibold block mb-0.5">Avatar Source</span>
                                    <span className="text-on-surface font-medium truncate block">
                                        {profile?.profile_image_url ? (profile.profile_image_url.includes('drive.google') ? 'Google Drive Link' : 'Custom Image URL') : 'Default Icon'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sidebar Info */}
                <div className="md:col-span-4 flex flex-col gap-md">
                    <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-3xl p-6 custom-shadow space-y-4">
                        <h3 className="font-bold text-sm text-on-surface flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary text-[20px]">security</span>
                            Security & Account Settings
                        </h3>
                        <p className="text-xs text-on-surface-variant leading-relaxed">
                            Your email ID is secured and cannot be altered directly. To update your phone number, display name, or avatar link, use the Profile Settings modal.
                        </p>
                        <button 
                            onClick={() => setIsSettingsOpen(true)}
                            className="w-full py-2.5 rounded-xl border border-primary/40 text-primary hover:bg-primary/5 transition-all text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                            <span className="material-symbols-outlined text-[16px]">tune</span>
                            Open Settings
                        </button>
                    </div>
                </div>
            </div>

            {/* Profile Settings Modal */}
            <ProfileSettingsModal 
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
                currentProfile={profile}
                onProfileUpdated={(updated) => setProfile(prev => ({ ...prev, ...updated }))}
            />
        </section>
    );
}
