'use client';
import { createContext, useContext, useState, useEffect } from 'react';

const SensiContext = createContext();

export function SensiProvider({ children }) {
    const [searchQuery, setSearchQuery] = useState('');
    const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
    const [selectedBatch, setSelectedBatchState] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('sensiSelectedBatch') || localStorage.getItem('staffSelectedBatch') || localStorage.getItem('batch') || '';
        }
        return '';
    });
    const [staffBatches, setStaffBatches] = useState(() => {
        if (typeof window !== 'undefined') {
            try {
                const storedBatches = localStorage.getItem('sensiBatches') || localStorage.getItem('staffBatches');
                if (storedBatches) {
                    const parsed = JSON.parse(storedBatches);
                    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
                }
            } catch (e) {
                console.error("Error parsing stored sensi batches:", e);
            }
        }
        return [];
    });
    const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const savedBatch = localStorage.getItem('sensiSelectedBatch') || localStorage.getItem('staffSelectedBatch') || localStorage.getItem('batch') || '';
            if (savedBatch && savedBatch !== selectedBatch) {
                setSelectedBatchState(savedBatch);
            }
        }
    }, []);

    const setSelectedBatch = (batch) => {
        setSelectedBatchState(batch);
        if (typeof window !== 'undefined') {
            localStorage.setItem('sensiSelectedBatch', batch || '');
            localStorage.setItem('staffSelectedBatch', batch || '');
            localStorage.setItem('batch', batch || '');
        }
    };

    const updateStaffBatches = (batches) => {
        const batchList = Array.isArray(batches) ? batches : (batches ? [batches] : []);
        setStaffBatches(batchList);
        if (typeof window !== 'undefined') {
            localStorage.setItem('sensiBatches', JSON.stringify(batchList));
            localStorage.setItem('staffBatches', JSON.stringify(batchList));
            const currentSaved = localStorage.getItem('sensiSelectedBatch') || localStorage.getItem('staffSelectedBatch') || localStorage.getItem('batch') || '';
            // Only set a default if the user has NEVER selected or saved any batch
            if (!currentSaved && batchList.length > 0) {
                setSelectedBatch(batchList[0]);
            }
        }
    };

    return (
        <SensiContext.Provider value={{ 
            searchQuery, 
            setSearchQuery, 
            isMobileNavOpen, 
            setIsMobileNavOpen,
            selectedBatch, 
            setSelectedBatch,
            staffBatches,
            sensiBatches: staffBatches,
            setStaffBatches: updateStaffBatches,
            setSensiBatches: updateStaffBatches,
            isBatchModalOpen,
            setIsBatchModalOpen
        }}>
            {children}
        </SensiContext.Provider>
    );
}

export function useSensiContext() {
    return useContext(SensiContext);
}
