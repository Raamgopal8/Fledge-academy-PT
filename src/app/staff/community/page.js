'use client';
import CommunityChat from "../../components/CommunityChat";
import { useStaffContext } from "@/app/staff/StaffContext";

export default function StaffCommunityPage() {
    const { selectedBatch } = useStaffContext();
    const activeBatch = (selectedBatch === 'All Assigned Batches' || selectedBatch === 'All Batches') ? '' : (selectedBatch || '');
    return (
        <div className="max-w-[1440px] mx-auto p-4 md:px-8 lg:px-12 md:py-8 space-y-6 md:space-y-8 relative pb-32 animate-fade-in">
            <CommunityChat role="Staff" overrideBatch={activeBatch} />
        </div>
    );
}
