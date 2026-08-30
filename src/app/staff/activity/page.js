'use client';

export default function StaffActivity() {
    return (
        <div className="max-w-[1440px] mx-auto p-gutter space-y-lg relative pb-32 animate-fade-in w-full max-w-full overflow-x-hidden">
            {/* Header */}
            <section className="flex flex-col md:flex-row md:items-center justify-between gap-md mb-lg">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="material-symbols-outlined text-primary text-3xl">history</span>
                        <h1 className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#6FB7E4] via-[#5D8BCC] to-[#465AA3]">
                            Staff Activity Log
                        </h1>
                    </div>
                    <p className="font-body-md text-on-surface-variant max-w-2xl">
                        Review your recent actions and updates
                    </p>
                </div>
            </section>

            {/* Bento Grid Layout */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 w-full max-w-full">
                
                {/* Main Content Area */}
                <div className="md:col-span-8 flex flex-col gap-5">
                    <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-3xl p-5 md:p-6 custom-shadow min-h-[400px] flex flex-col">
                        <div className="flex justify-between items-center mb-4 pb-3 border-b border-outline-variant/40">
                            <h2 className="font-headline-sm text-on-surface font-bold text-base">Overview Data</h2>
                            <button className="material-symbols-outlined text-outline hover:text-primary transition-colors">
                                more_horiz
                            </button>
                        </div>
                        
                        <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-surface-container-low/40 rounded-2xl border border-dashed border-outline-variant/60">
                            <span className="material-symbols-outlined text-5xl text-outline/50 mb-3">
                                pending_actions
                            </span>
                            <h3 className="font-headline-sm text-on-surface-variant font-bold text-base mb-1">Data Pending Integration</h3>
                            <p className="font-body-md text-on-surface-variant text-xs max-w-md">
                                This section is currently a placeholder. Live data will be populated once the backend integration for Staff Activity Log is complete.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Sidebar Area */}
                <div className="md:col-span-4 flex flex-col gap-5">
                    
                    {/* Stats Card */}
                    <div className="bg-primary text-on-primary rounded-3xl p-5 shadow-sm relative overflow-hidden group cursor-pointer hover:shadow-md transition-all">
                        <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full group-hover:scale-150 transition-transform duration-500 ease-out"></div>
                        <h3 className="text-xs font-bold uppercase tracking-wider opacity-80 mb-2">Quick Statistic</h3>
                        <div className="flex items-end gap-2">
                            <span className="text-3xl font-extrabold leading-none">42</span>
                            <span className="text-xs mb-1 opacity-80">Active Items</span>
                        </div>
                    </div>

                    {/* Quick Links / Actions */}
                    <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-3xl p-5 custom-shadow flex-1">
                        <h3 className="font-headline-sm text-on-surface font-bold text-base mb-3">Related Actions</h3>
                        <div className="space-y-2">
                            {[1, 2, 3].map(i => (
                                <button key={i} className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-surface-container-low transition-colors group border border-outline-variant/40">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-xl bg-secondary-container text-on-secondary-container flex items-center justify-center">
                                            <span className="material-symbols-outlined text-[16px]">bolt</span>
                                        </div>
                                        <span className="font-bold text-xs text-on-surface">Quick Action {i}</span>
                                    </div>
                                    <span className="material-symbols-outlined text-outline group-hover:text-primary group-hover:translate-x-1 transition-all text-[18px]">
                                        chevron_right
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
