'use client';
import { useState, useEffect } from 'react';
import MainContentWrapper from '@/app/dashboard/MainContentWrapper';

export default function StudentMaterials() {
    const [materials, setMaterials] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

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

    return (
        <MainContentWrapper>
            <section className="max-w-[1440px] mx-auto p-gutter space-y-lg animate-fade-in">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-md mb-lg">
                    <div>
                        <div className="flex items-center gap-sm mb-xs">
                            <h1 className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#6FB7E4] via-[#5D8BCC] to-[#465AA3]">
                                Learning Materials
                            </h1>
                        </div>
                        <p className="font-body-lg text-on-surface-variant max-w-2xl">
                            Access your course resources and reading materials
                        </p>
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
                            <h3 className="font-headline-sm text-on-surface-variant mb-xs">No Materials Found</h3>
                            <p className="font-body-md text-outline">
                                Your instructors haven't uploaded any materials yet. Check back later!
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-md">
                            {materials.map((material) => (
                                <div key={material.id} className="bg-surface-container rounded-xl p-md flex flex-col justify-between border border-outline-variant hover:border-primary/30 transition-colors">
                                    <div>
                                        <div className="flex justify-between items-start mb-sm">
                                            <div className="w-12 h-12 rounded-lg bg-primary-container text-primary flex items-center justify-center">
                                                <span className="material-symbols-outlined text-2xl">description</span>
                                            </div>
                                            {material.level && (
                                                <span className="px-2 py-1 rounded-full text-xs font-bold bg-secondary-container text-on-secondary-container">
                                                    {material.level}
                                                </span>
                                            )}
                                        </div>
                                        <h3 className="font-headline-sm text-on-surface mb-xs truncate" title={material.title}>{material.title}</h3>
                                        <p className="font-body-md text-on-surface-variant line-clamp-2 mb-md">
                                            {material.description || 'No description provided.'}
                                        </p>
                                    </div>
                                    <div className="flex items-center justify-between mt-sm pt-sm border-t border-outline-variant">
                                        <span className="text-xs text-outline">{new Date(material.created_at).toLocaleDateString()}</span>
                                        <a 
                                            href={material.file_url.startsWith('http') ? material.file_url : `${process.env.NEXT_PUBLIC_MATERIALS_API_URL || 'http://localhost:8005'}${material.file_url}`} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="text-primary hover:underline font-label-sm flex items-center gap-xs"
                                        >
                                            <span className="material-symbols-outlined text-[16px]">
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
            </section>
        </MainContentWrapper>
    );
}
