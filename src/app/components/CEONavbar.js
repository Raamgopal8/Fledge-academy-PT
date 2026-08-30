'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useCEOContext } from '@/app/ceo/CEOContext';
import { performLogout } from '@/app/utils/activityLogger';

export default function CEONavbar() {
    const pathname = usePathname();
    const router = useRouter();
    const { isMobileNavOpen, setIsMobileNavOpen } = useCEOContext();


    const navItems = [
        { name: 'Overview', path: '/ceo/dashboard', icon: 'dashboard' },
        { name: 'Activity Monitor', path: '/ceo/performance', icon: 'monitoring' },
        { name: 'Students', path: '/ceo/students', icon: 'groups' },
        { name: 'Staff', path: '/ceo/staff', icon: 'manage_accounts' },
        { name: 'Announcements', path: '/ceo/announcements', icon: 'campaign' },
        { name: 'Community', path: '/ceo/community', icon: 'forum' },
        { name: 'Tests', path: '/ceo/tests', icon: 'quiz' },
        { name: 'Attendance', path: '/ceo/attendance', icon: 'assignment' },
        { name: 'Materials', path: '/ceo/materials', icon: 'library_books' },
        { name: 'Videos', path: '/ceo/videos', icon: 'smart_display' },
        { name: 'Schedule', path: '/ceo/schedule', icon: 'schedule' },
        { name: 'Finances', path: '/ceo/finances', icon: 'account_balance' },
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
            
            <aside className={`h-screen w-64 fixed left-0 top-0 flex flex-col bg-surface-container-low border-r border-outline-variant z-50 py-md transition-transform duration-300 ${isMobileNavOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="px-gutter mb-lg flex items-center justify-between">
                    <div className="flex items-center">
                        <img src="/fledgeacad.png" alt="Fledge Academy Logo" className="w-40 h-auto object-contain drop-shadow-sm" />
                    </div>    
                    <button 
                        onClick={() => setIsMobileNavOpen(false)}
                        className="material-symbols-outlined text-on-surface-variant p-1 hover:bg-surface-container-high rounded-full transition-colors active:scale-95"
                    >
                        close
                    </button>
                </div>
            
            <nav className="flex-1 space-y-base overflow-y-auto custom-scrollbar">
                {navItems.map((item) => {
                    const isActive = pathname === item.path;
                    return (
                        <Link 
                            key={item.name}
                            href={item.path}
                            onClick={() => setIsMobileNavOpen(false)}
                            className={`flex items-center gap-sm rounded-lg mx-2 px-md py-sm transition-all relative ${
                                isActive 
                                    ? 'bg-secondary-container text-on-secondary-container active:scale-[0.98]'
                                    : 'text-on-surface-variant hover:bg-surface-container-high'
                            }`}
                        >
                            <span className="material-symbols-outlined">{item.icon}</span>
                            <span className="font-label-md text-label-md">{item.name}</span>
                        </Link>
                    );
                })}
            </nav>

            <div className="mt-auto px-2 space-y-xs pt-base">
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
