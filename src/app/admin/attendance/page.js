'use client';
import { useState, useEffect } from 'react';
import { useAdminContext } from '@/app/admin/AdminContext';

export default function CEOAttendance() {
    const { searchQuery, selectedBatch, selectedLevel, setSelectedLevel, availableLevels } = useAdminContext();
    const [attendanceOverview, setAttendanceOverview] = useState(null);
    const [studentsList, setStudentsList] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filter, setFilter] = useState('all'); // 'all', 'present', 'absent', 'not_marked'

    // In-page level filter state, synced with global selectedLevel
    const [filterLevel, setFilterLevel] = useState(() => {
        if (selectedLevel && selectedLevel !== 'All Levels' && selectedLevel !== 'Global') {
            return selectedLevel;
        }
        return 'All';
    });

    // Sync in-page filterLevel with AdminContext selectedLevel
    useEffect(() => {
        if (selectedLevel && selectedLevel !== 'All Levels' && selectedLevel !== 'Global') {
            setFilterLevel(selectedLevel);
        } else if (selectedLevel === 'All Levels' || selectedLevel === 'Global') {
            setFilterLevel('All');
        }
    }, [selectedLevel]);

    const handleFilterLevelChange = (lvl) => {
        setFilterLevel(lvl);
        if (setSelectedLevel) {
            setSelectedLevel(lvl === 'All' ? 'All Levels' : lvl);
        }
    };

    const levelsList = ['All', ...((availableLevels && availableLevels.length > 0) ? availableLevels : ['Level 5', 'Level 4', 'Level 3', 'Level 2', 'Level 1'])];
    const uniqueLevels = Array.from(new Set(levelsList));

    const effectiveLevel = (filterLevel && filterLevel !== 'All' && filterLevel !== 'All Levels' && filterLevel !== 'Global')
        ? filterLevel
        : (selectedLevel && selectedLevel !== 'All Levels' && selectedLevel !== 'Global' && selectedLevel !== 'All' ? selectedLevel : '');

    const fetchAttendanceData = async (showLoading = false) => {
        if (showLoading) setIsLoading(true);
        try {
            const token = localStorage.getItem('token');
            const headers = {
                'Authorization': `Bearer ${token}`
            };

            const params = new URLSearchParams();
            if (effectiveLevel) {
                params.append('level', effectiveLevel);
            }
            const overrideBatch = (selectedBatch === 'All Batches' || selectedBatch === 'All Assigned Batches' || selectedBatch === 'Global' || selectedBatch === 'Global Access') ? '' : (selectedBatch || '');
            if (overrideBatch) {
                params.append('batch', overrideBatch);
            }
            const queryStr = params.toString() ? `?${params.toString()}` : '';

            const [overviewRes, studentsRes] = await Promise.all([
                fetch(`${process.env.NEXT_PUBLIC_ATTENDANCE_API_URL || ''}/api/attendance/today${queryStr}`, { headers }),
                fetch(`${process.env.NEXT_PUBLIC_ATTENDANCE_API_URL || ''}/api/attendance/students${queryStr}`, { headers })
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
    }, [selectedBatch, selectedLevel, filterLevel]);

    const displayStudents = studentsList.filter(student => {
        let matchesLevel = true;
        if (effectiveLevel) {
            const sLevel = student.level ? student.level.toString().toLowerCase().trim() : '';
            const sLevels = Array.isArray(student.levels) ? student.levels : [];
            const targetLvl = effectiveLevel.toLowerCase().trim();
            const num = targetLvl.replace(/\D/g, '');
            matchesLevel = sLevel === targetLvl || 
                (num && (sLevel === `level ${num}` || sLevel === num)) ||
                sLevels.some(l => {
                    const lStr = (l || '').toString().toLowerCase().trim();
                    return lStr === targetLvl || (num && (lStr === `level ${num}` || lStr === num));
                });
        }
        return matchesLevel;
    });

    const filteredStudents = displayStudents.filter(student => {
        const matchesStatus = filter === 'all' || student.status === filter;
        const matchesSearch = !searchQuery || 
            (student.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (student.email || '').toLowerCase().includes(searchQuery.toLowerCase());
        return matchesStatus && matchesSearch;
    });

    const presentCount = displayStudents.filter(s => s.status === 'present').length;
    const absentCount = displayStudents.filter(s => s.status === 'absent').length;
    const totalCount = displayStudents.length;

    const [isExporting, setIsExporting] = useState(false);

    const handleExport = async () => {
        setIsExporting(true);
        try {
            const token = localStorage.getItem('token');
            const headers = { 'Authorization': `Bearer ${token}` };

            const exportParams = new URLSearchParams();
            if (effectiveLevel) {
                exportParams.append('level', effectiveLevel);
            }
            const overrideBatch = (selectedBatch === 'All Batches' || selectedBatch === 'All Assigned Batches' || selectedBatch === 'Global' || selectedBatch === 'Global Access') ? '' : (selectedBatch || '');
            if (overrideBatch) {
                exportParams.append('batch', overrideBatch);
            }
            const exportQueryStr = exportParams.toString() ? `?${exportParams.toString()}` : '';

            // Fetch complete historical attendance records
            const res = await fetch(`${process.env.NEXT_PUBLIC_ATTENDANCE_API_URL || ''}/api/attendance/export${exportQueryStr}`, { headers });
            
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
                const fallbackData = (displayStudents || []).map(student => ({
                    'Name': student.name,
                    'Email': student.email,
                    'Batch': student.batch || 'Unassigned',
                    'Level': student.level || 'Level 5',
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
                
                <div className="flex items-center gap-2 self-start md:self-auto flex-wrap">
                    {/* Level Filter Dropdown */}
                    <div className="flex items-center gap-1.5 bg-surface-container-lowest border border-outline-variant/70 rounded-2xl px-3 py-2 shadow-xs">
                        <span className="material-symbols-outlined text-primary text-[18px]">tune</span>
                        <select
                            value={filterLevel}
                            onChange={(e) => handleFilterLevelChange(e.target.value)}
                            className="bg-transparent text-xs font-bold text-on-surface outline-none cursor-pointer pr-1"
                            title="Filter by Level"
                        >
                            {uniqueLevels.map((lvl) => (
                                <option key={lvl} value={lvl} className="bg-surface-container-lowest text-on-surface">
                                    {lvl === 'All' ? 'All Levels' : lvl}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Batch Filter Pill */}
                    <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-surface-container-lowest border border-outline-variant/70 text-on-surface text-xs font-bold shadow-xs">
                        <span className="material-symbols-outlined text-primary text-[18px]">domain</span>
                        <span>{selectedBatch || 'Global Access'}</span>
                    </div>

                    {effectiveLevel && (
                        <button
                            onClick={() => handleFilterLevelChange('All')}
                            className="flex items-center gap-1 px-3 py-2 rounded-2xl bg-primary/10 border border-primary/20 text-primary text-xs font-bold hover:bg-primary/20 transition-colors cursor-pointer"
                            title="Clear Level Filter"
                        >
                            <span>{effectiveLevel}</span>
                            <span className="material-symbols-outlined text-[14px]">close</span>
                        </button>
                    )}

                    <button 
                        onClick={() => fetchAttendanceData(true)}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-surface-container-high text-on-surface hover:bg-surface-container-highest transition-colors active:scale-95 text-xs sm:text-sm font-semibold shadow-xs cursor-pointer"
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
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <p className="font-label-lg text-on-surface">{student.name}</p>
                                                        {student.level && (
                                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant">
                                                                {student.level}
                                                            </span>
                                                        )}
                                                        {student.batch && (
                                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                                                                {student.batch}
                                                            </span>
                                                        )}
                                                    </div>
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
