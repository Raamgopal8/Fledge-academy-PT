'use client';
import CommunityChat from "../../components/CommunityChat";
import { useCEOContext } from "../CEOContext";

export default function CEOCommunityPage() {
    const { selectedBatch } = useCEOContext();
    return (
        <section className="max-w-[1440px] mx-auto p-3 md:p-gutter space-y-4 md:space-y-lg animate-fade-in w-full max-w-full overflow-x-hidden">
            <CommunityChat role="CEO" overrideBatch={selectedBatch === 'All Batches' ? '' : (selectedBatch || '')} />
        </section>
    );
}
