'use client';
import { createContext, useContext, useState, useEffect } from 'react';

const StaffContext = createContext();

export function StaffProvider({ children }) {
    const [searchQuery, setSearchQuery] = useState('');
    const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
    const [selectedBatch, setSelectedBatchState] = useState('');
    const [staffBatches, setStaffBatches] = useState([]);
    const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const savedBatch = localStorage.getItem('staffSelectedBatch') || localStorage.getItem('batch') || '';
            setSelectedBatchState(savedBatch);
            
            try {
                const storedBatches = localStorage.getItem('staffBatches');
                if (storedBatches) {
                    const parsed = JSON.parse(storedBatches);
                    if (Array.isArray(parsed) && parsed.length > 0) {
                        setStaffBatches(parsed);
                    }
                }
            } catch (e) {
                console.error("Error parsing stored staff batches:", e);
            }
        }
    }, []);

    const setSelectedBatch = (batch) => {
        setSelectedBatchState(batch);
        if (typeof window !== 'undefined') {
            localStorage.setItem('staffSelectedBatch', batch || '');
            localStorage.setItem('batch', batch || '');
        }
    };

    const updateStaffBatches = (batches) => {
        const batchList = Array.isArray(batches) ? batches : (batches ? [batches] : []);
        setStaffBatches(batchList);
        if (typeof window !== 'undefined') {
            localStorage.setItem('staffBatches', JSON.stringify(batchList));
            if (!selectedBatch && batchList.length > 0) {
                setSelectedBatch(batchList[0]);
            }
        }
    };

    return (
        <StaffContext.Provider value={{ 
            searchQuery, 
            setSearchQuery, 
            isMobileNavOpen, 
            setIsMobileNavOpen,
            selectedBatch,
            setSelectedBatch,
            staffBatches,
            setStaffBatches: updateStaffBatches,
            isBatchModalOpen,
            setIsBatchModalOpen
        }}>
            {children}
        </StaffContext.Provider>
    );
}

export function useStaffContext() {
    return useContext(StaffContext);
}
