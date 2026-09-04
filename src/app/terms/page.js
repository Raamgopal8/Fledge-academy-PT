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
              <h1 className="text-headline-lg text-on-surface">Terms & Conditions</h1>
              <p className="text-body-sm text-on-surface-variant">Last Updated: July 15, 2026</p>
            </div>
          </div>

          <div className="space-y-4 text-body-md text-on-surface-variant mb-lg leading-relaxed">
            <p>
              These Terms &amp; Conditions (&ldquo;Terms&rdquo;) govern access to and use of the Fledge Academy website, Fledge Academy Portal, online classes, course materials, recordings, assessments, community features, communications and related educational services (collectively, the &ldquo;Services&rdquo;).
            </p>
            <p>
              By enrolling in a course, accepting these Terms, creating or using an account, or otherwise accessing the Services, you agree to be bound by these Terms. If you do not agree, you must not access or use the Services.
            </p>
            <p>
              Fledge Academy may update these Terms from time to time. Material changes will be communicated through the Portal, website, email or another reasonable method. The updated version will apply from the stated effective date, subject to applicable law.
            </p>
          </div>

          <div className="space-y-lg">
            {/* 1. About Fledge Academy */}
            <section className="space-y-sm">
              <h2 className="text-headline-md text-on-surface flex items-center gap-xs">
                <span className="material-symbols-outlined text-primary">info</span>
                1. About Fledge Academy
              </h2>
              <div className="pl-7 space-y-xs text-on-surface-variant leading-relaxed">
                <p>
                  Fledge Academy is an educational service operated under the name &ldquo;Fledge Academy&rdquo; by Lakshmanraju N C. Fledge Academy currently provides its Services in India.
                </p>
                <p>
                  The Fledge Academy Portal is a browser-based platform that may also be installed or used as a Progressive Web App (PWA). Access may depend on a compatible browser, device, internet connection and supporting third-party services.
                </p>
              </div>
            </section>

            {/* 2. Eligibility and Account Registration */}
            <section className="space-y-sm">
              <h2 className="text-headline-md text-on-surface flex items-center gap-xs">
                <span className="material-symbols-outlined text-primary">how_to_reg</span>
                2. Eligibility and Account Registration
              </h2>
              <div className="pl-7 space-y-xs text-on-surface-variant leading-relaxed">
                <p>
                  You must provide accurate, current and complete information when registering or enrolling. You are responsible for keeping your account information up to date.
                </p>
                <p>
                  Fledge Academy may require additional verification or information where reasonably necessary to provide the Services, comply with law, protect users, prevent fraud or maintain account security.
                </p>
                <p>
                  Where an enrolment requires a parent or lawful guardian consent process under applicable law, access may remain restricted until the required consent and verification have been completed.
                </p>
              </div>
            </section>

            {/* 3. Account Security and Personal Use */}
            <section className="space-y-sm">
              <h2 className="text-headline-md text-on-surface flex items-center gap-xs">
                <span className="material-symbols-outlined text-primary">security</span>
                3. Account Security and Personal Use
              </h2>
              <div className="pl-7 space-y-xs text-on-surface-variant leading-relaxed">
                <ul className="list-disc pl-5 space-y-xs">
                  <li>Your account and login credentials are personal to you and may not be shared, transferred, sold, lent or made available to another person.</li>
                  <li>You must keep your password and other authentication information confidential and must promptly notify Fledge Academy if you suspect unauthorised access.</li>
                  <li>You must not permit another person to attend classes or use the Portal through your account unless Fledge Academy has expressly authorised it.</li>
                  <li>Fledge Academy may suspend or restrict an account where it reasonably believes that account credentials have been shared, misused, compromised or used in breach of these Terms.</li>
                </ul>
              </div>
            </section>

            {/* 4. Courses, Classes and Educational Services */}
            <section className="space-y-sm">
              <h2 className="text-headline-md text-on-surface flex items-center gap-xs">
                <span className="material-symbols-outlined text-primary">school</span>
                4. Courses, Classes and Educational Services
              </h2>
              <div className="pl-7 space-y-xs text-on-surface-variant leading-relaxed">
                <p>
                  Course content, schedules, instructors, batches, class timings, delivery methods, assessments and related features may vary by course and may be reasonably changed when necessary for academic, operational, technical or other legitimate reasons.
                </p>
                <p>
                  Live classes may be delivered through Fledge Academy’s Portal and/or third-party meeting services such as Google Meet, Zoom or Microsoft Teams. Your use of a third-party meeting service may also be subject to that provider’s terms and privacy practices.
                </p>
                <p>
                  Fledge Academy does not guarantee uninterrupted availability of every class, recording, feature or third-party service. Reasonable efforts will be made to restore or provide affected Services where practicable.
                </p>
              </div>
            </section>

            {/* 5. Educational Nature; No Guaranteed Outcome */}
            <section className="space-y-sm">
              <h2 className="text-headline-md text-on-surface flex items-center gap-xs">
                <span className="material-symbols-outlined text-primary">verified</span>
                5. Educational Nature; No Guaranteed Outcome
              </h2>
              <div className="pl-7 space-y-xs text-on-surface-variant leading-relaxed">
                <p>
                  Fledge Academy provides educational and training services. Course participation, completion, assessments, feedback, certificates (where applicable), examples, strategies or other educational information do not constitute a guarantee of employment, income, business results, examination results, trading profits, investment returns or any other particular outcome.
                </p>
                <p>
                  Where courses discuss trading, investing, finance, business, marketing or similar subjects, educational information should not be treated as personalised financial, investment, legal, tax or professional advice unless expressly stated otherwise.
                </p>
              </div>
            </section>

            {/* 6. Fees, Payments and Enrolment */}
            <section className="space-y-sm">
              <h2 className="text-headline-md text-on-surface flex items-center gap-xs">
                <span className="material-symbols-outlined text-primary">payments</span>
                6. Fees, Payments and Enrolment
              </h2>
              <div className="pl-7 space-y-xs text-on-surface-variant leading-relaxed">
                <p>
                  Course fees, payment schedules and applicable charges will be communicated to the student before or at the time of enrolment. At present, payments may be made through direct methods such as UPI or bank transfer as instructed by Fledge Academy. Fledge Academy may introduce a third-party payment gateway in the future.
                </p>
                <p>
                  Fledge Academy may manually record fee status and payment-related administrative information in its systems. Students must not provide payment credentials to Fledge Academy unless specifically required by a legitimate payment provider’s secure process.
                </p>
                <p>
                  Enrolment is confirmed only when Fledge Academy has accepted the enrolment and the applicable payment requirements have been satisfied.
                </p>
              </div>
            </section>

            {/* 7. Refunds and Cancellation */}
            <section className="space-y-sm">
              <h2 className="text-headline-md text-on-surface flex items-center gap-xs">
                <span className="material-symbols-outlined text-primary">currency_exchange</span>
                7. Refunds and Cancellation
              </h2>
              <div className="pl-7 space-y-xs text-on-surface-variant leading-relaxed">
                <p>
                  Unless otherwise expressly stated for a particular course or required by applicable law, course fees are non-refundable after enrolment or commencement of access.
                </p>
                <p>
                  A refund or payment correction may be considered where, for example, a payment was made more than once for the same enrolment, a payment was made in error, or Fledge Academy cancels a course and cannot provide an agreed alternative. Any refund will be handled according to the circumstances and applicable law.
                </p>
                <p>
                  Nothing in this clause is intended to exclude or restrict any consumer right or remedy that cannot lawfully be excluded.
                </p>
              </div>
            </section>

            {/* 8. Course Materials and Intellectual Property */}
            <section className="space-y-sm">
              <h2 className="text-headline-md text-on-surface flex items-center gap-xs">
                <span className="material-symbols-outlined text-primary">copyright</span>
                8. Course Materials and Intellectual Property
              </h2>
              <div className="pl-7 space-y-xs text-on-surface-variant leading-relaxed">
                <p>
                  All Fledge Academy materials made available through the Services—including course PDFs, notes, slides, videos, recordings, assessments, question sets, graphics, text, templates, worksheets, software elements, Portal content, branding and other original materials—are owned by Fledge Academy or used under appropriate rights, licences or permissions, unless stated otherwise.
                </p>
                <p>
                  Copyright law in India protects, among other categories, original literary and artistic works, cinematograph films and sound recordings, and provides rights concerning reproduction and communication to the public. Fledge Academy reserves all rights not expressly granted to you.
                </p>
                <ul className="list-disc pl-5 space-y-xs">
                  <li>You receive a limited, personal, non-exclusive, non-transferable and revocable right to access course materials solely for your own educational use during the permitted course period.</li>
                  <li>You must not copy, reproduce, redistribute, sell, publish, upload, forward, transmit, sublicense, commercially exploit or make Fledge Academy materials available to another person.</li>
                  <li>You must not upload Fledge Academy course materials to public websites, social-media platforms, file-sharing services, messaging groups, repositories or other external locations.</li>
                  <li>You must not remove copyright notices, watermarks, attribution, access controls or other rights-management information.</li>
                  <li>You must not use Fledge Academy materials to create, operate or promote a competing course, training programme, repository or substantially similar commercial service.</li>
                </ul>
              </div>
            </section>

            {/* 9. Recordings and Class Media */}
            <section className="space-y-sm">
              <h2 className="text-headline-md text-on-surface flex items-center gap-xs">
                <span className="material-symbols-outlined text-primary">videocam</span>
                9. Recordings and Class Media
              </h2>
              <div className="pl-7 space-y-xs text-on-surface-variant leading-relaxed">
                <p>
                  Live classes may be recorded for educational, administrative, quality, safety, review and course-access purposes. Depending on how a class is conducted, a recording may capture the instructor, presentations, screen content, participant names or account identifiers, voice/audio contributions, and a participant’s image where the participant has enabled or displayed a camera.
                </p>
                <p>
                  By participating in a recorded session, you acknowledge that your contributions may form part of the recording. Camera participation may be optional where the applicable class arrangement permits it; however, audio contributions, names or other visible participation information may still be captured by the meeting or recording system.
                </p>
                <p>
                  Course recordings may be made available only to authorised students or other authorised persons associated with the relevant course or batch and may be retained for the applicable course period or as otherwise described in the Privacy Policy.
                </p>
                <p>
                  Students must not record, screen-capture, download, extract, copy, retransmit, mirror, share or otherwise redistribute Fledge Academy classes or recordings except where Fledge Academy has expressly authorised the specific activity.
                </p>
              </div>
            </section>

            {/* 10. Promotional and Marketing Media */}
            <section className="space-y-sm">
              <h2 className="text-headline-md text-on-surface flex items-center gap-xs">
                <span className="material-symbols-outlined text-primary">campaign</span>
                10. Promotional and Marketing Media
              </h2>
              <div className="pl-7 space-y-xs text-on-surface-variant leading-relaxed">
                <p>
                  Fledge Academy may use student-related information and media for its promotional, marketing and communication activities, subject to applicable law. This may include the student's name, photograph, age, voice, testimonials, comments, achievements, academic results, course participation, submitted material and other information or media that the student provides or that is generated through participation in Fledge Academy activities, where such use is permitted. Such material may be used on the Fledge Academy website, Portal, social media platforms such as Instagram, Facebook, YouTube and WhatsApp, advertisements including Meta Ads and Google Ads, promotional videos, brochures, presentations and other current or future promotional channels. Where a class or activity is recorded, a student's image or voice may also appear incidentally in group-session recordings when the student participates with their camera or microphone enabled.
                </p>
                <p>
                  A student may withdraw consent for future promotional and marketing use by sending a request from the student's registered email address to fledgeacademy@gmail.com. Withdrawal will be treated prospectively from the time Fledge Academy processes the request. After a valid withdrawal has been processed, Fledge Academy will take reasonable steps not to intentionally feature the student's identifiable image, voice or other identifiable promotional material in new promotional content. Withdrawal will not terminate the student's course enrolment or educational access.
                </p>
                <p>
                  Because classes may be group sessions, recordings can contain multiple participants. Promotional material or recordings may already have been published, distributed, reposted, cached, printed, embedded, incorporated into other materials or otherwise placed beyond Fledge Academy's reasonable control before withdrawal. Fledge Academy does not guarantee removal of every existing copy or third-party use, but will take reasonable steps within its control in accordance with applicable law.
                </p>
              </div>
            </section>

            {/* 11. Student Submissions and Educational Work */}
            <section className="space-y-sm">
              <h2 className="text-headline-md text-on-surface flex items-center gap-xs">
                <span className="material-symbols-outlined text-primary">assignment</span>
                11. Student Submissions and Educational Work
              </h2>
              <div className="pl-7 space-y-xs text-on-surface-variant leading-relaxed">
                <p>
                  Students may submit notes, assignments, test answers, projects, voice messages, images, documents and other content (&ldquo;Student Content&rdquo;) through the Services.
                </p>
                <p>
                  You retain rights you lawfully hold in your Student Content. By submitting Student Content, you grant Fledge Academy a limited, non-exclusive permission to store, access, review, reproduce and use that content as reasonably necessary to provide, administer, assess, correct, improve and document the educational Services.
                </p>
                <p>
                  Fledge Academy may use Student Content for internal educational or administrative purposes, including instructor review, correction, feedback, assessment records and course administration. Public or promotional use of identifiable Student Content will be subject to the applicable promotional/media authorisation or another lawful basis.
                </p>
              </div>
            </section>

            {/* 12. Community and Communications */}
            <section className="space-y-sm">
              <h2 className="text-headline-md text-on-surface flex items-center gap-xs">
                <span className="material-symbols-outlined text-primary">forum</span>
                12. Community and Communications
              </h2>
              <div className="pl-7 space-y-xs text-on-surface-variant leading-relaxed">
                <p>
                  The Portal may include a shared community area in which students and instructors can communicate through text, voice messages, images, files and links. Students may not create unauthorised groups or use the community to bypass Fledge Academy’s communication controls.
                </p>
                <ul className="list-disc pl-5 space-y-xs">
                  <li>Do not harass, threaten, abuse, intimidate, impersonate or unlawfully target another participant.</li>
                  <li>Do not post unlawful, defamatory, hateful, sexually explicit, threatening, deceptive or materially harmful content.</li>
                  <li>Do not publish another person’s private or confidential information without permission.</li>
                  <li>Do not spam, advertise unrelated products or services, solicit payments, distribute malware or post fraudulent links.</li>
                  <li>Do not use the community to share Fledge Academy recordings, PDFs, tests, course content or other restricted materials outside authorised educational use.</li>
                  <li>Do not interfere with instructors, assessments or other students’ learning experience.</li>
                </ul>
                <p>
                  Fledge Academy may review, moderate, remove or restrict community content where reasonably necessary to maintain safety, academic integrity, compliance, platform security or a functional learning environment.
                </p>
              </div>
            </section>

            {/* 13. Academic Integrity */}
            <section className="space-y-sm">
              <h2 className="text-headline-md text-on-surface flex items-center gap-xs">
                <span className="material-symbols-outlined text-primary">psychology</span>
                13. Academic Integrity
              </h2>
              <div className="pl-7 space-y-xs text-on-surface-variant leading-relaxed">
                <ul className="list-disc pl-5 space-y-xs">
                  <li>Students must complete assessments and tests honestly and in accordance with the applicable instructions.</li>
                  <li>Students must not impersonate another student, submit another person’s work as their own, obtain unauthorised assistance, manipulate assessment systems or distribute assessment answers.</li>
                  <li>Fledge Academy may review suspicious activity and may withhold, invalidate or require repetition of an assessment where academic integrity is reasonably in question.</li>
                </ul>
              </div>
            </section>

            {/* 14. Prohibited Activities and Platform Security */}
            <section className="space-y-sm">
              <h2 className="text-headline-md text-on-surface flex items-center gap-xs">
                <span className="material-symbols-outlined text-primary">gpp_bad</span>
                14. Prohibited Activities and Platform Security
              </h2>
              <div className="pl-7 space-y-xs text-on-surface-variant leading-relaxed">
                <ul className="list-disc pl-5 space-y-xs">
                  <li>Attempting to gain unauthorised access to the Portal, another user’s account, databases, systems or restricted content.</li>
                  <li>Scanning, probing, reverse engineering, circumventing security controls or attempting to identify vulnerabilities for misuse.</li>
                  <li>Introducing malware, malicious code or harmful files.</li>
                  <li>Interfering with the availability, performance or integrity of the Portal.</li>
                  <li>Using automated tools to scrape, copy or systematically extract restricted content without written permission.</li>
                  <li>Circumventing access controls, paywalls, recording restrictions or other technical protections.</li>
                  <li>Using the Services for unlawful purposes or in a manner that violates applicable law.</li>
                </ul>
              </div>
            </section>

            {/* 15. Third-Party Services */}
            <section className="space-y-sm">
              <h2 className="text-headline-md text-on-surface flex items-center gap-xs">
                <span className="material-symbols-outlined text-primary">hub</span>
                15. Third-Party Services
              </h2>
              <div className="pl-7 space-y-xs text-on-surface-variant leading-relaxed">
                <p>
                  The Services may depend on or link to third-party services, including communication, video-conferencing, email, cloud storage, hosting, analytics, advertising, authentication, messaging or payment providers. Examples may include Google services, Zoom, Microsoft Teams, Cloudflare and other providers used by Fledge Academy from time to time.
                </p>
                <p>
                  Third-party services are governed by their own terms and privacy practices. Fledge Academy does not control all third-party systems and is not responsible for their independent availability, security practices or policies, except to the extent responsibility cannot lawfully be excluded.
                </p>
              </div>
            </section>

            {/* 16. Cookies, Device Information and Tracking */}
            <section className="space-y-sm">
              <h2 className="text-headline-md text-on-surface flex items-center gap-xs">
                <span className="material-symbols-outlined text-primary">cookie</span>
                16. Cookies, Device Information and Tracking
              </h2>
              <div className="pl-7 space-y-xs text-on-surface-variant leading-relaxed">
                <p>
                  The Portal may use cookies, local storage, session technologies, device/browser information, login information and similar technologies to operate the Services, maintain sessions, improve security and understand usage. Fledge Academy may introduce analytics, advertising pixels or similar technologies in the future. The Privacy Policy describes the categories and purposes of such processing.
                </p>
                <p>
                  Where applicable law requires a separate choice or consent for a particular tracking technology or purpose, Fledge Academy will provide the relevant mechanism.
                </p>
              </div>
            </section>

            {/* 17. Platform Availability and Maintenance */}
            <section className="space-y-sm">
              <h2 className="text-headline-md text-on-surface flex items-center gap-xs">
                <span className="material-symbols-outlined text-primary">build</span>
                17. Platform Availability and Maintenance
              </h2>
              <div className="pl-7 space-y-xs text-on-surface-variant leading-relaxed">
                <p>
                  Fledge Academy may perform maintenance, updates, security changes, feature changes or temporary suspensions of the Portal. Features may be added, modified or discontinued.
                </p>
                <p>
                  Fledge Academy will make reasonable efforts to maintain the Services but does not guarantee that the Portal will always be uninterrupted, error-free, compatible with every device, or continuously available.
                </p>
              </div>
            </section>

            {/* 18. Suspension and Termination */}
            <section className="space-y-sm">
              <h2 className="text-headline-md text-on-surface flex items-center gap-xs">
                <span className="material-symbols-outlined text-primary">block</span>
                18. Suspension and Termination
              </h2>
              <div className="pl-7 space-y-xs text-on-surface-variant leading-relaxed">
                <p>
                  Fledge Academy may suspend, restrict or terminate access where reasonably necessary because of non-payment, breach of these Terms, misuse of course content, account sharing, academic misconduct, harassment, unlawful conduct, security concerns, attempted interference with the Portal, or other conduct that materially threatens the Services or users.
                </p>
                <p>
                  Where appropriate and practicable, Fledge Academy may provide an opportunity to remedy a breach. Immediate restriction may be applied where necessary to protect users, content, systems or legal interests.
                </p>
                <p>
                  Termination or suspension does not automatically remove obligations that by their nature should survive, including intellectual-property restrictions, confidentiality, payment obligations already accrued, dispute provisions and limitations of liability.
                </p>
              </div>
            </section>

            {/* 19. Privacy */}
            <section className="space-y-sm">
              <h2 className="text-headline-md text-on-surface flex items-center gap-xs">
                <span className="material-symbols-outlined text-primary">policy</span>
                19. Privacy
              </h2>
              <div className="pl-7 space-y-xs text-on-surface-variant leading-relaxed">
                <p>
                  Personal data is handled according to the Fledge Academy Privacy Policy, which forms part of these Terms. By using the Services, you acknowledge that personal data may be processed as described there, subject to applicable law and any consent or rights that apply.
                </p>
              </div>
            </section>

            {/* 20. Grievances and Contact */}
            <section className="space-y-sm">
              <h2 className="text-headline-md text-on-surface flex items-center gap-xs">
                <span className="material-symbols-outlined text-primary">contact_support</span>
                20. Grievances and Contact
              </h2>
              <div className="pl-7 space-y-xs text-on-surface-variant leading-relaxed">
                <p>
                  Questions, complaints, requests concerning your account or Services, and privacy-related requests may be submitted to:
                </p>
                <ul className="list-disc pl-5 space-y-xs">
                  <li><strong>Fledge Academy</strong></li>
                  <li>Operated by: Lakshmanraju N C</li>
                  <li>Email: <a href="mailto:fledgeacademy@gmail.com" className="text-primary hover:underline">fledgeacademy@gmail.com</a></li>
                  <li>Phone: 8072702576</li>
                  <li>Website: <a href="https://fledgeacademy.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">fledgeacademy.com</a></li>
                </ul>
                <p>
                  Fledge Academy will make reasonable efforts to acknowledge and address complaints and requests within applicable legal timelines.
                </p>
              </div>
            </section>

            {/* 21. Governing Law */}
            <section className="space-y-sm">
              <h2 className="text-headline-md text-on-surface flex items-center gap-xs">
                <span className="material-symbols-outlined text-primary">gavel</span>
                21. Governing Law
              </h2>
              <div className="pl-7 space-y-xs text-on-surface-variant leading-relaxed">
                <p>
                  These Terms are governed by and construed in accordance with the laws of India, subject to mandatory rights and remedies available under applicable law.
                </p>
                <p>
                  No exclusive court jurisdiction is specified in these Terms. Any dispute will be dealt with in accordance with applicable Indian law and the jurisdictional rules that apply to the particular dispute.
                </p>
              </div>
            </section>

            {/* 22. Consumer Rights and Non-Exclusion */}
            <section className="space-y-sm">
              <h2 className="text-headline-md text-on-surface flex items-center gap-xs">
                <span className="material-symbols-outlined text-primary">shield</span>
                22. Consumer Rights and Non-Exclusion
              </h2>
              <div className="pl-7 space-y-xs text-on-surface-variant leading-relaxed">
                <p>
                  Nothing in these Terms is intended to exclude, restrict or waive any right, remedy, warranty, protection or liability that cannot lawfully be excluded or limited under applicable Indian law, including applicable consumer-protection law.
                </p>
              </div>
            </section>

            {/* 23. Severability */}
            <section className="space-y-sm">
              <h2 className="text-headline-md text-on-surface flex items-center gap-xs">
                <span className="material-symbols-outlined text-primary">rule</span>
                23. Severability
              </h2>
              <div className="pl-7 space-y-xs text-on-surface-variant leading-relaxed">
                <p>
                  If any provision of these Terms is held invalid, unlawful or unenforceable, that provision will be modified or limited to the minimum extent necessary and the remaining provisions will continue to the extent permitted by law.
                </p>
              </div>
            </section>

            {/* 24. Entire Understanding */}
            <section className="space-y-sm">
              <h2 className="text-headline-md text-on-surface flex items-center gap-xs">
                <span className="material-symbols-outlined text-primary">handshake</span>
                24. Entire Understanding
              </h2>
              <div className="pl-7 space-y-xs text-on-surface-variant leading-relaxed">
                <p>
                  These Terms, together with the Privacy Policy and any course-specific written terms or notices expressly incorporated into them, constitute the principal terms governing your use of the Services.
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
