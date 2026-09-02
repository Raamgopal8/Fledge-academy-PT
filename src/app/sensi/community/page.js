'use client';
import CommunityChat from "../../components/CommunityChat";
import { useSensiContext } from "@/app/sensi/SensiContext";

export default function SensiCommunityPage() {
    const { selectedBatch } = useSensiContext();
    const activeBatch = (selectedBatch === 'All Assigned Batches' || selectedBatch === 'All Batches') ? '' : (selectedBatch || '');
    return (
        <div className="max-w-[1440px] mx-auto p-4 md:px-8 lg:px-12 md:py-8 space-y-6 md:space-y-8 relative pb-32 animate-fade-in">
            <CommunityChat role="Sensi" overrideBatch={activeBatch} />
        </div>
    );
}
