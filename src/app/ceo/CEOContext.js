'use client';
import { createContext, useContext, useState } from 'react';

const CEOContext = createContext();

export function CEOProvider({ children }) {
    const [searchQuery, setSearchQuery] = useState('');
    const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

    return (
        <CEOContext.Provider value={{ searchQuery, setSearchQuery, isMobileNavOpen, setIsMobileNavOpen }}>
            {children}
        </CEOContext.Provider>
    );
}

export function useCEOContext() {
    return useContext(CEOContext);
}
