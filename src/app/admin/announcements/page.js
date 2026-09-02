'use client';
import AnnouncementChat from "../../components/AnnouncementChat";
import { useAdminContext } from "../AdminContext";

export default function AdminAnnouncements() {
    const { selectedBatch } = useAdminContext();
    return (
        <div className="max-w-[1440px] mx-auto p-gutter space-y-lg relative pb-32 animate-fade-in">
            <AnnouncementChat role="Admin" overrideBatch={selectedBatch === 'All Batches' ? '' : (selectedBatch || '')} />
        </div>
    );
}
