'use client';
import { createContext, useContext, useState, useEffect } from 'react';

const AdminContext = createContext();

export function AdminProvider({ children }) {
    const [searchQuery, setSearchQuery] = useState('');
    const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
    const [selectedBatch, setSelectedBatchState] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('adminSelectedBatch') || localStorage.getItem('ceoSelectedBatch') || null;
        }
        return null;
    });
    const [selectedLevel, setSelectedLevelState] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('adminSelectedLevel') || localStorage.getItem('ceoSelectedLevel') || localStorage.getItem('level') || 'All Levels';
        }
        return 'All Levels';
    });
    const [availableBatches, setAvailableBatches] = useState([]);
    const [availableLevels, setAvailableLevels] = useState(['Level 5', 'Level 4', 'Level 3', 'Level 2', 'Level 1']);
    const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);

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

    const fetchAvailableLevels = async () => {
        try {
            const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
            if (!token) return;
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/user/available-levels`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                if (Array.isArray(data) && data.length > 0) {
                    setAvailableLevels(data);
                }
            }
        } catch (e) {
            console.warn("Failed to fetch available levels:", e);
        }
    };

    // Initialize from localStorage and fetch batches/levels on mount
    useEffect(() => {
        const storedBatch = localStorage.getItem('adminSelectedBatch') || localStorage.getItem('ceoSelectedBatch');
        if (storedBatch !== null) {
            setSelectedBatchState(storedBatch);
        }
        const storedLevel = localStorage.getItem('adminSelectedLevel') || localStorage.getItem('ceoSelectedLevel');
        if (storedLevel !== null) {
            setSelectedLevelState(storedLevel);
        }
        fetchAvailableBatches();
        fetchAvailableLevels();
    }, []);

    const setSelectedBatch = (batch) => {
        setSelectedBatchState(batch);
        if (batch === null) {
            localStorage.removeItem('adminSelectedBatch');
            localStorage.removeItem('ceoSelectedBatch');
        } else {
            localStorage.setItem('adminSelectedBatch', batch);
            localStorage.setItem('ceoSelectedBatch', batch);
            localStorage.setItem('batch', batch);
        }
    };

    const setSelectedLevel = (lvl) => {
        const cleanLevel = lvl || 'All Levels';
        setSelectedLevelState(cleanLevel);
        if (typeof window !== 'undefined') {
            localStorage.setItem('adminSelectedLevel', cleanLevel);
            localStorage.setItem('ceoSelectedLevel', cleanLevel);
            localStorage.setItem('level', cleanLevel);
        }
    };

    return (
        <AdminContext.Provider value={{ 
            searchQuery, setSearchQuery, 
            isMobileNavOpen, setIsMobileNavOpen,
            selectedBatch, setSelectedBatch,
            selectedLevel, setSelectedLevel,
            availableBatches,
            availableLevels,
            isBatchModalOpen, setIsBatchModalOpen,
            refreshBatches: fetchAvailableBatches,
            refreshLevels: fetchAvailableLevels
        }}>
            {children}
        </AdminContext.Provider>
    );
}

export function useAdminContext() {
    return useContext(AdminContext);
}
