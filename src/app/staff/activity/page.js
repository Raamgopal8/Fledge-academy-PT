'use client';

export default function StaffActivity() {
    return (
        <div className="max-w-[1440px] mx-auto p-4 md:px-8 lg:px-12 md:py-8 space-y-6 md:space-y-8 relative pb-32 animate-fade-in">
            {/* Header */}
            <section className="flex flex-col md:flex-row md:items-center justify-between gap-md mb-lg">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="material-symbols-outlined text-primary text-3xl">history</span>
                        <h1 className="text-3xl md:text-4xl font-bold tracking-tight bg-gradient-to-r from-[#6FB7E4] via-[#5D8BCC] to-[#465AA3] text-transparent bg-clip-text">
                            Staff Activity Log
                        </h1>
                    </div>
                    <p className="font-body-md text-on-surface-variant max-w-2xl mt-1">
                        Review your recent instructor actions, graded tests, and institutional updates.
                    </p>
                </div>
            </section>

            {/* Bento Grid Layout */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                
                {/* Main Content Area */}
                <div className="md:col-span-8 flex flex-col gap-5">
                    <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-3xl p-5 md:p-6 custom-shadow hover:shadow-md min-h-[400px] flex flex-col">
                        <div className="flex justify-between items-center mb-4 pb-3 border-b border-outline-variant/60">
                            <h2 className="font-bold text-lg text-on-surface">Overview Data</h2>
                            <button className="material-symbols-outlined text-outline hover:text-primary transition-colors">
                                more_horiz
                            </button>
                        </div>
                        
                        <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-surface-container-low/50 rounded-2xl border border-dashed border-outline-variant/60">
                            <span className="material-symbols-outlined text-6xl text-outline/50 mb-3">
                                pending_actions
                            </span>
                            <h3 className="font-bold text-base text-on-surface-variant mb-1">Activity Log Sync</h3>
                            <p className="text-xs sm:text-sm text-outline max-w-md">
                                Live activity stream is recorded automatically across student interactions and reviews.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Sidebar Area */}
                <div className="md:col-span-4 flex flex-col gap-5">
                    
                    {/* Stats Card */}
                    <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-3xl p-5 md:p-6 custom-shadow hover:shadow-md transition-all relative overflow-hidden group">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                                <span className="material-symbols-outlined text-[22px]">bolt</span>
                            </div>
                            <h3 className="text-sm font-bold text-on-surface">Quick Actions</h3>
                        </div>
                        <p className="text-xs text-on-surface-variant">Frequently used instructor shortcuts</p>
                    </div>

                    {/* Quick Links / Actions */}
                    <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-3xl p-5 md:p-6 custom-shadow hover:shadow-md transition-all flex-1">
                        <h3 className="text-sm font-bold text-on-surface mb-3">Related Actions</h3>
                        <div className="space-y-2">
                            {[
                                { title: 'View Student Submissions', href: '/staff/activities', icon: 'assignment' },
                                { title: 'Manage Course Materials', href: '/staff/materials', icon: 'library_books' },
                                { title: 'Check Class Schedule', href: '/staff/schedule', icon: 'calendar_month' }
                            ].map((item, i) => (
                                <a key={i} href={item.href} className="w-full flex items-center justify-between p-3 rounded-2xl bg-surface-container-low/60 hover:bg-surface-container-high/60 border border-outline-variant/40 transition-colors group cursor-pointer">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-xl bg-surface-container text-primary flex items-center justify-center">
                                            <span className="material-symbols-outlined text-[18px]">{item.icon}</span>
                                        </div>
                                        <span className="text-xs font-semibold text-on-surface">{item.title}</span>
                                    </div>
                                    <span className="material-symbols-outlined text-outline group-hover:text-primary group-hover:translate-x-0.5 transition-all text-[18px]">
                                        chevron_right
                                    </span>
                                </a>
                            ))}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
