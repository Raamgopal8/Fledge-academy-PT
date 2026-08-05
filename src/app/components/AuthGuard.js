'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AuthGuard({ children, requiredRole }) {
    const router = useRouter();
    const [isAuthorized, setIsAuthorized] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/login');
            return;
        }

        try {
            // Basic JWT parsing
            const payload = JSON.parse(atob(token.split('.')[1]));
            // Assuming the JWT payload has a 'role' field
            const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
            if (roles.includes(payload.role)) {
                setIsAuthorized(true);
            } else {
                // If the user does not have the required role, redirect them
                router.push('/unauthorized'); 
            }
        } catch (e) {
            // If token is invalid or parsing fails
            console.error('Invalid token', e);
            router.push('/login');
        }

        // Listen for token changes across tabs
        const handleStorageChange = (e) => {
            if (e.key === 'token' && !e.newValue) {
                router.push('/login');
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, [router, requiredRole]);

    // Show nothing (or a loading spinner) while checking authorization
    if (!isAuthorized) {
        return <div className="min-h-screen flex items-center justify-center">Loading...</div>; 
    }

    return <>{children}</>;
}
