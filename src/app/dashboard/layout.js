import StudentNavbar from "../components/StudentNavbar";
import TopNav from "../components/TopNav";
import AuthGuard from "../components/AuthGuard";
import { StudentProvider } from "../student/StudentContext";
import MainContentWrapper from "./MainContentWrapper";

export const metadata = {
  title: "Fledge Academy | Student Dashboard",
};

export default function DashboardLayout({ children }) {
  return (
    <AuthGuard requiredRole="student">
      <StudentProvider>
        <div className="flex min-h-screen bg-slate-50">
          <StudentNavbar />
          
          {/* Main Content Canvas */}
          <MainContentWrapper>
            <TopNav />
            
            {/* Content Area */}
            <div className="flex-grow relative p-margin-mobile md:p-margin-desktop">
              {children}
            </div>
          </MainContentWrapper>
        </div>
      </StudentProvider>
    </AuthGuard>
  );
}
