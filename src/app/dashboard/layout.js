import StudentNavbar from "../components/StudentNavbar";
import TopNav from "../components/TopNav";
import AuthGuard from "../components/AuthGuard";
import StudentFooter from "../components/StudentFooter";
import { StudentProvider } from "../student/StudentContext";
import MainContentWrapper from "./MainContentWrapper";

export const metadata = {
  title: "Fledge Academy | Student Dashboard",
};

export default function DashboardLayout({ children }) {
  return (
    <AuthGuard requiredRole="student">
      <StudentProvider>
        <div className="flex min-h-screen bg-slate-50 w-full max-w-full overflow-x-hidden">
          <StudentNavbar />
          
          {/* Main Content Canvas */}
          <MainContentWrapper>
            <TopNav />
            
            {/* Content Area */}
            <div className="flex-grow relative w-full max-w-full overflow-x-hidden pb-8">
              {children}
            </div>

            {/* Student Portal Footer */}
            <StudentFooter />
          </MainContentWrapper>
        </div>
      </StudentProvider>
    </AuthGuard>
  );
}
