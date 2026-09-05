'use client';
import { createContext, useContext, useState, useEffect } from 'react';

const SensiContext = createContext();

export function SensiProvider({ children }) {
    const [searchQuery, setSearchQuery] = useState('');
    const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
    const [selectedBatch, setSelectedBatchState] = useState(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('sensiSelectedBatch') || localStorage.getItem('staffSelectedBatch') || localStorage.getItem('batch') || '';
            // Disallow global all batches for sensi
            if (saved === 'All Batches' || saved === 'All Assigned Batches' || saved === 'Global') return '';
            return saved;
        }
        return '';
    });
    const [selectedLevel, setSelectedLevelState] = useState(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('sensiSelectedLevel') || localStorage.getItem('staffSelectedLevel') || localStorage.getItem('level') || '';
            if (saved === 'All Levels' || saved === 'All' || saved === 'Global') return '';
            return saved;
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
    const [sensiLevels, setSensiLevels] = useState(() => {
        if (typeof window !== 'undefined') {
            try {
                const storedLevels = localStorage.getItem('sensiLevels');
                if (storedLevels) {
                    const parsed = JSON.parse(storedLevels);
                    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
                }
                const single = localStorage.getItem('level');
                if (single && single !== 'All Levels') return [single];
            } catch (e) {}
        }
        return [];
    });
    const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);

    // Fetch profile to guarantee assigned levels & batches on mount
    useEffect(() => {
        const fetchSensiProfile = async () => {
            try {
                const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
                if (!token) return;
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/user/profile`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    // Extract assigned batches
                    const bList = Array.isArray(data.batches) && data.batches.length > 0 
                        ? data.batches 
                        : (data.batch ? [data.batch] : []);
                    updateStaffBatches(bList);

                    // Extract assigned level(s)
                    const lvlList = Array.isArray(data.levels) && data.levels.length > 0
                        ? data.levels
                        : (data.level ? [data.level] : ['Level 5']);
                    updateSensiLevels(lvlList);

                    // Check if modal should open (if sensi has not selected their active level/batch yet)
                    const currentBatch = localStorage.getItem('sensiSelectedBatch') || localStorage.getItem('batch');
                    const currentLevel = localStorage.getItem('sensiSelectedLevel') || localStorage.getItem('level');
                    if (!currentBatch || !currentLevel || currentBatch === 'All Batches' || currentLevel === 'All Levels') {
                        setIsBatchModalOpen(true);
                    }
                }
            } catch (err) {
                console.warn("Failed to load Sensi profile scopes:", err);
            }
        };
        fetchSensiProfile();
    }, []);

    const fetchBatchesForLevel = async (level) => {
        if (!level || level === 'All Levels') return [];
        try {
            const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
            if (!token) return [];
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/user/available-batches?level=${encodeURIComponent(level)}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                return Array.isArray(data) ? data : [];
            }
            return [];
        } catch (e) {
            return [];
        }
    };

    const setSelectedBatch = (batch) => {
        if (batch === 'All Batches' || batch === 'All Assigned Batches' || batch === 'Global') {
            batch = '';
        }
        setSelectedBatchState(batch || '');
        if (typeof window !== 'undefined') {
            localStorage.setItem('sensiSelectedBatch', batch || '');
            localStorage.setItem('staffSelectedBatch', batch || '');
            localStorage.setItem('batch', batch || '');
        }
    };

    const setSelectedLevel = async (lvl) => {
        // Disallow 'All Levels' for sensi
        if (!lvl || lvl === 'All Levels' || lvl === 'All') {
            if (sensiLevels && sensiLevels.length > 0) {
                lvl = sensiLevels[0];
            } else {
                lvl = 'Level 5';
            }
        }
        setSelectedLevelState(lvl);
        if (typeof window !== 'undefined') {
            localStorage.setItem('sensiSelectedLevel', lvl);
            localStorage.setItem('staffSelectedLevel', lvl);
            localStorage.setItem('level', lvl);
        }
        // Fetch batches for this level and adjust selectedBatch
        const validLevelBatches = await fetchBatchesForLevel(lvl);
        if (validLevelBatches.length > 0) {
            if (!selectedBatch || !validLevelBatches.includes(selectedBatch)) {
                setSelectedBatch(validLevelBatches[0]);
            }
        } else {
            setSelectedBatch('');
        }
    };

    const updateStaffBatches = (batches) => {
        const batchList = Array.isArray(batches) ? batches.filter(b => b && b !== 'All Batches' && b !== 'All Assigned Batches') : (batches ? [batches] : []);
        setStaffBatches(batchList);
        if (typeof window !== 'undefined') {
            localStorage.setItem('sensiBatches', JSON.stringify(batchList));
            localStorage.setItem('staffBatches', JSON.stringify(batchList));
        }
    };

    const updateSensiLevels = (levels) => {
        const levelList = Array.isArray(levels) ? levels.filter(l => l && l !== 'All Levels') : (levels ? [levels] : []);
        setSensiLevels(levelList);
        if (typeof window !== 'undefined') {
            localStorage.setItem('sensiLevels', JSON.stringify(levelList));
            const currentSaved = localStorage.getItem('sensiSelectedLevel') || localStorage.getItem('level') || '';
            if ((!currentSaved || currentSaved === 'All Levels') && levelList.length > 0) {
                setSelectedLevel(levelList[0]);
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
            selectedLevel,
            setSelectedLevel,
            staffBatches,
            sensiBatches: staffBatches,
            sensiLevels,
            setStaffBatches: updateStaffBatches,
            setSensiBatches: updateStaffBatches,
            setSensiLevels: updateSensiLevels,
            fetchBatchesForLevel,
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
