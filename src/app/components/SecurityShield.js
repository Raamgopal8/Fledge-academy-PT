'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function SecurityShield() {
    const pathname = usePathname();

    useEffect(() => {
        // Exclude video pages since they have their own dedicated video player security features
        if (pathname?.includes('/videos')) {
            return;
        }

        // 1. Disable Right-Click (Context Menu)
        const handleContextMenu = (e) => {
            e.preventDefault();
            return false;
        };

        // 2. Block Inspect, View Source, DevTools, PrintScreen, and Save Shortcuts
        const handleKeyDown = (e) => {
            const key = (e.key || '').toLowerCase();
            const keyCode = e.keyCode || e.which;

            // F12 -> DevTools
            if (key === 'f12' || keyCode === 123) {
                e.preventDefault();
                e.stopPropagation();
                return false;
            }

            // Ctrl+U or Cmd+U -> View Page Source
            if ((e.ctrlKey || e.metaKey) && key === 'u') {
                e.preventDefault();
                e.stopPropagation();
                return false;
            }

            // Ctrl+Shift+I or Cmd+Option+I -> DevTools Inspect
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && key === 'i') {
                e.preventDefault();
                e.stopPropagation();
                return false;
            }

            // Ctrl+Shift+J or Cmd+Option+J -> DevTools Console
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && key === 'j') {
                e.preventDefault();
                e.stopPropagation();
                return false;
            }

            // Ctrl+Shift+C or Cmd+Option+C -> DevTools Element Inspector
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && key === 'c') {
                e.preventDefault();
                e.stopPropagation();
                return false;
            }

            // Ctrl+S or Cmd+S -> Save Webpage
            if ((e.ctrlKey || e.metaKey) && key === 's' && !e.shiftKey) {
                e.preventDefault();
                e.stopPropagation();
                return false;
            }

            // Ctrl+P or Cmd+P -> Print Webpage
            if ((e.ctrlKey || e.metaKey) && key === 'p') {
                e.preventDefault();
                e.stopPropagation();
                return false;
            }

            // PrintScreen Button
            if (key === 'printscreen' || keyCode === 44) {
                e.preventDefault();
                e.stopPropagation();
                try {
                    navigator.clipboard.writeText('Screenshots and screen capture are disabled on this portal.');
                } catch (err) {}
                return false;
            }

            // Windows Snipping Tool (Win + Shift + S) or Mac Screenshots (Cmd + Shift + 3 / 4 / 5)
            if ((e.metaKey || e.ctrlKey) && e.shiftKey && (key === 's' || key === '3' || key === '4' || key === '5')) {
                e.preventDefault();
                e.stopPropagation();
                try {
                    navigator.clipboard.writeText('Screenshots and screen capture are disabled on this portal.');
                } catch (err) {}
                return false;
            }
        };

        // 3. Clear Clipboard on PrintScreen Release
        const handleKeyUp = (e) => {
            const key = (e.key || '').toLowerCase();
            const keyCode = e.keyCode || e.which;
            if (key === 'printscreen' || keyCode === 44) {
                try {
                    navigator.clipboard.writeText('Screenshots and screen capture are disabled on this portal.');
                } catch (err) {}
            }
        };

        // 4. Prevent drag start of sensitive media / images
        const handleDragStart = (e) => {
            if (e.target?.tagName === 'IMG' || e.target?.tagName === 'VIDEO') {
                e.preventDefault();
            }
        };

        document.addEventListener('contextmenu', handleContextMenu, true);
        document.addEventListener('keydown', handleKeyDown, true);
        document.addEventListener('keyup', handleKeyUp, true);
        document.addEventListener('dragstart', handleDragStart, true);

        return () => {
            document.removeEventListener('contextmenu', handleContextMenu, true);
            document.removeEventListener('keydown', handleKeyDown, true);
            document.removeEventListener('keyup', handleKeyUp, true);
            document.removeEventListener('dragstart', handleDragStart, true);
        };
    }, [pathname]);

    return null;
}
