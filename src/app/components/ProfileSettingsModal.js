'use client';

import { useState, useEffect, useRef } from 'react';
import { subscribeToPushNotifications } from '../utils/pushNotifications';

// Helper to convert Google Drive shareable URLs to direct embed image URLs
function formatGoogleDriveUrl(url) {
    if (!url || typeof url !== 'string') return '';
    const trimmed = url.trim();
    if (!trimmed) return '';

    // If it's already a direct Google usercontent URL
    if (trimmed.includes('lh3.googleusercontent.com/d/')) {
        return trimmed;
    }

    // Match /file/d/{id}, open?id={id}, or uc?id={id}
    const match = trimmed.match(/drive\.google\.com\/(?:file\/d\/([a-zA-Z0-9_-]+)|open\?id=([a-zA-Z0-9_-]+)|uc\?(?:[^&]*&)*id=([a-zA-Z0-9_-]+))/i);
    if (match) {
        const fileId = match[1] || match[2] || match[3];
        if (fileId) {
            return `https://lh3.googleusercontent.com/d/${fileId}`;
        }
    }
    return trimmed;
}

export default function ProfileSettingsModal({ isOpen, onClose, currentProfile, onProfileUpdated }) {
    const [profile, setProfile] = useState({
        name: '',
        email: '',
        phone: '',
        profile_image_url: '',
        preferences: { notifications: true, darkMode: false }
    });
    const [isSaving, setIsSaving] = useState(false);
    const [isLoadingDetails, setIsLoadingDetails] = useState(false);
    const [message, setMessage] = useState('');

    // Image Upload States
    const [selectedImageFile, setSelectedImageFile] = useState(null);
    const [imagePreviewUrl, setImagePreviewUrl] = useState('');
    const [photoInputMode, setPhotoInputMode] = useState('file'); // 'file' | 'url'
    const [isUploadingImage, setIsUploadingImage] = useState(false);
    const fileInputRef = useRef(null);

    // Clean up local blob object URL on unmount or file reset
    useEffect(() => {
        return () => {
            if (imagePreviewUrl && imagePreviewUrl.startsWith('blob:')) {
                URL.revokeObjectURL(imagePreviewUrl);
            }
        };
    }, [imagePreviewUrl]);

    // Fetch fresh profile from database/Redis on modal open
    useEffect(() => {
        if (!isOpen) return;

        /* eslint-disable react-hooks/set-state-in-effect */
        // Reset local selection states when opened
        setSelectedImageFile(null);
        setImagePreviewUrl('');
        setMessage('');
        /* eslint-enable react-hooks/set-state-in-effect */

        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        const localEmail = typeof window !== 'undefined' ? (localStorage.getItem('userEmail') || localStorage.getItem('email') || '') : '';
        const localName = typeof window !== 'undefined' ? (localStorage.getItem('userName') || '') : '';
        const localImg = typeof window !== 'undefined' ? (localStorage.getItem('userProfileImage') || '') : '';

        // Initialize with available props / localStorage first
        setProfile({
            name: currentProfile?.name || localName || '',
            email: currentProfile?.email || localEmail || '',
            phone: currentProfile?.phone || '',
            profile_image_url: currentProfile?.profile_image_url || localImg || '',
            preferences: currentProfile?.preferences || { notifications: true, darkMode: false }
        });

        // Fetch authoritative profile details from API
        if (token) {
            setIsLoadingDetails(true);
            fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/user/profile`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            .then(res => res.ok ? res.json() : null)
            .then(data => {
                if (data) {
                    setProfile(prev => ({
                        ...prev,
                        name: data.name || prev.name,
                        email: data.email || prev.email,
                        phone: data.phone !== undefined && data.phone !== null ? data.phone : prev.phone,
                        profile_image_url: data.profile_image_url || prev.profile_image_url,
                        preferences: data.preferences || prev.preferences
                    }));
                }
            })
            .catch(err => console.error("Error loading user profile:", err))
            .finally(() => setIsLoadingDetails(false));
        }
    }, [isOpen, currentProfile]);

    if (!isOpen) return null;

    const isStudent = (profile.role || currentProfile?.role || (typeof window !== 'undefined' ? localStorage.getItem('role') : '') || '').toLowerCase() === 'student';
    const previewUrl = formatGoogleDriveUrl(profile.profile_image_url);
    const displayAvatar = imagePreviewUrl || previewUrl;

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            setMessage('Please select a valid image file (PNG, JPG, JPEG, WEBP, GIF).');
            return;
        }

        if (file.size > 10 * 1024 * 1024) {
            setMessage('Selected image exceeds the 10MB size limit.');
            return;
        }

        setMessage('');
        setSelectedImageFile(file);
        if (imagePreviewUrl && imagePreviewUrl.startsWith('blob:')) {
            URL.revokeObjectURL(imagePreviewUrl);
        }
        const localUrl = URL.createObjectURL(file);
        setImagePreviewUrl(localUrl);
    };

    const handleRemoveSelectedFile = () => {
        if (imagePreviewUrl && imagePreviewUrl.startsWith('blob:')) {
            URL.revokeObjectURL(imagePreviewUrl);
        }
        setImagePreviewUrl('');
        setSelectedImageFile(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        setMessage('');
        try {
            const token = localStorage.getItem('token');
            let formattedImageUrl = formatGoogleDriveUrl(profile.profile_image_url);

            // If a local image file was chosen, upload it first to obtain its persistent URL
            if (selectedImageFile) {
                setIsUploadingImage(true);
                try {
                    const formData = new FormData();
                    formData.append('file', selectedImageFile);

                    const uploadRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/user/profile/upload-image`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${token}`
                        },
                        body: formData
                    });

                    if (!uploadRes.ok) {
                        const uploadErr = await uploadRes.json().catch(() => ({}));
                        throw new Error(uploadErr.detail || 'Failed to upload profile image.');
                    }

                    const uploadData = await uploadRes.json();
                    if (uploadData.profile_image_url) {
                        formattedImageUrl = uploadData.profile_image_url;
                    }
                } finally {
                    setIsUploadingImage(false);
                }
            }

            const payload = {
                name: profile.name.trim(),
                phone: profile.phone.trim(),
                profile_image_url: formattedImageUrl,
                preferences: profile.preferences
            };

            // Only allow staff/ceo/admin to update their email address
            if (!isStudent && profile.email) {
                payload.email = profile.email.trim().toLowerCase();
            }

            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/user/profile`, {
                method: 'PUT',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                setMessage('Profile updated successfully!');
                const resData = await res.json().catch(() => ({}));
                
                const cleanProfile = {
                    ...currentProfile,
                    ...profile,
                    profile_image_url: formattedImageUrl,
                    ...(resData.user || {}),
                    ...(resData.name ? resData : {})
                };

                setProfile(cleanProfile);

                if (typeof window !== 'undefined') {
                    if (cleanProfile.profile_image_url !== undefined) localStorage.setItem('userProfileImage', cleanProfile.profile_image_url);
                    if (cleanProfile.name) localStorage.setItem('userName', cleanProfile.name);
                    if (cleanProfile.email && !isStudent) localStorage.setItem('userEmail', cleanProfile.email);
                    const notifEnabled = cleanProfile.preferences?.notifications !== false;
                    localStorage.setItem('notifications_enabled', notifEnabled ? 'true' : 'false');
                    
                    window.dispatchEvent(new CustomEvent('fledge_notification_preference_changed', { 
                        detail: { enabled: notifEnabled } 
                    }));
                    window.dispatchEvent(new CustomEvent('fledge_profile_updated', { 
                        detail: cleanProfile 
                    }));
                }

                if (onProfileUpdated) {
                    onProfileUpdated(cleanProfile);
                }

                setTimeout(() => {
                    onClose();
                    if (typeof window !== 'undefined') {
                        window.location.reload();
                    }
                }, 600);
            } else {
                const errData = await res.json().catch(() => ({}));
                setMessage(errData.detail || 'Failed to update profile.');
            }
        } catch (err) {
            setMessage(err.message || 'An error occurred while saving.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-surface-container-lowest dark:bg-slate-900 rounded-3xl shadow-2xl border border-outline-variant/80 w-full max-w-[520px] overflow-hidden flex flex-col max-h-[90vh] animate-scale-up">
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-outline-variant/60 bg-surface-container-low dark:bg-slate-800/80">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                            <span className="material-symbols-outlined text-[24px]">manage_accounts</span>
                        </div>
                        <div>
                            <h2 className="font-bold text-lg text-on-surface">Profile Settings</h2>
                            <p className="text-xs text-on-surface-variant">Update your account details and preferences</p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose} 
                        className="w-9 h-9 rounded-full flex items-center justify-center text-on-surface-variant hover:text-primary hover:bg-surface-container transition-colors cursor-pointer"
                        title="Close"
                    >
                        <span className="material-symbols-outlined text-[20px]">close</span>
                    </button>
                </div>
                
                {/* Form Body */}
                <div className="p-5 sm:p-6 overflow-y-auto custom-scrollbar">
                    {isLoadingDetails && (
                        <div className="flex items-center justify-center py-4 text-xs font-semibold text-primary gap-2 bg-primary/5 rounded-2xl mb-4 border border-primary/20">
                            <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                            <span>Loading latest account details...</span>
                        </div>
                    )}

                    <form onSubmit={handleSave} className="space-y-4">
                        {/* Hidden File Input */}
                        <input 
                            ref={fileInputRef}
                            type="file"
                            accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
                            className="hidden"
                            onChange={handleFileChange}
                        />

                        {/* Avatar & Photo Input */}
                        <div className="p-4 bg-surface-container-low dark:bg-slate-800/50 rounded-2xl border border-outline-variant/40 space-y-3">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-bold text-on-surface flex items-center gap-1.5">
                                    <span className="material-symbols-outlined text-[16px] text-primary">account_circle</span>
                                    <span>Profile Photo</span>
                                </label>
                                {/* Input Mode Switcher */}
                                <div className="inline-flex rounded-lg bg-surface-container p-0.5 border border-outline-variant/60 text-[11px] font-semibold">
                                    <button
                                        type="button"
                                        onClick={() => setPhotoInputMode('file')}
                                        className={`px-2.5 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1 ${
                                            photoInputMode === 'file' 
                                                ? 'bg-primary text-on-primary shadow-xs' 
                                                : 'text-on-surface-variant hover:text-on-surface'
                                        }`}
                                    >
                                        <span className="material-symbols-outlined text-[14px]">upload_file</span>
                                        <span>Upload File</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setPhotoInputMode('url')}
                                        className={`px-2.5 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1 ${
                                            photoInputMode === 'url' 
                                                ? 'bg-primary text-on-primary shadow-xs' 
                                                : 'text-on-surface-variant hover:text-on-surface'
                                        }`}
                                    >
                                        <span className="material-symbols-outlined text-[14px]">link</span>
                                        <span>Image Link</span>
                                    </button>
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-4 items-center sm:items-start pt-1">
                                {/* Clickable Avatar Preview */}
                                <div 
                                    onClick={() => fileInputRef.current?.click()}
                                    title="Click to upload profile photo"
                                    className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-primary/40 shrink-0 bg-surface-container flex items-center justify-center shadow-sm relative group cursor-pointer hover:border-primary transition-all"
                                >
                                    {displayAvatar ? (
                                        <img 
                                            src={displayAvatar} 
                                            alt="Profile Avatar" 
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                e.currentTarget.style.display = 'none';
                                            }}
                                        />
                                    ) : (
                                        <span className="material-symbols-outlined text-[36px] text-on-surface-variant">person</span>
                                    )}
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white text-[10px] font-semibold transition-opacity backdrop-blur-[1px]">
                                        <span className="material-symbols-outlined text-[20px]">photo_camera</span>
                                        <span>Change</span>
                                    </div>
                                </div>
                                
                                <div className="flex-1 space-y-2 w-full">
                                    {photoInputMode === 'file' ? (
                                        <div className="space-y-2">
                                            {selectedImageFile ? (
                                                <div className="flex items-center justify-between p-2.5 bg-surface-container rounded-xl border border-primary/30">
                                                    <div className="flex items-center gap-2 overflow-hidden">
                                                        <span className="material-symbols-outlined text-primary text-[20px] shrink-0">image</span>
                                                        <div className="truncate">
                                                            <p className="text-xs font-semibold text-on-surface truncate">{selectedImageFile.name}</p>
                                                            <p className="text-[10px] text-on-surface-variant">{(selectedImageFile.size / 1024).toFixed(1)} KB • Ready to save</p>
                                                        </div>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={handleRemoveSelectedFile}
                                                        className="w-7 h-7 rounded-lg flex items-center justify-center text-on-surface-variant hover:text-error hover:bg-error/10 transition-colors shrink-0"
                                                        title="Remove selected image"
                                                    >
                                                        <span className="material-symbols-outlined text-[16px]">close</span>
                                                    </button>
                                                </div>
                                            ) : (
                                                <button
                                                    type="button"
                                                    onClick={() => fileInputRef.current?.click()}
                                                    className="w-full py-2.5 px-3 rounded-xl border border-dashed border-outline-variant hover:border-primary bg-surface-container-lowest/60 hover:bg-surface-container transition-all flex items-center justify-center gap-2 text-xs font-semibold text-on-surface-variant hover:text-primary cursor-pointer group"
                                                >
                                                    <span className="material-symbols-outlined text-[18px] text-primary group-hover:scale-110 transition-transform">add_photo_alternate</span>
                                                    <span>Choose image</span>
                                                </button>
                                            )}
                                            <p className="text-[10px] text-on-surface-variant flex items-center gap-1">
                                                <span className="material-symbols-outlined text-[13px] text-primary">info</span>
                                                <span>Supports PNG, JPG, WEBP, or GIF up to 10MB.</span>
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="space-y-1.5">
                                            <input 
                                                type="url" 
                                                value={profile.profile_image_url}
                                                onChange={(e) => setProfile({ ...profile, profile_image_url: e.target.value })}
                                                className="w-full bg-surface-container-lowest dark:bg-slate-900 border border-outline-variant rounded-xl p-2.5 text-xs font-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                                                placeholder="Google Drive link or https://... image URL"
                                            />
                                            <p className="text-[10px] text-on-surface-variant flex items-center gap-1">
                                                <span className="material-symbols-outlined text-[13px] text-primary">add_link</span>
                                                <span>Supports Google Drive share links and direct image URLs.</span>
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Full Name */}
                        <div>
                            <label className="block text-xs font-bold text-on-surface mb-1">Full Name</label>
                            <div className="relative flex items-center">
                                <span className="material-symbols-outlined absolute left-3 text-[18px] text-outline">badge</span>
                                <input 
                                    type="text" 
                                    value={profile.name}
                                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                                    className="w-full bg-surface-container-low dark:bg-slate-800 border border-outline-variant rounded-xl pl-9 pr-3 py-2.5 text-xs sm:text-sm font-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                                    placeholder="Enter your full name"
                                    required
                                />
                            </div>
                        </div>

                        {/* Email Address (Locked for Students only, Editable for Staff & CEO) */}
                        <div>
                            <div className="flex items-center justify-between mb-1">
                                <label className="block text-xs font-bold text-on-surface">Email Address</label>
                                {isStudent ? (
                                    <span className="text-[10px] font-semibold text-outline flex items-center gap-0.5">
                                        <span className="material-symbols-outlined text-[12px]">lock</span>
                                        <span>Locked</span>
                                    </span>
                                ) : (
                                    <span className="text-[10px] font-semibold text-primary flex items-center gap-0.5">
                                        <span className="material-symbols-outlined text-[12px]">edit</span>
                                        <span>Editable</span>
                                    </span>
                                )}
                            </div>
                            <div className={`relative flex items-center ${isStudent ? 'opacity-85' : ''}`}>
                                <span className="material-symbols-outlined absolute left-3 text-[18px] text-outline">mail</span>
                                <input 
                                    type="email" 
                                    value={profile.email}
                                    onChange={!isStudent ? (e) => setProfile({ ...profile, email: e.target.value }) : undefined}
                                    disabled={isStudent}
                                    readOnly={isStudent}
                                    className={`w-full border rounded-xl pl-9 pr-3 py-2.5 text-xs sm:text-sm font-body-md outline-none transition-all ${
                                        isStudent 
                                            ? 'bg-surface-container-high/60 dark:bg-slate-800/40 border-outline-variant/70 text-on-surface-variant cursor-not-allowed select-all' 
                                            : 'bg-surface-container-low dark:bg-slate-800 border-outline-variant text-on-surface focus:border-primary focus:ring-1 focus:ring-primary'
                                    }`}
                                    placeholder="user@example.com"
                                    title={isStudent ? "Student email address is permanent and cannot be changed" : "Edit your email address"}
                                    required={!isStudent}
                                />
                            </div>
                            <p className="text-[10px] text-outline mt-0.5">
                                {isStudent 
                                    ? "Student email address is managed by the academy administrator." 
                                    : "You can update your account login and contact email address."}
                            </p>
                        </div>

                        {/* Phone Number (Editable) */}
                        <div>
                            <label className="block text-xs font-bold text-on-surface mb-1">Phone Number</label>
                            <div className="relative flex items-center">
                                <span className="material-symbols-outlined absolute left-3 text-[18px] text-outline">call</span>
                                <input 
                                    type="tel" 
                                    value={profile.phone || ''}
                                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                                    className="w-full bg-surface-container-low dark:bg-slate-800 border border-outline-variant rounded-xl pl-9 pr-3 py-2.5 text-xs sm:text-sm font-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                                    placeholder="+1 (555) 000-0000 or Mobile Number"
                                />
                            </div>
                        </div>

                        {/* Preferences */}
                        <div className="pt-3 border-t border-outline-variant/40">
                            <h3 className="text-xs font-bold text-on-surface mb-2.5">Notification Preferences</h3>
                            
                            <label className="flex items-center gap-3 p-3 rounded-2xl bg-surface-container-low dark:bg-slate-800/60 border border-outline-variant/40 cursor-pointer group hover:border-primary/40 transition-all">
                                <div className={`w-11 h-6 rounded-full p-1 transition-colors ${profile.preferences?.notifications ? 'bg-primary' : 'bg-surface-container-high'}`}>
                                    <div className={`w-4 h-4 rounded-full bg-on-primary transition-transform ${profile.preferences?.notifications ? 'translate-x-5' : 'translate-x-0 bg-on-surface-variant'}`}></div>
                                </div>
                                <div className="flex-1">
                                    <span className="font-bold text-xs text-on-surface block select-none group-hover:text-primary transition-colors">
                                        Enable Push & In-App Alerts
                                    </span>
                                    <span className="text-[10px] text-on-surface-variant block">
                                        Receive real-time notifications for classes, tests, and discussions
                                    </span>
                                </div>
                                <input 
                                    type="checkbox" 
                                    className="hidden"
                                    checked={profile.preferences?.notifications || false}
                                    onChange={(e) => {
                                        const isChecked = e.target.checked;
                                        setProfile({
                                            ...profile, 
                                            preferences: { ...profile.preferences, notifications: isChecked }
                                        });
                                        if (isChecked) {
                                            subscribeToPushNotifications();
                                        }
                                    }}
                                />
                            </label>
                        </div>

                        {message && (
                            <div className={`p-3 rounded-xl text-center text-xs font-bold ${
                                message.includes('success') 
                                    ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30' 
                                    : 'bg-error/15 text-error border border-error/30'
                            }`}>
                                {message}
                            </div>
                        )}

                        <div className="flex justify-end gap-2.5 pt-2">
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={isSaving || isUploadingImage}
                                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button 
                                type="submit" 
                                disabled={isSaving || isUploadingImage}
                                className="bg-primary text-on-primary px-5 py-2.5 rounded-xl text-xs font-bold hover:bg-primary/90 shadow-md hover:scale-102 active:scale-98 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 cursor-pointer"
                            >
                                {isUploadingImage ? (
                                    <>
                                        <span className="material-symbols-outlined animate-spin text-[16px]">cloud_upload</span>
                                        <span>Uploading photo...</span>
                                    </>
                                ) : isSaving ? (
                                    <>
                                        <span className="material-symbols-outlined animate-spin text-[16px]">sync</span>
                                        <span>Saving...</span>
                                    </>
                                ) : (
                                    <>
                                        <span className="material-symbols-outlined text-[16px]">save</span>
                                        <span>Save Changes</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
