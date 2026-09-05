'use client';
import { useState, useEffect } from 'react';
import { useAdminContext } from '@/app/admin/AdminContext';

export default function BatchSelectionModal() {
    const { 
        selectedBatch, setSelectedBatch, 
        selectedLevel, setSelectedLevel, 
        availableBatches, availableLevels,
        isBatchModalOpen, setIsBatchModalOpen 
    } = useAdminContext();

    const [isOpen, setIsOpen] = useState(false);
    const [batchInput, setBatchInput] = useState('');
    const [levelInput, setLevelInput] = useState('');

    const [tempLevel, setTempLevel] = useState(selectedLevel || 'All Levels');
    const [tempBatch, setTempBatch] = useState(selectedBatch || 'All Batches');
    const [levelBatches, setLevelBatches] = useState([]);
    const [isLoadingBatches, setIsLoadingBatches] = useState(false);

    useEffect(() => {
        // Automatically open if no batch or level has been set, or if explicitly requested
        if (selectedBatch === null || isBatchModalOpen) {
            setIsOpen(true);
            setTempLevel(selectedLevel || 'All Levels');
            setTempBatch(selectedBatch || 'All Batches');
        } else {
            setIsOpen(false);
        }
    }, [selectedBatch, isBatchModalOpen, selectedLevel]);

    useEffect(() => {
        if (!isOpen) return;
        let isCancelled = false;
        const loadBatchesForLevel = async () => {
            setIsLoadingBatches(true);
            try {
                const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
                const levelParam = (tempLevel && tempLevel !== 'All Levels' && tempLevel !== 'Global')
                    ? `?level=${encodeURIComponent(tempLevel)}`
                    : '';
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/user/available-batches${levelParam}`, {
                    headers: token ? { 'Authorization': `Bearer ${token}` } : {}
                });
                if (res.ok) {
                    const data = await res.json();
                    if (!isCancelled) {
                        const batchArr = Array.isArray(data) ? data : [];
                        setLevelBatches(batchArr);
                        // If tempBatch is a specific batch and not available in the new level, reset to 'All Batches'
                        if (tempBatch && tempBatch !== 'All Batches' && !batchArr.includes(tempBatch)) {
                            setTempBatch('All Batches');
                        }
                    }
                } else if (!isCancelled) {
                    setLevelBatches([]);
                }
            } catch (e) {
                if (!isCancelled) setLevelBatches([]);
            } finally {
                if (!isCancelled) setIsLoadingBatches(false);
            }
        };
        loadBatchesForLevel();
        return () => { isCancelled = true; };
    }, [tempLevel, isOpen]);

    const handleClose = () => {
        if (selectedBatch === null) setSelectedBatch('All Batches');
        if (!selectedLevel) setSelectedLevel('All Levels');
        setIsOpen(false);
        if (setIsBatchModalOpen) setIsBatchModalOpen(false);
    };

    const handleApply = (e) => {
        if (e) e.preventDefault();
        const finalLevel = levelInput.trim() || tempLevel || 'All Levels';
        const finalBatch = batchInput.trim() || tempBatch || 'All Batches';
        
        setSelectedLevel(finalLevel);
        setSelectedBatch(finalBatch);
        setIsOpen(false);
        if (setIsBatchModalOpen) setIsBatchModalOpen(false);
    };

    if (!isOpen) return null;

    const levelsToDisplay = Array.isArray(availableLevels) && availableLevels.length > 0
        ? availableLevels
        : ['Level 5', 'Level 4', 'Level 3', 'Level 2', 'Level 1'];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-surface rounded-2xl shadow-2xl p-6 sm:p-7 w-full max-w-[500px] relative border border-outline-variant/70 max-h-[92vh] overflow-y-auto custom-scrollbar">
                {/* Close Button */}
                <button 
                    onClick={handleClose}
                    className="absolute top-4 right-4 text-on-surface-variant hover:text-on-surface p-1.5 rounded-full hover:bg-surface-container transition-colors cursor-pointer"
                    title="Close"
                >
                    <span className="material-symbols-outlined text-[20px]">close</span>
                </button>

                <div className="flex items-center gap-3 mb-2 mt-1">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-[24px]">tune</span>
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-on-surface">Portal Scope & Filters</h2>
                        <p className="text-xs text-on-surface-variant">Configure level and batch view for the academy</p>
                    </div>
                </div>

                <form onSubmit={handleApply} className="space-y-5 mt-5">
                    {/* SECTION 1: LEVEL FILTER (ABOVE BATCH) */}
                    <div className="bg-surface-container-low p-4 rounded-xl border border-outline-variant/60 space-y-3">
                        <div className="flex items-center justify-between">
                            <label className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
                                <span className="material-symbols-outlined text-[16px]">stairs</span>
                                Select Level
                            </label>
                            <span className="text-[11px] font-semibold text-on-surface-variant bg-surface px-2 py-0.5 rounded-md border border-outline-variant/40">
                                Active: {tempLevel}
                            </span>
                        </div>

                        {/* Global Level Button */}
                        <button
                            type="button"
                            onClick={() => {
                                setTempLevel('All Levels');
                                setLevelInput('');
                            }}
                            className={`w-full py-2 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-2 border cursor-pointer ${
                                tempLevel === 'All Levels' && !levelInput
                                    ? 'bg-primary text-on-primary border-primary shadow-xs'
                                    : 'bg-surface text-on-surface border-outline-variant hover:bg-surface-container'
                            }`}
                        >
                            <span className="material-symbols-outlined text-[16px]">public</span>
                            All Levels (Global Level)
                        </button>

                        {/* Available Levels Chips */}
                        <div className="flex flex-wrap gap-1.5">
                            {levelsToDisplay.map((lvl) => {
                                const isSelected = tempLevel === lvl && !levelInput;
                                return (
                                    <button
                                        key={lvl}
                                        type="button"
                                        onClick={() => {
                                            setTempLevel(lvl);
                                            setLevelInput('');
                                        }}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                                            isSelected
                                                ? 'bg-primary/20 text-primary border-primary font-bold shadow-xs'
                                                : 'bg-surface text-on-surface-variant border-outline-variant/70 hover:bg-surface-container'
                                        }`}
                                    >
                                        {lvl}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Custom Level Input */}
                        <div className="flex gap-2 pt-1">
                            <input
                                type="text"
                                value={levelInput}
                                onChange={(e) => {
                                    setLevelInput(e.target.value);
                                    if (e.target.value.trim()) setTempLevel(e.target.value.trim());
                                }}
                                placeholder="Or enter level (e.g. Level 5)"
                                className="flex-grow h-[36px] px-3 bg-surface border border-outline-variant rounded-lg focus:outline-none focus:border-primary text-xs"
                            />
                        </div>
                    </div>

                    {/* SECTION 2: BATCH FILTER (BELOW LEVEL) */}
                    <div className="bg-surface-container-low p-4 rounded-xl border border-outline-variant/60 space-y-3">
                        <div className="flex items-center justify-between">
                            <label className="text-xs font-bold uppercase tracking-wider text-secondary flex items-center gap-1.5">
                                <span className="material-symbols-outlined text-[16px]">domain</span>
                                Select Batch
                            </label>
                            <span className="text-[11px] font-semibold text-on-surface-variant bg-surface px-2 py-0.5 rounded-md border border-outline-variant/40">
                                Active: {tempBatch}
                            </span>
                        </div>

                        {/* Global All Batches Button */}
                        <button
                            type="button"
                            onClick={() => {
                                setTempBatch('All Batches');
                                setBatchInput('');
                            }}
                            className={`w-full py-2 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-2 border cursor-pointer ${
                                tempBatch === 'All Batches' && !batchInput
                                    ? 'bg-secondary text-on-secondary border-secondary shadow-xs'
                                    : 'bg-surface text-on-surface border-outline-variant hover:bg-surface-container'
                            }`}
                        >
                            <span className="material-symbols-outlined text-[16px]">groups</span>
                            All Batches (Global View)
                        </button>

                        {/* Available Batches Quick Suggestions */}
                        {isLoadingBatches ? (
                            <div className="py-3 flex items-center justify-center gap-2 text-on-surface-variant text-xs">
                                <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                                <span>Loading batches for {tempLevel}...</span>
                            </div>
                        ) : levelBatches && levelBatches.length > 0 ? (
                            <div className="flex flex-wrap gap-1.5">
                                {levelBatches.map((b) => {
                                    const isSelected = tempBatch === b && !batchInput;
                                    return (
                                        <button
                                            key={b}
                                            type="button"
                                            onClick={() => {
                                                setTempBatch(b);
                                                setBatchInput('');
                                            }}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                                                isSelected
                                                    ? 'bg-secondary/20 text-secondary border-secondary font-bold shadow-xs'
                                                    : 'bg-surface text-on-surface-variant border-outline-variant/70 hover:bg-surface-container'
                                            }`}
                                        >
                                            {b}
                                        </button>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="py-4 text-center text-on-surface-variant bg-surface/50 rounded-xl border border-dashed border-outline-variant/60">
                                <span className="material-symbols-outlined text-[26px] opacity-40 block mb-1">domain_disabled</span>
                                <p className="text-xs font-semibold">No batches presented</p>
                                <p className="text-[11px] opacity-75">No batches found under {tempLevel}</p>
                            </div>
                        )}

                        {/* Custom Batch Input */}
                        <div className="flex gap-2 pt-1">
                            <input
                                type="text"
                                value={batchInput}
                                onChange={(e) => {
                                    setBatchInput(e.target.value);
                                    if (e.target.value.trim()) setTempBatch(e.target.value.trim());
                                }}
                                placeholder="Or enter batch (e.g. Batch - 1)"
                                className="flex-grow h-[36px] px-3 bg-surface border border-outline-variant rounded-lg focus:outline-none focus:border-secondary text-xs"
                            />
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="px-4 py-2 rounded-xl text-xs sm:text-sm font-medium text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-primary text-white hover:bg-primary/90 transition-all shadow-md active:scale-95 flex items-center gap-2 cursor-pointer"
                        >
                            <span className="material-symbols-outlined text-[18px]">check</span>
                            <span>Apply & Enter</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
