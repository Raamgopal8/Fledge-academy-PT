'use client';
import CommunityChat from "../../components/CommunityChat";
import { useCEOContext } from "../CEOContext";

export default function CEOCommunityPage() {
    const { selectedBatch } = useCEOContext();
    return (
        <section className="p-gutter max-w-[1440px] mx-auto">
            <CommunityChat role="CEO" overrideBatch={selectedBatch === 'All Batches' ? '' : (selectedBatch || '')} />
        </section>
    );
}
