'use client';
import AnnouncementChat from "../../components/AnnouncementChat";
import { useCEOContext } from "../CEOContext";

export default function CEOAnnouncements() {
    const { selectedBatch } = useCEOContext();
    return (
        <div className="max-w-[1440px] mx-auto p-gutter space-y-lg relative pb-32 animate-fade-in">
            <AnnouncementChat role="CEO" overrideBatch={selectedBatch === 'All Batches' ? '' : (selectedBatch || '')} />
        </div>
    );
}
