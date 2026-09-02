'use client';
import AnnouncementChat from "../../components/AnnouncementChat";

export default function StudentAnnouncements() {
    return (
        <section className="px-4 sm:px-6 md:px-8 lg:px-12 py-4 sm:py-6 max-w-[1440px] mx-auto w-full">
            <AnnouncementChat role="Student" />
        </section>
    );
}
