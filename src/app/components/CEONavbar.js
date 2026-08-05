'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCEOContext } from '@/app/ceo/CEOContext';

export default function CEONavbar() {
    const pathname = usePathname();
    const { isMobileNavOpen, setIsMobileNavOpen } = useCEOContext();


    const navItems = [
        { name: 'Overview', path: '/ceo/dashboard', icon: 'dashboard' },
        { name: 'Students', path: '/ceo/students', icon: 'groups' },
        { name: 'Announcements', path: '/ceo/announcements', icon: 'campaign' },
        { name: 'Community', path: '/ceo/community', icon: 'forum' },
        { name: 'Tests', path: '/ceo/tests', icon: 'quiz' },
        { name: 'Attendance', path: '/ceo/attendance', icon: 'assignment' },
        { name: 'Staff Logs', path: '/ceo/staff-logs', icon: 'history' },
        { name: 'Materials', path: '/ceo/materials', icon: 'library_books' },
        { name: 'Videos', path: '/ceo/videos', icon: 'smart_display' },
        { name: 'Schedule', path: '/ceo/schedule', icon: 'schedule' },
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
                <div className="px-gutter mb-lg flex justify-between items-center">
                    <div>
                        <h1 className="font-headline-md text-headline-md text-primary">Fledge Academy</h1>
                        <p className="font-body-sm text-body-sm text-on-surface-variant opacity-70">CEO Portal</p>
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
                <Link 
                    href="/" 
                    className="flex items-center gap-sm text-on-surface-variant hover:bg-surface-container-high rounded-lg px-md py-sm transition-all"
                >
                    <span className="material-symbols-outlined">logout</span>
                    <span className="font-label-md text-label-md">Logout</span>
                </Link>
            </div>
        </aside>
        </>
    );
}
