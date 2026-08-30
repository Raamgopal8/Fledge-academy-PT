'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useStaffContext } from '@/app/staff/StaffContext';

export default function StaffMembers() {
    const { selectedBatch } = useStaffContext();
    const [students, setStudents] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [markingStatus, setMarkingStatus] = useState({});

    const fetchStudents = async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem('token');
            const batchParam = (selectedBatch && selectedBatch !== 'All Assigned Batches' && selectedBatch !== 'All Batches') 
                ? `?batch=${encodeURIComponent(selectedBatch)}` 
                : '';
            const res = await fetch(`${process.env.NEXT_PUBLIC_ATTENDANCE_API_URL || ''}/api/attendance/students${batchParam}`, {
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
    }, [selectedBatch]);

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

    return (
        <div className="max-w-[1440px] mx-auto p-gutter space-y-lg relative pb-32 animate-fade-in w-full max-w-full overflow-x-hidden">
            {/* Header */}
            <section className="flex flex-col md:flex-row md:items-center justify-between gap-md mb-lg">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="material-symbols-outlined text-primary text-3xl">how_to_reg</span>
                        <h1 className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#6FB7E4] via-[#5D8BCC] to-[#465AA3]">
                            Members & Attendance
                        </h1>
                    </div>
                    <p className="font-body-md text-on-surface-variant max-w-2xl">
                        Mark attendance for students for today's classes and manage enrollments.
                    </p>
                </div>
            </section>

            <div className="bg-surface-container-lowest rounded-3xl custom-shadow overflow-hidden border border-outline-variant/60 p-5 md:p-6 flex flex-col">
                <div className="overflow-x-auto custom-scrollbar w-full border border-outline-variant/40 rounded-2xl">
                    <table className="w-full text-left min-w-[580px]">
                        <thead className="bg-surface-container-low border-b border-outline-variant/60">
                            <tr>
                                <th className="px-4 py-3 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Student</th>
                                <th className="px-4 py-3 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Email</th>
                                <th className="px-4 py-3 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Today's Status</th>
                                <th className="px-4 py-3 text-xs font-bold text-on-surface-variant uppercase tracking-wider text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-outline-variant/30">
                            {students.map((student) => (
                                <tr key={student.id} className="hover:bg-surface-container-low/60 transition-colors">
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-full bg-primary/20 overflow-hidden shrink-0 flex items-center justify-center">
                                                {student.profile_image_url ? (
                                                    <img src={student.profile_image_url} alt={student.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-primary font-bold text-xs">
                                                        {student.name.charAt(0).toUpperCase()}
                                                    </div>
                                                )}
                                            </div>
                                            <span className="font-bold text-xs text-on-surface">{student.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-xs text-on-surface-variant">
                                        {student.email}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border
                                            ${student.status === 'present' ? 'bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/30' : 
                                              student.status === 'absent' ? 'bg-error/15 text-error border-error/30' : 
                                              'bg-surface-container-high text-on-surface-variant border-outline-variant/40'}`}>
                                            <span className="material-symbols-outlined text-[14px]">
                                                {student.status === 'present' ? 'check_circle' : student.status === 'absent' ? 'cancel' : 'help'}
                                            </span>
                                            <span className="capitalize">{student.status === 'present' ? 'Present' : student.status === 'absent' ? 'Absent' : 'Not Marked'}</span>
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button 
                                                onClick={() => markAttendance(student.id, 'present')}
                                                disabled={markingStatus[student.id]}
                                                className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer active:scale-95
                                                ${student.status === 'present' ? 'bg-primary text-on-primary shadow-xs' : 'border border-primary text-primary hover:bg-primary/10 disabled:opacity-50'}`}
                                            >
                                                Present
                                            </button>
                                            <button 
                                                onClick={() => markAttendance(student.id, 'absent')}
                                                disabled={markingStatus[student.id]}
                                                className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer active:scale-95
                                                ${student.status === 'absent' ? 'bg-error text-on-error shadow-xs' : 'border border-error text-error hover:bg-error/10 disabled:opacity-50'}`}
                                            >
                                                Absent
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {students.length === 0 && (
                                <tr>
                                    <td colSpan="4" className="px-4 py-8 text-center text-xs text-on-surface-variant">
                                        No students found.
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
