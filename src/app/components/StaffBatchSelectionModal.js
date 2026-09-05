'use client';
import { useState, useEffect } from 'react';
import { useSensiContext } from '@/app/sensi/SensiContext';

export default function SensiBatchSelectionModal() {
    const context = useSensiContext();
    const selectedBatch = context?.selectedBatch;
    const setSelectedBatch = context?.setSelectedBatch || (() => {});
    const selectedLevel = context?.selectedLevel;
    const setSelectedLevel = context?.setSelectedLevel || (() => {});
    const staffBatches = context?.staffBatches || context?.sensiBatches || [];
    const sensiLevels = context?.sensiLevels || [];
    const isBatchModalOpen = context?.isBatchModalOpen;
    const setIsBatchModalOpen = context?.setIsBatchModalOpen || (() => {});

    // Strictly assigned batches only: filter out any "All Batches" or "All Assigned Batches"
    const validBatches = Array.isArray(staffBatches)
        ? staffBatches.filter(b => b && b !== 'All Batches' && b !== 'All Assigned Batches' && b !== 'Global')
        : [];

    // Strictly assigned levels only: filter out any "All Levels"
    const validLevels = Array.isArray(sensiLevels) && sensiLevels.length > 0
        ? sensiLevels.filter(l => l && l !== 'All Levels' && l !== 'All')
        : (selectedLevel && selectedLevel !== 'All Levels' ? [selectedLevel] : ['Level 5']);

    const [tempLevel, setTempLevel] = useState(selectedLevel || validLevels[0] || 'Level 5');
    const [tempBatch, setTempBatch] = useState(selectedBatch || validBatches[0] || '');

    useEffect(() => {
        if (isBatchModalOpen) {
            setTempLevel(selectedLevel || validLevels[0] || 'Level 5');
            setTempBatch(selectedBatch || validBatches[0] || '');
        }
    }, [isBatchModalOpen, selectedLevel, selectedBatch]);

    if (!isBatchModalOpen) return null;

    const handleApply = (e) => {
        if (e) e.preventDefault();
        const finalLevel = tempLevel || validLevels[0] || 'Level 5';
        const finalBatch = tempBatch || validBatches[0] || '';
        
        setSelectedLevel(finalLevel);
        setSelectedBatch(finalBatch);
        setIsBatchModalOpen(false);
    };

    const handleClose = () => {
        // Fallback to active or first assigned if not set
        if (!selectedLevel && validLevels.length > 0) setSelectedLevel(validLevels[0]);
        if (!selectedBatch && validBatches.length > 0) setSelectedBatch(validBatches[0]);
        setIsBatchModalOpen(false);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-surface rounded-2xl shadow-2xl p-6 sm:p-7 w-full max-w-[460px] relative border border-outline-variant/70 max-h-[92vh] overflow-y-auto custom-scrollbar">
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
                        <span className="material-symbols-outlined text-[24px]">swap_horiz</span>
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-on-surface">Switch Level & Batch</h2>
                        <p className="text-xs text-on-surface-variant">Select from your assigned levels and batches</p>
                    </div>
                </div>

                <form onSubmit={handleApply} className="space-y-5 mt-5">
                    {/* SECTION 1: ASSIGNED LEVELS ONLY (ABOVE BATCH) */}
                    <div className="bg-surface-container-low p-4 rounded-xl border border-outline-variant/60 space-y-2.5">
                        <div className="flex items-center justify-between">
                            <label className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
                                <span className="material-symbols-outlined text-[16px]">stairs</span>
                                Assigned Level
                            </label>
                            <span className="text-[11px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-md border border-primary/20">
                                {tempLevel}
                            </span>
                        </div>
                        <p className="text-[11px] text-on-surface-variant">
                            Choose your active assigned teaching level:
                        </p>

                        <div className="space-y-2 pt-1">
                            {validLevels.map((lvl) => {
                                const isSelected = tempLevel === lvl;
                                return (
                                    <button
                                        key={lvl}
                                        type="button"
                                        onClick={() => setTempLevel(lvl)}
                                        className={`w-full py-2.5 px-3.5 rounded-xl font-medium transition-all flex items-center justify-between border cursor-pointer ${
                                            isSelected
                                                ? 'bg-primary/15 text-primary border-primary font-bold shadow-xs'
                                                : 'bg-surface text-on-surface border-outline-variant hover:bg-surface-container'
                                        }`}
                                    >
                                        <div className="flex items-center gap-2.5">
                                            <span className="material-symbols-outlined text-[18px]">school</span>
                                            <span className="text-xs sm:text-sm">{lvl}</span>
                                        </div>
                                        {isSelected && (
                                            <span className="material-symbols-outlined text-primary text-[18px]">check_circle</span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* SECTION 2: ASSIGNED BATCHES ONLY (BELOW LEVEL) */}
                    <div className="bg-surface-container-low p-4 rounded-xl border border-outline-variant/60 space-y-2.5">
                        <div className="flex items-center justify-between">
                            <label className="text-xs font-bold uppercase tracking-wider text-secondary flex items-center gap-1.5">
                                <span className="material-symbols-outlined text-[16px]">domain</span>
                                Assigned Batch
                            </label>
                            <span className="text-[11px] font-semibold text-secondary bg-secondary/10 px-2 py-0.5 rounded-md border border-secondary/20">
                                {tempBatch || 'None'}
                            </span>
                        </div>
                        <p className="text-[11px] text-on-surface-variant">
                            Select your active assigned batch to view and manage:
                        </p>

                        <div className="space-y-2 pt-1 max-h-[35vh] overflow-y-auto custom-scrollbar">
                            {validBatches.map((batchItem) => {
                                const isSelected = tempBatch === batchItem;
                                return (
                                    <button
                                        key={batchItem}
                                        type="button"
                                        onClick={() => setTempBatch(batchItem)}
                                        className={`w-full py-2.5 px-3.5 rounded-xl font-medium transition-all flex items-center justify-between border cursor-pointer ${
                                            isSelected
                                                ? 'bg-secondary/15 text-secondary border-secondary font-bold shadow-xs'
                                                : 'bg-surface text-on-surface border-outline-variant hover:bg-surface-container'
                                        }`}
                                    >
                                        <div className="flex items-center gap-2.5">
                                            <span className="material-symbols-outlined text-[18px]">domain</span>
                                            <span className="text-xs sm:text-sm">{batchItem}</span>
                                        </div>
                                        {isSelected && (
                                            <span className="material-symbols-outlined text-secondary text-[18px]">check_circle</span>
                                        )}
                                    </button>
                                );
                            })}

                            {validBatches.length === 0 && (
                                <div className="py-5 text-center text-on-surface-variant">
                                    <span className="material-symbols-outlined text-[32px] opacity-40 block mb-1">assignment_late</span>
                                    <p className="text-xs font-medium">No batches currently assigned.</p>
                                    <p className="text-[11px] opacity-75 mt-0.5">Please ask your Admin to assign batches to your account.</p>
                                </div>
                            )}
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
                            <span>Save & Switch</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export const StaffBatchSelectionModal = SensiBatchSelectionModal;
