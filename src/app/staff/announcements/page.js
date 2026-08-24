'use client';
import AnnouncementChat from "../../components/AnnouncementChat";
import { useStaffContext } from "@/app/staff/StaffContext";

export default function StaffAnnouncements() {
    const { selectedBatch } = useStaffContext();
    const activeBatch = (selectedBatch === 'All Assigned Batches' || selectedBatch === 'All Batches') ? '' : (selectedBatch || '');
    return (
        <section className="p-gutter max-w-[1440px] mx-auto">
            <AnnouncementChat role="Staff" overrideBatch={activeBatch} />
        </section>
    );
}
