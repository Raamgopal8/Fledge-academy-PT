'use client';
import { useState, useEffect } from 'react';
import { CategoryBadge } from '@/app/components/CategoryColorPicker';

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

    // In-page Material Viewer
    const [viewingMaterial, setViewingMaterial] = useState(null);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [iframeLoading, setIframeLoading] = useState(true);

    useEffect(() => {
        const fetchStudentInfoAndMaterials = async () => {
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
                setStudentInfo({ level, batch });
            } catch (error) {
                console.error('Failed to fetch materials:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchStudentInfoAndMaterials();
    }, []);

    // Handle ESC key and body scroll lock when modal is open
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                setViewingMaterial(null);
            }
        };
        if (viewingMaterial) {
            window.addEventListener('keydown', handleKeyDown);
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = 'unset';
        };
    }, [viewingMaterial]);

    const getLevelBadgeClass = (lvl) => {
        return LEVEL_COLORS[lvl] || 'bg-primary/10 text-primary border-primary/20';
    };

    const checkIsFile = (url) => {
        if (!url) return false;
        return url.includes('/materials/') || url.includes('/uploads/') || url.includes('/api/materials/file/') || /\.(pdf|png|jpg|jpeg|webp|gif|svg|doc|docx|xls|xlsx|ppt|pptx|mp4|webm|mp3|wav)$/i.test(url);
    };

    const getFileUrl = (url) => {
        if (!url) return '';
        return url.startsWith('http') 
            ? url 
            : `${process.env.NEXT_PUBLIC_MATERIALS_API_URL || ''}${url}`;
    };

    const getMaterialType = (url) => {
        if (!url) return 'other';
        const cleanUrl = url.split('?')[0].toLowerCase();
        if (/\.(pdf)$/i.test(cleanUrl) || cleanUrl.includes('/pdf')) return 'pdf';
        if (/\.(png|jpe?g|webp|gif|svg|bmp)$/i.test(cleanUrl)) return 'image';
        if (/\.(mp4|webm|ogg|mov)$/i.test(cleanUrl)) return 'video';
        if (/\.(mp3|wav|ogg|m4a|aac)$/i.test(cleanUrl)) return 'audio';
        if (/\.(doc|docx|xls|xlsx|ppt|pptx)$/i.test(cleanUrl)) return 'office';
        if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
        if (url.includes('drive.google.com') || url.includes('docs.google.com')) return 'gdoc';
        if (checkIsFile(url)) return 'file';
        return 'link';
    };

    const getEmbedUrl = (url, type) => {
        if (!url) return '';
        if (type === 'youtube') {
            const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
            if (match && match[1]) {
                return `https://www.youtube.com/embed/${match[1]}?autoplay=1`;
            }
        }
        if (type === 'gdoc') {
            if (url.includes('drive.google.com/file/d/')) {
                return url.replace(/\/view(\?.*)?$/, '/preview');
            }
            if (url.includes('docs.google.com') && !url.includes('/preview') && !url.includes('/pub')) {
                return url.replace(/\/edit(\?.*)?$/, '/preview');
            }
        }
        return url;
    };

    const handleViewMaterial = (material) => {
        setIframeLoading(true);
        setIsFullscreen(false);
        setViewingMaterial(material);
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
        <section className="max-w-[1440px] mx-auto p-4 md:px-8 lg:px-12 md:py-8 space-y-6 md:space-y-8 relative animate-fade-in">
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
                                    Your instructors haven&apos;t uploaded resources for this category yet. Check back soon!
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
                                                    <button
                                                        type="button"
                                                        onClick={() => handleViewMaterial(material)}
                                                        className="opacity-75 group-hover:opacity-100 hover:opacity-100 p-2 rounded-xl hover:bg-surface-container text-on-surface-variant hover:text-primary transition-all cursor-pointer"
                                                        title="View material in page"
                                                    >
                                                        <span className="material-symbols-outlined text-[20px]">visibility</span>
                                                    </button>
                                                </div>

                                                <h3 
                                                    onClick={() => handleViewMaterial(material)}
                                                    className="font-headline-sm text-on-surface font-bold text-base mb-1.5 break-words group-hover:text-primary transition-colors line-clamp-2 cursor-pointer" 
                                                    title={`View ${material.title}`}
                                                >
                                                    {material.title}
                                                </h3>

                                                <p className="font-body-md text-on-surface-variant text-xs mb-3 line-clamp-2 leading-relaxed">
                                                    {material.description || 'No description provided.'}
                                                </p>

                                                {/* Level and Category Badges */}
                                                <div className="flex flex-wrap items-center gap-1.5 mb-3">
                                                    {material.category && (
                                                        <CategoryBadge 
                                                            category={material.category} 
                                                            color={material.category_color} 
                                                        />
                                                    )}
                                                    {material.level && (
                                                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${getLevelBadgeClass(material.level)}`}>
                                                            {material.level}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Action Footer */}
                                            <div className="flex items-center justify-between pt-3 border-t border-outline-variant/40 mt-auto gap-2">
                                                <span className="text-[11px] font-medium text-on-surface-variant/80 flex items-center gap-1">
                                                    <span className="material-symbols-outlined text-[13px]">calendar_today</span>
                                                    {material.created_at ? new Date(material.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'Recent'}
                                                </span>
                                                <div className="flex items-center gap-1.5">
                                                    <button 
                                                        type="button"
                                                        onClick={() => handleViewMaterial(material)}
                                                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-primary text-on-primary hover:opacity-90 transition-all font-label-md text-xs font-bold shadow-xs cursor-pointer active:scale-95"
                                                    >
                                                        <span className="material-symbols-outlined text-[15px]">visibility</span>
                                                        <span>View</span>
                                                    </button>
                                                    <a 
                                                        href={fileDownloadUrl} 
                                                        target="_blank" 
                                                        rel="noopener noreferrer"
                                                        download={isFile}
                                                        className="inline-flex items-center justify-center p-1.5 rounded-xl border border-outline-variant hover:bg-surface-container text-on-surface-variant hover:text-primary transition-all cursor-pointer active:scale-95"
                                                        title={isLink ? 'Open external link in new tab' : 'Download file'}
                                                    >
                                                        <span className="material-symbols-outlined text-[16px]">
                                                            {isLink ? 'open_in_new' : 'download'}
                                                        </span>
                                                    </a>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* In-Page Material Viewer Modal */}
                {viewingMaterial && (() => {
                    const fullUrl = getFileUrl(viewingMaterial.file_url);
                    const materialType = getMaterialType(viewingMaterial.file_url);
                    const isFile = checkIsFile(viewingMaterial.file_url);
                    const isPublicHttp = fullUrl.startsWith('https://') || (fullUrl.startsWith('http://') && !fullUrl.includes('localhost'));
                    const embedUrl = getEmbedUrl(fullUrl, materialType);

                    return (
                        <div 
                            className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-sm p-2 sm:p-4 md:p-6 animate-fade-in"
                            onClick={(e) => {
                                if (e.target === e.currentTarget) setViewingMaterial(null);
                            }}
                        >
                            <div 
                                className={`bg-surface rounded-3xl w-full flex flex-col shadow-2xl border border-outline-variant/60 overflow-hidden transition-all duration-200 ${
                                    isFullscreen 
                                        ? 'fixed inset-0 rounded-none h-full max-w-none z-50' 
                                        : 'max-w-5xl h-[88vh]'
                                }`}
                            >
                                {/* Modal Header */}
                                <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-outline-variant/40 bg-surface-container-low/80 shrink-0 gap-3">
                                    <div className="flex items-center gap-3 min-w-0 flex-1">
                                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-2xs ${
                                            materialType === 'video' || materialType === 'youtube'
                                                ? 'bg-red-500/10 text-red-500'
                                                : materialType === 'audio'
                                                ? 'bg-purple-500/10 text-purple-500'
                                                : materialType === 'image'
                                                ? 'bg-emerald-500/10 text-emerald-500'
                                                : !isFile
                                                ? 'bg-amber-500/10 text-amber-600'
                                                : 'bg-primary/10 text-primary'
                                        }`}>
                                            <span className="material-symbols-outlined text-[20px]">
                                                {materialType === 'video' || materialType === 'youtube' ? 'movie' :
                                                 materialType === 'audio' ? 'graphic_eq' :
                                                 materialType === 'image' ? 'image' :
                                                 !isFile ? 'link' : 'description'}
                                            </span>
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <h2 className="font-bold text-sm sm:text-base text-on-surface truncate" title={viewingMaterial.title}>
                                                    {viewingMaterial.title}
                                                </h2>
                                                {viewingMaterial.category && (
                                                    <CategoryBadge 
                                                        category={viewingMaterial.category} 
                                                        color={viewingMaterial.category_color} 
                                                    />
                                                )}
                                                {viewingMaterial.level && (
                                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getLevelBadgeClass(viewingMaterial.level)}`}>
                                                        {viewingMaterial.level}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Modal Controls */}
                                    <div className="flex items-center gap-1.5 shrink-0">
                                        {isFile && (
                                            <a
                                                href={fullUrl}
                                                download
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-container hover:bg-surface-container-high border border-outline-variant/60 text-on-surface text-xs font-semibold transition-all cursor-pointer shadow-2xs active:scale-95"
                                                title="Download file"
                                            >
                                                <span className="material-symbols-outlined text-[16px]">download</span>
                                                <span>Download</span>
                                            </a>
                                        )}

                                        <a
                                            href={fullUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-surface-container hover:bg-surface-container-high border border-outline-variant/60 text-on-surface text-xs font-semibold transition-all cursor-pointer shadow-2xs active:scale-95"
                                            title="Open in new window / tab"
                                        >
                                            <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                                            <span className="hidden sm:inline">Open in tab</span>
                                        </a>

                                        <button
                                            type="button"
                                            onClick={() => setIsFullscreen(!isFullscreen)}
                                            className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-surface-container text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
                                            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
                                        >
                                            <span className="material-symbols-outlined text-[18px]">
                                                {isFullscreen ? 'fullscreen_exit' : 'fullscreen'}
                                            </span>
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => setViewingMaterial(null)}
                                            className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-surface-container text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
                                            title="Close (Esc)"
                                        >
                                            <span className="material-symbols-outlined text-[20px]">close</span>
                                        </button>
                                    </div>
                                </div>

                                {/* Subtitle / Description strip if present */}
                                {viewingMaterial.description && (
                                    <div className="px-4 sm:px-6 py-2 bg-surface-container-low/40 border-b border-outline-variant/30 text-xs text-on-surface-variant shrink-0">
                                        <p className="line-clamp-2 leading-relaxed">
                                            {viewingMaterial.description}
                                        </p>
                                    </div>
                                )}

                                {/* Main Content Viewer */}
                                <div className="relative flex-1 w-full bg-surface-container-lowest overflow-hidden flex items-center justify-center">
                                    {/* Image Viewer */}
                                    {materialType === 'image' && (
                                        <div className="w-full h-full p-4 overflow-auto flex items-center justify-center bg-black/5 dark:bg-black/20">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img 
                                                src={fullUrl} 
                                                alt={viewingMaterial.title} 
                                                className="max-w-full max-h-full object-contain rounded-xl shadow-md select-none"
                                            />
                                        </div>
                                    )}

                                    {/* Video Player */}
                                    {materialType === 'video' && (
                                        <div className="w-full h-full p-4 flex items-center justify-center bg-black">
                                            <video 
                                                src={fullUrl} 
                                                controls 
                                                autoPlay 
                                                className="max-w-full max-h-full rounded-xl shadow-lg"
                                            />
                                        </div>
                                    )}

                                    {/* Audio Player */}
                                    {materialType === 'audio' && (
                                        <div className="w-full h-full flex flex-col items-center justify-center p-6 gap-6 bg-surface-container-low">
                                            <div className="w-20 h-20 rounded-3xl bg-primary/10 text-primary flex items-center justify-center shadow-md">
                                                <span className="material-symbols-outlined text-4xl">graphic_eq</span>
                                            </div>
                                            <div className="text-center max-w-md">
                                                <h4 className="font-bold text-on-surface text-base mb-1">{viewingMaterial.title}</h4>
                                                <p className="text-xs text-on-surface-variant">Audio Lesson & Listening Material</p>
                                            </div>
                                            <audio src={fullUrl} controls autoPlay className="w-full max-w-md shadow-sm" />
                                        </div>
                                    )}

                                    {/* YouTube Video Player */}
                                    {materialType === 'youtube' && (
                                        <iframe 
                                            src={embedUrl} 
                                            title={viewingMaterial.title}
                                            className="w-full h-full border-0"
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                            allowFullScreen
                                        />
                                    )}

                                    {/* Google Docs / Drive Preview */}
                                    {materialType === 'gdoc' && (
                                        <iframe 
                                            src={embedUrl} 
                                            title={viewingMaterial.title}
                                            className="w-full h-full border-0"
                                            allowFullScreen
                                        />
                                    )}

                                    {/* Office Documents (.docx, .pptx, .xlsx) */}
                                    {materialType === 'office' && (
                                        isPublicHttp ? (
                                            <div className="relative w-full h-full">
                                                {iframeLoading && (
                                                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-surface-container-lowest z-10">
                                                        <span className="material-symbols-outlined text-3xl text-primary animate-spin">progress_activity</span>
                                                        <span className="text-xs text-on-surface-variant">Rendering document preview...</span>
                                                    </div>
                                                )}
                                                <iframe 
                                                    src={`https://docs.google.com/viewer?url=${encodeURIComponent(fullUrl)}&embedded=true`}
                                                    title={viewingMaterial.title}
                                                    className="w-full h-full border-0"
                                                    onLoad={() => setIframeLoading(false)}
                                                />
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center justify-center text-center p-8 gap-4 max-w-md mx-auto">
                                                <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                                                    <span className="material-symbols-outlined text-3xl">description</span>
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-on-surface text-base mb-1">Office Document</h4>
                                                    <p className="text-xs text-on-surface-variant leading-relaxed">
                                                        This document ({fullUrl.split('.').pop()?.toUpperCase() || 'Office'}) is ready for download to view on your device.
                                                    </p>
                                                </div>
                                                <a 
                                                    href={fullUrl} 
                                                    download 
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-on-primary text-xs font-bold shadow-md hover:opacity-90 transition-all cursor-pointer"
                                                >
                                                    <span className="material-symbols-outlined text-[18px]">download</span>
                                                    <span>Download and View Document</span>
                                                </a>
                                            </div>
                                        )
                                    )}

                                    {/* PDF and Generic Files or Embeddable Links */}
                                    {(materialType === 'pdf' || materialType === 'file' || materialType === 'link' || materialType === 'other') && (
                                        <div className="relative w-full h-full">
                                            {iframeLoading && (
                                                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-surface-container-lowest z-10">
                                                    <span className="material-symbols-outlined text-3xl text-primary animate-spin">progress_activity</span>
                                                    <span className="text-xs text-on-surface-variant">Loading content preview...</span>
                                                </div>
                                            )}
                                            <iframe 
                                                src={fullUrl} 
                                                title={viewingMaterial.title}
                                                className="w-full h-full border-0"
                                                onLoad={() => setIframeLoading(false)}
                                            />
                                        </div>
                                    )}
                                </div>

                                {/* External link fallback note footer if viewing external website */}
                                {!isFile && materialType !== 'youtube' && materialType !== 'gdoc' && (
                                    <div className="px-4 sm:px-6 py-2 bg-surface-container-low border-t border-outline-variant/30 text-[11px] text-on-surface-variant flex items-center justify-between shrink-0">
                                        <span>External website not showing properly?</span>
                                        <a 
                                            href={fullUrl} 
                                            target="_blank" 
                                            rel="noopener noreferrer" 
                                            className="font-semibold text-primary hover:underline inline-flex items-center gap-1 ml-2"
                                        >
                                            Open directly in new tab
                                            <span className="material-symbols-outlined text-[13px]">open_in_new</span>
                                        </a>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })()}
            </section>
    );
}
