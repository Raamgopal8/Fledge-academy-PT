'use client';
import CommunityChat from "../../components/CommunityChat";
import { useSensiContext } from "@/app/sensi/SensiContext";

export default function SensiCommunityPage() {
    const { selectedBatch } = useSensiContext();
    const activeBatch = (selectedBatch === 'All Assigned Batches' || selectedBatch === 'All Batches') ? '' : (selectedBatch || '');
    return (
        <div className="max-w-[1440px] mx-auto p-4 md:px-8 lg:px-12 md:py-3 relative animate-fade-in h-[calc(100dvh-5rem)] flex flex-col min-h-0">
            <CommunityChat role="Sensi" overrideBatch={activeBatch} />
        </div>
    );
}
