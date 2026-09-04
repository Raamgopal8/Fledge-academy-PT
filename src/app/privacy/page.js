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

          <div className="space-y-4 text-body-md text-on-surface-variant mb-lg leading-relaxed">
            <p>
              This Privacy Policy explains how Fledge Academy (&ldquo;Fledge Academy&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo; or &ldquo;our&rdquo;), operated by Lakshmanraju N C, collects, uses, stores, shares and otherwise processes personal data in connection with the Fledge Academy website, Portal, courses, classes, assessments, community features and related Services.
            </p>
            <p>
              This Policy is intended to be clear and practical. Where a specific law provides a mandatory right, obligation, notice, consent requirement or remedy, that legal requirement will prevail to the extent of any inconsistency.
            </p>
          </div>

          <div className="space-y-lg">
            {/* 1. Who We Are */}
            <section className="space-y-sm">
              <h2 className="text-headline-md text-on-surface flex items-center gap-xs">
                <span className="material-symbols-outlined text-primary">info</span>
                1. Who We Are
              </h2>
              <div className="pl-7 space-y-xs text-on-surface-variant leading-relaxed">
                <ul className="list-disc pl-5 space-y-xs">
                  <li><strong>Name/brand:</strong> Fledge Academy</li>
                  <li><strong>Operated by:</strong> Lakshmanraju N C</li>
                  <li><strong>Email:</strong> <a href="mailto:fledgeacademy@gmail.com" className="text-primary hover:underline">fledgeacademy@gmail.com</a></li>
                  <li><strong>Phone:</strong> 8072702576</li>
                  <li><strong>Website:</strong> <a href="https://fledgeacademy.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">fledgeacademy.com</a></li>
                  <li><strong>Primary operating territory:</strong> India</li>
                </ul>
                <p className="pt-2">For privacy questions or requests, contact us using the details above.</p>
              </div>
            </section>

            {/* 2. Personal Data We May Collect */}
            <section className="space-y-sm">
              <h2 className="text-headline-md text-on-surface flex items-center gap-xs">
                <span className="material-symbols-outlined text-primary">inventory_2</span>
                2. Personal Data We May Collect
              </h2>
              <div className="pl-7 space-y-sm text-on-surface-variant leading-relaxed">
                <p>Depending on how you enrol and use the Services, we may collect or receive the following categories of personal data:</p>

                <div className="space-y-xs">
                  <h3 className="font-semibold text-on-surface">A. Registration and profile information</h3>
                  <ul className="list-disc pl-5 space-y-xs">
                    <li>Full name</li>
                    <li>Date of birth and age</li>
                    <li>Email address</li>
                    <li>Phone/mobile number</li>
                    <li>Profile photograph</li>
                    <li>Other profile information that you voluntarily provide</li>
                  </ul>
                </div>

                <div className="space-y-xs">
                  <h3 className="font-semibold text-on-surface">B. Course and academic information</h3>
                  <ul className="list-disc pl-5 space-y-xs">
                    <li>Course, batch and level information</li>
                    <li>Attendance and participation information</li>
                    <li>Class schedules and completion information</li>
                    <li>Assignments, notes and uploaded documents</li>
                    <li>Test/assessment answers and scores</li>
                    <li>Instructor feedback, corrections, approvals and academic notes</li>
                  </ul>
                </div>

                <div className="space-y-xs">
                  <h3 className="font-semibold text-on-surface">C. Communication and community information</h3>
                  <ul className="list-disc pl-5 space-y-xs">
                    <li>Text messages posted in the community</li>
                    <li>Voice messages</li>
                    <li>Images, files and links submitted through community or course features</li>
                    <li>Communications with instructors or administrators</li>
                  </ul>
                </div>

                <div className="space-y-xs">
                  <h3 className="font-semibold text-on-surface">D. Technical and usage information</h3>
                  <ul className="list-disc pl-5 space-y-xs">
                    <li>IP address</li>
                    <li>Browser and device information</li>
                    <li>Operating-system or device characteristics made available by the browser/device</li>
                    <li>Login history and session information</li>
                    <li>Security and access logs</li>
                    <li>Cookies, local storage and similar technical identifiers</li>
                  </ul>
                </div>

                <div className="space-y-xs">
                  <h3 className="font-semibold text-on-surface">E. Fee and administrative information</h3>
                  <ul className="list-disc pl-5 space-y-xs">
                    <li>Course fee status</li>
                    <li>Paid, pending or outstanding fee information</li>
                    <li>Payment method or payment-related administrative details communicated to Fledge Academy</li>
                    <li>Payment records maintained for administration, reconciliation and support</li>
                  </ul>
                  <p className="pt-1">
                    Fledge Academy does not currently use the Portal to collect or store users’ card numbers, UPI PINs, banking passwords or similar payment credentials. Where a third-party payment gateway is introduced, payment information may be processed by that provider according to its terms and privacy policy.
                  </p>
                </div>

                <div className="space-y-xs">
                  <h3 className="font-semibold text-on-surface">F. Class recordings and media</h3>
                  <p>
                    Where classes are recorded, the recording may contain the instructor, presentation materials, participant names or visible identifiers, audio contributions, and participant images where cameras are enabled. Recordings may also contain chat or other class interactions depending on the meeting configuration.
                  </p>
                </div>
              </div>
            </section>

            {/* 3. How We Collect Personal Data */}
            <section className="space-y-sm">
              <h2 className="text-headline-md text-on-surface flex items-center gap-xs">
                <span className="material-symbols-outlined text-primary">downloading</span>
                3. How We Collect Personal Data
              </h2>
              <div className="pl-7 space-y-xs text-on-surface-variant leading-relaxed">
                <ul className="list-disc pl-5 space-y-xs">
                  <li>Directly from you during enrolment, registration or profile creation.</li>
                  <li>When you use the Portal, attend classes, submit assignments or participate in assessments.</li>
                  <li>When you communicate with instructors or administrators.</li>
                  <li>Automatically through technical logs, cookies and similar technologies when you access the Portal.</li>
                  <li>From payment or communication records where you provide information through direct payment or support channels.</li>
                  <li>From third-party services used to deliver classes, recordings, communications, hosting or other Services.</li>
                </ul>
              </div>
            </section>

            {/* 4. Purposes of Processing */}
            <section className="space-y-sm">
              <h2 className="text-headline-md text-on-surface flex items-center gap-xs">
                <span className="material-symbols-outlined text-primary">analytics</span>
                4. Purposes of Processing
              </h2>
              <div className="pl-7 space-y-xs text-on-surface-variant leading-relaxed">
                <p>We may process personal data for purposes including:</p>
                <ul className="list-disc pl-5 space-y-xs">
                  <li>Creating and administering student accounts.</li>
                  <li>Confirming enrolment and assigning students to courses, batches and instructors.</li>
                  <li>Delivering classes, course materials, recordings and educational services.</li>
                  <li>Recording attendance, participation and course progress.</li>
                  <li>Administering assignments, tests, assessments and feedback.</li>
                  <li>Providing academic support and maintaining educational records.</li>
                  <li>Managing community participation and communications.</li>
                  <li>Managing fees, payment status, invoices/receipts where applicable and financial administration.</li>
                  <li>Authenticating users and protecting accounts and the Portal against fraud, misuse and security threats.</li>
                  <li>Maintaining logs, troubleshooting technical problems and improving platform reliability.</li>
                  <li>Responding to support requests, complaints and grievances.</li>
                  <li>Complying with applicable legal, regulatory, tax, accounting or lawful-authority requirements.</li>
                  <li>Establishing, exercising or defending legal claims where reasonably necessary.</li>
                  <li>Operating and improving the Services, subject to applicable law.</li>
                  <li>Carrying out promotional or marketing activities only where the applicable lawful basis and separate promotional/media authorisation or other permission is in place.</li>
                </ul>
              </div>
            </section>

            {/* 5. Legal Basis and Consent */}
            <section className="space-y-sm">
              <h2 className="text-headline-md text-on-surface flex items-center gap-xs">
                <span className="material-symbols-outlined text-primary">fact_check</span>
                5. Legal Basis and Consent
              </h2>
              <div className="pl-7 space-y-xs text-on-surface-variant leading-relaxed">
                <p>
                  Fledge Academy will process personal data in accordance with applicable Indian data-protection law. Depending on the activity, processing may be based on consent, the provision or administration of the requested Services, compliance with law, security or other lawful grounds recognised by applicable law.
                </p>
                <p>
                  Where consent is the basis for processing, Fledge Academy will seek consent in a clear manner appropriate to the relevant purpose. A person may withdraw consent where applicable by contacting Fledge Academy through the designated channel. Withdrawal does not affect processing that was lawfully carried out before withdrawal, and processing may continue where another lawful basis applies.
                </p>
              </div>
            </section>

            {/* 6. Class Recordings */}
            <section className="space-y-sm">
              <h2 className="text-headline-md text-on-surface flex items-center gap-xs">
                <span className="material-symbols-outlined text-primary">videocam</span>
                6. Class Recordings
              </h2>
              <div className="pl-7 space-y-xs text-on-surface-variant leading-relaxed">
                <p>
                  Live classes may be recorded for educational and course-administration purposes. Recordings may be stored on third-party cloud, video or storage services selected by Fledge Academy and may be made available to authorised members of the relevant course or batch.
                </p>
                <p>
                  Recording retention is generally intended to continue until completion of the applicable course, subject to operational, legal, security, backup and dispute-related requirements.
                </p>
                <p>
                  If you participate in a recorded class, your audio contribution and other visible participation information may be captured. If you enable your camera in a recorded class, your image may also be captured.
                </p>
              </div>
            </section>

            {/* 7. Promotional and Marketing Use */}
            <section className="space-y-sm">
              <h2 className="text-headline-md text-on-surface flex items-center gap-xs">
                <span className="material-symbols-outlined text-primary">campaign</span>
                7. Promotional and Marketing Use
              </h2>
              <div className="pl-7 space-y-xs text-on-surface-variant leading-relaxed">
                <p>
                  Fledge Academy may separately request express promotional/media authorisation to use specified student-related material for marketing or promotional purposes. Depending on the authorisation provided, this may include image, voice, name, testimonials, comments, academic achievements/results, submitted work or other specified material.
                </p>
                <p>
                  A student may withdraw promotional/media consent by emailing <a href="mailto:fledgeacademy@gmail.com" className="text-primary hover:underline">fledgeacademy@gmail.com</a>. After a valid withdrawal is processed, Fledge Academy will take reasonable steps not to intentionally feature that student’s identifiable image or audio in new promotional materials. Educational access will not be withdrawn solely because promotional/media consent has been withdrawn.
                </p>
                <p>
                  Because group classes contain multiple participants, previously created recordings or promotional materials may include more than one person. Fledge Academy cannot guarantee removal from third-party copies, reposts, caches, printed materials or content already outside its reasonable control.
                </p>
              </div>
            </section>

            {/* 8. Sharing and Disclosure of Personal Data */}
            <section className="space-y-sm">
              <h2 className="text-headline-md text-on-surface flex items-center gap-xs">
                <span className="material-symbols-outlined text-primary">share</span>
                8. Sharing and Disclosure of Personal Data
              </h2>
              <div className="pl-7 space-y-xs text-on-surface-variant leading-relaxed">
                <p>
                  Fledge Academy may disclose or provide access to personal data where reasonably necessary for the purposes described in this Policy, including to:
                </p>
                <ul className="list-disc pl-5 space-y-xs">
                  <li>Instructors and authorised staff who need information to deliver or administer the course.</li>
                  <li>Service providers that support hosting, cloud storage, email, messaging, video conferencing, analytics, security, technical operations or other Services.</li>
                  <li>Third-party meeting or video services such as Google Meet, Zoom or Microsoft Teams when used for classes.</li>
                  <li>Payment service providers if a payment gateway is introduced.</li>
                  <li>Professional advisers or service providers where reasonably necessary for legal, accounting, compliance or dispute-related purposes.</li>
                  <li>Government, law-enforcement, regulatory or judicial authorities where disclosure is required or permitted by law.</li>
                  <li>Other parties where you have provided the required permission or where disclosure is otherwise lawful.</li>
                </ul>
                <p className="pt-2">
                  Fledge Academy does not sell personal data as a business asset. We will not disclose personal data for purposes incompatible with this Policy except where permitted or required by applicable law.
                </p>
              </div>
            </section>

            {/* 9. Third-Party Providers and Cloud Storage */}
            <section className="space-y-sm">
              <h2 className="text-headline-md text-on-surface flex items-center gap-xs">
                <span className="material-symbols-outlined text-primary">cloud_sync</span>
                9. Third-Party Providers and Cloud Storage
              </h2>
              <div className="pl-7 space-y-xs text-on-surface-variant leading-relaxed">
                <p>
                  Fledge Academy may store or process data using third-party infrastructure, including cloud storage, email, hosting, video and communication providers. Examples may include Google Drive, Google Meet, Zoom, Microsoft Teams, Cloudflare and other providers that may be introduced or changed over time.
                </p>
                <p>
                  Because providers may change, the current provider list may not be exhaustive. Fledge Academy will use reasonable measures to select and manage providers appropriate to the Services and applicable law.
                </p>
              </div>
            </section>

            {/* 10. Cookies and Similar Technologies */}
            <section className="space-y-sm">
              <h2 className="text-headline-md text-on-surface flex items-center gap-xs">
                <span className="material-symbols-outlined text-primary">cookie</span>
                10. Cookies and Similar Technologies
              </h2>
              <div className="pl-7 space-y-xs text-on-surface-variant leading-relaxed">
                <p>
                  We may use cookies, session identifiers, local storage and similar technologies to keep you signed in, remember settings, protect the Portal, measure usage and support functionality.
                </p>
                <p>
                  Fledge Academy may in the future use analytics tools, advertising pixels, conversion tracking or similar technologies, including tools associated with Google or Meta. Where such technologies are enabled, the Privacy Policy or applicable cookie/consent mechanism may be updated to explain the relevant purposes and choices.
                </p>
                <p>
                  You may be able to control cookies through your browser settings. Disabling certain cookies may affect Portal functionality.
                </p>
              </div>
            </section>

            {/* 11. Data Security */}
            <section className="space-y-sm">
              <h2 className="text-headline-md text-on-surface flex items-center gap-xs">
                <span className="material-symbols-outlined text-primary">security</span>
                11. Data Security
              </h2>
              <div className="pl-7 space-y-xs text-on-surface-variant leading-relaxed">
                <p>
                  Fledge Academy will take reasonable technical and organisational measures appropriate to the nature of the personal data and the Services to protect personal data against unauthorised access, disclosure, alteration, loss, misuse or destruction:
                </p>
                <ul className="list-disc pl-5 space-y-xs">
                  <li>Access to administrative systems is limited according to role and operational need.</li>
                  <li>Course and student information is intended to be accessible only to authorised users.</li>
                  <li>Authentication and access controls are used to protect accounts.</li>
                  <li>Third-party service providers may apply their own security controls.</li>
                  <li>Fledge Academy may maintain security and access logs for prevention, detection and investigation of misuse.</li>
                </ul>
                <p className="pt-2">
                  No online system can be guaranteed completely secure. If Fledge Academy becomes aware of a personal-data breach or security incident requiring notification under applicable law, it will take the steps required by law and appropriate remedial measures.
                </p>
              </div>
            </section>

            {/* 12. Data Retention */}
            <section className="space-y-sm">
              <h2 className="text-headline-md text-on-surface flex items-center gap-xs">
                <span className="material-symbols-outlined text-primary">auto_delete</span>
                12. Data Retention
              </h2>
              <div className="pl-7 space-y-xs text-on-surface-variant leading-relaxed">
                <p>
                  We retain personal data only for as long as reasonably necessary for the purposes for which it was collected, including course delivery, academic records, account administration, legal compliance, financial records, dispute resolution, security and legitimate operational needs:
                </p>
                <ul className="list-disc pl-5 space-y-xs">
                  <li><strong>Course recordings:</strong> generally until completion of the relevant course, subject to legal, backup, operational or security needs.</li>
                  <li><strong>Assessment and academic records:</strong> for a period reasonably necessary for course administration, verification, support and legal/administrative requirements.</li>
                  <li><strong>Account and profile data:</strong> while the account or relevant relationship is active and for a reasonable period thereafter where necessary.</li>
                  <li><strong>Fee/payment administration records:</strong> for periods required for accounting, tax, legal, dispute and reconciliation purposes.</li>
                  <li><strong>Security and access logs:</strong> for a period reasonably necessary for security, fraud prevention and investigation.</li>
                </ul>
                <p className="pt-2">
                  Retention periods may vary depending on the type of information and applicable legal requirements. When information is no longer required, Fledge Academy may delete, anonymise or securely dispose of it, subject to backups and legal requirements.
                </p>
              </div>
            </section>

            {/* 13. Your Privacy Rights and Requests */}
            <section className="space-y-sm">
              <h2 className="text-headline-md text-on-surface flex items-center gap-xs">
                <span className="material-symbols-outlined text-primary">badge</span>
                13. Your Privacy Rights and Requests
              </h2>
              <div className="pl-7 space-y-xs text-on-surface-variant leading-relaxed">
                <p>
                  Subject to applicable law, you may have rights relating to your personal data, including rights to request access to information about processing, correction or updating of inaccurate information, erasure/deletion where legally applicable, withdrawal of consent where consent is the basis for processing, and grievance redressal.
                </p>
                <p>
                  To submit a privacy request, email <a href="mailto:fledgeacademy@gmail.com" className="text-primary hover:underline">fledgeacademy@gmail.com</a> with enough information for Fledge Academy to identify the relevant account and understand the request. Fledge Academy may request reasonable verification before acting on a request to protect against unauthorised disclosure.
                </p>
                <p>
                  Some requests may be refused, limited or delayed where permitted or required by law, including where retention or processing is necessary for legal, security, accounting or other lawful purposes.
                </p>
              </div>
            </section>

            {/* 14. Grievance Redressal */}
            <section className="space-y-sm">
              <h2 className="text-headline-md text-on-surface flex items-center gap-xs">
                <span className="material-symbols-outlined text-primary">support_agent</span>
                14. Grievance Redressal
              </h2>
              <div className="pl-7 space-y-xs text-on-surface-variant leading-relaxed">
                <p>Privacy complaints and other grievances concerning the Services may be submitted to:</p>
                <ul className="list-disc pl-5 space-y-xs">
                  <li><strong>Fledge Academy</strong></li>
                  <li>Operated by: Lakshmanraju N C</li>
                  <li>Email: <a href="mailto:fledgeacademy@gmail.com" className="text-primary hover:underline">fledgeacademy@gmail.com</a></li>
                  <li>Phone: 8072702576</li>
                </ul>
                <p className="pt-2">
                  Fledge Academy will make reasonable efforts to acknowledge and resolve grievances within applicable legal requirements. If applicable law requires a designated grievance officer or additional contact details, Fledge Academy will publish or provide the required information.
                </p>
              </div>
            </section>

            {/* 15. Data Relating to Students Who Require Parent/Guardian Consent */}
            <section className="space-y-sm">
              <h2 className="text-headline-md text-on-surface flex items-center gap-xs">
                <span className="material-symbols-outlined text-primary">family_restroom</span>
                15. Data Relating to Students Who Require Parent/Guardian Consent
              </h2>
              <div className="pl-7 space-y-xs text-on-surface-variant leading-relaxed">
                <p>
                  Where applicable law requires parent or lawful-guardian consent for a student’s personal data, Fledge Academy will use an appropriate consent and verification process before activating or continuing the relevant processing. The specific process may be electronic and may require information reasonably necessary to verify the parent or lawful guardian and record consent.
                </p>
                <p>
                  Fledge Academy will apply additional safeguards required by applicable law to child data and will not use child personal data for prohibited tracking, behavioural monitoring or targeted advertising where such processing is prohibited.
                </p>
              </div>
            </section>

            {/* 16. Student-Generated Content */}
            <section className="space-y-sm">
              <h2 className="text-headline-md text-on-surface flex items-center gap-xs">
                <span className="material-symbols-outlined text-primary">assignment</span>
                16. Student-Generated Content
              </h2>
              <div className="pl-7 space-y-xs text-on-surface-variant leading-relaxed">
                <p>
                  Student submissions may be stored and accessed by authorised instructors and administrators for teaching, correction, assessment, support and administration. Public or promotional use of identifiable student submissions will be subject to applicable authorisation or another lawful basis.
                </p>
                <p>
                  Students should avoid submitting unnecessary sensitive personal information, government identification documents, passwords, payment credentials or other information that is not required for the educational purpose.
                </p>
              </div>
            </section>

            {/* 17. International or Cross-Border Processing */}
            <section className="space-y-sm">
              <h2 className="text-headline-md text-on-surface flex items-center gap-xs">
                <span className="material-symbols-outlined text-primary">public</span>
                17. International or Cross-Border Processing
              </h2>
              <div className="pl-7 space-y-xs text-on-surface-variant leading-relaxed">
                <p>
                  Some third-party service providers used by Fledge Academy may operate infrastructure or process data outside India. Where personal data is transferred, accessed or processed across borders, Fledge Academy will do so subject to applicable Indian law and any restrictions or safeguards that apply at the relevant time.
                </p>
              </div>
            </section>

            {/* 18. Changes to This Privacy Policy */}
            <section className="space-y-sm">
              <h2 className="text-headline-md text-on-surface flex items-center gap-xs">
                <span className="material-symbols-outlined text-primary">update</span>
                18. Changes to This Privacy Policy
              </h2>
              <div className="pl-7 space-y-xs text-on-surface-variant leading-relaxed">
                <p>
                  Fledge Academy may update this Privacy Policy when Services, technologies, providers, legal requirements or processing practices change. The updated version will state its effective date. Where a change materially affects your rights or requires renewed consent under applicable law, Fledge Academy will provide the relevant notice or consent mechanism.
                </p>
              </div>
            </section>

            {/* 19. Contact Information */}
            <section className="space-y-sm">
              <h2 className="text-headline-md text-on-surface flex items-center gap-xs">
                <span className="material-symbols-outlined text-primary">contact_mail</span>
                19. Contact Information
              </h2>
              <div className="pl-7 space-y-xs text-on-surface-variant leading-relaxed">
                <ul className="list-disc pl-5 space-y-xs">
                  <li><strong>Fledge Academy</strong></li>
                  <li>Operated by: Lakshmanraju N C</li>
                  <li>Email: <a href="mailto:fledgeacademy@gmail.com" className="text-primary hover:underline">fledgeacademy@gmail.com</a></li>
                  <li>Phone: 8072702576</li>
                  <li>Website: <a href="https://fledgeacademy.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">fledgeacademy.com</a></li>
                </ul>
              </div>
            </section>

            {/* 20. Updates to This Privacy Policy */}
            <section className="space-y-sm">
              <h2 className="text-headline-md text-on-surface flex items-center gap-xs">
                <span className="material-symbols-outlined text-primary">published_with_changes</span>
                20. Updates to This Privacy Policy
              </h2>
              <div className="pl-7 space-y-xs text-on-surface-variant leading-relaxed">
                <p>
                  Fledge Academy may update this Privacy Policy from time to time to reflect changes in our Services, technology, data-processing practices or applicable legal requirements. Any updated version will be published on the Fledge Academy website or Portal with the applicable effective date. Where required by applicable law, Fledge Academy will provide additional notice or obtain consent before implementing changes that require it.
                </p>
              </div>
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
