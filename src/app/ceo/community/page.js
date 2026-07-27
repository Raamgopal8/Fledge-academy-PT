import CEONavbar from "../../components/CEONavbar";
import CommunityChat from "../../components/CommunityChat";

export default function CEOCommunityPage() {
    return (
        <div className="min-h-screen bg-surface-container flex flex-col md:flex-row">
            <CEONavbar />
            <main className="flex-1 md:ml-64 p-md md:p-xl h-screen overflow-y-auto">
                <CommunityChat role="CEO" />
            </main>
        </div>
    );
}
