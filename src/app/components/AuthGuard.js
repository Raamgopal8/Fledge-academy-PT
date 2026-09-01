'use client';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { sendHeartbeat, logActivity } from '../utils/activityLogger';

function parseJwt(token) {
    try {
        if (!token || typeof token !== 'string') return null;
        const parts = token.split('.');
        if (parts.length !== 3) return null;
        let base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
        while (base64.length % 4) {
            base64 += '=';
        }
        const jsonPayload = decodeURIComponent(
            atob(base64)
                .split('')
                .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                .join('')
        );
        return JSON.parse(jsonPayload);
    } catch (e) {
        console.error('Error decoding JWT token:', e);
        return null;
    }
}

export default function AuthGuard({ children, requiredRole }) {
    const router = useRouter();
    const [isAuthorized, setIsAuthorized] = useState(false);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/');
            return;
        }

        const payload = parseJwt(token);
        
        // If JWT has expiration timestamp, verify it
        if (payload && payload.exp && Date.now() >= payload.exp * 1000) {
            localStorage.clear();
            router.push('/');
            return;
        }

        const storedRole = (localStorage.getItem('role') || (payload && payload.role) || '').toLowerCase();
        const requiredRoles = (Array.isArray(requiredRole) ? requiredRole : [requiredRole]).map((r) => String(r).toLowerCase());

        // Check if user role satisfies requirement with aliasing
        const isRoleMatch = requiredRoles.some((req) => {
            if (req === 'admin' || req === 'ceo') return storedRole === 'admin' || storedRole === 'ceo';
            if (req === 'sensi' || req === 'staff') return storedRole === 'sensi' || storedRole === 'staff';
            if (req === 'student') return !storedRole || storedRole === 'student';
            return req === storedRole;
        });

        if (
            isRoleMatch ||
            storedRole === 'admin' ||
            storedRole === 'ceo' // Admin has access across the portal
        ) {
            setIsAuthorized(true);
            // Send initial heartbeat and log page view
            sendHeartbeat();
            const currentPath = window.location.pathname;
            const pageName = currentPath.split('/').filter(Boolean).pop() || 'Dashboard';
            logActivity(`Visited ${pageName.charAt(0).toUpperCase() + pageName.slice(1)} page`, 'page_view', { path: currentPath });
        } else {
            // Mismatched role navigation - route to appropriate dashboard
            if (storedRole === 'admin' || storedRole === 'ceo') {
                router.push('/admin/dashboard');
            } else if (storedRole === 'sensi' || storedRole === 'staff') {
                router.push('/sensi/dashboard');
            } else {
                router.push('/dashboard');
            }
        }

        // Heartbeat interval every 60 seconds while active
        const heartbeatInterval = setInterval(() => {
            sendHeartbeat();
        }, 60000);

        // Listen for token removal across tabs
        const handleStorageChange = (e) => {
            if (e.key === 'token' && !e.newValue) {
                router.push('/');
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => {
            clearInterval(heartbeatInterval);
            window.removeEventListener('storage', handleStorageChange);
        };
    }, [router, requiredRole]);

    if (!isAuthorized) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-background text-primary">
                <span className="material-symbols-outlined text-[48px] animate-spin">progress_activity</span>
                <p className="font-label-lg mt-4 text-on-surface-variant">Verifying session...</p>
            </div>
        );
    }

    return <>{children}</>;
}
