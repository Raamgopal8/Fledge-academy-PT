'use client';
import { createContext, useContext, useState } from 'react';

const StaffContext = createContext();

export function StaffProvider({ children }) {
    const [searchQuery, setSearchQuery] = useState('');
    const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

    return (
        <StaffContext.Provider value={{ searchQuery, setSearchQuery, isMobileNavOpen, setIsMobileNavOpen }}>
            {children}
        </StaffContext.Provider>
    );
}

export function useStaffContext() {
    return useContext(StaffContext);
}
