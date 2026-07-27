'use client';

export default function StudentActivity() {
    return (
        <section className="max-w-[1440px] mx-auto p-gutter space-y-lg animate-fade-in">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-md mb-lg">
                <div>
                    <div className="flex items-center gap-sm mb-xs">
                        <span className="material-symbols-outlined text-primary text-3xl">
                            history
                        </span>
                        <h1 className="font-display-sm md:font-display-md text-on-surface">
                            Recent Activity
                        </h1>
                    </div>
                    <p className="font-body-lg text-on-surface-variant max-w-2xl">
                        Track your progress and engagement
                    </p>
                </div>
                
                <div className="flex gap-sm">
                    <button className="flex items-center gap-xs px-md py-sm rounded-lg bg-surface-container-high text-on-surface hover:bg-surface-container-highest transition-colors active:scale-95 font-label-md">
                        <span className="material-symbols-outlined text-[18px]">filter_list</span>
                        Filter
                    </button>
                    <button className="flex items-center gap-xs px-md py-sm rounded-lg bg-primary text-on-primary hover:opacity-90 transition-colors active:scale-95 font-label-md shadow-sm">
                        <span className="material-symbols-outlined text-[18px]">add</span>
                        New Action
                    </button>
                </div>
            </div>

            {/* Bento Grid Layout */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-md">
                
                {/* Main Content Area */}
                <div className="md:col-span-8 flex flex-col gap-md">
                    <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-lg custom-shadow min-h-[400px] flex flex-col">
                        <div className="flex justify-between items-center mb-md pb-sm border-b border-outline-variant">
                            <h2 className="font-headline-sm text-on-surface">Overview Data</h2>
                            <button className="material-symbols-outlined text-outline hover:text-primary transition-colors">
                                more_horiz
                            </button>
                        </div>
                        
                        <div className="flex-1 flex flex-col items-center justify-center text-center p-xl bg-surface-container/30 rounded-xl border border-dashed border-outline-variant">
                            <span className="material-symbols-outlined text-6xl text-outline/50 mb-md">
                                pending_actions
                            </span>
                            <h3 className="font-headline-sm text-on-surface-variant mb-xs">Data Pending Integration</h3>
                            <p className="font-body-md text-outline max-w-md">
                                This section is currently a placeholder. Live data will be populated once the backend integration for Recent Activity is complete.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Sidebar Area */}
                <div className="md:col-span-4 flex flex-col gap-md">
                    
                    {/* Stats Card */}
                    <div className="bg-primary-container text-on-primary-container rounded-2xl p-md shadow-sm relative overflow-hidden group cursor-pointer hover:shadow-md transition-all">
                        <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary/10 rounded-full group-hover:scale-150 transition-transform duration-500 ease-out"></div>
                        <h3 className="font-label-md opacity-80 mb-sm">Quick Statistic</h3>
                        <div className="flex items-end gap-sm">
                            <span className="font-display-md leading-none">42</span>
                            <span className="font-label-sm mb-1 opacity-80">Active Items</span>
                        </div>
                    </div>

                    {/* Quick Links / Actions */}
                    <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-md custom-shadow flex-1">
                        <h3 className="font-label-lg text-on-surface mb-md">Related Actions</h3>
                        <div className="space-y-sm">
                            {[1, 2, 3].map(i => (
                                <button key={i} className="w-full flex items-center justify-between p-sm rounded-lg hover:bg-surface-container-low transition-colors group">
                                    <div className="flex items-center gap-sm">
                                        <div className="w-8 h-8 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center">
                                            <span className="material-symbols-outlined text-[16px]">bolt</span>
                                        </div>
                                        <span className="font-body-md text-on-surface">Quick Action {i}</span>
                                    </div>
                                    <span className="material-symbols-outlined text-outline group-hover:text-primary group-hover:translate-x-1 transition-all">
                                        chevron_right
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

            </div>
        </section>
    );
}
