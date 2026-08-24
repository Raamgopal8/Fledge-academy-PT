'use client';
import { useState, useEffect } from 'react';
import { useCEOContext } from '@/app/ceo/CEOContext';

export default function BatchSelectionModal() {
    const { selectedBatch, setSelectedBatch } = useCEOContext();
    const [isOpen, setIsOpen] = useState(false);
    const [batchInput, setBatchInput] = useState('');

    useEffect(() => {
        // Automatically open if no batch is selected
        if (selectedBatch === null) {
            setIsOpen(true);
        } else {
            setIsOpen(false);
        }
    }, [selectedBatch]);

    const handleSelectAll = () => {
        setSelectedBatch('All Batches');
        setIsOpen(false);
    };

    const handleSelectBatch = (e) => {
        e.preventDefault();
        if (batchInput.trim()) {
            setSelectedBatch(batchInput.trim());
            setIsOpen(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-surface rounded-xl shadow-xl p-6 w-full max-w-[400px] relative">
                {/* Close Button */}
                <button 
                    onClick={() => {
                        if (selectedBatch === null) setSelectedBatch('All Batches');
                        setIsOpen(false);
                    }}
                    className="absolute top-4 right-4 text-on-surface-variant hover:text-on-surface transition-colors"
                >
                    <span className="material-symbols-outlined">close</span>
                </button>

                <h2 className="text-xl font-bold text-on-surface mb-2 mt-2">Select Batch</h2>
                <p className="text-sm text-on-surface-variant mb-6">
                    Choose a specific batch to view its data, or select 'All Batches' for a global view.
                </p>

                <div className="space-y-4">
                    <button
                        onClick={handleSelectAll}
                        className="w-full py-2 px-4 bg-primary/10 text-primary rounded-lg font-medium hover:bg-primary/20 transition-colors flex items-center justify-center gap-2"
                    >
                        <span className="material-symbols-outlined text-[18px]">public</span>
                        All Batches
                    </button>

                    <div className="relative flex items-center py-2">
                        <div className="flex-grow border-t border-outline-variant"></div>
                        <span className="flex-shrink-0 mx-4 text-sm font-medium text-on-surface-variant">OR</span>
                        <div className="flex-grow border-t border-outline-variant"></div>
                    </div>

                    <form onSubmit={handleSelectBatch} className="flex gap-2">
                        <input
                            type="text"
                            value={batchInput}
                            onChange={(e) => setBatchInput(e.target.value)}
                            placeholder="Enter batch (e.g. batch-1)"
                            className="flex-grow h-[40px] px-4 bg-surface-container-lowest border border-outline-variant rounded-lg focus:outline-none focus:border-primary text-body-md"
                        />
                        <button
                            type="submit"
                            disabled={!batchInput.trim()}
                            className="h-[40px] px-4 bg-primary text-white rounded-lg font-medium disabled:opacity-50 transition-colors"
                        >
                            Enter
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
