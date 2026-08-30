'use client';
import AnnouncementChat from "../../components/AnnouncementChat";
import { useStaffContext } from "@/app/staff/StaffContext";

export default function StaffAnnouncements() {
    const { selectedBatch } = useStaffContext();
    const activeBatch = (selectedBatch === 'All Assigned Batches' || selectedBatch === 'All Batches') ? '' : (selectedBatch || '');
    return (
        <div className="max-w-[1440px] mx-auto p-gutter space-y-lg relative pb-32 animate-fade-in w-full max-w-full overflow-x-hidden">
            <AnnouncementChat role="Staff" overrideBatch={activeBatch} />
        </div>
    );
}
