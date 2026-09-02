'use client';
import React from 'react';
import Link from 'next/link';

export default function StudentFooter() {
    return (
        <footer className="mt-auto bg-surface-container-highest/80 dark:bg-slate-900/80 py-5 border-t border-outline-variant/60 w-full backdrop-blur-sm">
            <div className="flex flex-col sm:flex-row justify-between items-center px-4 sm:px-8 max-w-7xl mx-auto gap-4 text-center sm:text-left">
                <div className="flex flex-col items-center sm:items-start">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-on-surface">Fledge Academy</span>
                        <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.2 rounded-md bg-primary/10 text-primary border border-primary/20">
                            Student Portal
                        </span>
                    </div>
                    <p className="text-xs text-on-surface-variant mt-0.5">
                        © 2026 Fledge Academy. All rights reserved.
                    </p>
                </div>

                <div className="flex flex-wrap justify-center items-center gap-4 sm:gap-6 text-xs text-on-surface-variant font-medium">
                    <Link className="hover:text-primary transition-colors" href="/privacy">
                        Privacy Policy
                    </Link>
                    <span className="text-outline/40 hidden sm:inline">•</span>
                    <Link className="hover:text-primary transition-colors" href="/terms">
                        Terms of Service
                    </Link>
                    <span className="text-outline/40 hidden sm:inline">•</span>
                    <Link className="hover:text-primary transition-colors" href="/contact">
                        Contact Support
                    </Link>
                </div>
            </div>
        </footer>
    );
}
