import StudentNavbar from "../components/StudentNavbar";
import TopNav from "../components/TopNav";
import { StudentProvider } from "../student/StudentContext";

export const metadata = {
  title: "Fledge Academy | Student Dashboard",
};

export default function DashboardLayout({ children }) {
  return (
    <StudentProvider>
      <div className="flex min-h-screen bg-background">
        <StudentNavbar />
        
        {/* Main Content Canvas */}
        <main className="flex-1 md:ml-64 p-margin-mobile md:p-margin-desktop min-h-screen pb-32">
          <TopNav />
          {children}
          
          {/* Footer */}
          <footer className="fixed bottom-0 left-0 right-0 bg-surface-container-highest py-md border-t border-outline-variant z-40 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
            <div className="flex flex-col md:flex-row justify-between items-center px-gutter w-full max-w-7xl mx-auto gap-md">
              <div className="flex items-center gap-xs">
                <span className="material-symbols-outlined text-primary">school</span>
                <span className="font-headline-md text-headline-md text-primary">
                  Fledge Academy
                </span>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                © 2026 Fledge Academy. All rights reserved.
              </p>
              <div className="flex gap-lg">
                <a
                  href="/privacy"
                  className="font-label-sm text-label-sm text-on-surface-variant hover:text-primary transition-colors"
                >
                  Privacy Policy
                </a>
                <a
                  href="/terms"
                  className="font-label-sm text-label-sm text-on-surface-variant hover:text-primary transition-colors"
                >
                  Terms of Service
                </a>
                <a
                  href="/contact"
                  className="font-label-sm text-label-sm text-on-surface-variant hover:text-primary transition-colors"
                >
                  Contact Us
                </a>
              </div>
            </div>
          </footer>
        </main>
      </div>
    </StudentProvider>
  );
}
