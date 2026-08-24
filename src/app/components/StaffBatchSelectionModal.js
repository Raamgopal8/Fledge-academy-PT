'use client';
import { useStaffContext } from '@/app/staff/StaffContext';

export default function StaffBatchSelectionModal() {
    const { 
        selectedBatch, 
        setSelectedBatch, 
        staffBatches, 
        isBatchModalOpen, 
        setIsBatchModalOpen 
    } = useStaffContext();

    if (!isBatchModalOpen) return null;

    const handleSelectBatch = (batchName) => {
        setSelectedBatch(batchName);
        setIsBatchModalOpen(false);
    };

    const batchesList = Array.isArray(staffBatches) && staffBatches.length > 0
        ? staffBatches
        : (selectedBatch ? [selectedBatch] : []);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-surface rounded-2xl shadow-2xl p-6 w-full max-w-[420px] relative border border-outline-variant/60">
                {/* Close Button */}
                <button 
                    onClick={() => setIsBatchModalOpen(false)}
                    className="absolute top-4 right-4 text-on-surface-variant hover:text-on-surface p-1 rounded-full hover:bg-surface-container transition-colors"
                >
                    <span className="material-symbols-outlined text-[20px]">close</span>
                </button>

                <div className="flex items-center gap-2.5 mb-2 mt-1">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                        <span className="material-symbols-outlined text-[22px]">swap_horiz</span>
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-on-surface">Switch Batch</h2>
                        <p className="text-xs text-on-surface-variant">Select which batch view to manage</p>
                    </div>
                </div>

                <div className="mt-5 space-y-2.5 max-h-[60vh] overflow-y-auto custom-scrollbar">
                    {/* All Assigned Batches Option */}
                    {batchesList.length > 1 && (
                        <button
                            onClick={() => handleSelectBatch('All Assigned Batches')}
                            className={`w-full py-3 px-4 rounded-xl font-medium transition-all flex items-center justify-between border ${
                                selectedBatch === 'All Assigned Batches' || !selectedBatch
                                    ? 'bg-primary/15 text-primary border-primary font-bold shadow-xs'
                                    : 'bg-surface-container-low text-on-surface border-outline-variant hover:bg-surface-container'
                            }`}
                        >
                            <div className="flex items-center gap-3">
                                <span className="material-symbols-outlined text-[20px]">groups</span>
                                <span>All Assigned Batches</span>
                            </div>
                            {(selectedBatch === 'All Assigned Batches' || !selectedBatch) && (
                                <span className="material-symbols-outlined text-primary text-[20px]">check_circle</span>
                            )}
                        </button>
                    )}

                    {/* Individual Assigned Batches */}
                    {batchesList.map((batchItem) => {
                        const isSelected = selectedBatch === batchItem;
                        return (
                            <button
                                key={batchItem}
                                onClick={() => handleSelectBatch(batchItem)}
                                className={`w-full py-3 px-4 rounded-xl font-medium transition-all flex items-center justify-between border ${
                                    isSelected
                                        ? 'bg-primary/15 text-primary border-primary font-bold shadow-xs'
                                        : 'bg-surface-container-low text-on-surface border-outline-variant hover:bg-surface-container'
                                }`}
                            >
                                <div className="flex items-center gap-3">
                                    <span className="material-symbols-outlined text-[20px]">domain</span>
                                    <span>{batchItem}</span>
                                </div>
                                {isSelected && (
                                    <span className="material-symbols-outlined text-primary text-[20px]">check_circle</span>
                                )}
                            </button>
                        );
                    })}

                    {batchesList.length === 0 && (
                        <div className="py-6 text-center text-on-surface-variant">
                            <span className="material-symbols-outlined text-[36px] opacity-40 block mb-2">assignment_late</span>
                            <p className="text-sm font-medium">No batches currently assigned.</p>
                            <p className="text-xs opacity-75 mt-1">Please ask your CEO or Admin to assign batches to your account.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
