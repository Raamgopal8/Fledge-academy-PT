'use client';
import AnnouncementChat from "../../components/AnnouncementChat";
import { useCEOContext } from "../CEOContext";

export default function CEOAnnouncements() {
    const { selectedBatch } = useCEOContext();
    return (
        <section className="p-gutter max-w-[1440px] mx-auto">
            <AnnouncementChat role="CEO" overrideBatch={selectedBatch === 'All Batches' ? '' : (selectedBatch || '')} />
        </section>
    );
}
