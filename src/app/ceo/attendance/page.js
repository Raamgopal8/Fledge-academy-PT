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
                fetch(`${process.env.NEXT_PUBLIC_ATTENDANCE_API_URL || ''}/api/attendance/today`, { headers }),
                fetch(`${process.env.NEXT_PUBLIC_ATTENDANCE_API_URL || ''}/api/attendance/students`, { headers })
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

    const [isExporting, setIsExporting] = useState(false);

    const handleExport = async () => {
        setIsExporting(true);
        try {
            const token = localStorage.getItem('token');
            const headers = { 'Authorization': `Bearer ${token}` };

            // Fetch complete historical attendance records
            const res = await fetch(`${process.env.NEXT_PUBLIC_ATTENDANCE_API_URL || ''}/api/attendance/export`, { headers });
            
            let exportData = null;
            if (res.ok) {
                exportData = await res.json();
            }

            const XLSX = await import('xlsx');
            const workbook = XLSX.utils.book_new();
            const todayStr = attendanceOverview?.date || new Date().toISOString().split('T')[0];

            if (exportData && exportData.students && exportData.students.length > 0) {
                const dates = exportData.dates || [];

                // 1. Matrix Summary Sheet (Student info, stats, and date-by-date breakdown)
                const matrixRows = exportData.students.map(s => {
                    const row = {
                        'Student Name': s.name,
                        'Email': s.email,
                        'Batch': s.batch,
                        'Level': s.level,
                        'Total Present': s.total_present,
                        'Total Absent': s.total_absent,
                        'Attendance Rate': s.attendance_rate,
                    };
                    dates.forEach(d => {
                        const statusRaw = s.daily_status?.[d] || 'not_marked';
                        row[d] = statusRaw.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
                    });
                    return row;
                });

                const summarySheet = XLSX.utils.json_to_sheet(matrixRows);
                
                // Column width sizing for Summary
                const colWidths = [
                    { wch: 25 }, // Name
                    { wch: 30 }, // Email
                    { wch: 15 }, // Batch
                    { wch: 12 }, // Level
                    { wch: 14 }, // Total Present
                    { wch: 14 }, // Total Absent
                    { wch: 18 }, // Attendance Rate
                    ...dates.map(() => ({ wch: 14 })) // Date columns
                ];
                summarySheet['!cols'] = colWidths;
                XLSX.utils.book_append_sheet(workbook, summarySheet, "Attendance Summary");

                // 2. Detailed Daily Log Sheet
                if (exportData.flat_records && exportData.flat_records.length > 0) {
                    const detailSheet = XLSX.utils.json_to_sheet(exportData.flat_records);
                    detailSheet['!cols'] = [
                        { wch: 14 }, // Date
                        { wch: 25 }, // Name
                        { wch: 30 }, // Email
                        { wch: 15 }, // Batch
                        { wch: 12 }, // Level
                        { wch: 15 }, // Status
                    ];
                    XLSX.utils.book_append_sheet(workbook, detailSheet, "Daily Records Log");
                }

                const startDateStr = dates[0] || todayStr;
                XLSX.writeFile(workbook, `Fledge_Attendance_Report_${startDateStr}_to_${todayStr}.xlsx`);
            } else {
                // Fallback to today's list if no history returned
                const fallbackData = (studentsList || []).map(student => ({
                    'Name': student.name,
                    'Email': student.email,
                    'Status': student.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
                    'Date': todayStr
                }));
                const worksheet = XLSX.utils.json_to_sheet(fallbackData);
                XLSX.utils.book_append_sheet(workbook, worksheet, "Today Attendance");
                XLSX.writeFile(workbook, `Fledge_Attendance_Report_${todayStr}.xlsx`);
            }
        } catch (err) {
            console.error("Failed to export complete attendance:", err);
            alert("Failed to export complete attendance history. Please try again.");
        } finally {
            setIsExporting(false);
        }
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
        <div className="max-w-[1440px] mx-auto p-gutter space-y-lg relative pb-32 animate-fade-in">
            {/* Header */}
            <section className="flex flex-col md:flex-row md:items-center justify-between gap-md mb-lg">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="material-symbols-outlined text-primary text-3xl">
                            assignment
                        </span>
                        <h1 className="text-3xl md:text-4xl font-bold tracking-tight bg-gradient-to-r from-[#6FB7E4] via-[#5D8BCC] to-[#465AA3] text-transparent bg-clip-text">
                            Attendance Reports
                        </h1>
                    </div>
                    <p className="font-body-md text-on-surface-variant max-w-2xl">
                        Live attendance tracking for today ({attendanceOverview?.date || new Date().toISOString().split('T')[0]})
                    </p>
                </div>
                
                <div className="flex gap-2 self-start md:self-auto">
                    <button 
                        onClick={() => fetchAttendanceData(true)}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-surface-container-high text-on-surface hover:bg-surface-container-highest transition-colors active:scale-95 text-xs sm:text-sm font-semibold shadow-xs"
                    >
                        <span className="material-symbols-outlined text-[18px]">refresh</span>
                        Refresh
                    </button>
                    <button 
                        onClick={handleExport}
                        disabled={isExporting}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-primary text-on-primary hover:opacity-90 transition-colors active:scale-95 text-xs sm:text-sm font-semibold shadow-xs disabled:opacity-50 cursor-pointer"
                        title="Export complete attendance history"
                    >
                        <span className={`material-symbols-outlined text-[18px] ${isExporting ? 'animate-spin' : ''}`}>
                            {isExporting ? 'progress_activity' : 'download'}
                        </span>
                        {isExporting ? 'Exporting...' : 'Export'}
                    </button>
                </div>
            </section>

            {/* Bento Grid Layout */}
            <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-3xl p-5 md:p-6 custom-shadow hover:shadow-md transition-all flex flex-col">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-md">
                    
                    {/* Sidebar Area - Stats */}
                <div className="md:col-span-4 flex flex-col gap-2.5 md:gap-md">
                    
                    {/* Stats Cards */}
                    <div className="bg-primary-container text-on-primary-container rounded-2xl p-3 md:p-md shadow-xs relative overflow-hidden group cursor-pointer hover:shadow-md transition-all">
                        <div className="absolute -right-4 -top-4 w-20 h-20 sm:w-24 sm:h-24 bg-primary/10 rounded-full group-hover:scale-150 transition-transform duration-500 ease-out"></div>
                        <h3 className="text-xs sm:text-sm font-semibold opacity-80 mb-1">Total Students</h3>
                        <div className="flex items-end gap-2">
                            <span className="text-2xl sm:text-4xl font-extrabold leading-none">{totalCount}</span>
                            <span className="text-[10px] sm:text-xs mb-0.5 opacity-80">Enrolled</span>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2.5 sm:gap-md">
                        <div className="bg-secondary-container text-on-secondary-container rounded-2xl p-3 sm:p-md shadow-xs relative overflow-hidden group cursor-pointer hover:shadow-md transition-all">
                            <div className="absolute -right-4 -top-4 w-14 h-14 sm:w-16 sm:h-16 bg-secondary/10 rounded-full group-hover:scale-150 transition-transform duration-500 ease-out"></div>
                            <h3 className="text-xs sm:text-sm font-semibold opacity-80 mb-1">Present</h3>
                            <div className="flex items-end gap-2">
                                <span className="text-xl sm:text-3xl font-extrabold leading-none">{presentCount}</span>
                            </div>
                        </div>
                        <div className="bg-error-container text-on-error-container rounded-2xl p-3 sm:p-md shadow-xs relative overflow-hidden group cursor-pointer hover:shadow-md transition-all">
                            <div className="absolute -right-4 -top-4 w-14 h-14 sm:w-16 sm:h-16 bg-error/10 rounded-full group-hover:scale-150 transition-transform duration-500 ease-out"></div>
                            <h3 className="text-xs sm:text-sm font-semibold opacity-80 mb-1">Absent</h3>
                            <div className="flex items-end gap-2">
                                <span className="text-xl sm:text-3xl font-extrabold leading-none">{absentCount}</span>
                            </div>
                        </div>
                    </div>

                    {/* Quick Filters */}
                    <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-3 sm:p-md custom-shadow flex-1">
                        <h3 className="text-xs sm:text-base font-bold text-on-surface mb-2 sm:mb-md">Filter View</h3>
                        <div className="space-y-1 sm:space-y-sm">
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
                                    <p className="font-body-md text-outline">
                                        No students match the current filter selection.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
        </div>
    );
}
