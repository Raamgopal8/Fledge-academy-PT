'use client';
import { createContext, useContext, useState, useEffect } from 'react';

const CEOContext = createContext();

export function CEOProvider({ children }) {
    const [searchQuery, setSearchQuery] = useState('');
    const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
    const [selectedBatch, setSelectedBatchState] = useState(null);

    // Initialize from localStorage on mount
    useEffect(() => {
        const storedBatch = localStorage.getItem('ceoSelectedBatch');
        if (storedBatch !== null) {
            setSelectedBatchState(storedBatch);
        }
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
            selectedBatch, setSelectedBatch 
        }}>
            {children}
        </CEOContext.Provider>
    );
}

export function useCEOContext() {
    return useContext(CEOContext);
}
