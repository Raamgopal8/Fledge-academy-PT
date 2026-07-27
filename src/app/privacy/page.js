"use client";

import { useRouter } from "next/navigation";

export default function PrivacyPolicy() {
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
              <span className="material-symbols-outlined text-[28px]">gavel</span>
            </span>
            <div>
              <h1 className="text-headline-lg text-on-surface">Privacy Policy</h1>
              <p className="text-body-sm text-on-surface-variant">Last Updated: July 15, 2026</p>
            </div>
          </div>

          <p className="text-body-md text-on-surface-variant mb-lg leading-relaxed">
            At Fledge Academy, we value your privacy and are committed to protecting your personal data. This Privacy Policy outlines how we collect, use, disclose, and safeguard your information when you use our portal and learning platforms.
          </p>

          <div className="space-y-lg">
            <section className="space-y-sm">
              <h2 className="text-headline-md text-on-surface flex items-center gap-xs">
                <span className="material-symbols-outlined text-primary">inventory_2</span>
                1. Information We Collect
              </h2>
              <div className="pl-7 space-y-xs text-on-surface-variant">
                <p>We collect information you provide directly to us when creating an account, accessing courses, or communicating with us. This includes:</p>
                <ul className="list-disc pl-5 space-y-xs">
                  <li><strong>Account Data:</strong> Name, email address, password, profile picture, and user preferences.</li>
                  <li><strong>Academic Records:</strong> Course progress, quiz scores, assignment submissions, and performance charts.</li>
                  <li><strong>Technical Data:</strong> IP address, device type, operating system, and platform usage metrics.</li>
                </ul>
              </div>
            </section>

            <section className="space-y-sm">
              <h2 className="text-headline-md text-on-surface flex items-center gap-xs">
                <span className="material-symbols-outlined text-primary">analytics</span>
                2. How We Use Your Information
              </h2>
              <div className="pl-7 space-y-xs text-on-surface-variant">
                <p>We use the collected information for various educational and operational purposes, including:</p>
                <ul className="list-disc pl-5 space-y-xs">
                  <li>Providing, maintaining, and improving our dashboard portal.</li>
                  <li>Personalizing your learning experience and tracking academic performance.</li>
                  <li>Communicating updates, notifications, and portal improvements.</li>
                  <li>Ensuring security, preventing fraud, and troubleshooting technical issues.</li>
                </ul>
              </div>
            </section>

            <section className="space-y-sm">
              <h2 className="text-headline-md text-on-surface flex items-center gap-xs">
                <span className="material-symbols-outlined text-primary">security</span>
                3. Data Security
              </h2>
              <p className="pl-7 text-on-surface-variant leading-relaxed">
                We implement state-of-the-art security measures including end-to-end encryption, regular system audits, and restricted database access control to protect your personal information from unauthorized access, alteration, or disclosure.
              </p>
            </section>

            <section className="space-y-sm">
              <h2 className="text-headline-md text-on-surface flex items-center gap-xs">
                <span className="material-symbols-outlined text-primary">share</span>
                4. Sharing of Information
              </h2>
              <p className="pl-7 text-on-surface-variant leading-relaxed">
                Fledge Academy does not sell, trade, or lease your personal identification information to third parties. We may only share anonymized analytical data or share information to comply with legal obligations or protect our users' safety.
              </p>
            </section>

            <section className="space-y-sm">
              <h2 className="text-headline-md text-on-surface flex items-center gap-xs">
                <span className="material-symbols-outlined text-primary">badge</span>
                5. Your Rights and Choices
              </h2>
              <div className="pl-7 space-y-xs text-on-surface-variant">
                <p>You have full control over your personal data on our portal. You may:</p>
                <ul className="list-disc pl-5 space-y-xs">
                  <li>Access, update, or correct your profile information via the Settings tab.</li>
                  <li>Request the deletion or suspension of your account and personal records.</li>
                  <li>Opt-out of optional email notifications and communications.</li>
                </ul>
              </div>
            </section>

            <section className="space-y-sm">
              <h2 className="text-headline-md text-on-surface flex items-center gap-xs">
                <span className="material-symbols-outlined text-primary">contact_support</span>
                6. Contact Information
              </h2>
              <p className="pl-7 text-on-surface-variant leading-relaxed">
                If you have any questions or concerns regarding this Privacy Policy, please contact our support team at <a href="mailto:privacy@fledgeacademy.com" className="text-primary hover:underline">privacy@fledgeacademy.com</a> or visit our Contact Us page.
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
