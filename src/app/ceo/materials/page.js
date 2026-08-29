'use client';
import { useState, useEffect } from 'react';
import { useCEOContext } from '../CEOContext';

const LEVELS = [
    { value: 'Level 5', label: 'Level 5 (Beginner)', color: 'bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/30' },
    { value: 'Level 4', label: 'Level 4 (Elementary)', color: 'bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30' },
    { value: 'Level 3', label: 'Level 3 (Intermediate)', color: 'bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 border-yellow-500/30' },
    { value: 'Level 2', label: 'Level 2 (Pre-Advanced)', color: 'bg-orange-500/15 text-orange-700 dark:text-orange-400 border-orange-500/30' },
    { value: 'Level 1', label: 'Level 1 (Advanced)', color: 'bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30' },
];

export default function CEOMaterials() {
    const { selectedBatch } = useCEOContext();
    const [materials, setMaterials] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [materialToDelete, setMaterialToDelete] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    
    // Filters
    const [filterLevel, setFilterLevel] = useState('All');
    const [filterType, setFilterType] = useState('All'); // 'All', 'file', 'link'
    const [searchQuery, setSearchQuery] = useState('');

    // Form state
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [level, setLevel] = useState('Level 5');
    const [batch, setBatch] = useState((selectedBatch && selectedBatch !== 'All Batches' && selectedBatch !== 'Global' && selectedBatch !== 'Global Access') ? selectedBatch : 'Batch - 1');
    const [file, setFile] = useState(null);
    const [link, setLink] = useState('');
    const [uploadType, setUploadType] = useState('file');
    const [isUploading, setIsUploading] = useState(false);

    useEffect(() => {
        if (selectedBatch && selectedBatch !== 'All Batches' && selectedBatch !== 'Global' && selectedBatch !== 'Global Access') {
            setBatch(selectedBatch);
        }
    }, [selectedBatch]);

    useEffect(() => {
        fetchMaterials();
    }, [selectedBatch]);

    const fetchMaterials = async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem('token');
            const batchParam = (selectedBatch && selectedBatch !== 'All Batches' && selectedBatch !== 'Global' && selectedBatch !== 'Global Access')
                ? `?batch=${encodeURIComponent(selectedBatch)}`
                : '';
            const response = await fetch(`${process.env.NEXT_PUBLIC_MATERIALS_API_URL || ''}/api/materials${batchParam}`, {
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

    const handleUpload = async (e) => {
        e.preventDefault();
        if (uploadType === 'file' && (!file || !title)) return;
        if (uploadType === 'link' && (!link || !title)) return;

        setIsUploading(true);
        setErrorMessage('');
        setSuccessMessage('');
        const token = localStorage.getItem('token');
        const formData = new FormData();
        formData.append('title', title);
        formData.append('description', description);
        formData.append('level', level);
        if (batch) formData.append('batch', batch.trim());
        if (uploadType === 'file') {
            formData.append('file', file);
        } else {
            formData.append('link', link);
        }

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_MATERIALS_API_URL || ''}/api/materials`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            if (response.ok) {
                setIsUploadModalOpen(false);
                setTitle('');
                setDescription('');
                setLevel('Level 5');
                setBatch((selectedBatch && selectedBatch !== 'All Batches' && selectedBatch !== 'Global' && selectedBatch !== 'Global Access') ? selectedBatch : 'Batch - 1');
                setFile(null);
                setLink('');
                setSuccessMessage('Course material uploaded successfully!');
                await fetchMaterials();
                setTimeout(() => setSuccessMessage(''), 4000);
            } else {
                const errData = await response.json().catch(() => ({}));
                setErrorMessage(errData.detail || 'Upload failed. Please try again.');
            }
        } catch (error) {
            console.error('Error uploading material:', error);
            setErrorMessage('Network error during upload.');
        } finally {
            setIsUploading(false);
        }
    };

    const confirmDelete = async () => {
        if (!materialToDelete) return;
        setIsDeleting(true);
        const token = localStorage.getItem('token');
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_MATERIALS_API_URL || ''}/api/materials/${materialToDelete.id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                setSuccessMessage(`Material "${materialToDelete.title}" deleted.`);
                setMaterialToDelete(null);
                await fetchMaterials();
                setTimeout(() => setSuccessMessage(''), 4000);
            } else {
                alert('Failed to delete material.');
            }
        } catch (error) {
            console.error('Error deleting material:', error);
        } finally {
            setIsDeleting(false);
        }
    };

    const getLevelBadgeClass = (lvl) => {
        const match = LEVELS.find(l => l.value === lvl);
        return match ? match.color : 'bg-primary/10 text-primary border-primary/20';
    };

    const checkIsFile = (url) => {
        if (!url) return false;
        return url.includes('/materials/') || url.includes('/uploads/') || url.includes('/api/materials/file/') || /\.(pdf|png|jpg|jpeg|webp|doc|docx|xls|xlsx|ppt|pptx)$/i.test(url);
    };

    const filteredMaterials = materials.filter(m => {
        if (filterLevel !== 'All' && m.level !== filterLevel) return false;
        const isFile = checkIsFile(m.file_url);
        if (filterType === 'file' && !isFile) return false;
        if (filterType === 'link' && isFile) return false;
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            const titleMatch = (m.title || '').toLowerCase().includes(q);
            const descMatch = (m.description || '').toLowerCase().includes(q);
            const batchMatch = (m.batch || '').toLowerCase().includes(q);
            return titleMatch || descMatch || batchMatch;
        }
        return true;
    });

    return (
        <section className="max-w-[1440px] mx-auto p-gutter space-y-lg animate-fade-in">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-md mb-md">
                <div>
                    <div className="flex items-center gap-sm mb-xs">
                        <span className="material-symbols-outlined text-primary text-3xl">
                            library_books
                        </span>
                        <h1 className="text-3xl md:text-4xl font-bold tracking-tight bg-gradient-to-r from-[#6FB7E4] via-[#5D8BCC] to-[#465AA3] text-transparent bg-clip-text">
                            Course Materials Management
                        </h1>
                    </div>
                    <p className="font-body-lg text-on-surface-variant max-w-2xl">
                        Upload lecture slides, practice worksheets, and reference resources for students.
                    </p>
                </div>
                
                <button 
                    onClick={() => setIsUploadModalOpen(true)}
                    className="bg-primary text-on-primary px-5 py-2.5 rounded-full font-label-lg hover:bg-primary/90 transition-all flex items-center gap-2 shadow-md cursor-pointer active:scale-95"
                >
                    <span className="material-symbols-outlined text-[20px]">add</span>
                    <span>Upload Material</span>
                </button>
            </div>

            {successMessage && (
                <div className="bg-green-500/10 text-green-700 dark:text-green-400 p-4 rounded-2xl flex items-center gap-2.5 border border-green-500/30">
                    <span className="material-symbols-outlined text-[22px]">check_circle</span>
                    <span className="text-sm font-medium">{successMessage}</span>
                </div>
            )}

            {/* Filter Controls Bar */}
            <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-4 custom-shadow flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-3">
                    {/* Level Filter */}
                    <div className="flex items-center gap-1.5">
                        <span className="text-xs text-on-surface-variant font-medium">Level:</span>
                        <select
                            value={filterLevel}
                            onChange={(e) => setFilterLevel(e.target.value)}
                            className="bg-surface-container border border-outline-variant rounded-lg px-2.5 py-1.5 text-xs text-on-surface focus:outline-none focus:border-primary"
                        >
                            <option value="All">All Levels</option>
                            {LEVELS.map(l => (
                                <option key={l.value} value={l.value}>{l.value}</option>
                            ))}
                        </select>
                    </div>

                    {/* Resource Type Filter */}
                    <div className="flex items-center gap-1.5">
                        <span className="text-xs text-on-surface-variant font-medium">Type:</span>
                        <select
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value)}
                            className="bg-surface-container border border-outline-variant rounded-lg px-2.5 py-1.5 text-xs text-on-surface focus:outline-none focus:border-primary"
                        >
                            <option value="All">All Formats</option>
                            <option value="file">Files & Docs</option>
                            <option value="link">Web Links</option>
                        </select>
                    </div>
                </div>

                {/* Search Bar */}
                <div className="relative min-w-[220px]">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[16px] text-on-surface-variant">search</span>
                    <input 
                        type="text"
                        placeholder="Search materials..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 bg-surface-container border border-outline-variant rounded-xl text-xs text-on-surface focus:outline-none focus:border-primary"
                    />
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="min-h-[400px]">
                {isLoading ? (
                    <div className="flex flex-col justify-center items-center h-64 bg-surface-container-lowest border border-outline-variant rounded-2xl gap-3">
                        <span className="material-symbols-outlined text-4xl text-primary animate-spin">progress_activity</span>
                        <p className="text-xs text-on-surface-variant">Loading course materials...</p>
                    </div>
                ) : filteredMaterials.length === 0 ? (
                    <div className="flex flex-col items-center justify-center text-center p-12 bg-surface-container-lowest rounded-2xl border border-dashed border-outline-variant h-64 custom-shadow">
                        <span className="material-symbols-outlined text-6xl text-outline/40 mb-3">folder_open</span>
                        <h3 className="font-headline-sm text-on-surface-variant font-bold">No Materials Found</h3>
                        <p className="font-body-md text-outline text-xs mt-1">
                            Click "Upload Material" to share documents or links with your students.
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
                                <div key={material.id} className="group relative bg-surface-container-lowest rounded-2xl p-5 flex flex-col justify-between border border-outline-variant hover:border-primary/50 hover:shadow-lg transition-all duration-300">
                                    <div>
                                        <div className="flex justify-between items-start mb-3.5">
                                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-xs ${isLink ? 'bg-amber-500/10 text-amber-600' : 'bg-primary/10 text-primary'}`}>
                                                <span className="material-symbols-outlined text-[28px]">
                                                    {isLink ? 'link' : 'description'}
                                                </span>
                                            </div>
                                            <button 
                                                type="button"
                                                onClick={() => setMaterialToDelete(material)}
                                                className="text-outline hover:text-error hover:bg-error-container/20 p-1.5 rounded-lg transition-colors cursor-pointer"
                                                title="Delete Material"
                                            >
                                                <span className="material-symbols-outlined text-[18px]">delete</span>
                                            </button>
                                        </div>

                                        <h3 className="font-headline-sm text-on-surface font-bold text-base break-words group-hover:text-primary transition-colors mb-1.5 line-clamp-2" title={material.title}>
                                            {material.title}
                                        </h3>

                                        <p className="font-body-md text-on-surface-variant text-xs mb-3 line-clamp-2 leading-relaxed">
                                            {material.description || 'No description provided.'}
                                        </p>

                                        {/* Badges */}
                                        <div className="flex flex-wrap items-center gap-1.5 mb-4">
                                            {material.level && (
                                                <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold border ${getLevelBadgeClass(material.level)}`}>
                                                    {material.level}
                                                </span>
                                            )}
                                            {material.batch && (
                                                <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-primary/10 text-primary border border-primary/20 flex items-center gap-1">
                                                    <span className="material-symbols-outlined text-[12px]">groups</span>
                                                    {material.batch}
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
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary/10 text-primary hover:bg-primary hover:text-on-primary text-xs font-bold transition-all shadow-2xs"
                                        >
                                            <span className="material-symbols-outlined text-[16px]">
                                                {isLink ? 'open_in_new' : 'download'}
                                            </span>
                                            <span>{isLink ? 'Open' : 'Download'}</span>
                                        </a>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Upload Modal */}
            {isUploadModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-surface rounded-3xl p-6 max-w-[500px] w-full shadow-2xl border border-outline-variant/60 max-h-[90vh] overflow-y-auto custom-scrollbar relative">
                        <div className="flex justify-between items-center mb-5 pb-3 border-b border-outline-variant/40">
                            <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary text-[24px]">upload_file</span>
                                <h2 className="font-headline-sm text-on-surface font-bold text-lg">Upload Material</h2>
                            </div>
                            <button 
                                onClick={() => setIsUploadModalOpen(false)}
                                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-container text-on-surface-variant transition-colors cursor-pointer"
                            >
                                <span className="material-symbols-outlined text-[18px]">close</span>
                            </button>
                        </div>

                        {errorMessage && (
                            <div className="bg-error/10 text-error p-3 rounded-xl text-xs mb-4 flex items-center gap-2">
                                <span className="material-symbols-outlined text-[18px]">error</span>
                                <span>{errorMessage}</span>
                            </div>
                        )}
                        
                        <form onSubmit={handleUpload} className="space-y-4">
                            {/* Upload Type Radio Selection */}
                            <div>
                                <label className="block font-label-md text-on-surface mb-2 font-semibold text-xs">Format Type</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button 
                                        type="button"
                                        onClick={() => setUploadType('file')}
                                        className={`p-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition-all cursor-pointer ${
                                            uploadType === 'file'
                                                ? 'bg-primary/10 border-primary text-primary ring-1 ring-primary'
                                                : 'border-outline-variant hover:bg-surface-container text-on-surface-variant'
                                        }`}
                                    >
                                        <span className="material-symbols-outlined text-[18px]">upload_file</span>
                                        <span>File Upload</span>
                                    </button>
                                    <button 
                                        type="button"
                                        onClick={() => setUploadType('link')}
                                        className={`p-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition-all cursor-pointer ${
                                            uploadType === 'link'
                                                ? 'bg-primary/10 border-primary text-primary ring-1 ring-primary'
                                                : 'border-outline-variant hover:bg-surface-container text-on-surface-variant'
                                        }`}
                                    >
                                        <span className="material-symbols-outlined text-[18px]">link</span>
                                        <span>External Link</span>
                                    </button>
                                </div>
                            </div>

                            {/* Title */}
                            <div>
                                <label className="block font-label-md text-on-surface mb-1 font-semibold text-xs">Material Title *</label>
                                <input 
                                    type="text" 
                                    required
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-3.5 py-2.5 text-xs text-on-surface focus:outline-none focus:border-primary transition-colors"
                                    placeholder="e.g. Chapter 4 Grammar Cheatsheet"
                                />
                            </div>
                            
                            {/* Japanese Level */}
                            <div>
                                <label className="block font-label-md text-on-surface mb-1 font-semibold text-xs">Japanese Level</label>
                                <div className="grid grid-cols-3 gap-1.5">
                                    {LEVELS.map(lvl => (
                                        <button
                                            key={lvl.value}
                                            type="button"
                                            onClick={() => setLevel(lvl.value)}
                                            className={`py-1.5 px-2 rounded-xl border text-xs font-semibold transition-all text-center ${
                                                level === lvl.value
                                                    ? `${lvl.color} border-current ring-1 ring-primary font-bold shadow-2xs`
                                                    : 'border-outline-variant/60 text-on-surface-variant hover:bg-surface-container'
                                            }`}
                                        >
                                            {lvl.value}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Target Batch */}
                            <div>
                                <label className="block font-label-md text-on-surface mb-1 font-semibold text-xs">Target Batch</label>
                                <input 
                                    type="text" 
                                    value={batch}
                                    onChange={(e) => setBatch(e.target.value)}
                                    className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-3.5 py-2 text-xs text-on-surface focus:outline-none focus:border-primary transition-colors mb-1.5"
                                    placeholder="e.g. Batch - 1, Batch - 2, or All Batches"
                                />
                                <div className="flex flex-wrap gap-1.5 items-center">
                                    <span className="text-[10px] text-on-surface-variant font-medium mr-1">Quick select:</span>
                                    {['Batch - 1', 'Batch - 2', 'Batch - 3', 'Batch - 4', 'All Batches'].map((b) => (
                                        <button
                                            key={b}
                                            type="button"
                                            onClick={() => setBatch(b)}
                                            className={`text-[10px] px-2.5 py-0.5 rounded-full border transition-all cursor-pointer ${
                                                batch === b
                                                    ? 'bg-primary text-on-primary border-primary font-bold'
                                                    : 'border-outline-variant hover:bg-surface-container text-on-surface'
                                            }`}
                                        >
                                            {b}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block font-label-md text-on-surface mb-1 font-semibold text-xs">Description (Optional)</label>
                                <textarea 
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-3.5 py-2 text-xs text-on-surface focus:outline-none focus:border-primary transition-colors min-h-[70px] resize-none"
                                    placeholder="Brief overview of content or instructions..."
                                />
                            </div>

                            {/* Upload Input */}
                            {uploadType === 'file' ? (
                                <div>
                                    <label className="block font-label-md text-on-surface mb-1 font-semibold text-xs">Document File *</label>
                                    <div className="w-full bg-surface-container-low border border-dashed border-outline-variant hover:border-primary/50 transition-colors rounded-xl p-3 flex items-center justify-center">
                                        <input 
                                            type="file" 
                                            required={uploadType === 'file'}
                                            onChange={(e) => setFile(e.target.files[0])}
                                            className="w-full text-xs text-on-surface file:mr-3 file:py-1.5 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-primary-container file:text-primary hover:file:bg-primary hover:file:text-on-primary file:transition-colors cursor-pointer"
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    <label className="block font-label-md text-on-surface mb-1 font-semibold text-xs">Resource Link URL *</label>
                                    <input 
                                        type="url" 
                                        required={uploadType === 'link'}
                                        value={link}
                                        onChange={(e) => setLink(e.target.value)}
                                        className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-3.5 py-2.5 text-xs text-on-surface focus:outline-none focus:border-primary transition-colors"
                                        placeholder="https://drive.google.com/..."
                                    />
                                </div>
                            )}
                            
                            {/* Modal Actions */}
                            <div className="flex justify-end gap-2.5 pt-4 border-t border-outline-variant/40 mt-4">
                                <button 
                                    type="button"
                                    onClick={() => setIsUploadModalOpen(false)}
                                    className="px-4 py-2 rounded-xl text-xs font-semibold text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit"
                                    disabled={isUploading}
                                    className="px-5 py-2 rounded-xl text-xs font-semibold text-on-primary bg-primary hover:opacity-90 transition-all disabled:opacity-50 flex items-center gap-2 shadow-md cursor-pointer"
                                >
                                    {isUploading ? (
                                        <>
                                            <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
                                            <span>Uploading...</span>
                                        </>
                                    ) : (
                                        <>
                                            <span className="material-symbols-outlined text-[16px]">cloud_upload</span>
                                            <span>Upload Material</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {materialToDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-surface rounded-2xl shadow-2xl p-6 w-full max-w-[420px] border border-outline-variant/60 relative">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-xl bg-error-container text-error flex items-center justify-center shrink-0">
                                <span className="material-symbols-outlined text-[24px]">warning</span>
                            </div>
                            <div>
                                <h3 className="font-headline-sm text-on-surface font-bold text-lg">Delete Material?</h3>
                                <p className="text-xs text-on-surface-variant">This action cannot be undone.</p>
                            </div>
                        </div>

                        <div className="p-3 bg-surface-container-low rounded-xl border border-outline-variant/50 my-4 text-xs space-y-1">
                            <p className="font-bold text-on-surface text-sm line-clamp-1">{materialToDelete.title}</p>
                            <div className="flex gap-1.5 pt-1">
                                {materialToDelete.level && <span className="font-semibold text-primary">{materialToDelete.level}</span>}
                                {materialToDelete.batch && <span className="font-semibold text-on-surface-variant">• {materialToDelete.batch}</span>}
                            </div>
                        </div>

                        <div className="flex justify-end gap-2.5 mt-5">
                            <button
                                type="button"
                                onClick={() => setMaterialToDelete(null)}
                                disabled={isDeleting}
                                className="px-4 py-2 rounded-xl border border-outline-variant text-on-surface hover:bg-surface-container text-xs font-semibold transition-colors cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={confirmDelete}
                                disabled={isDeleting}
                                className="px-4 py-2 rounded-xl bg-error text-on-error hover:bg-error/90 text-xs font-semibold transition-all flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
                            >
                                {isDeleting ? (
                                    <>
                                        <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
                                        <span>Deleting...</span>
                                    </>
                                ) : (
                                    <>
                                        <span className="material-symbols-outlined text-[16px]">delete</span>
                                        <span>Delete Material</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}
