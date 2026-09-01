'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function StaffRedirect() {
    const router = useRouter();
    useEffect(() => {
        router.replace('/sensi/dashboard');
    }, [router]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-background text-primary">
            <span className="material-symbols-outlined text-4xl animate-spin">progress_activity</span>
        </div>
    );
}
