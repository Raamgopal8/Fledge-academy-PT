'use client';
import AnnouncementChat from "../../components/AnnouncementChat";
import { useSensiContext } from "@/app/sensi/SensiContext";

export default function SensiAnnouncements() {
    const { selectedBatch } = useSensiContext();
    const activeBatch = (selectedBatch === 'All Assigned Batches' || selectedBatch === 'All Batches') ? '' : (selectedBatch || '');
    return (
        <div className="max-w-[1440px] mx-auto p-4 md:px-8 lg:px-12 md:py-8 space-y-6 md:space-y-8 relative pb-32 animate-fade-in">
            <AnnouncementChat role="Sensi" overrideBatch={activeBatch} />
        </div>
    );
}
