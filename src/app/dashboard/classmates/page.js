'use client';
import { useState, useEffect } from 'react';

export default function ClassmatesPage() {
    const [members, setMembers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [studentLevel, setStudentLevel] = useState('Level 5');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const fetchMembers = async () => {
            setIsLoading(true);
            try {
                const token = localStorage.getItem('token');
                let level = localStorage.getItem('level');
                let batch = localStorage.getItem('batch');

                if (!level || !batch) {
                    try {
                        const profRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/user/profile`, {
                            headers: { 'Authorization': `Bearer ${token}` }
                        });
                        if (profRes.ok) {
                            const prof = await profRes.json();
                            level = prof.level || level || 'Level 5';
                            batch = prof.batch || batch || '';
                            localStorage.setItem('level', level);
                            if (batch) localStorage.setItem('batch', batch);
                        }
                    } catch (e) {
                        console.error("Profile fallback error:", e);
                    }
                }

                level = level || 'Level 5';
                batch = batch || '';
                setStudentLevel(level);

                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/user/classroom/members?level=${encodeURIComponent(level)}&batch=${encodeURIComponent(batch)}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!res.ok) throw new Error('Failed to fetch group members');
                const data = await res.json();
                setMembers(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };
        fetchMembers();
    }, []);

    // Filter staff (explicitly excluding CEO from student view)
    const staffMembers = members.filter(m => 
        ((m.role || '').toLowerCase() === 'staff' || (m.role || '').toLowerCase() === 'sensi') && 
        (m.name || '').trim().toLowerCase() !== 'ceo' && 
        (m.email || '').trim().toLowerCase() !== 'ceo@gmail.com'
    );

    // Filter students
    const students = members.filter(m => 
        (m.role || '').toLowerCase() === 'student' &&
        (m.name || '').trim().toLowerCase() !== 'ceo'
    );

    // Search filtered peers
    const filteredStudents = students.filter(s => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (s.name || '').toLowerCase().includes(q) || (s.email || '').toLowerCase().includes(q);
    });

    const getInitials = (name) => {
        if (!name) return 'U';
        const parts = name.trim().split(' ');
        if (parts.length >= 2) {
            return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
        }
        return name.slice(0, 2).toUpperCase();
    };

    return (
        <div className="max-w-[1440px] mx-auto p-gutter space-y-lg animate-fade-in">
            {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-md mb-lg">
                    <div>
                        <div className="flex items-center gap-sm mb-xs">
                            <span className="material-symbols-outlined text-primary text-3xl">groups</span>
                            <h1 className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#6FB7E4] via-[#5D8BCC] to-[#465AA3]">
                                Class Group & Instructors
                            </h1>
                        </div>
                        <p className="font-body-lg text-on-surface-variant max-w-2xl">
                            Connect with your course instructor and fellow classmates learning Japanese.
                        </p>
                    </div>

                    {/* Active Student Level Indicator (Batch is hidden in UI) */}
                    <div className="flex items-center gap-2">
                        {studentLevel && (
                            <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold shadow-2xs">
                                <span className="material-symbols-outlined text-[16px]">school</span>
                                <span>{studentLevel}</span>
                            </div>
                        )}
                    </div>
                </div>

                {error && (
                    <div className="bg-error/10 text-error p-4 rounded-2xl flex items-center gap-2 border border-error/30">
                        <span className="material-symbols-outlined">error</span>
                        <span className="text-sm font-medium">{error}</span>
                    </div>
                )}

                {/* Instructors Section */}
                <section className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary text-[22px]">co_present</span>
                            <h2 className="text-xl font-bold text-on-surface">Course Instructors</h2>
                        </div>
                        {!isLoading && staffMembers.length > 0 && (
                            <span className="text-xs text-primary font-bold bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
                                {staffMembers.length} {staffMembers.length === 1 ? 'Instructor' : 'Instructors'}
                            </span>
                        )}
                    </div>

                    {isLoading ? (
                        <div className="flex flex-col justify-center items-center h-40 bg-surface-container-lowest border border-outline-variant rounded-2xl gap-2">
                            <span className="material-symbols-outlined text-3xl text-primary animate-spin">progress_activity</span>
                            <p className="text-xs text-on-surface-variant font-medium">Loading instructors...</p>
                        </div>
                    ) : staffMembers.length === 0 ? (
                        <div className="p-8 text-center bg-surface-container-lowest rounded-2xl border border-dashed border-outline-variant custom-shadow">
                            <span className="material-symbols-outlined text-4xl text-outline/40 mb-1">person_search</span>
                            <p className="text-on-surface-variant text-xs font-medium">No instructors assigned to this group yet.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                            {staffMembers.map(staff => (
                                <div 
                                    key={staff.id} 
                                    className="bg-surface-container-lowest border border-outline-variant hover:border-primary/50 hover:shadow-lg rounded-2xl p-5 flex flex-col items-center gap-3 transition-all custom-shadow group relative overflow-hidden"
                                >
                                    <div className="absolute top-0 right-0 w-20 h-20 bg-primary/5 rounded-bl-full -z-0 group-hover:scale-110 transition-transform"></div>

                                    {/* Avatar */}
                                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-primary/40 text-primary flex items-center justify-center font-bold text-xl overflow-hidden relative ring-4 ring-primary/10 shadow-sm z-10">
                                        {staff.profile_image_url ? (
                                            <img 
                                                src={staff.profile_image_url} 
                                                alt={staff.name || 'Instructor'} 
                                                className="w-full h-full object-cover"
                                                onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                            />
                                        ) : (
                                            <span>{getInitials(staff.name)}</span>
                                        )}
                                    </div>

                                    {/* Info */}
                                    <div className="text-center w-full z-10 space-y-1">
                                        <h3 className="font-headline-sm text-on-surface font-bold text-base line-clamp-1 group-hover:text-primary transition-colors" title={staff.name}>
                                            {staff.name || 'Instructor'}
                                        </h3>
                                        <span className="text-[11px] font-bold bg-primary/10 text-primary px-3 py-0.5 rounded-full inline-flex items-center gap-1 border border-primary/20">
                                            <span className="material-symbols-outlined text-[13px]">school</span>
                                            <span>Sensi Instructor</span>
                                        </span>
                                        {staff.email && (
                                            <p className="text-[11px] text-on-surface-variant truncate pt-1 opacity-80" title={staff.email}>
                                                {staff.email}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                {/* Classmates Section */}
                <section className="space-y-4 pt-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-outline-variant/40">
                        <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary text-[22px]">diversity_3</span>
                            <h2 className="text-xl font-bold text-on-surface">Classmates</h2>
                            {!isLoading && (
                                <span className="text-xs text-on-surface-variant font-semibold bg-surface-container-low px-2.5 py-0.5 rounded-full border border-outline-variant/60 ml-1">
                                    {students.length} {students.length === 1 ? 'Peer' : 'Peers'}
                                </span>
                            )}
                        </div>

                        {/* Classmate Search */}
                        <div className="relative min-w-[220px]">
                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[16px] text-on-surface-variant">search</span>
                            <input 
                                type="text"
                                placeholder="Search classmates..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-8 pr-3 py-1.5 bg-surface-container-lowest border border-outline-variant rounded-xl text-xs text-on-surface focus:outline-none focus:border-primary transition-colors"
                            />
                        </div>
                    </div>

                    {isLoading ? (
                        <div className="flex flex-col justify-center items-center h-48 bg-surface-container-lowest border border-outline-variant rounded-2xl gap-2">
                            <span className="material-symbols-outlined text-3xl text-primary animate-spin">progress_activity</span>
                            <p className="text-xs text-on-surface-variant font-medium">Loading classmates...</p>
                        </div>
                    ) : filteredStudents.length === 0 ? (
                        <div className="p-8 text-center bg-surface-container-lowest rounded-2xl border border-dashed border-outline-variant custom-shadow">
                            <span className="material-symbols-outlined text-4xl text-outline/40 mb-1">group_off</span>
                            <p className="text-on-surface-variant text-xs font-medium">
                                {searchQuery ? 'No classmates matching your search.' : 'No other students enrolled in this group yet.'}
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {filteredStudents.map(student => (
                                <div 
                                    key={student.id} 
                                    className="bg-surface-container-lowest border border-outline-variant hover:border-primary/40 hover:shadow-md rounded-2xl p-4 flex items-center gap-3.5 transition-all custom-shadow group"
                                >
                                    {/* Avatar with Initials Fallback */}
                                    <div className="w-12 h-12 shrink-0 rounded-full bg-gradient-to-br from-secondary-container to-surface-container-high text-on-secondary-container flex items-center justify-center font-bold text-sm overflow-hidden relative ring-2 ring-outline-variant/40 group-hover:ring-primary/40 transition-all">
                                        {student.profile_image_url ? (
                                            <img 
                                                src={student.profile_image_url} 
                                                alt={student.name || 'Student'} 
                                                className="w-full h-full object-cover" 
                                                onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                            />
                                        ) : (
                                            <span>{getInitials(student.name)}</span>
                                        )}
                                    </div>

                                    {/* Details */}
                                    <div className="min-w-0 flex-1">
                                        <h3 className="font-label-lg text-on-surface font-bold text-sm truncate group-hover:text-primary transition-colors" title={student.name}>
                                            {student.name || 'Student'}
                                        </h3>
                                        <div className="flex items-center gap-1.5 mt-0.5">
                                            <span className="text-[11px] text-on-surface-variant font-medium">Classmate</span>
                                            {student.level && (
                                                <span className="text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.2 rounded border border-primary/20">
                                                    {student.level}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            </div>
    );
}
