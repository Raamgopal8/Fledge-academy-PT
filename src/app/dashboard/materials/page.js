'use client';
import { useState, useEffect } from 'react';

const LEVEL_COLORS = {
    'Level 5': 'bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/30',
    'Level 4': 'bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30',
    'Level 3': 'bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 border-yellow-500/30',
    'Level 2': 'bg-orange-500/15 text-orange-700 dark:text-orange-400 border-orange-500/30',
    'Level 1': 'bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30',
};

export default function StudentMaterials() {
    const [materials, setMaterials] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [studentInfo, setStudentInfo] = useState({ level: 'Level 5', batch: '' });
    
    // Filter & Search
    const [filterType, setFilterType] = useState('All'); // 'All', 'file', 'link'
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchStudentInfoAndMaterials();
    }, []);

    const fetchStudentInfoAndMaterials = async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem('token');
            let level = localStorage.getItem('level');
            let batch = localStorage.getItem('batch');

            // Fallback from profile
            if (!level || !batch) {
                try {
                    const profRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/user/profile`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (profRes.ok) {
                        const prof = await profRes.json();
                        level = prof.level || level || 'Level 5';
                        batch = prof.batch || batch || '';
                        localStorage.setItem('level', level);
                        if (batch) localStorage.setItem('batch', batch);
                    }
                } catch (e) {
                    console.error("Profile fetch fallback error:", e);
                }
            }

            level = level || 'Level 5';
            batch = batch || '';
            setStudentInfo({ level, batch });

            const queryParams = new URLSearchParams();
            if (level) queryParams.append('level', level);
            if (batch) queryParams.append('batch', batch);

            const response = await fetch(`${process.env.NEXT_PUBLIC_MATERIALS_API_URL || ''}/api/materials/?${queryParams.toString()}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (response.ok) {
                const data = await response.json();
                setMaterials(data);
            }
        } catch (error) {
            console.error('Failed to fetch materials:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const getLevelBadgeClass = (lvl) => {
        return LEVEL_COLORS[lvl] || 'bg-primary/10 text-primary border-primary/20';
    };

    const checkIsFile = (url) => {
        if (!url) return false;
        return url.includes('/materials/') || url.includes('/uploads/') || url.includes('/api/materials/file/') || /\.(pdf|png|jpg|jpeg|webp|doc|docx|xls|xlsx|ppt|pptx)$/i.test(url);
    };

    const filteredMaterials = materials.filter(m => {
        const isFile = checkIsFile(m.file_url);
        const isLink = !isFile && m.file_url.startsWith('http');
        if (filterType === 'file' && isLink) return false;
        if (filterType === 'link' && !isLink) return false;
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            const titleMatch = (m.title || '').toLowerCase().includes(q);
            const descMatch = (m.description || '').toLowerCase().includes(q);
            return titleMatch || descMatch;
        }
        return true;
    });

    return (
        <section className="max-w-[1440px] mx-auto p-gutter space-y-lg animate-fade-in">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-md mb-lg">
                    <div>
                        <div className="flex items-center gap-sm mb-xs">
                            <span className="material-symbols-outlined text-primary text-3xl">library_books</span>
                            <h1 className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#6FB7E4] via-[#5D8BCC] to-[#465AA3]">
                                Learning Materials
                            </h1>
                        </div>
                        <p className="font-body-lg text-on-surface-variant max-w-2xl">
                            Access course study guides, practice worksheets, and reference resources for your level.
                        </p>
                    </div>

                    {/* Active Student Level Indicator (Batch is hidden in UI) */}
                    <div className="flex items-center gap-2">
                        {studentInfo.level && (
                            <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold shadow-2xs">
                                <span className="material-symbols-outlined text-[16px]">school</span>
                                <span>{studentInfo.level}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Filter and Content Card */}
                <div className="rounded-3xl bg-surface-container-lowest p-lg overflow-hidden border border-outline-variant shadow-sm hover:shadow-md transition-shadow min-h-[400px] space-y-6">
                    {/* Controls Bar */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-outline-variant/50">
                        {/* Format Filter Tabs */}
                        <div className="flex gap-2 overflow-x-auto pb-1 custom-scrollbar">
                            {[
                                { key: 'All', label: 'All Materials', icon: 'auto_stories' },
                                { key: 'file', label: 'Documents & PDFs', icon: 'description' },
                                { key: 'link', label: 'Reference Links', icon: 'link' },
                            ].map(tab => (
                                <button
                                    key={tab.key}
                                    onClick={() => setFilterType(tab.key)}
                                    className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                                        filterType === tab.key 
                                            ? 'bg-primary text-on-primary shadow-xs font-bold' 
                                            : 'bg-surface-container-low border border-outline-variant/60 text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                                    }`}
                                >
                                    <span className="material-symbols-outlined text-[15px]">{tab.icon}</span>
                                    <span>{tab.label}</span>
                                </button>
                            ))}
                        </div>

                        {/* Search Input */}
                        <div className="relative min-w-[220px]">
                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-on-surface-variant">search</span>
                            <input 
                                type="text"
                                placeholder="Search materials..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-9 pr-4 py-1.5 bg-surface-container-low border border-outline-variant rounded-xl text-xs text-on-surface focus:outline-none focus:border-primary transition-colors"
                            />
                        </div>
                    </div>

                    {/* Materials Grid */}
                    <div>
                        {isLoading ? (
                            <div className="flex flex-col justify-center items-center h-64 gap-3">
                                <span className="material-symbols-outlined text-4xl text-primary animate-spin">progress_activity</span>
                                <p className="text-xs text-on-surface-variant">Loading learning resources...</p>
                            </div>
                        ) : filteredMaterials.length === 0 ? (
                            <div className="flex flex-col items-center justify-center text-center p-xl bg-surface-container/30 rounded-2xl border border-dashed border-outline-variant h-64">
                                <span className="material-symbols-outlined text-6xl text-outline/40 mb-3">folder_open</span>
                                <h3 className="font-headline-sm text-on-surface-variant font-bold">No Materials Found</h3>
                                <p className="font-body-md text-outline text-xs mt-1">
                                    Your instructors haven't uploaded resources for this category yet. Check back soon!
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {filteredMaterials.map((material) => {
                                    const isFile = checkIsFile(material.file_url);
                                    const isLink = !isFile && material.file_url.startsWith('http');
                                    const fileDownloadUrl = material.file_url.startsWith('http') 
                                        ? material.file_url 
                                        : `${process.env.NEXT_PUBLIC_MATERIALS_API_URL || ''}${material.file_url}`;

                                    return (
                                        <div key={material.id} className="group relative bg-surface-container-low rounded-2xl p-5 flex flex-col justify-between border border-outline-variant hover:border-primary/50 hover:shadow-lg transition-all duration-300">
                                            <div>
                                                <div className="flex justify-between items-start mb-3">
                                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-xs ${isLink ? 'bg-amber-500/10 text-amber-600' : 'bg-primary/10 text-primary'}`}>
                                                        <span className="material-symbols-outlined text-[28px]">
                                                            {isLink ? 'link' : 'description'}
                                                        </span>
                                                    </div>
                                                </div>

                                                <h3 className="font-headline-sm text-on-surface font-bold text-base mb-1.5 break-words group-hover:text-primary transition-colors line-clamp-2" title={material.title}>
                                                    {material.title}
                                                </h3>

                                                <p className="font-body-md text-on-surface-variant text-xs mb-3 line-clamp-2 leading-relaxed">
                                                    {material.description || 'No description provided.'}
                                                </p>

                                                {/* Level Badge (Batch hidden in UI) */}
                                                <div className="flex flex-wrap items-center gap-1.5 mb-3">
                                                    {material.level && (
                                                        <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold border ${getLevelBadgeClass(material.level)}`}>
                                                            {material.level}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Action Footer */}
                                            <div className="flex items-center justify-between pt-3 border-t border-outline-variant/40 mt-auto">
                                                <span className="text-[11px] font-medium text-on-surface-variant/80 flex items-center gap-1">
                                                    <span className="material-symbols-outlined text-[13px]">calendar_today</span>
                                                    {material.created_at ? new Date(material.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'Recent'}
                                                </span>
                                                <a 
                                                    href={fileDownloadUrl} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-primary text-on-primary hover:opacity-90 transition-all font-label-md text-xs font-bold shadow-xs cursor-pointer active:scale-95"
                                                >
                                                    <span className="material-symbols-outlined text-[16px]">
                                                        {isLink ? 'open_in_new' : 'download'}
                                                    </span>
                                                    <span>{isLink ? 'Open Link' : 'Download'}</span>
                                                </a>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </section>
    );
}
