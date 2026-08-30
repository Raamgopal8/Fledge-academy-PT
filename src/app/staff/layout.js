import StaffNavbar from '@/app/components/StaffNavbar';
import StaffTopNav from '@/app/components/StaffTopNav';
import AuthGuard from '@/app/components/AuthGuard';
import { StaffProvider } from './StaffContext';

export const metadata = {
  title: 'Staff Portal | Fledge Academy',
};

export default function StaffLayout({ children }) {
    return (
        <AuthGuard requiredRole={["staff", "ceo"]}>
            <StaffProvider>
                <div className="flex min-h-screen bg-background text-on-surface font-body-md w-full max-w-full overflow-x-hidden">
                    <StaffNavbar />
                    
                    <main className="flex-grow min-h-screen flex flex-col w-full max-w-full overflow-x-hidden">
                        <StaffTopNav />
                        
                        {/* Content Area */}
                        <div className="flex-grow relative w-full max-w-full overflow-x-hidden pb-12">
                            {children}
                        </div>
                        
                        {/* Footer Shell */}
                        <footer className="mt-auto bg-surface-container-highest py-4 border-t border-outline-variant w-full">
                            <div className="flex flex-col sm:flex-row justify-between items-center px-4 max-w-7xl mx-auto gap-3 text-center sm:text-left">
                                <div className="flex flex-col items-center sm:items-start">
                                    <h2 className="text-sm font-bold text-on-surface">Fledge Academy</h2>
                                    <p className="text-xs text-on-surface-variant">
                                        © 2026 Fledge Academy. All rights reserved.
                                    </p>
                                </div>
                                <div className="flex flex-wrap justify-center gap-4 text-xs text-on-surface-variant">
                                    <a className="hover:text-primary transition-colors" href="/privacy">Privacy Policy</a>
                                    <a className="hover:text-primary transition-colors" href="/terms">Terms of Service</a>
                                    <a className="hover:text-primary transition-colors" href="/contact">Contact Us</a>
                                </div>
                            </div>
                        </footer>
                    </main>
                </div>
            </StaffProvider>
        </AuthGuard>
    );
}
