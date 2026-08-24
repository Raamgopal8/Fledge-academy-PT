'use client';
import AnnouncementChat from "../../components/AnnouncementChat";

export default function StudentAnnouncements() {
    return (
        <section className="p-gutter max-w-[1440px] mx-auto w-full animate-fade-in">
            <AnnouncementChat role="Student" />
        </section>
    );
}
