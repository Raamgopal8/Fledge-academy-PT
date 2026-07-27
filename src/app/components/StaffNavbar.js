'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useStaffContext } from '@/app/staff/StaffContext';

export default function StaffNavbar() {
    const pathname = usePathname();
    const [unreadCount, setUnreadCount] = useState(0);
    const { isMobileNavOpen, setIsMobileNavOpen } = useStaffContext();

    useEffect(() => {
        const fetchUnreadCount = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) return;
                
                const response = await fetch('http://localhost:8000/api/announcement/unread_count', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                if (response.ok) {
                    const data = await response.json();
                    setUnreadCount(data.unread_count);
                }
            } catch (error) {
                console.error("Failed to fetch unread announcements count", error);
            }
        };

        fetchUnreadCount();
        
        const interval = setInterval(fetchUnreadCount, 60000);
        return () => clearInterval(interval);
    }, []);

    const navLinks = [
        { name: 'Overview', href: '/staff/dashboard', icon: 'dashboard' },
        { name: 'Announcements', href: '/staff/announcements', icon: 'campaign' },
        { name: 'Materials', href: '/staff/materials', icon: 'library_books' },
        { name: 'Tests', href: '/staff/tests', icon: 'quiz' },
        { name: 'Test Activities', href: '/staff/activities', icon: 'assignment' },
        { name: 'Student Progress', href: '/staff/progress', icon: 'monitoring' },
        { name: 'Members', href: '/staff/members', icon: 'groups' },
        { name: 'Schedule', href: '/staff/schedule', icon: 'schedule' },
    ];

    return (
        <>
            {/* Backdrop overlay for mobile */}
            {isMobileNavOpen && (
                <div 
                    className="fixed inset-0 bg-black/50 z-40 transition-opacity"
                    onClick={() => setIsMobileNavOpen(false)}
                />
            )}
            
            <aside className={`h-screen w-64 fixed left-0 top-0 flex flex-col bg-surface-container-low border-r border-outline-variant py-md z-50 transition-transform duration-300 ${isMobileNavOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                {/* Brand Header */}
                <div className="px-gutter mb-lg flex justify-between items-center">
                    <div>
                        <h1 className="font-headline-md text-headline-md text-primary">Fledge Academy</h1>
                        <p className="font-body-sm text-body-sm text-on-surface-variant">Staff Portal</p>
                    </div>
                    <button 
                        onClick={() => setIsMobileNavOpen(false)}
                        className="material-symbols-outlined text-on-surface-variant p-1 hover:bg-surface-container-high rounded-full transition-colors active:scale-95"
                    >
                        close
                    </button>
                </div>

            {/* Navigation Links */}
            <nav className="flex-grow space-y-1 overflow-y-auto custom-scrollbar">
                {navLinks.map((link) => {
                    const isActive = pathname === link.href || (pathname.startsWith(link.href) && link.href !== '/staff/dashboard' && link.href !== '/staff/announcements');
                    return (
                        <Link 
                            key={link.name} 
                            href={link.href}
                            className={`mx-2 flex items-center px-4 py-3 rounded-lg font-label-md text-label-md transition-all active:scale-[0.98] relative ${
                                isActive 
                                    ? 'bg-secondary-container text-on-secondary-container' 
                                    : 'text-on-surface-variant hover:bg-surface-container-high'
                            }`}
                        >
                            <span className="material-symbols-outlined mr-3">{link.icon}</span>
                            {link.name}
                            {link.name === 'Announcements' && unreadCount > 0 && (
                                <span className="absolute right-4 bg-error text-on-error text-[10px] font-bold px-2 py-0.5 rounded-full">
                                    {unreadCount}
                                </span>
                            )}
                        </Link>
                    );
                })}
            </nav>

            {/* Footer Actions */}
            <div className="mt-auto px-2 space-y-1">
                <Link 
                    href="/"
                    className="text-error flex items-center px-4 py-3 rounded-lg font-label-md text-label-md hover:bg-surface-container-high transition-all"
                >
                    <span className="material-symbols-outlined mr-3">logout</span>
                    Logout
                </Link>
            </div>
        </aside>
        </>
    );
}
