import StudentNavbar from "../components/StudentNavbar";
import CommunityChat from "../components/CommunityChat";
import { StudentProvider } from "../student/StudentContext";

export default function StudentCommunityPage() {
    return (
        <StudentProvider>
            <div className="min-h-screen bg-surface-container flex flex-col md:flex-row">
                <StudentNavbar />
                <main className="flex-1 md:ml-64 p-md md:p-xl h-screen overflow-y-auto">
                    <CommunityChat role="Student" />
                </main>
            </div>
        </StudentProvider>
    );
}
