"use client";
import { useStudentContext } from "@/app/student/StudentContext";

export default function MainContentWrapper({ children }) {
  const { isMobileNavOpen } = useStudentContext();

  return (
    <main className={`flex-1 min-h-screen flex flex-col transition-all duration-300 ${isMobileNavOpen ? 'md:ml-64' : 'ml-0'}`}>
      {children}
    </main>
  );
}
