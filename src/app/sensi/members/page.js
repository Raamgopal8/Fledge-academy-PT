'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSensiContext } from '@/app/sensi/SensiContext';

export default function StaffMembers() {
    const { selectedBatch, selectedLevel } = useSensiContext();
    const [students, setStudents] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [markingStatus, setMarkingStatus] = useState({});

    const fetchStudents = async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem('token');
            const params = new URLSearchParams();
            if (selectedLevel && selectedLevel !== 'All Levels' && selectedLevel !== 'All' && selectedLevel !== 'Global') {
                params.append('level', selectedLevel);
            }
            if (selectedBatch && selectedBatch !== 'All Assigned Batches' && selectedBatch !== 'All Batches' && selectedBatch !== 'Global') {
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
            setStudents(data);
        } catch (err) {
            console.error("Error fetching students:", err);
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchStudents();
    }, [selectedBatch, selectedLevel]);

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

    const filteredStudents = students.filter(student => {
        // 1. Level filter first (applies to all levels)
        const overrideLevel = (selectedLevel && selectedLevel !== 'All Levels' && selectedLevel !== 'All' && selectedLevel !== 'Global')
            ? selectedLevel.trim().toLowerCase()
            : '';
        const matchesLevel = overrideLevel
            ? (student.level || '').trim().toLowerCase() === overrideLevel
            : true;

        // 2. Batch filter second
        const overrideBatch = (selectedBatch && selectedBatch !== 'All Assigned Batches' && selectedBatch !== 'All Batches' && selectedBatch !== 'Global')
            ? selectedBatch.trim().toLowerCase()
            : '';
        const matchesBatch = overrideBatch
            ? (student.batch || '').trim().toLowerCase() === overrideBatch
            : true;

        return matchesLevel && matchesBatch;
    });

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
                        Mark attendance and track enrolled students for today's classes.
                    </p>
                </div>
            </section>

            <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-3xl p-5 md:p-6 custom-shadow hover:shadow-md transition-all flex flex-col">
                <div className="overflow-x-auto custom-scrollbar border border-outline-variant/40 rounded-2xl">
                    <table className="w-full text-left min-w-[800px]">
                        <thead className="bg-surface-container-low border-b border-surface-variant">
                            <tr>
                                <th className="px-md py-4 font-label-md text-label-md text-outline">Student</th>
                                <th className="px-md py-4 font-label-md text-label-md text-outline">Email</th>
                                <th className="px-md py-4 font-label-md text-label-md text-outline">Today's Status</th>
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
                                                        {student.name.charAt(0).toUpperCase()}
                                                    </div>
                                                )}
                                            </div>
                                            <span className="font-label-md text-label-md text-on-surface font-bold">{student.name}</span>
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
                                            {selectedLevel ? `No students found under ${selectedLevel}${selectedBatch ? ` (${selectedBatch})` : ''}` : 'No students found.'}
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
