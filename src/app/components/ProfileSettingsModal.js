'use client';
import { useState, useEffect } from 'react';

export default function ProfileSettingsModal({ isOpen, onClose, currentProfile, onProfileUpdated }) {
    const [profile, setProfile] = useState({ name: '', profile_image_url: '', preferences: { notifications: true, darkMode: false } });
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        if (currentProfile) {
            setProfile({
                name: currentProfile.name || '',
                profile_image_url: currentProfile.profile_image_url || '',
                preferences: currentProfile.preferences || { notifications: true, darkMode: false }
            });
        }
        setMessage('');
    }, [currentProfile, isOpen]);

    if (!isOpen) return null;

    const handleSave = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        setMessage('');
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/user/profile`, {
                method: 'PUT',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(profile)
            });
            if (res.ok) {
                setMessage('Profile updated successfully!');
                const updatedProfile = await res.json();
                if (onProfileUpdated) {
                    onProfileUpdated(updatedProfile);
                }
                setTimeout(() => {
                    onClose();
                }, 1000);
            } else {
                setMessage('Failed to update profile.');
            }
        } catch (err) {
            setMessage('An error occurred.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-scrim/50 backdrop-blur-sm">
            <div className="bg-surface rounded-2xl shadow-lg w-full max-w-[500px] overflow-hidden flex flex-col max-h-[90vh]">
                <div className="flex items-center justify-between p-md border-b border-outline-variant/30">
                    <h2 className="font-headline-md text-on-surface">Profile Settings</h2>
                    <button onClick={onClose} className="material-symbols-outlined text-on-surface-variant hover:text-primary transition-colors hover:bg-surface-container p-1 rounded-full">
                        close
                    </button>
                </div>
                
                <div className="p-md overflow-y-auto">
                    <form onSubmit={handleSave} className="space-y-md">
                        <div className="flex flex-col sm:flex-row gap-lg items-center sm:items-start">
                            <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-primary-container shrink-0 bg-surface-container flex items-center justify-center">
                                {profile.profile_image_url ? (
                                    <img src={profile.profile_image_url} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    <span className="material-symbols-outlined text-[36px] text-on-surface-variant">person</span>
                                )}
                            </div>
                            
                            <div className="flex-1 space-y-md w-full">
                                <div>
                                    <label className="block font-label-md text-on-surface mb-xs">Full Name</label>
                                    <input 
                                        type="text" 
                                        value={profile.name}
                                        onChange={(e) => setProfile({...profile, name: e.target.value})}
                                        className="w-full bg-surface-container-low border border-outline-variant rounded-lg p-sm font-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                                        placeholder="Enter your full name"
                                    />
                                </div>
                                <div>
                                    <label className="block font-label-md text-on-surface mb-xs">Profile Image URL</label>
                                    <input 
                                        type="url" 
                                        value={profile.profile_image_url}
                                        onChange={(e) => setProfile({...profile, profile_image_url: e.target.value})}
                                        className="w-full bg-surface-container-low border border-outline-variant rounded-lg p-sm font-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                                        placeholder="https://example.com/avatar.jpg"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="pt-md border-t border-outline-variant/30">
                            <h3 className="font-headline-sm text-on-surface mb-md">Preferences</h3>
                            
                            <div className="space-y-sm">
                                <label className="flex items-center gap-sm cursor-pointer group">
                                    <div className={`w-12 h-6 rounded-full p-1 transition-colors ${profile.preferences?.notifications ? 'bg-primary' : 'bg-surface-container-high'}`}>
                                        <div className={`w-4 h-4 rounded-full bg-on-primary transition-transform ${profile.preferences?.notifications ? 'translate-x-6' : 'translate-x-0 bg-on-surface-variant'}`}></div>
                                    </div>
                                    <span className="font-body-md text-on-surface select-none group-hover:text-primary transition-colors">Enable Notifications</span>
                                    <input 
                                        type="checkbox" 
                                        className="hidden"
                                        checked={profile.preferences?.notifications || false}
                                        onChange={(e) => setProfile({
                                            ...profile, 
                                            preferences: { ...profile.preferences, notifications: e.target.checked }
                                        })}
                                    />
                                </label>
                            </div>
                        </div>

                        {message && (
                            <div className={`p-sm rounded-lg text-center font-label-md ${message.includes('success') ? 'bg-primary-container text-on-primary-container' : 'bg-error-container text-on-error-container'}`}>
                                {message}
                            </div>
                        )}

                        <div className="flex justify-end pt-sm">
                            <button 
                                type="submit" 
                                disabled={isSaving}
                                className="bg-primary text-on-primary px-xl py-sm rounded-full font-label-lg hover:shadow-md hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-xs"
                            >
                                {isSaving ? (
                                    <>
                                        <span className="material-symbols-outlined animate-spin text-[18px]">sync</span>
                                        Saving...
                                    </>
                                ) : (
                                    'Save Changes'
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
