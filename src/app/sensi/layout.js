import SensiNavbar from '@/app/components/SensiNavbar';
import SensiTopNav from '@/app/components/SensiTopNav';
import AuthGuard from '@/app/components/AuthGuard';
import { SensiProvider } from './SensiContext';

export const metadata = {
  title: 'Sensi Portal | Fledge Academy',
};

export default function SensiLayout({ children }) {
    return (
        <AuthGuard requiredRole={["sensi", "staff", "admin", "ceo"]}>
            <SensiProvider>
                <div className="flex min-h-screen bg-background text-on-surface font-body-md w-full max-w-full overflow-x-hidden">
                    <SensiNavbar />
                    
                    <main className="flex-grow min-h-screen flex flex-col w-full max-w-full overflow-x-hidden">
                        <SensiTopNav />
                        
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
            </SensiProvider>
        </AuthGuard>
    );
}
