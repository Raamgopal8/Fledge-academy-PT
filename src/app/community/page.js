import StudentNavbar from "../components/StudentNavbar";
import TopNav from "../components/TopNav";
import CommunityChat from "../components/CommunityChat";
import StudentFooter from "../components/StudentFooter";
import { StudentProvider } from "../student/StudentContext";
import MainContentWrapper from "../dashboard/MainContentWrapper";

export default function StudentCommunityPage() {
    return (
        <StudentProvider>
            <div className="flex min-h-screen bg-slate-50 w-full max-w-full overflow-x-hidden">
                <StudentNavbar />
                <MainContentWrapper>
                    <TopNav />
                    <div className="max-w-[1440px] mx-auto p-4 md:px-8 lg:px-12 md:py-3 relative animate-fade-in w-full flex-grow flex flex-col h-[calc(100dvh-6.5rem)] min-h-0">
                        <CommunityChat role="Student" />
                    </div>
                    <StudentFooter />
                </MainContentWrapper>
            </div>
        </StudentProvider>
    );
}
