'use client';
import AnnouncementChat from "../../components/AnnouncementChat";

export default function StudentAnnouncements() {
    return (
        <section className="max-w-[1440px] mx-auto p-4 md:px-8 lg:px-12 md:py-3 relative animate-fade-in h-[calc(100dvh-6.5rem)] flex flex-col min-h-0">
            <AnnouncementChat role="Student" />
        </section>
    );
}
