"use client";
import { useStudentContext } from "@/app/student/StudentContext";

export default function MainContentWrapper({ children }) {
  const { isMobileNavOpen } = useStudentContext();

  return (
    <main className="flex-grow min-h-screen flex flex-col w-full max-w-full overflow-x-hidden">
      {children}
    </main>
  );
}
