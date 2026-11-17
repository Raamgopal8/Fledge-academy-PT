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
    const isSidebarCollapsed = context?.isSidebarCollapsed || false;
    const setIsSidebarCollapsed = context?.setIsSidebarCollapsed || (() => {});
    const selectedBatch = context?.selectedBatch;
    const staffBatches = context?.staffBatches || context?.sensiBatches || [];
    const setIsBatchModalOpen = context?.setIsBatchModalOpen || (() => {});

    const navGroups = [
        {
            category: 'Overview',
            items: [
                { name: 'Dashboard', href: '/sensi/dashboard', icon: 'dashboard' },
                { name: 'Student Progress', href: '/sensi/progress', icon: 'monitoring' },
                { name: 'Members', href: '/sensi/members', icon: 'groups' },
            ]
        },
        {
            category: 'Academic & Teaching',
            items: [
                { name: 'Materials', href: '/sensi/materials', icon: 'library_books' },
                { name: 'Videos', href: '/sensi/videos', icon: 'smart_display' },
                { name: 'Tests', href: '/sensi/tests', icon: 'quiz' },
                { name: 'Schedule', href: '/sensi/schedule', icon: 'schedule' },
            ]
        },
        {
            category: 'Communication',
            items: [
                { name: 'Announcements', href: '/sensi/announcements', icon: 'campaign' },
                { name: 'Community', href: '/sensi/community', icon: 'forum' },
            ]
        }
    ];
    
    const handleNavItemClick = () => {
        setIsMobileNavOpen(false);
        setIsSidebarCollapsed(true);
    };

    return (
        <>
            {/* Backdrop overlay for mobile */}
            {isMobileNavOpen && (
                <div 
                    className="fixed inset-0 bg-black/50 z-40 transition-opacity"
                    onClick={() => setIsMobileNavOpen(false)}
                />
            )}
            
            {/* Collapsed Side Widget Icon Strip (Shown on desktop when collapsed) */}
            <aside 
                className={`hidden md:flex flex-col items-center fixed left-0 top-0 h-screen w-16 bg-surface-container-low border-r border-outline-variant/60 z-30 py-3 select-none transition-all duration-300 ${
                    isSidebarCollapsed ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0 pointer-events-none'
                }`}
                aria-label="Sensi Quick Access Sidebar"
            >
                {/* Logo & Expand Toggle */}
                <button
                    onClick={() => setIsSidebarCollapsed(false)}
                    className="p-1.5 mb-3 rounded-xl hover:bg-surface-container-highest transition-all group flex flex-col items-center cursor-pointer"
                    title="Click to expand sidebar"
                >
                    <img 
                        src="/icon-192.png" 
                        alt="Fledge Academy Logo" 
                        className="w-9 h-9 object-contain rounded-lg drop-shadow-xs group-hover:scale-105 transition-transform" 
                    />
                </button>

                {/* Vertical Icon Navigation with Hover Tooltips */}
                <nav className="flex-1 flex flex-col items-center gap-1 w-full overflow-y-auto overflow-x-hidden no-scrollbar px-1">
                    {navGroups.map((group, groupIdx) => (
                        <div key={group.category} className="w-full flex flex-col items-center">
                            {groupIdx > 0 && <div className="w-6 h-[1px] bg-outline-variant/50 my-1.5" />}
                            {group.items.map((item) => {
                                const isActive = pathname === item.href || (pathname.startsWith(item.href) && item.href !== '/sensi/dashboard' && item.href !== '/sensi/announcements');
                                return (
                                    <div key={item.name} className="relative group/tooltip flex items-center justify-center my-0.5">
                                        <Link
                                            href={item.href}
                                            onClick={handleNavItemClick}
                                            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                                                isActive
                                                    ? 'bg-primary text-on-primary shadow-xs'
                                                    : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
                                            }`}
                                        >
                                            <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                                        </Link>

                                        {/* Floating Tooltip Pill */}
                                        <div className="absolute left-12 ml-2 px-2.5 py-1 bg-surface-container-highest text-on-surface text-xs font-semibold rounded-lg shadow-xl border border-outline-variant/60 whitespace-nowrap opacity-0 pointer-events-none group-hover/tooltip:opacity-100 group-hover/tooltip:pointer-events-auto transition-all duration-150 z-50">
                                            {item.name}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                </nav>

                {/* Scope Switcher Quick Button in Icon Rail */}
                <div className="my-1.5 relative group/scope">
                    <button
                        type="button"
                        onClick={() => setIsBatchModalOpen(true)}
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-primary bg-primary/10 hover:bg-primary hover:text-on-primary transition-all cursor-pointer shadow-2xs"
                        title="Switch Level & Batch"
                    >
                        <span className="material-symbols-outlined text-[18px]">tune</span>
                    </button>
                    <div className="absolute left-12 ml-2 bottom-1 px-2.5 py-1 bg-surface-container-highest text-on-surface text-xs font-semibold rounded-lg shadow-xl border border-outline-variant/60 whitespace-nowrap opacity-0 pointer-events-none group-hover/scope:opacity-100 transition-all duration-150 z-50">
                        {context?.selectedLevel || 'Level'} • {selectedBatch || 'Batch'}
                    </div>
                </div>

                {/* Bottom Logout Quick Icon */}
                <div className="mt-auto pt-2 relative group/logout">
                    <button
                        type="button"
                        onClick={() => performLogout(router)}
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-error hover:bg-error/15 transition-colors cursor-pointer"
                        title="Logout"
                    >
                        <span className="material-symbols-outlined text-[20px]">logout</span>
                    </button>
                    <div className="absolute left-12 ml-2 bottom-1 px-2.5 py-1 bg-error text-white text-xs font-semibold rounded-lg shadow-xl whitespace-nowrap opacity-0 pointer-events-none group-hover/logout:opacity-100 transition-all duration-150 z-50">
                        Logout
                    </div>
                </div>
            </aside>
            
            {/* Full Expanded Navigation Drawer (Desktop full mode & Mobile off-canvas drawer) */}
            <aside className={`h-screen w-64 fixed left-0 top-0 flex flex-col bg-surface-container-low border-r border-outline-variant py-md z-50 transition-all duration-300 shadow-2xl ${
                isMobileNavOpen 
                    ? 'translate-x-0' 
                    : (isSidebarCollapsed ? '-translate-x-full md:-translate-x-full' : 'translate-x-0 md:translate-x-0 -translate-x-full')
            }`}>
                {/* Brand Header */}
                <div className="px-gutter mb-md flex justify-between items-center">
                    <div className="flex items-center">
                        <img src="/fledgeacad.png" alt="Fledge Academy Logo" className="w-40 h-auto object-contain drop-shadow-sm" />
                    </div>
                </div>

                {/* Active Level & Batch Switcher in Sidebar */}
                <div className="px-3 mb-3">
                    <button
                        onClick={() => {
                            setIsBatchModalOpen(true);
                            setIsMobileNavOpen(false);
                        }}
                        className="w-full bg-surface-container-high hover:bg-surface-container-highest border border-outline-variant/60 rounded-xl px-3 py-2 text-left flex items-center justify-between transition-all group shadow-2xs cursor-pointer"
                        title="Switch Level & Batch"
                    >
                        <div className="flex items-center gap-2 min-w-0">
                            <span className="material-symbols-outlined text-primary text-[18px] shrink-0">tune</span>
                            <div className="truncate">
                                <p className="text-[10px] text-on-surface-variant font-medium uppercase tracking-wider leading-none mb-0.5">Assigned Scope</p>
                                <p className="font-label-md text-on-surface font-semibold truncate text-xs">
                                    {context?.selectedLevel || (context?.sensiLevels && context.sensiLevels.length > 0 ? context.sensiLevels[0] : 'Level 5')} • {selectedBatch || 'No Batch'}
                                </p>
                            </div>
                        </div>
                        <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary text-[18px] shrink-0 transition-colors">
                            swap_horiz
                        </span>
                    </button>
                </div>

            {/* Navigation Links */}
            <nav className="flex-grow space-y-4 overflow-y-auto overflow-x-hidden custom-scrollbar px-2">
                {navGroups.map((group) => (
                    <div key={group.category} className="space-y-1">
                        <div className="px-3 pb-1 pt-1 text-[11px] font-bold tracking-wider uppercase text-on-surface-variant/60">
                            {group.category}
                        </div>
                        {group.items.map((link) => {
                            const isActive = pathname === link.href || (pathname.startsWith(link.href) && link.href !== '/sensi/dashboard' && link.href !== '/sensi/announcements');
                            return (
                                <Link 
                                    key={link.name} 
                                    href={link.href}
                                    onClick={handleNavItemClick}
                                    className={`flex items-center px-4 py-2.5 rounded-lg font-label-md text-label-md transition-all active:scale-[0.98] relative ${
                                        isActive 
                                            ? 'bg-secondary-container text-on-secondary-container font-semibold' 
                                            : 'text-on-surface-variant hover:bg-surface-container-high'
                                    }`}
                                >
                                    <span className="material-symbols-outlined text-[20px] mr-3">{link.icon}</span>
                                    {link.name}
                                </Link>
                            );
                        })}
                    </div>
                ))}
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
