"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useStudentContext } from '@/app/student/StudentContext';
import ProfileSettingsModal from './ProfileSettingsModal';
import ThemeToggle from './ThemeToggle';

export default function TopNav() {
  const [profile, setProfile] = useState(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const { setIsMobileNavOpen } = useStudentContext();

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
    <header className="flex justify-between items-center w-full mb-lg max-w-[1440px] mx-auto h-16 bg-surface shadow-sm rounded-2xl px-gutter sticky top-4 z-40 gap-sm md:gap-md">
      <div className="flex items-center gap-sm md:gap-md flex-grow md:flex-grow-0">
        <button 
            onClick={() => setIsMobileNavOpen(true)}
            className="p-2 text-on-surface-variant hover:bg-surface-container-high rounded-full transition-colors active:scale-95 shrink-0"
        >
          <span className="material-symbols-outlined">menu</span>
        </button>
      </div>
      <div className="flex items-center gap-md">
        <ThemeToggle />
        <div className="flex items-center gap-sm">
          <div className="text-right hidden lg:block">
            <p className="font-label-md text-label-md text-on-surface leading-none">
              {profile?.name || "Student"}
            </p>
            <p className="font-label-sm text-label-sm text-outline leading-tight">Pro Learner</p>
          </div>
          <button onClick={() => setIsSettingsOpen(true)} className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-primary-container bg-surface-container flex items-center justify-center hover:scale-105 transition-transform cursor-pointer">
            {profile?.profile_image_url ? (
              <img
                className="w-full h-full object-cover"
                alt={`Portrait of ${profile?.name || "Student"}`}
                src={profile.profile_image_url}
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
