'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
    const router = useRouter();
    const [profile, setProfile] = useState({ name: '', profile_image_url: '', preferences: { notifications: true, darkMode: false } });
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    router.push('/');
                    return;
                }
                const res = await fetch('http://localhost:8000/api/user/profile', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setProfile({
                        name: data.name || '',
                        profile_image_url: data.profile_image_url || '',
                        preferences: data.preferences || { notifications: true, darkMode: false }
                    });
                } else {
                    console.error("Failed to fetch profile");
                }
            } catch (err) {
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchProfile();
    }, [router]);

    const handleSave = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        setMessage('');
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('http://localhost:8000/api/user/profile', {
                method: 'PUT',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(profile)
            });
            if (res.ok) {
                setMessage('Profile updated successfully!');
            } else {
                setMessage('Failed to update profile.');
            }
        } catch (err) {
            setMessage('An error occurred.');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-surface">
                <span className="material-symbols-outlined text-[48px] animate-spin text-primary">progress_activity</span>
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-surface p-gutter">
            <div className="max-w-[800px] mx-auto space-y-lg">
                <div className="flex items-center gap-sm">
                    <button onClick={() => router.back()} className="material-symbols-outlined p-2 rounded-full hover:bg-surface-container transition-colors">arrow_back</button>
                    <h1 className="font-display-lg text-headline-lg text-primary">Settings</h1>
                </div>

                <div className="bento-card p-lg space-y-lg">
                    <div>
                        <h2 className="font-headline-md text-on-surface mb-sm">Profile Customization</h2>
                        <p className="font-body-sm text-on-surface-variant">Update your personal information and avatar.</p>
                    </div>

                    <form onSubmit={handleSave} className="space-y-md">
                        <div className="flex flex-col md:flex-row gap-lg items-start">
                            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-primary-container shrink-0 bg-surface-container flex items-center justify-center">
                                {profile.profile_image_url ? (
                                    <img src={profile.profile_image_url} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    <span className="material-symbols-outlined text-[48px] text-on-surface-variant">person</span>
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

                        <div className="flex justify-end pt-md">
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
        </main>
    );
}
