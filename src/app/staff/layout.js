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
                    
                    <main className="flex-grow min-h-screen pb-32 flex flex-col">
                        <StaffTopNav />
                        
                        {/* Content Area */}
                        <div className="flex-grow relative">
                            {children}
                        </div>
                        
                        {/* Footer Shell */}
                        <footer className="fixed bottom-0 left-0 right-0 bg-surface-container-highest py-md border-t border-outline-variant z-40">
                            <div className="flex flex-col md:flex-row justify-between items-center px-gutter w-full max-w-7xl mx-auto gap-md">
                                <div className="flex flex-col items-center md:items-start">
                                    <h2 className="font-headline-md text-headline-md text-on-surface">Fledge Academy</h2>
                                    <p className="font-body-sm text-body-sm text-on-surface-variant mt-xs">
                                        © 2026 Fledge Academy. All rights reserved.
                                    </p>
                                </div>
                                <div className="flex gap-lg">
                                    <a className="font-label-sm text-label-sm text-on-surface-variant hover:text-primary transition-colors" href="/privacy">Privacy Policy</a>
                                    <a className="font-label-sm text-label-sm text-on-surface-variant hover:text-primary transition-colors" href="/terms">Terms of Service</a>
                                    <a className="font-label-sm text-label-sm text-on-surface-variant hover:text-primary transition-colors" href="/contact">Contact Us</a>
                                </div>
                            </div>
                        </footer>
                    </main>
                </div>
            </StaffProvider>
        </AuthGuard>
    );
}
