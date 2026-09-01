'use client';
import { createContext, useContext, useState, useEffect } from 'react';

const CEOContext = createContext();

export function CEOProvider({ children }) {
    const [searchQuery, setSearchQuery] = useState('');
    const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
    const [selectedBatch, setSelectedBatchState] = useState(null);
    const [availableBatches, setAvailableBatches] = useState([]);

    const fetchAvailableBatches = async () => {
        try {
            const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
            if (!token) return;
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/user/available-batches`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                if (Array.isArray(data)) {
                    setAvailableBatches(data);
                }
            }
        } catch (e) {
            console.warn("Failed to fetch available batches:", e);
        }
    };

    // Initialize from localStorage and fetch batches on mount
    useEffect(() => {
        const storedBatch = localStorage.getItem('ceoSelectedBatch');
        if (storedBatch !== null) {
            setSelectedBatchState(storedBatch);
        }
        fetchAvailableBatches();
    }, []);

    const setSelectedBatch = (batch) => {
        setSelectedBatchState(batch);
        if (batch === null) {
            localStorage.removeItem('ceoSelectedBatch');
        } else {
            localStorage.setItem('ceoSelectedBatch', batch);
        }
    };

    return (
        <CEOContext.Provider value={{ 
            searchQuery, setSearchQuery, 
            isMobileNavOpen, setIsMobileNavOpen,
            selectedBatch, setSelectedBatch,
            availableBatches,
            refreshBatches: fetchAvailableBatches
        }}>
            {children}
        </CEOContext.Provider>
    );
}

export function useCEOContext() {
    return useContext(CEOContext);
}
