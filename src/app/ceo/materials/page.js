'use client';
import { useState, useEffect } from 'react';

export default function CEOMaterials() {
    const [materials, setMaterials] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    
    // Form state
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [file, setFile] = useState(null);
    const [link, setLink] = useState('');
    const [uploadType, setUploadType] = useState('file');
    const [isUploading, setIsUploading] = useState(false);

    useEffect(() => {
        fetchMaterials();
    }, []);

    const fetchMaterials = async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${process.env.NEXT_PUBLIC_MATERIALS_API_URL || 'http://localhost:8005'}/api/materials`, {
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
        const token = localStorage.getItem('token');
        const formData = new FormData();
        formData.append('title', title);
        formData.append('description', description);
        if (uploadType === 'file') {
            formData.append('file', file);
        } else {
            formData.append('link', link);
        }

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_MATERIALS_API_URL || 'http://localhost:8005'}/api/materials`, {
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
                setFile(null);
                setLink('');
                fetchMaterials();
            } else {
                console.error('Upload failed');
            }
        } catch (error) {
            console.error('Error uploading material:', error);
        } finally {
            setIsUploading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this material?')) return;
        
        const token = localStorage.getItem('token');
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_MATERIALS_API_URL || 'http://localhost:8005'}/api/materials/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                fetchMaterials();
            }
        } catch (error) {
            console.error('Error deleting material:', error);
        }
    };

    return (
        <section className="max-w-[1440px] mx-auto p-gutter space-y-lg animate-fade-in">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-md mb-lg">
                <div>
                    <div className="flex items-center gap-sm mb-xs">
                        <span className="material-symbols-outlined text-primary text-3xl">
                            library_books
                        </span>
                        <h1 className="font-display-sm md:font-display-md text-on-surface">
                            Course Materials
                        </h1>
                    </div>
                    <p className="font-body-lg text-on-surface-variant max-w-2xl">
                        Manage and upload resources for your students
                    </p>
                </div>
                
                <div className="flex gap-sm">
                    <button 
                        onClick={() => setIsUploadModalOpen(true)}
                        className="flex items-center gap-xs px-md py-sm rounded-lg bg-primary text-on-primary hover:opacity-90 transition-colors active:scale-95 font-label-md shadow-sm"
                    >
                        <span className="material-symbols-outlined text-[18px]">add</span>
                        Upload Material
                    </button>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-lg custom-shadow min-h-[400px]">
                {isLoading ? (
                    <div className="flex justify-center items-center h-64">
                        <span className="material-symbols-outlined text-4xl text-primary animate-spin">refresh</span>
                    </div>
                ) : materials.length === 0 ? (
                    <div className="flex flex-col items-center justify-center text-center p-xl bg-surface-container/30 rounded-xl border border-dashed border-outline-variant h-full">
                        <span className="material-symbols-outlined text-6xl text-outline/50 mb-md">
                            folder_open
                        </span>
                        <h3 className="font-headline-sm text-on-surface-variant mb-xs">No Materials Found</h3>
                        <p className="font-body-md text-outline">
                            Click "Upload Material" to share resources with your students.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {materials.map((material) => (
                            <div key={material.id} className="group relative bg-surface-container-low rounded-2xl p-6 flex flex-col justify-between border border-outline-variant hover:border-primary/50 hover:shadow-lg transition-all duration-300 overflow-hidden">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-bl-full -z-10 transition-transform group-hover:scale-110"></div>
                                <div>
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="w-14 h-14 rounded-2xl bg-primary-container text-primary flex items-center justify-center shadow-sm">
                                            <span className="material-symbols-outlined text-3xl">
                                                {material.file_url.startsWith('http') ? 'link' : 'description'}
                                            </span>
                                        </div>
                                        <button 
                                            onClick={() => handleDelete(material.id)}
                                            className="text-outline hover:text-error hover:bg-error-container p-2 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                                            title="Delete Material"
                                        >
                                            <span className="material-symbols-outlined text-[20px]">delete</span>
                                        </button>
                                    </div>
                                    <h3 className="font-headline-sm text-on-surface mb-2 break-words group-hover:text-primary transition-colors" title={material.title}>{material.title}</h3>
                                    <p className="font-body-md text-on-surface-variant mb-4 break-words">
                                        {material.description || 'No description provided.'}
                                    </p>
                                </div>
                                <div className="flex items-center justify-between mt-2 pt-4 border-t border-outline-variant/50">
                                    <span className="text-xs font-label-md text-outline flex items-center gap-1">
                                        <span className="material-symbols-outlined text-[14px]">calendar_today</span>
                                        {new Date(material.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                                    </span>
                                    <a 
                                        href={material.file_url.startsWith('http') ? material.file_url : `${process.env.NEXT_PUBLIC_MATERIALS_API_URL || 'http://localhost:8005'}${material.file_url}`} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary hover:bg-primary hover:text-on-primary transition-colors font-label-md shadow-sm"
                                    >
                                        <span className="material-symbols-outlined text-[18px]">
                                            {material.file_url.startsWith('http') ? 'open_in_new' : 'download'}
                                        </span>
                                        {material.file_url.startsWith('http') ? 'View' : 'Download'}
                                    </a>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Upload Modal */}
            {isUploadModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-surface-container-lowest rounded-3xl p-6 md:p-8 max-w-[500px] w-full shadow-2xl border border-outline-variant/30">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="font-display-sm text-on-surface">Upload Material</h2>
                            <button 
                                onClick={() => setIsUploadModalOpen(false)}
                                className="w-10 h-10 flex items-center justify-center rounded-full bg-surface-container hover:bg-surface-container-highest text-on-surface-variant transition-colors"
                            >
                                <span className="material-symbols-outlined text-[20px]">close</span>
                            </button>
                        </div>
                        
                        <form onSubmit={handleUpload} className="space-y-6">
                            <div>
                                <label className="block font-label-md text-on-surface mb-2">Title *</label>
                                <input 
                                    type="text" 
                                    required
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-3 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 text-on-surface transition-all"
                                    placeholder="Enter material title"
                                />
                            </div>
                            
                            <div>
                                <label className="block font-label-md text-on-surface mb-2">Description</label>
                                <textarea 
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-3 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 text-on-surface min-h-[120px] transition-all resize-none"
                                    placeholder="Optional description"
                                ></textarea>
                            </div>

                            <div>
                                <label className="block font-label-md text-on-surface mb-3">Upload Type</label>
                                <div className="flex gap-4 mb-2">
                                    <label className="flex items-center gap-2 cursor-pointer p-3 border border-outline-variant rounded-xl flex-1 hover:border-primary/50 transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                                        <input 
                                            type="radio" 
                                            value="file" 
                                            checked={uploadType === 'file'}
                                            onChange={(e) => setUploadType(e.target.value)}
                                            className="text-primary w-4 h-4"
                                        />
                                        <span className="text-on-surface font-label-md">File Upload</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer p-3 border border-outline-variant rounded-xl flex-1 hover:border-primary/50 transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                                        <input 
                                            type="radio" 
                                            value="link" 
                                            checked={uploadType === 'link'}
                                            onChange={(e) => setUploadType(e.target.value)}
                                            className="text-primary w-4 h-4"
                                        />
                                        <span className="text-on-surface font-label-md">External Link</span>
                                    </label>
                                </div>
                            </div>

                            {uploadType === 'file' ? (
                                <div>
                                    <label className="block font-label-md text-on-surface mb-2">File *</label>
                                    <div className="w-full bg-surface-container-low border border-dashed border-outline-variant hover:border-primary/50 transition-colors rounded-xl p-4 flex items-center justify-center">
                                        <input 
                                            type="file" 
                                            required
                                            onChange={(e) => setFile(e.target.files[0])}
                                            className="w-full text-on-surface file:mr-4 file:py-2 file:px-6 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-container file:text-primary hover:file:bg-primary hover:file:text-on-primary file:transition-colors cursor-pointer"
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    <label className="block font-label-md text-on-surface mb-2">Link URL *</label>
                                    <input 
                                        type="url" 
                                        required
                                        value={link}
                                        onChange={(e) => setLink(e.target.value)}
                                        className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-3 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 text-on-surface transition-all"
                                        placeholder="https://example.com"
                                    />
                                </div>
                            )}
                            
                            <div className="flex justify-end gap-3 pt-6 border-t border-outline-variant/30 mt-6">
                                <button 
                                    type="button"
                                    onClick={() => setIsUploadModalOpen(false)}
                                    className="px-6 py-2.5 rounded-full font-label-md text-on-surface bg-surface-container hover:bg-surface-container-highest transition-colors"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit"
                                    disabled={isUploading}
                                    className="px-6 py-2.5 rounded-full font-label-md text-on-primary bg-primary hover:opacity-90 transition-colors disabled:opacity-50 flex items-center gap-2 shadow-sm"
                                >
                                    {isUploading ? (
                                        <>
                                            <span className="material-symbols-outlined text-[18px] animate-spin">refresh</span>
                                            Uploading...
                                        </>
                                    ) : 'Upload Material'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </section>
    );
}
