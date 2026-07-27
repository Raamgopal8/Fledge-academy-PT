"use client";

import { useRouter } from "next/navigation";

export default function TermsOfService() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-background text-on-surface font-body-md flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-surface/80 backdrop-blur-md border-b border-outline-variant px-gutter py-sm">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-xs cursor-pointer" onClick={() => router.push("/")}>
            <span className="material-symbols-outlined text-primary text-[32px]">school</span>
            <span className="font-headline-md text-headline-md text-primary">Fledge Academy</span>
          </div>
          <button 
            onClick={() => router.back()} 
            className="flex items-center gap-xs px-4 py-2 rounded-xl border border-outline-variant hover:bg-surface-container-low transition-colors text-label-md text-on-surface"
          >
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
            Back
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow max-w-4xl mx-auto w-full px-gutter py-xl">
        <div className="bg-surface-container-lowest border border-outline-variant rounded-3xl p-gutter md:p-xl shadow-sm">
          <div className="flex items-center gap-sm mb-md">
            <span className="bg-primary-fixed text-on-primary-fixed-variant p-3 rounded-2xl">
              <span className="material-symbols-outlined text-[28px]">description</span>
            </span>
            <div>
              <h1 className="text-headline-lg text-on-surface">Terms of Service</h1>
              <p className="text-body-sm text-on-surface-variant">Last Updated: July 15, 2026</p>
            </div>
          </div>

          <p className="text-body-md text-on-surface-variant mb-lg leading-relaxed">
            Welcome to Fledge Academy. By accessing or using our portal, courses, and educational services, you agree to comply with and be bound by the following Terms of Service. Please read these terms carefully.
          </p>

          <div className="space-y-lg">
            <section className="space-y-sm">
              <h2 className="text-headline-md text-on-surface flex items-center gap-xs">
                <span className="material-symbols-outlined text-primary">check_circle</span>
                1. Acceptance of Terms
              </h2>
              <p className="pl-7 text-on-surface-variant leading-relaxed">
                By registering for an account or using our portal in any way, you confirm that you accept these Terms of Service. If you do not agree to these terms, you must not access or use Fledge Academy's platform.
              </p>
            </section>

            <section className="space-y-sm">
              <h2 className="text-headline-md text-on-surface flex items-center gap-xs">
                <span className="material-symbols-outlined text-primary">manage_accounts</span>
                2. User Accounts & Portals
              </h2>
              <div className="pl-7 space-y-xs text-on-surface-variant">
                <p>To access certain features of the platform, you may be required to register for an account. You agree to:</p>
                <ul className="list-disc pl-5 space-y-xs">
                  <li>Provide accurate, current, and complete information during registration.</li>
                  <li>Maintain the security of your password and accept all risks of unauthorized access.</li>
                  <li>Promptly notify us if you discover or suspect any security breaches related to your account.</li>
                </ul>
              </div>
            </section>

            <section className="space-y-sm">
              <h2 className="text-headline-md text-on-surface flex items-center gap-xs">
                <span className="material-symbols-outlined text-primary">rule</span>
                3. Acceptable Use Policy
              </h2>
              <div className="pl-7 space-y-xs text-on-surface-variant">
                <p>When using the Fledge Academy portal, you agree not to engage in any activity that:</p>
                <ul className="list-disc pl-5 space-y-xs">
                  <li>Violates any local, state, national, or international law or regulation.</li>
                  <li>Infringes upon the intellectual property rights of Fledge Academy or others.</li>
                  <li>Attempts to disrupt, hack, or compromise the stability of our servers or databases.</li>
                  <li>Engages in cheating, academic dishonesty, or sharing course answer sheets without permission.</li>
                </ul>
              </div>
            </section>

            <section className="space-y-sm">
              <h2 className="text-headline-md text-on-surface flex items-center gap-xs">
                <span className="material-symbols-outlined text-primary">copyright</span>
                4. Intellectual Property
              </h2>
              <p className="pl-7 text-on-surface-variant leading-relaxed">
                All content published on the Fledge Academy platform, including text, graphics, videos, code snippets, logos, and portal designs, is the exclusive property of Fledge Academy and is protected by copyright and intellectual property laws. You are granted a limited, non-exclusive license to use these resources for personal learning only.
              </p>
            </section>

            <section className="space-y-sm">
              <h2 className="text-headline-md text-on-surface flex items-center gap-xs">
                <span className="material-symbols-outlined text-primary">warning</span>
                5. Limitation of Liability
              </h2>
              <p className="pl-7 text-on-surface-variant leading-relaxed">
                Fledge Academy provides its platform and services on an "as-is" basis. We make no guarantees that our portal will be error-free, uninterrupted, or completely secure. Fledge Academy is not liable for any direct or indirect damages resulting from your use of the platform.
              </p>
            </section>

            <section className="space-y-sm">
              <h2 className="text-headline-md text-on-surface flex items-center gap-xs">
                <span className="material-symbols-outlined text-primary">gavel</span>
                6. Governing Law
              </h2>
              <p className="pl-7 text-on-surface-variant leading-relaxed">
                These Terms of Service shall be governed by and construed in accordance with the laws of the jurisdiction in which Fledge Academy operates, without giving effect to any principles of conflicts of law.
              </p>
            </section>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-surface-container-highest border-t border-outline-variant py-md text-center text-body-sm text-on-surface-variant">
        <p>© 2026 Fledge Academy. All rights reserved.</p>
      </footer>
    </div>
  );
}
