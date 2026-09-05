'use client';
import { useState, useEffect } from 'react';
import { useSensiContext } from '@/app/sensi/SensiContext';

export default function SensiBatchSelectionModal() {
    const context = useSensiContext();
    
    const selectedBatch = context?.selectedBatch;
    const setSelectedBatch = context?.setSelectedBatch || (() => {});
    const staffBatches = context?.staffBatches || context?.sensiBatches || [];
    
    const selectedLevel = context?.selectedLevel;
    const setSelectedLevel = context?.setSelectedLevel || (() => {});
    const sensiLevels = context?.sensiLevels || [];
    
    const isBatchModalOpen = context?.isBatchModalOpen;
    const setIsBatchModalOpen = context?.setIsBatchModalOpen || (() => {});

    const [tempLevel, setTempLevel] = useState('');
    const [tempBatch, setTempBatch] = useState('');

    useEffect(() => {
        if (isBatchModalOpen) {
            setTempLevel(selectedLevel || (sensiLevels.length > 0 ? sensiLevels[0] : 'Level 5'));
            setTempBatch(selectedBatch || (staffBatches.length > 0 ? staffBatches[0] : ''));
        }
    }, [isBatchModalOpen, selectedLevel, selectedBatch, sensiLevels, staffBatches]);

    if (!isBatchModalOpen) return null;

    const batchesList = Array.isArray(staffBatches) && staffBatches.length > 0
        ? staffBatches
        : (selectedBatch ? [selectedBatch] : []);

    const levelsList = Array.isArray(sensiLevels) && sensiLevels.length > 0
        ? sensiLevels
        : (selectedLevel ? [selectedLevel] : ['Level 5']);

    const handleApply = (e) => {
        if (e) e.preventDefault();
        setSelectedLevel(tempLevel);
        setSelectedBatch(tempBatch);
        setIsBatchModalOpen(false);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-surface rounded-2xl shadow-2xl p-6 sm:p-7 w-full max-w-[500px] relative border border-outline-variant/70 max-h-[92vh] overflow-y-auto custom-scrollbar">
                {/* Close Button */}
                <button 
                    onClick={() => setIsBatchModalOpen(false)}
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
                        <h2 className="text-xl font-bold text-on-surface">Portal Scope</h2>
                        <p className="text-xs text-on-surface-variant">Select your assigned level and batch view</p>
                    </div>
                </div>

                <form onSubmit={handleApply} className="space-y-5 mt-5">
                    {/* SECTION 1: LEVEL FILTER */}
                    <div className="bg-surface-container-low p-4 rounded-xl border border-outline-variant/60 space-y-3">
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
                                <span className="material-symbols-outlined text-[16px]">stairs</span>
                                Select Level
                            </label>
                        </div>

                        {/* Available Levels */}
                        <div className="space-y-2 max-h-[25vh] overflow-y-auto custom-scrollbar">
                            {levelsList.map((lvl) => {
                                const isSelected = tempLevel === lvl;
                                return (
                                    <button
                                        key={lvl}
                                        type="button"
                                        onClick={() => setTempLevel(lvl)}
                                        className={`w-full py-2.5 px-3 rounded-xl font-medium transition-all flex items-center justify-between border ${
                                            isSelected
                                                ? 'bg-primary/15 text-primary border-primary font-bold shadow-xs'
                                                : 'bg-surface text-on-surface-variant border-outline-variant/70 hover:bg-surface-container'
                                        }`}
                                    >
                                        <div className="flex items-center gap-2">
                                            <span className="material-symbols-outlined text-[18px]">school</span>
                                            <span>{lvl}</span>
                                        </div>
                                        {isSelected && (
                                            <span className="material-symbols-outlined text-primary text-[18px]">check_circle</span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* SECTION 2: BATCH FILTER */}
                    <div className="bg-surface-container-low p-4 rounded-xl border border-outline-variant/60 space-y-3">
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-xs font-bold uppercase tracking-wider text-secondary flex items-center gap-1.5">
                                <span className="material-symbols-outlined text-[16px]">domain</span>
                                Select Batch
                            </label>
                        </div>

                        {/* Individual Assigned Batches */}
                        <div className="space-y-2 max-h-[30vh] overflow-y-auto custom-scrollbar">
                            {batchesList.map((batchItem) => {
                                const isSelected = tempBatch === batchItem;
                                return (
                                    <button
                                        key={batchItem}
                                        type="button"
                                        onClick={() => setTempBatch(batchItem)}
                                        className={`w-full py-2.5 px-3 rounded-xl font-medium transition-all flex items-center justify-between border ${
                                            isSelected
                                                ? 'bg-secondary/15 text-secondary border-secondary font-bold shadow-xs'
                                                : 'bg-surface text-on-surface-variant border-outline-variant/70 hover:bg-surface-container'
                                        }`}
                                    >
                                        <div className="flex items-center gap-2">
                                            <span className="material-symbols-outlined text-[18px]">groups</span>
                                            <span>{batchItem}</span>
                                        </div>
                                        {isSelected && (
                                            <span className="material-symbols-outlined text-secondary text-[18px]">check_circle</span>
                                        )}
                                    </button>
                                );
                            })}

                            {batchesList.length === 0 && (
                                <div className="py-4 text-center text-on-surface-variant">
                                    <span className="material-symbols-outlined text-[28px] opacity-40 block mb-1">assignment_late</span>
                                    <p className="text-xs font-medium">No batches assigned.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={() => setIsBatchModalOpen(false)}
                            className="px-4 py-2 rounded-xl text-xs sm:text-sm font-medium text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={!tempLevel || !tempBatch}
                            className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-primary text-white hover:bg-primary/90 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
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

export const StaffBatchSelectionModal = SensiBatchSelectionModal;
