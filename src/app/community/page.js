import StudentNavbar from "../components/StudentNavbar";
import TopNav from "../components/TopNav";
import CommunityChat from "../components/CommunityChat";
import { StudentProvider } from "../student/StudentContext";

import MainContentWrapper from "../dashboard/MainContentWrapper";

export default function StudentCommunityPage() {
    return (
        <StudentProvider>
            <div className="flex min-h-screen bg-slate-50">
                <StudentNavbar />
                <MainContentWrapper>
                    <TopNav />
                    <div className="flex-grow relative p-margin-mobile md:p-margin-desktop h-[calc(100vh-48px)] overflow-hidden">
                        <CommunityChat role="Student" />
                    </div>
                </MainContentWrapper>
            </div>
        </StudentProvider>
    );
}
