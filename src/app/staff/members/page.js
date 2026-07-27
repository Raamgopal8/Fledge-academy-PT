'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import StaffNavbar from '../../components/StaffNavbar';

export default function StaffMembers() {
    const [students, setStudents] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [markingStatus, setMarkingStatus] = useState({});

    useEffect(() => {
        fetchStudents();
    }, []);

    const fetchStudents = async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('http://localhost:8000/api/attendance/students', {
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

    const markAttendance = async (studentId, status) => {
        setMarkingStatus(prev => ({ ...prev, [studentId]: true }));
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('http://localhost:8000/api/attendance/mark', {
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
            <div className="min-h-screen bg-surface">
                <StaffNavbar />
                <section className="p-gutter max-w-[1440px] mx-auto min-h-[50vh] flex items-center justify-center">
                    <div className="flex flex-col items-center gap-4 text-primary">
                        <span className="material-symbols-outlined text-[48px] animate-spin">progress_activity</span>
                        <p className="font-label-lg">Loading Members...</p>
                    </div>
                </section>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-surface">
                <StaffNavbar />
                <section className="p-gutter max-w-[1440px] mx-auto min-h-[50vh] flex items-center justify-center">
                    <div className="p-lg bg-error-container text-on-error-container rounded-xl flex items-center gap-md">
                        <span className="material-symbols-outlined text-[32px]">error</span>
                        <div>
                            <h3 className="font-headline-md">Error Loading Data</h3>
                            <p className="font-body-md">{error}</p>
                        </div>
                    </div>
                </section>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-surface">
            <StaffNavbar />
            
            <div className="max-w-[1440px] mx-auto p-gutter space-y-lg">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="font-headline-lg text-headline-lg text-on-surface">Members & Attendance</h1>
                        <p className="font-body-md text-body-md text-on-surface-variant">Mark attendance for students for today's classes.</p>
                    </div>
                </div>

                <div className="bg-surface-container-lowest rounded-xl custom-shadow overflow-hidden border border-surface-container">
                    <div className="overflow-x-auto">
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
                                {students.map((student) => (
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
                                            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-label-sm font-label-sm
                                                ${student.status === 'present' ? 'bg-primary-container text-on-primary-container' : 
                                                  student.status === 'absent' ? 'bg-error-container text-on-error-container' : 
                                                  'bg-surface-variant text-on-surface-variant'}`}>
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
                                                    className={`px-4 py-2 rounded-lg font-label-md text-label-md transition-colors 
                                                    ${student.status === 'present' ? 'bg-primary text-on-primary' : 'border border-primary text-primary hover:bg-primary-container disabled:opacity-50'}`}
                                                >
                                                    Present
                                                </button>
                                                <button 
                                                    onClick={() => markAttendance(student.id, 'absent')}
                                                    disabled={markingStatus[student.id]}
                                                    className={`px-4 py-2 rounded-lg font-label-md text-label-md transition-colors 
                                                    ${student.status === 'absent' ? 'bg-error text-on-error' : 'border border-error text-error hover:bg-error-container disabled:opacity-50'}`}
                                                >
                                                    Absent
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {students.length === 0 && (
                                    <tr>
                                        <td colSpan="4" className="px-md py-6 text-center font-body-md text-on-surface-variant">
                                            No students found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
