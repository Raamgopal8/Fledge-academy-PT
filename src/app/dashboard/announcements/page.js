'use client';
import AnnouncementChat from "../../components/AnnouncementChat";

export default function StudentAnnouncements() {
    return (
        <section className="max-w-[1440px] mx-auto p-4 md:px-8 lg:px-12 md:py-8 space-y-6 md:space-y-8 relative animate-fade-in">
            <AnnouncementChat role="Student" />
        </section>
    );
}
