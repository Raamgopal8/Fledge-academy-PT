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
                <div className="flex min-h-screen bg-background text-on-surface font-body-md">
                    <StaffNavbar />
                    
                    <main className="flex-grow min-h-screen pb-32 flex flex-col p-margin-mobile md:p-margin-desktop">
                        <StaffTopNav />
                        
                        {/* Content Area */}
                        <div className="flex-grow relative">
                            {children}
                            
                            {/* Floating Action Button */}
                            <button className="fixed bottom-24 right-8 h-14 w-14 bg-primary text-on-primary rounded-full shadow-lg flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-50">
                                <span className="material-symbols-outlined">add_task</span>
                            </button>
                        </div>
                        
                        {/* Footer Shell */}
                        <footer className="fixed bottom-0 left-0 right-0 bg-surface-container-highest py-md border-t border-outline-variant z-40">
                            <div className="flex flex-col md:flex-row justify-between items-center px-gutter w-full max-w-7xl mx-auto gap-md">
                                <div className="text-on-surface-variant font-body-sm text-body-sm">
                                    © 2026 Fledge Academy. All rights reserved.
                                </div>
                                <div className="flex gap-lg">
                                    <a className="text-on-surface-variant font-label-sm text-label-sm hover:text-primary transition-colors" href="/privacy">Privacy Policy</a>
                                    <a className="text-on-surface-variant font-label-sm text-label-sm hover:text-primary transition-colors" href="/terms">Terms of Service</a>
                                    <a className="text-on-surface-variant font-label-sm text-label-sm hover:text-primary transition-colors" href="/contact">Contact Us</a>
                                </div>
                            </div>
                        </footer>
                    </main>
                </div>
            </StaffProvider>
        </AuthGuard>
    );
}
