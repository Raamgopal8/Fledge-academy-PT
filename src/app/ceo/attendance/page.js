'use client';
import { useState, useEffect } from 'react';

export default function CEOAttendance() {
    const [attendanceOverview, setAttendanceOverview] = useState(null);
    const [studentsList, setStudentsList] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filter, setFilter] = useState('all'); // 'all', 'present', 'absent', 'not_marked'

    const fetchAttendanceData = async (showLoading = false) => {
        if (showLoading) setIsLoading(true);
        try {
            const token = localStorage.getItem('token');
            const headers = {
                'Authorization': `Bearer ${token}`
            };

            const [overviewRes, studentsRes] = await Promise.all([
                fetch('http://localhost:8000/api/attendance/today', { headers }),
                fetch('http://localhost:8000/api/attendance/students', { headers })
            ]);

            if (!overviewRes.ok || !studentsRes.ok) {
                throw new Error('Failed to fetch attendance data');
            }

            setAttendanceOverview(await overviewRes.json());
            setStudentsList(await studentsRes.json());
        } catch (err) {
            console.error("Error fetching attendance data:", err);
            setError(err.message);
        } finally {
            if (showLoading) setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchAttendanceData(true);
        const interval = setInterval(() => fetchAttendanceData(false), 30000); // Auto refresh every 30 seconds
        return () => clearInterval(interval);
    }, []);

    const filteredStudents = studentsList.filter(student => {
        if (filter === 'all') return true;
        return student.status === filter;
    });

    const presentCount = studentsList.filter(s => s.status === 'present').length;
    const absentCount = studentsList.filter(s => s.status === 'absent').length;
    const totalCount = studentsList.length;

    const handleExport = async () => {
        if (!studentsList || studentsList.length === 0) {
            return;
        }

        const exportData = studentsList.map(student => ({
            'Name': student.name,
            'Email': student.email,
            'Status': student.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
            'Date': attendanceOverview?.date || new Date().toISOString().split('T')[0]
        }));

        const XLSX = await import('xlsx');
        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Attendance");
        
        // Adjust column widths
        worksheet["!cols"] = [ { wch: 25 }, { wch: 30 }, { wch: 15 }, { wch: 15 } ];

        XLSX.writeFile(workbook, `Attendance_Report_${attendanceOverview?.date || new Date().toISOString().split('T')[0]}.xlsx`);
    };

    if (isLoading) {
        return (
            <section className="p-gutter max-w-[1440px] mx-auto min-h-[50vh] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4 text-primary">
                    <span className="material-symbols-outlined text-[48px] animate-spin">progress_activity</span>
                    <p className="font-label-lg">Loading Attendance Data...</p>
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
        <section className="max-w-[1440px] mx-auto p-gutter space-y-lg animate-fade-in">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-md mb-lg">
                <div>
                    <div className="flex items-center gap-sm mb-xs">
                        <span className="material-symbols-outlined text-primary text-3xl">
                            assignment
                        </span>
                        <h1 className="font-display-sm md:font-display-md text-on-surface">
                            Attendance Reports
                        </h1>
                    </div>
                    <p className="font-body-lg text-on-surface-variant max-w-2xl">
                        View live attendance tracking and trends for today ({attendanceOverview?.date || new Date().toISOString().split('T')[0]})
                    </p>
                </div>
                
                <div className="flex gap-sm">
                    <button 
                        onClick={() => fetchAttendanceData(true)}
                        className="flex items-center gap-xs px-md py-sm rounded-lg bg-surface-container-high text-on-surface hover:bg-surface-container-highest transition-colors active:scale-95 font-label-md"
                    >
                        <span className="material-symbols-outlined text-[18px]">refresh</span>
                        Refresh
                    </button>
                    <button 
                        onClick={handleExport}
                        className="flex items-center gap-xs px-md py-sm rounded-lg bg-primary text-on-primary hover:opacity-90 transition-colors active:scale-95 font-label-md shadow-sm"
                    >
                        <span className="material-symbols-outlined text-[18px]">download</span>
                        Export
                    </button>
                </div>
            </div>

            {/* Bento Grid Layout */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-md">
                
                {/* Sidebar Area - Stats */}
                <div className="md:col-span-4 flex flex-col gap-md">
                    
                    {/* Stats Cards */}
                    <div className="bg-primary-container text-on-primary-container rounded-2xl p-md shadow-sm relative overflow-hidden group cursor-pointer hover:shadow-md transition-all">
                        <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary/10 rounded-full group-hover:scale-150 transition-transform duration-500 ease-out"></div>
                        <h3 className="font-label-md opacity-80 mb-sm">Total Students</h3>
                        <div className="flex items-end gap-sm">
                            <span className="font-display-md leading-none">{totalCount}</span>
                            <span className="font-label-sm mb-1 opacity-80">Enrolled</span>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-md">
                        <div className="bg-secondary-container text-on-secondary-container rounded-2xl p-md shadow-sm relative overflow-hidden group cursor-pointer hover:shadow-md transition-all">
                            <div className="absolute -right-4 -top-4 w-16 h-16 bg-secondary/10 rounded-full group-hover:scale-150 transition-transform duration-500 ease-out"></div>
                            <h3 className="font-label-md opacity-80 mb-sm">Present</h3>
                            <div className="flex items-end gap-sm">
                                <span className="font-display-sm leading-none">{presentCount}</span>
                            </div>
                        </div>
                        <div className="bg-error-container text-on-error-container rounded-2xl p-md shadow-sm relative overflow-hidden group cursor-pointer hover:shadow-md transition-all">
                            <div className="absolute -right-4 -top-4 w-16 h-16 bg-error/10 rounded-full group-hover:scale-150 transition-transform duration-500 ease-out"></div>
                            <h3 className="font-label-md opacity-80 mb-sm">Absent</h3>
                            <div className="flex items-end gap-sm">
                                <span className="font-display-sm leading-none">{absentCount}</span>
                            </div>
                        </div>
                    </div>

                    {/* Quick Filters */}
                    <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-md custom-shadow flex-1">
                        <h3 className="font-label-lg text-on-surface mb-md">Filter View</h3>
                        <div className="space-y-sm">
                            {[
                                { id: 'all', label: 'All Students', icon: 'groups' },
                                { id: 'present', label: 'Present Today', icon: 'check_circle' },
                                { id: 'absent', label: 'Absent Today', icon: 'cancel' },
                                { id: 'not_marked', label: 'Not Marked', icon: 'help' }
                            ].map(f => (
                                <button 
                                    key={f.id} 
                                    onClick={() => setFilter(f.id)}
                                    className={`w-full flex items-center justify-between p-sm rounded-lg transition-colors group ${filter === f.id ? 'bg-primary-container text-on-primary-container' : 'hover:bg-surface-container-low text-on-surface'}`}
                                >
                                    <div className="flex items-center gap-sm">
                                        <span className="material-symbols-outlined text-[20px]">{f.icon}</span>
                                        <span className="font-body-md">{f.label}</span>
                                    </div>
                                    {filter === f.id && (
                                        <span className="material-symbols-outlined text-[16px]">check</span>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="md:col-span-8 flex flex-col gap-md">
                    <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-lg custom-shadow min-h-[400px] flex flex-col">
                        <div className="flex justify-between items-center mb-md pb-sm border-b border-outline-variant">
                            <h2 className="font-headline-sm text-on-surface">
                                Student List {filter !== 'all' && `(${filter})`}
                            </h2>
                            <div className="text-body-sm text-on-surface-variant bg-surface-container-low px-3 py-1 rounded-full">
                                {filteredStudents.length} Students
                            </div>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto custom-scrollbar">
                            {filteredStudents.length > 0 ? (
                                <div className="space-y-2">
                                    {filteredStudents.map((student) => (
                                        <div key={student.id} className="flex items-center justify-between p-sm hover:bg-surface-container-low rounded-xl transition-colors">
                                            <div className="flex items-center gap-md">
                                                <div className="w-10 h-10 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center font-bold text-lg overflow-hidden shrink-0">
                                                    {student.profile_image_url ? (
                                                        <img src={student.profile_image_url} alt={student.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        student.name.charAt(0).toUpperCase()
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-label-lg text-on-surface">{student.name}</p>
                                                    <p className="font-body-sm text-on-surface-variant">{student.email}</p>
                                                </div>
                                            </div>
                                            <div className={`px-md py-xs rounded-full font-label-sm flex items-center gap-xs ${
                                                student.status === 'present' ? 'bg-secondary-container text-on-secondary-container' :
                                                student.status === 'absent' ? 'bg-error-container text-on-error-container' :
                                                'bg-surface-container-high text-on-surface-variant'
                                            }`}>
                                                <span className="material-symbols-outlined text-[16px]">
                                                    {student.status === 'present' ? 'check_circle' :
                                                     student.status === 'absent' ? 'cancel' : 'help'}
                                                </span>
                                                <span className="capitalize">{student.status.replace('_', ' ')}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex-1 flex flex-col items-center justify-center text-center p-xl h-full">
                                    <span className="material-symbols-outlined text-6xl text-outline/50 mb-md">
                                        search_off
                                    </span>
                                    <h3 className="font-headline-sm text-on-surface-variant mb-xs">No students found</h3>
                                    <p className="font-body-md text-outline max-w-md">
                                        No students match the current filter selection.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

            </div>
        </section>
    );
}
