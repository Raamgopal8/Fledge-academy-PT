'use client';
import { createContext, useContext, useState } from 'react';

const StudentContext = createContext();

export function StudentProvider({ children }) {
    const [searchQuery, setSearchQuery] = useState('');
    const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

    return (
        <StudentContext.Provider value={{ searchQuery, setSearchQuery, isMobileNavOpen, setIsMobileNavOpen }}>
            {children}
        </StudentContext.Provider>
    );
}

export function useStudentContext() {
    return useContext(StudentContext);
}
