'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAdminContext } from '@/app/admin/AdminContext';
import { performLogout } from '@/app/utils/activityLogger';

export default function AdminNavbar() {
    const pathname = usePathname();
    const router = useRouter();
    const { isMobileNavOpen, setIsMobileNavOpen, isSidebarCollapsed, setIsSidebarCollapsed } = useAdminContext();

    const navGroups = [
        {
            category: 'Overview',
            items: [
                { name: 'Dashboard', path: '/admin/dashboard', icon: 'dashboard' },
                { name: 'Activity Monitor', path: '/admin/performance', icon: 'monitoring' },
            ]
        },
        {
            category: 'People & Access',
            items: [
                { name: 'Students', path: '/admin/students', icon: 'groups' },
                { name: 'Sensi', path: '/admin/sensi', icon: 'manage_accounts' },
            ]
        },
        {
            category: 'Academic & Learning',
            items: [
                { name: 'Materials', path: '/admin/materials', icon: 'library_books' },
                { name: 'Videos', path: '/admin/videos', icon: 'smart_display' },
                { name: 'Tests', path: '/admin/tests', icon: 'quiz' },
                { name: 'Attendance', path: '/admin/attendance', icon: 'assignment' },
                { name: 'Schedule', path: '/admin/schedule', icon: 'schedule' },
            ]
        },
        {
            category: 'Communication & Operations',
            items: [
                { name: 'Announcements', path: '/admin/announcements', icon: 'campaign' },
                { name: 'Community', path: '/admin/community', icon: 'forum' },
                { name: 'Finances', path: '/admin/finances', icon: 'account_balance' },
            ]
        }
    ];

    // Closes the expanded drawer/sidebar upon selecting an option
    const handleNavItemClick = () => {
        setIsMobileNavOpen(false);
        setIsSidebarCollapsed(true);
    };

    return (
        <>
            {/* Backdrop overlay for mobile when drawer is opened */}
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
                aria-label="Quick Access Sidebar"
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
                                const isActive = pathname === item.path;
                                return (
                                    <div key={item.name} className="relative group/tooltip flex items-center justify-center my-0.5">
                                        <Link
                                            href={item.path}
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

                {/* Bottom Logout Quick Icon */}
                <div className="mt-auto pt-2 relative group/logout">
                    <button
                        type="button"
                        onClick={() => performLogout(router)}
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-on-surface-variant hover:bg-error/15 hover:text-error transition-colors cursor-pointer"
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
            <aside className={`h-screen w-64 fixed left-0 top-0 flex flex-col bg-surface-container-low border-r border-outline-variant z-50 py-md transition-all duration-300 shadow-2xl ${
                isMobileNavOpen 
                    ? 'translate-x-0' 
                    : (isSidebarCollapsed ? '-translate-x-full md:-translate-x-full' : 'translate-x-0 md:translate-x-0 -translate-x-full')
            }`}>
                <div className="px-gutter mb-lg flex items-center justify-between">
                    <div className="flex items-center">
                        <img src="/fledgeacad.png" alt="Fledge Academy Logo" className="w-40 h-auto object-contain drop-shadow-sm" />
                    </div>    
                    <button 
                        onClick={() => {
                            if (window.innerWidth < 768) {
                                setIsMobileNavOpen(false);
                            } else {
                                setIsSidebarCollapsed(true);
                            }
                        }}
                        className="material-symbols-outlined text-on-surface-variant p-1 hover:bg-surface-container-high rounded-full transition-colors active:scale-95 cursor-pointer"
                        title="Collapse sidebar"
                    >
                        {isSidebarCollapsed ? "close" : "chevron_left"}
                    </button>
                </div>
            
            <nav className="flex-1 space-y-4 overflow-y-auto overflow-x-hidden custom-scrollbar px-2">
                {navGroups.map((group) => (
                    <div key={group.category} className="space-y-1">
                        <div className="px-3 pb-1 pt-1 text-[11px] font-bold tracking-wider uppercase text-on-surface-variant/60">
                            {group.category}
                        </div>
                        {group.items.map((item) => {
                            const isActive = pathname === item.path;
                            return (
                                <Link 
                                    key={item.name}
                                    href={item.path}
                                    onClick={handleNavItemClick}
                                    className={`flex items-center gap-sm rounded-lg px-md py-sm transition-all relative ${
                                        isActive 
                                            ? 'bg-secondary-container text-on-secondary-container font-semibold active:scale-[0.98]'
                                            : 'text-on-surface-variant hover:bg-surface-container-high'
                                    }`}
                                >
                                    <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                                    <span className="font-label-md text-label-md">{item.name}</span>
                                </Link>
                            );
                        })}
                    </div>
                ))}
            </nav>

            <div className="mt-auto px-2 space-y-xs pt-base border-t border-outline-variant/40">
                <button 
                    type="button"
                    onClick={() => {
                        setIsMobileNavOpen(false);
                        performLogout(router);
                    }}
                    className="w-full flex items-center gap-sm text-on-surface-variant hover:bg-surface-container-high rounded-lg px-md py-sm transition-all cursor-pointer"
                >
                    <span className="material-symbols-outlined">logout</span>
                    <span className="font-label-md text-label-md">Logout</span>
                </button>
            </div>
        </aside>
        </>
    );
}
