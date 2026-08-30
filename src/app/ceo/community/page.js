'use client';
import CommunityChat from "../../components/CommunityChat";
import { useCEOContext } from "../CEOContext";

export default function CEOCommunityPage() {
    const { selectedBatch } = useCEOContext();
    return (
        <div className="max-w-[1440px] mx-auto p-gutter space-y-lg relative pb-32 animate-fade-in">
            <CommunityChat role="CEO" overrideBatch={selectedBatch === 'All Batches' ? '' : (selectedBatch || '')} />
        </div>
    );
}
