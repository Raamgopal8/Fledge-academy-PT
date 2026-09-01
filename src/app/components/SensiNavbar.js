'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useSensiContext } from '@/app/sensi/SensiContext';
import { performLogout } from '@/app/utils/activityLogger';

export default function SensiNavbar() {
    const pathname = usePathname();
    const router = useRouter();
    const context = useSensiContext();
    const isMobileNavOpen = context?.isMobileNavOpen;
    const setIsMobileNavOpen = context?.setIsMobileNavOpen || (() => {});
    const selectedBatch = context?.selectedBatch;
    const staffBatches = context?.staffBatches || context?.sensiBatches || [];
    const setIsBatchModalOpen = context?.setIsBatchModalOpen || (() => {});

    const navLinks = [
        { name: 'Overview', href: '/sensi/dashboard', icon: 'dashboard' },
        { name: 'Announcements', href: '/sensi/announcements', icon: 'campaign' },
        { name: 'Materials', href: '/sensi/materials', icon: 'library_books' },
        { name: 'Videos', href: '/sensi/videos', icon: 'smart_display' },
        { name: 'Tests', href: '/sensi/tests', icon: 'quiz' },
        { name: 'Student Progress', href: '/sensi/progress', icon: 'monitoring' },
        { name: 'Members', href: '/sensi/members', icon: 'groups' },
        { name: 'Schedule', href: '/sensi/schedule', icon: 'schedule' },
        { name: 'Community', href: '/sensi/community', icon: 'forum' },
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
                <div className="px-gutter mb-md flex justify-between items-center">
                    <div className="flex items-center">
                        <img src="/fledgeacad.png" alt="Fledge Academy Logo" className="w-40 h-auto object-contain drop-shadow-sm" />
                    </div>    
                     <button 
                        onClick={() => setIsMobileNavOpen(false)}
                        className="material-symbols-outlined text-on-surface-variant p-1 hover:bg-surface-container-high rounded-full transition-colors active:scale-95 md:hidden"
                    >
                        close
                    </button>
                </div>

                {/* Active Batch Switcher in Sidebar */}
                <div className="px-3 mb-3">
                    <button
                        onClick={() => {
                            setIsBatchModalOpen(true);
                            setIsMobileNavOpen(false);
                        }}
                        className="w-full bg-surface-container-high hover:bg-surface-container-highest border border-outline-variant/60 rounded-xl px-3 py-2 text-left flex items-center justify-between transition-all group shadow-2xs"
                        title="Switch Batch"
                    >
                        <div className="flex items-center gap-2 min-w-0">
                            <span className="material-symbols-outlined text-primary text-[18px] shrink-0">domain</span>
                            <div className="truncate">
                                <p className="text-[10px] text-on-surface-variant font-medium uppercase tracking-wider leading-none mb-0.5">Active Batch</p>
                                <p className="font-label-md text-on-surface font-semibold truncate text-xs">
                                    {selectedBatch || (staffBatches && staffBatches.length > 0 ? staffBatches[0] : 'Select Batch')}
                                </p>
                            </div>
                        </div>
                        <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary text-[18px] shrink-0 transition-colors">
                            swap_horiz
                        </span>
                    </button>
                </div>

            {/* Navigation Links */}
            <nav className="flex-grow space-y-1 overflow-y-auto custom-scrollbar">
                {navLinks.map((link) => {
                    const isActive = pathname === link.href || (pathname.startsWith(link.href) && link.href !== '/sensi/dashboard' && link.href !== '/sensi/announcements');
                    return (
                        <Link 
                            key={link.name} 
                            href={link.href}
                            onClick={() => setIsMobileNavOpen(false)}
                            className={`mx-2 flex items-center px-4 py-3 rounded-lg font-label-md text-label-md transition-all active:scale-[0.98] relative ${
                                isActive 
                                    ? 'bg-secondary-container text-on-secondary-container' 
                                    : 'text-on-surface-variant hover:bg-surface-container-high'
                            }`}
                        >
                            <span className="material-symbols-outlined mr-3">{link.icon}</span>
                            {link.name}
                        </Link>
                    );
                })}
            </nav>

            {/* Footer Actions */}
            <div className="mt-auto px-2 space-y-1">
                <button 
                    type="button"
                    onClick={() => {
                        setIsMobileNavOpen(false);
                        performLogout(router);
                    }}
                    className="w-full text-error flex items-center px-4 py-3 rounded-lg font-label-md text-label-md hover:bg-surface-container-high transition-all cursor-pointer"
                >
                    <span className="material-symbols-outlined mr-3">logout</span>
                    Logout
                </button>
            </div>
        </aside>
        </>
    );
}
