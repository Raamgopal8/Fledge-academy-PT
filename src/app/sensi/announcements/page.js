'use client';
import AnnouncementChat from "../../components/AnnouncementChat";
import { useSensiContext } from "@/app/sensi/SensiContext";

export default function SensiAnnouncements() {
    const { selectedBatch, selectedLevel } = useSensiContext();
    const activeBatch = (selectedBatch === 'All Assigned Batches' || selectedBatch === 'All Batches') ? '' : (selectedBatch || '');
    return (
        <div className="max-w-[1440px] mx-auto p-4 md:px-8 lg:px-12 md:py-3 relative animate-fade-in h-[calc(100dvh-5rem)] flex flex-col min-h-0">
            <AnnouncementChat 
                role="Sensi" 
                overrideBatch={activeBatch} 
                overrideLevel={selectedLevel || ''} 
            />
        </div>
    );
}
