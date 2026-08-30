'use client';
import AnnouncementChat from "../../components/AnnouncementChat";
import { useCEOContext } from "../CEOContext";

export default function CEOAnnouncements() {
    const { selectedBatch } = useCEOContext();
    return (
        <section className="max-w-[1440px] mx-auto p-3 md:p-gutter space-y-4 md:space-y-lg animate-fade-in w-full max-w-full overflow-x-hidden">
            <AnnouncementChat role="CEO" overrideBatch={selectedBatch === 'All Batches' ? '' : (selectedBatch || '')} />
        </section>
    );
}
