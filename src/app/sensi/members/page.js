'use client';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useSensiContext } from '@/app/sensi/SensiContext';

const LEVELS = [
    { value: 'Level 5', label: 'Level 5 (Beginner)', color: 'bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/30' },
    { value: 'Level 4', label: 'Level 4 (Elementary)', color: 'bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30' },
    { value: 'Level 3', label: 'Level 3 (Intermediate)', color: 'bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 border-yellow-500/30' },
    { value: 'Level 2', label: 'Level 2 (Pre-Advanced)', color: 'bg-orange-500/15 text-orange-700 dark:text-orange-400 border-orange-500/30' },
    { value: 'Level 1', label: 'Level 1 (Advanced)', color: 'bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30' },
];

export default function StaffMembers() {
    const { 
        selectedBatch, 
        setSelectedBatch, 
        selectedLevel, 
        setSelectedLevel, 
        staffBatches, 
        sensiLevels 
    } = useSensiContext();
    const [students, setStudents] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [markingStatus, setMarkingStatus] = useState({});

    // In-page level filter and search query
    const [filterLevel, setFilterLevel] = useState(() => {
        if (selectedLevel && selectedLevel !== 'All Levels' && selectedLevel !== 'Global' && selectedLevel !== 'All') {
            return selectedLevel;
        }
        return 'All';
    });
    const [searchQuery, setSearchQuery] = useState('');

    // Sync filterLevel when selectedLevel changes in context / top nav
    useEffect(() => {
        if (selectedLevel && selectedLevel !== 'All Levels' && selectedLevel !== 'Global' && selectedLevel !== 'All') {
            setFilterLevel(selectedLevel);
        } else if (selectedLevel === 'All Levels' || selectedLevel === 'Global' || selectedLevel === 'All' || !selectedLevel) {
            setFilterLevel('All');
        }
    }, [selectedLevel]);

    const handleFilterLevelChange = (lvl) => {
        setFilterLevel(lvl);
        if (setSelectedLevel && lvl !== 'All') {
            setSelectedLevel(lvl);
        }
    };

    const fetchStudents = useCallback(async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem('token');
            const params = new URLSearchParams();
            if (filterLevel && filterLevel !== 'All' && filterLevel !== 'All Levels') {
                params.append('level', filterLevel);
            } else if (selectedLevel && selectedLevel !== 'All Levels' && selectedLevel !== 'All' && selectedLevel !== 'Global') {
                params.append('level', selectedLevel);
            }
            if (selectedBatch && selectedBatch !== 'All Assigned Batches' && selectedBatch !== 'All Batches' && selectedBatch !== 'Global' && selectedBatch !== 'Global Access') {
                params.append('batch', selectedBatch);
            }
            const queryParam = params.toString() ? `?${params.toString()}` : '';
            const res = await fetch(`${process.env.NEXT_PUBLIC_ATTENDANCE_API_URL || ''}/api/attendance/students${queryParam}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!res.ok) {
                throw new Error('Failed to fetch students');
            }

            const data = await res.json();
            setStudents(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("Error fetching students:", err);
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }, [selectedBatch, selectedLevel, filterLevel]);

    useEffect(() => {
        fetchStudents();
    }, [fetchStudents]);

    const markAttendance = async (studentId, status) => {
        setMarkingStatus(prev => ({ ...prev, [studentId]: true }));
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${process.env.NEXT_PUBLIC_ATTENDANCE_API_URL || ''}/api/attendance/mark`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ student_id: studentId, status: status })
            });

            if (!res.ok) {
                throw new Error('Failed to mark attendance');
            }

            // Update local state
            setStudents(prevStudents => 
                prevStudents.map(student => 
                    student.id === studentId ? { ...student, status: status } : student
                )
            );
        } catch (err) {
            console.error("Error marking attendance:", err);
            alert("Failed to mark attendance. Please try again.");
        } finally {
            setMarkingStatus(prev => ({ ...prev, [studentId]: false }));
        }
    };

    const getLevelBadgeClass = (lvl) => {
        if (!lvl) return 'bg-primary/10 text-primary border-primary/20';
        const clean = lvl.trim().toLowerCase();
        const match = LEVELS.find(l => 
            l.value.toLowerCase() === clean ||
            clean.startsWith(l.value.toLowerCase()) ||
            l.value.toLowerCase().startsWith(clean)
        );
        return match ? match.color : 'bg-primary/10 text-primary border-primary/20';
    };

    const filteredStudents = students.filter(student => {
        // 1. Level matching
        if (filterLevel !== 'All') {
            const sLvl = (student.level || '').trim().toLowerCase();
            const sLvls = Array.isArray(student.levels) ? student.levels.map(l => (l || '').trim().toLowerCase()) : [];
            const fLvl = filterLevel.trim().toLowerCase();
            const isGlobal = !sLvl || sLvl === 'all' || sLvl === 'all levels' || sLvl === 'global';
            
            const matchSingle = sLvl === fLvl || sLvl.startsWith(fLvl) || fLvl.startsWith(sLvl);
            const matchArray = sLvls.some(l => l === fLvl || l.startsWith(fLvl) || fLvl.startsWith(l));
            
            if (!isGlobal && !matchSingle && !matchArray) return false;
        }

        // 2. Batch matching
        if (selectedBatch && selectedBatch !== 'All Assigned Batches' && selectedBatch !== 'All Batches' && selectedBatch !== 'Global' && selectedBatch !== 'Global Access') {
            const sBatch = (student.batch || '').trim().toLowerCase();
            const sBatches = Array.isArray(student.batches) ? student.batches.map(b => (b || '').trim().toLowerCase()) : [];
            const targetBatch = selectedBatch.trim().toLowerCase();
            const isGlobalBatch = !sBatch || sBatch === 'all batches' || sBatch === 'global' || sBatch === 'all';
            
            const matchSingle = sBatch === targetBatch || sBatch.includes(targetBatch);
            const matchArray = sBatches.some(b => b === targetBatch || b.includes(targetBatch));
            
            if (!isGlobalBatch && !matchSingle && !matchArray) return false;
        }

        // 3. Search query matching
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            const nameMatch = (student.name || '').toLowerCase().includes(q);
            const emailMatch = (student.email || '').toLowerCase().includes(q);
            const levelMatch = (student.level || '').toLowerCase().includes(q);
            const batchMatch = (student.batch || '').toLowerCase().includes(q);
            return nameMatch || emailMatch || levelMatch || batchMatch;
        }

        return true;
    });

    if (isLoading) {
        return (
            <section className="p-gutter max-w-[1440px] mx-auto min-h-[50vh] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4 text-primary">
                    <span className="material-symbols-outlined text-[48px] animate-spin">progress_activity</span>
                    <p className="font-label-lg">Loading Members...</p>
                </div>
            </section>
        );
    }

    if (error) {
        return (
            <section className="p-gutter max-w-[1440px] mx-auto min-h-[50vh] flex items-center justify-center">
                <div className="p-lg bg-error-container text-on-error-container rounded-xl flex items-center gap-md">
                    <span className="material-symbols-outlined text-[32px]">error</span>
                    <div>
                        <h3 className="font-headline-md">Error Loading Data</h3>
                        <p className="font-body-md">{error}</p>
                    </div>
                </div>
            </section>
        );
    }

    return (
        <div className="max-w-[1440px] mx-auto p-4 md:px-8 lg:px-12 md:py-8 space-y-6 md:space-y-8 relative pb-32 animate-fade-in">
            {/* Header */}
            <section className="flex flex-col md:flex-row md:items-center justify-between gap-md mb-lg">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="material-symbols-outlined text-primary text-3xl">groups</span>
                        <h1 className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#6FB7E4] via-[#5D8BCC] to-[#465AA3]">
                            Members & Attendance
                        </h1>
                    </div>
                    <p className="font-body-md text-on-surface-variant max-w-2xl mt-1">
                        Mark attendance and track enrolled students for today&apos;s classes.
                    </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                    {filterLevel && filterLevel !== 'All' && (
                        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold shadow-2xs">
                            <span className="material-symbols-outlined text-[16px]">school</span>
                            <span>{filterLevel}</span>
                        </div>
                    )}
                    {selectedBatch && selectedBatch !== 'All Assigned Batches' && selectedBatch !== 'All Batches' && (
                        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold shadow-2xs">
                            <span className="material-symbols-outlined text-[16px]">groups</span>
                            <span>{selectedBatch}</span>
                        </div>
                    )}
                </div>
            </section>

            {/* Filter Controls Bar */}
            <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-4 custom-shadow flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                    
                </div>

                <div className="relative min-w-[220px]">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[16px] text-on-surface-variant">search</span>
                    <input 
                        type="text" 
                        placeholder="Search student, email, or batch..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 bg-surface-container border border-outline-variant rounded-xl text-xs text-on-surface focus:outline-none focus:border-primary"
                    />
                </div>
            </div>

            <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-3xl p-5 md:p-6 custom-shadow hover:shadow-md transition-all flex flex-col">
                <div className="overflow-x-auto custom-scrollbar border border-outline-variant/40 rounded-2xl">
                    <table className="w-full text-left min-w-[800px]">
                        <thead className="bg-surface-container-low border-b border-surface-variant">
                            <tr>
                                <th className="px-md py-4 font-label-md text-label-md text-outline">Student</th>
                                <th className="px-md py-4 font-label-md text-label-md text-outline">Email</th>
                                <th className="px-md py-4 font-label-md text-label-md text-outline">Today&apos;s Status</th>
                                <th className="px-md py-4 font-label-md text-label-md text-outline">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-surface-variant">
                            {filteredStudents.map((student) => (
                                <tr key={student.id} className="hover:bg-surface-container-low transition-colors">
                                    <td className="px-md py-4">
                                        <div className="flex items-center gap-sm">
                                            <div className="w-10 h-10 rounded-full bg-primary/20 overflow-hidden shrink-0">
                                                {student.profile_image_url ? (
                                                    <img src={student.profile_image_url} alt={student.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-primary font-bold">
                                                        {(student.name || 'S').charAt(0).toUpperCase()}
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <span className="font-label-md text-label-md text-on-surface font-bold block">{student.name}</span>
                                                <div className="flex items-center gap-1.5 mt-0.5">
                                                    {student.level && (
                                                        <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${getLevelBadgeClass(student.level)}`}>
                                                            {student.level}
                                                        </span>
                                                    )}
                                                    {student.batch && (
                                                        <span className="text-[10px] font-medium text-on-surface-variant bg-surface-container px-1.5 py-0.2 rounded border border-outline-variant/40">
                                                            {student.batch}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-md py-4 font-body-md text-body-md text-on-surface-variant">
                                        {student.email}
                                    </td>
                                    <td className="px-md py-4">
                                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-label-sm font-label-sm ${
                                            student.status === 'present' 
                                                ? 'bg-primary-container text-on-primary-container' 
                                                : student.status === 'absent' 
                                                    ? 'bg-error-container text-on-error-container' 
                                                    : 'bg-surface-variant text-on-surface-variant'
                                        }`}>
                                            <span className="material-symbols-outlined text-[16px]">
                                                {student.status === 'present' ? 'check_circle' : student.status === 'absent' ? 'cancel' : 'help'}
                                            </span>
                                            {student.status === 'present' ? 'Present' : student.status === 'absent' ? 'Absent' : 'Not Marked'}
                                        </span>
                                    </td>
                                    <td className="px-md py-4">
                                        <div className="flex items-center gap-sm">
                                            <button 
                                                onClick={() => markAttendance(student.id, 'present')}
                                                disabled={markingStatus[student.id]}
                                                className={`px-4 py-2 rounded-lg font-label-md text-label-md transition-colors ${
                                                    student.status === 'present' 
                                                        ? 'bg-primary text-on-primary' 
                                                        : 'border border-primary text-primary hover:bg-primary-container disabled:opacity-50'
                                                }`}
                                            >
                                                Present
                                            </button>
                                            <button 
                                                onClick={() => markAttendance(student.id, 'absent')}
                                                disabled={markingStatus[student.id]}
                                                className={`px-4 py-2 rounded-lg font-label-md text-label-md transition-colors ${
                                                    student.status === 'absent' 
                                                        ? 'bg-error text-on-error' 
                                                        : 'border border-error text-error hover:bg-error-container disabled:opacity-50'
                                                }`}
                                            >
                                                Absent
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredStudents.length === 0 && (
                                <tr>
                                    <td colSpan="4" className="px-md py-8 text-center font-body-md text-on-surface-variant">
                                        <span className="material-symbols-outlined text-[32px] opacity-40 block mb-1">school</span>
                                        <p className="font-semibold text-sm">No students found</p>
                                        <p className="text-xs opacity-75 mt-0.5">
                                            {filterLevel !== 'All' ? `No students found under ${filterLevel}${selectedBatch ? ` (${selectedBatch})` : ''}` : 'No students found.'}
                                        </p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
