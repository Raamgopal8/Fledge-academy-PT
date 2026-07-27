import StaffNavbar from "../../components/StaffNavbar";
import CommunityChat from "../../components/CommunityChat";

export default function StaffCommunityPage() {
    return (
        <div className="min-h-screen bg-surface-container flex flex-col md:flex-row">
            <StaffNavbar />
            <main className="flex-1 md:ml-64 p-md md:p-xl h-screen overflow-y-auto">
                <CommunityChat role="Staff" />
            </main>
        </div>
    );
}
