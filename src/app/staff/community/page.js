'use client';
import StaffNavbar from "../../components/StaffNavbar";
import CommunityChat from "../../components/CommunityChat";
import { useStaffContext } from "@/app/staff/StaffContext";

export default function StaffCommunityPage() {
    const { selectedBatch } = useStaffContext();
    const activeBatch = (selectedBatch === 'All Assigned Batches' || selectedBatch === 'All Batches') ? '' : (selectedBatch || '');
    return (
        <div className="min-h-screen bg-surface-container flex flex-col md:flex-row">
            <StaffNavbar />
            <main className="flex-1 md:ml-64 p-md md:p-xl h-screen overflow-y-auto">
                <CommunityChat role="Staff" overrideBatch={activeBatch} />
            </main>
        </div>
    );
}
