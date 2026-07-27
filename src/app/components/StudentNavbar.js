"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { useStudentContext } from "@/app/student/StudentContext";

export default function StudentNavbar() {
  const pathname = usePathname();
  const [unreadCount, setUnreadCount] = useState(0);
  const { isMobileNavOpen, setIsMobileNavOpen } = useStudentContext();

  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        
        const response = await fetch('http://localhost:8000/api/announcement/unread_count', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (response.ok) {
          const data = await response.json();
          setUnreadCount(data.unread_count);
        }
      } catch (error) {
        console.error("Failed to fetch unread announcements count", error);
      }
    };

    fetchUnreadCount();
    
    const interval = setInterval(fetchUnreadCount, 60000);
    return () => clearInterval(interval);
  }, []);

    const navItems = [
      { name: "Overview", icon: "dashboard", href: "/dashboard" },
      { name: "Announcements", icon: "campaign", href: "/dashboard/announcements" },
      { name: "Community", icon: "forum", href: "/community" },
      { name: "Tasks", icon: "assignment", href: "/dashboard/tasks" },
    ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileNavOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 transition-opacity"
          onClick={() => setIsMobileNavOpen(false)}
        />
      )}

      {/* SideNavBar (Desktop & Mobile Off-canvas) */}
      <aside className={`fixed left-0 top-0 h-screen w-64 flex flex-col bg-surface-container-low border-r border-outline-variant py-md z-50 transition-transform duration-300 ease-in-out ${isMobileNavOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="px-gutter mb-lg flex items-center justify-between">
          <div className="flex items-center gap-base">
            <div className="w-10 h-10 bg-primary-container rounded-lg flex items-center justify-center">
              <span
                className="material-symbols-outlined text-white"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                school
              </span>
            </div>
            <div>
              <h2 className="font-headline-md text-headline-md text-primary leading-tight">
                Fledge Academy
              </h2>
              <p className="font-body-sm text-body-sm text-outline">Learning Portal</p>
            </div>
          </div>
          {/* Close button for mobile */}
          <button 
            className="text-on-surface-variant p-2 -mr-2 hover:bg-surface-container-high rounded-full transition-colors active:scale-95"
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
                {item.name === "Announcements" && unreadCount > 0 && (
                  <span className="ml-auto bg-error text-on-error text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {unreadCount}
                  </span>
                )}
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
