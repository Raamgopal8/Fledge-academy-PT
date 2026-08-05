'use client';
import { useState, useEffect } from 'react';

export default function CEOVideos() {
    const [videos, setVideos] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);

    const [formData, setFormData] = useState({
        title: '',
        category: '',
        video_url: ''
    });

    useEffect(() => {
        fetchVideos();
    }, []);

    const fetchVideos = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('http://localhost:8006/api/videos/', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!res.ok) throw new Error('Failed to fetch videos');
            const data = await res.json();
            setVideos(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);
        
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('http://localhost:8006/api/videos/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.detail || 'Failed to add video');
            }

            setFormData({ title: '', category: '', video_url: '' });
            fetchVideos();
        } catch (err) {
            setError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this video?')) return;
        
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`http://localhost:8006/api/videos/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (!res.ok) throw new Error('Failed to delete video');
            fetchVideos();
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <section className="max-w-[1440px] mx-auto p-gutter space-y-lg animate-fade-in">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-md mb-lg">
                <div>
                    <div className="flex items-center gap-sm mb-xs">
                        <span className="material-symbols-outlined text-primary text-3xl">
                            video_library
                        </span>
                        <h1 className="font-display-sm md:font-display-md text-on-surface">
                            Manage Videos
                        </h1>
                    </div>
                    <p className="font-body-lg text-on-surface-variant max-w-2xl">
                        Add and manage YouTube video links for students.
                    </p>
                </div>
            </div>

            {error && (
                <div className="bg-error/10 text-error p-md rounded-lg mb-md flex items-center gap-sm">
                    <span className="material-symbols-outlined">error</span>
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-lg">
                {/* Upload Form */}
                <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-lg custom-shadow h-fit">
                    <h2 className="font-headline-sm text-on-surface mb-md">Add New Video</h2>
                    <form onSubmit={handleSubmit} className="space-y-md">
                        <div>
                            <label className="block font-label-md text-on-surface mb-xs">Video Title</label>
                            <input 
                                type="text"
                                name="title"
                                value={formData.title}
                                onChange={handleInputChange}
                                required
                                className="w-full px-md py-sm bg-surface-container border border-outline rounded-lg focus:border-primary focus:outline-none transition-colors"
                                placeholder="Enter video title"
                            />
                        </div>
                        <div>
                            <label className="block font-label-md text-on-surface mb-xs">Category</label>
                            <input 
                                type="text"
                                name="category"
                                value={formData.category}
                                onChange={handleInputChange}
                                required
                                className="w-full px-md py-sm bg-surface-container border border-outline rounded-lg focus:border-primary focus:outline-none transition-colors"
                                placeholder="e.g., Mathematics, Science"
                            />
                        </div>
                        <div>
                            <label className="block font-label-md text-on-surface mb-xs">YouTube URL</label>
                            <input 
                                type="url"
                                name="video_url"
                                value={formData.video_url}
                                onChange={handleInputChange}
                                required
                                className="w-full px-md py-sm bg-surface-container border border-outline rounded-lg focus:border-primary focus:outline-none transition-colors"
                                placeholder="https://www.youtube.com/watch?v=..."
                            />
                        </div>
                        <button 
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full py-sm bg-primary text-on-primary rounded-lg font-label-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                        >
                            {isSubmitting ? 'Adding...' : 'Add Video'}
                        </button>
                    </form>
                </div>

                {/* Video List */}
                <div className="lg:col-span-2 space-y-md">
                    {isLoading ? (
                        <div className="flex justify-center p-xl">
                            <span className="material-symbols-outlined animate-spin text-4xl text-primary">progress_activity</span>
                        </div>
                    ) : videos.length === 0 ? (
                        <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-xl text-center custom-shadow">
                            <span className="material-symbols-outlined text-6xl text-outline/50 mb-md">videocam_off</span>
                            <h3 className="font-headline-sm text-on-surface-variant">No videos added yet</h3>
                            <p className="font-body-md text-outline mt-sm">Upload video links to see them here.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
                            {videos.map(video => (
                                <div key={video.id} className="bg-surface-container-lowest border border-outline-variant rounded-xl p-md custom-shadow flex flex-col">
                                    <div className="flex justify-between items-start mb-sm">
                                        <h3 className="font-label-lg text-on-surface line-clamp-2">{video.title}</h3>
                                        <button 
                                            onClick={() => handleDelete(video.id)}
                                            className="material-symbols-outlined text-error hover:bg-error/10 p-1 rounded transition-colors"
                                            title="Delete Video"
                                        >
                                            delete
                                        </button>
                                    </div>
                                    <div className="inline-block bg-secondary-container text-on-secondary-container px-sm py-xs rounded text-xs font-label-sm w-fit mb-md">
                                        {video.category}
                                    </div>
                                    <div className="mt-auto pt-sm border-t border-outline-variant truncate">
                                        <a href={video.video_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-body-sm truncate block">
                                            {video.video_url}
                                        </a>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}
