"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { useStudentContext } from "@/app/student/StudentContext";

export default function StudentNavbar() {
  const pathname = usePathname();
  const { isMobileNavOpen, setIsMobileNavOpen } = useStudentContext();

    const navItems = [
      { name: "Overview", icon: "dashboard", href: "/dashboard" },
      { name: "Pathway", icon: "route", href: "/dashboard/pathway" },
      { name: "Announcements", icon: "campaign", href: "/dashboard/announcements" },
      { name: "Community", icon: "forum", href: "/community" },
      { name: "Classmates", icon: "group", href: "/dashboard/classmates" },
      { name: "Tasks", icon: "assignment", href: "/dashboard/tasks" },
      { name: "Schedule", icon: "calendar_today", href: "/dashboard/schedule" },
      { name: "Materials", icon: "library_books", href: "/dashboard/materials" },
      { name: "Videos", icon: "smart_display", href: "/dashboard/videos" }
    ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileNavOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 transition-opacity md:hidden"
          onClick={() => setIsMobileNavOpen(false)}
        />
      )}

      {/* SideNavBar (Desktop & Mobile Off-canvas) */}
      <aside className={`fixed left-0 top-0 h-screen w-64 flex flex-col bg-surface-container-low border-r border-outline-variant py-md z-50 transition-transform duration-300 ease-in-out ${isMobileNavOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="px-gutter mb-lg flex items-center justify-between">
          <div className="flex items-center">
            <img src="/fledgeacad.png" alt="Fledge Academy Logo" className="w-40 h-auto object-contain drop-shadow-sm" />
          </div>
          {/* Close button for mobile */}
          <button 
            className="text-on-surface-variant p-2 -mr-2 hover:bg-surface-container-high rounded-full transition-colors active:scale-95 md:hidden"
            onClick={() => setIsMobileNavOpen(false)}
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <nav className="flex-1 flex flex-col gap-xs">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setIsMobileNavOpen(false)}
                className={`flex items-center gap-md px-md py-sm rounded-lg mx-2 transition-transform active:scale-[0.98] ${
                  isActive
                    ? "bg-secondary-container text-on-secondary-container"
                    : "text-on-surface-variant hover:bg-surface-container-high"
                }`}
              >
                <span
                  className="material-symbols-outlined"
                  style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}
                >
                  {item.icon}
                </span>
                <span className="font-label-md text-label-md">{item.name}</span>
              </Link>
            );
          })}
        </nav>
        <div className="px-md mt-auto pt-md border-t border-outline-variant flex flex-col gap-xs">
          <Link
            href="/"
            onClick={() => setIsMobileNavOpen(false)}
            className="flex items-center gap-md px-md py-sm text-on-surface-variant hover:text-error transition-colors active:scale-[0.98]"
          >
            <span className="material-symbols-outlined">logout</span>
            <span className="font-label-md text-label-md">Logout</span>
          </Link>
        </div>
      </aside>
    </>
  );
}
