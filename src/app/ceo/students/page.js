'use client';
import { useState, useEffect } from 'react';
import { useCEOContext } from '@/app/ceo/CEOContext';

export default function CEOStudents() {
    const { searchQuery, selectedBatch, availableBatches } = useCEOContext();
    const [students, setStudents] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    
    const [currentStudent, setCurrentStudent] = useState(null);
    const [formData, setFormData] = useState({ name: '', email: '', password: '', level: 'Level 5', batch: selectedBatch || '' });
    const [formError, setFormError] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const fetchStudents = async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/user/students`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Failed to fetch students');
            const data = await res.json();
            setStudents(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchStudents();
    }, []);

    const handleAddSubmit = async (e) => {
        e.preventDefault();
        setFormError('');
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/user/students`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ email: formData.email.trim() })
            });
            if (!res.ok) {
                let errText = 'Failed to add student';
                try {
                    const data = await res.json();
                    errText = data.detail || errText;
                } catch {
                    try {
                        const raw = await res.text();
                        if (raw) errText = raw;
                    } catch {}
                }
                throw new Error(errText);
            }
            await fetchStudents();
            setIsAddModalOpen(false);
            setFormData({ name: '', email: '', password: '', level: 'Level 5', batch: selectedBatch || '' });
        } catch (err) {
            setFormError(err.message);
        }
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        setFormError('');
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/user/students/${currentStudent.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    name: formData.name,
                    email: formData.email,
                    password: formData.password || undefined, // Only send password if changed
                    level: formData.level,
                    batch: formData.batch
                })
            });
            if (!res.ok) {
                let errText = 'Failed to update student';
                try {
                    const data = await res.json();
                    errText = data.detail || errText;
                } catch {
                    try {
                        const raw = await res.text();
                        if (raw) errText = raw;
                    } catch {}
                }
                throw new Error(errText);
            }
            await fetchStudents();
            setIsEditModalOpen(false);
            setCurrentStudent(null);
            setFormData({ name: '', email: '', password: '', level: 'Level 5', batch: selectedBatch || '' });
        } catch (err) {
            setFormError(err.message);
        }
    };

    const handleDelete = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/user/students/${currentStudent.id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!res.ok) throw new Error('Failed to delete student');
            await fetchStudents();
            setIsDeleteModalOpen(false);
            setCurrentStudent(null);
        } catch (err) {
            alert(err.message);
        }
    };

    const openEditModal = (student) => {
        setCurrentStudent(student);
        setFormData({ name: student.name || '', email: student.email, password: '', level: student.level || 'Level 5', batch: student.batch || '' });
        setIsEditModalOpen(true);
    };

    const openDeleteModal = (student) => {
        setCurrentStudent(student);
        setIsDeleteModalOpen(true);
    };

    if (isLoading) {
        return (
            <section className="p-gutter max-w-[1440px] mx-auto min-h-[50vh] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4 text-primary">
                    <span className="material-symbols-outlined text-[48px] animate-spin">progress_activity</span>
                    <p className="font-label-lg">Loading Students...</p>
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
        const matchesSearch = (student.name || '').toLowerCase().includes((searchQuery || '').toLowerCase()) ||
                              student.email.toLowerCase().includes((searchQuery || '').toLowerCase());
        const overrideBatch = (selectedBatch === 'All Batches' || selectedBatch === 'Global' || selectedBatch === 'Global Access') ? '' : (selectedBatch || '');
        const matchesBatch = overrideBatch ? (student.batch || '').trim() === overrideBatch.trim() : true;
        return matchesSearch && matchesBatch;
    });

    return (
        <div className="max-w-[1440px] mx-auto p-gutter space-y-lg relative pb-32 animate-fade-in">
            <section className="flex flex-col md:flex-row md:items-center justify-between gap-md mb-lg">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="material-symbols-outlined text-primary text-3xl">school</span>
                        <h1 className="text-3xl md:text-4xl font-bold tracking-tight bg-gradient-to-r from-[#6FB7E4] via-[#5D8BCC] to-[#465AA3] text-transparent bg-clip-text">
                            Student Management
                        </h1>
                    </div>
                    <p className="font-body-md text-on-surface-variant max-w-2xl">
                        View, add, edit, and manage student accounts and batch enrollments.
                    </p>
                </div>
                <button 
                    onClick={() => { setFormData({ name: '', email: '', password: '', level: 'Level 5', batch: selectedBatch || '' }); setFormError(''); setIsAddModalOpen(true); }}
                    className="bg-primary text-on-primary px-5 py-2.5 rounded-2xl font-label-md text-sm hover:bg-primary/90 transition-all flex items-center justify-center gap-2 self-start md:self-auto shadow-xs cursor-pointer active:scale-95"
                >
                    <span className="material-symbols-outlined text-[20px]">person_add</span>
                    <span>Add Student</span>
                </button>
            </section>

            <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-3xl p-5 md:p-6 custom-shadow hover:shadow-md transition-all flex flex-col">
                <div className="w-full overflow-x-auto custom-scrollbar border border-outline-variant/40 rounded-2xl">
                    <table className="w-full text-left border-collapse min-w-[650px]">
                        <thead className="bg-surface-container-low border-b border-outline-variant/60">
                            <tr>
                                <th className="p-2.5 md:p-md text-xs sm:text-sm font-semibold text-on-surface-variant">Name</th>
                                <th className="p-2.5 md:p-md text-xs sm:text-sm font-semibold text-on-surface-variant">Email</th>
                                <th className="p-2.5 md:p-md text-xs sm:text-sm font-semibold text-on-surface-variant">Level</th>
                                <th className="p-2.5 sm:p-md text-xs sm:text-sm font-semibold text-on-surface-variant">Batch</th>
                                <th className="p-2.5 sm:p-md text-xs sm:text-sm font-semibold text-on-surface-variant text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredStudents.map(student => (
                                <tr key={student.id} className="border-b border-outline-variant hover:bg-surface-container-lowest transition-colors">
                                    <td className="p-md font-body-md text-on-surface">
                                        {student.name ? (
                                            student.name
                                        ) : (
                                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                                                Pending Registration
                                            </span>
                                        )}
                                    </td>
                                    <td className="p-md font-body-md text-on-surface-variant font-mono text-xs">{student.email}</td>
                                    <td className="p-md font-body-md text-on-surface-variant">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                            student.level === 'Level 5' ? 'bg-blue-100 text-blue-800' :
                                            student.level === 'Level 4' ? 'bg-purple-100 text-purple-800' :
                                            student.level === 'Level 3' ? 'bg-orange-100 text-orange-800' :
                                            student.level === 'Level 2' ? 'bg-green-100 text-green-800' :
                                            student.level === 'Level 1' ? 'bg-red-100 text-red-800' :
                                            'bg-gray-100 text-gray-800'
                                        }`}>
                                            {student.level || 'Level 5'}
                                        </span>
                                    </td>
                                    <td className="p-md font-body-md text-on-surface-variant">
                                        <span className="bg-surface-container-high px-2 py-1 rounded-md text-xs font-medium text-on-surface">
                                            {student.batch || 'Unassigned'}
                                        </span>
                                    </td>
                                    <td className="p-md flex justify-end gap-sm">
                                        <button 
                                            onClick={() => openEditModal(student)}
                                            className="text-secondary hover:text-primary transition-colors p-2 rounded-full hover:bg-secondary-container flex items-center justify-center"
                                            title="Edit Student"
                                        >
                                            <span className="material-symbols-outlined">edit</span>
                                        </button>
                                        <button 
                                            onClick={() => openDeleteModal(student)}
                                            className="text-error hover:text-error/80 transition-colors p-2 rounded-full hover:bg-error-container flex items-center justify-center"
                                            title="Delete Student"
                                        >
                                            <span className="material-symbols-outlined">delete</span>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {filteredStudents.length === 0 && (
                                <tr>
                                    <td colSpan="3" className="p-xl text-center text-on-surface-variant font-body-lg">
                                        No students found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add Student Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-surface rounded-2xl p-xl w-[90%] max-w-[500px] shadow-2xl">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                                <span className="material-symbols-outlined text-[24px]">person_add</span>
                            </div>
                            <h2 className="font-headline-md text-on-surface font-bold">Add Student</h2>
                        </div>
                        <p className="text-sm text-on-surface-variant mb-4">
                            Enter the student&apos;s email address to pre-enroll them into the academy. The student will provide their name, password, phone, and profile details when registering.
                        </p>
                        {formError && <p className="text-error mb-4 text-sm bg-error-container p-2 rounded">{formError}</p>}
                        <form onSubmit={handleAddSubmit} className="space-y-4">
                            <div>
                                <label className="block text-label-md font-medium text-on-surface mb-1.5">
                                    Student Email Address <span className="text-error">*</span>
                                </label>
                                <input 
                                    type="email" 
                                    required
                                    placeholder="e.g. student@fledgeacademy.com"
                                    className="w-full bg-surface-container-low border border-outline-variant rounded-lg p-3 text-on-surface focus:outline-none focus:border-primary transition-colors"
                                    value={formData.email}
                                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                                    autoFocus
                                />
                            </div>
                            <div className="flex justify-end gap-3 mt-6">
                                <button 
                                    type="button" 
                                    onClick={() => setIsAddModalOpen(false)}
                                    className="px-6 py-2 rounded-full text-on-surface-variant hover:bg-surface-container transition-colors"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit"
                                    className="px-6 py-2 rounded-full bg-primary text-on-primary hover:bg-primary/90 transition-colors shadow-md font-bold"
                                >
                                    Add Student
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Student Modal */}
            {isEditModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-surface rounded-2xl p-xl w-[90%] max-w-[500px] shadow-2xl">
                        <h2 className="font-headline-md text-on-surface mb-md">Edit Student</h2>
                        {formError && <p className="text-error mb-4 text-sm bg-error-container p-2 rounded">{formError}</p>}
                        <form onSubmit={handleEditSubmit} className="space-y-4">
                            <div>
                                <label className="block text-label-md text-on-surface-variant mb-1">Name</label>
                                <input 
                                    type="text" 
                                    required
                                    className="w-full bg-surface-container-low border border-outline-variant rounded-lg p-3 text-on-surface focus:outline-none focus:border-primary transition-colors"
                                    value={formData.name}
                                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                                />
                            </div>
                            <div>
                                <label className="block text-label-md text-on-surface-variant mb-1">Email</label>
                                <input 
                                    type="email" 
                                    required
                                    className="w-full bg-surface-container-low border border-outline-variant rounded-lg p-3 text-on-surface focus:outline-none focus:border-primary transition-colors"
                                    value={formData.email}
                                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                                />
                            </div>
                            <div>
                                <label className="block text-label-md text-on-surface-variant mb-1">New Password (leave blank to keep current)</label>
                                <div className="relative">
                                    <input 
                                        type={showPassword ? "text" : "password"}
                                        className="w-full bg-surface-container-low border border-outline-variant rounded-lg p-3 pr-12 text-on-surface focus:outline-none focus:border-primary transition-colors"
                                        value={formData.password}
                                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface transition-colors"
                                    >
                                        <span className="material-symbols-outlined">
                                            {showPassword ? "visibility_off" : "visibility"}
                                        </span>
                                    </button>
                                </div>
                            </div>
                            <div>
                                <label className="block text-label-md text-on-surface-variant mb-1">Level</label>
                                <select 
                                    className="w-full bg-surface-container-low border border-outline-variant rounded-lg p-3 text-on-surface focus:outline-none focus:border-primary transition-colors"
                                    value={formData.level}
                                    onChange={(e) => setFormData({...formData, level: e.target.value})}
                                >
                                    <option value="Level 5">Level 5</option>
                                    <option value="Level 4">Level 4</option>
                                    <option value="Level 3">Level 3</option>
                                    <option value="Level 2">Level 2</option>
                                    <option value="Level 1">Level 1</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-label-md text-on-surface-variant mb-1">Batch</label>
                                <input 
                                    type="text" 
                                    placeholder="e.g. Batch - 1"
                                    className="w-full bg-surface-container-low border border-outline-variant rounded-lg p-3 text-on-surface focus:outline-none focus:border-primary transition-colors"
                                    value={formData.batch}
                                    onChange={(e) => setFormData({...formData, batch: e.target.value})}
                                />
                                {availableBatches && availableBatches.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5 mt-2 items-center">
                                        <span className="text-[11px] text-on-surface-variant font-medium mr-1">Quick assign:</span>
                                        {availableBatches.map((b) => (
                                            <button 
                                                key={b}
                                                type="button"
                                                onClick={() => setFormData(prev => ({ ...prev, batch: b }))}
                                                className={`text-[11px] px-2.5 py-0.5 rounded-full border transition-all cursor-pointer ${
                                                    formData.batch === b
                                                        ? 'bg-primary text-on-primary border-primary font-bold'
                                                        : 'border-outline-variant hover:bg-surface-container text-on-surface'
                                                }`}
                                            >
                                                {b}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div className="flex justify-end gap-3 mt-6">
                                <button 
                                    type="button" 
                                    onClick={() => setIsEditModalOpen(false)}
                                    className="px-6 py-2 rounded-full text-on-surface-variant hover:bg-surface-container transition-colors"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit"
                                    className="px-6 py-2 rounded-full bg-primary text-on-primary hover:bg-primary/90 transition-colors shadow-md"
                                >
                                    Save Changes
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Student Modal */}
            {isDeleteModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-surface rounded-2xl p-xl w-[90%] max-w-[500px] shadow-2xl">
                        <div className="flex flex-col items-center text-center gap-4">
                            <div className="w-16 h-16 rounded-full bg-error-container text-error flex items-center justify-center">
                                <span className="material-symbols-outlined text-[32px]">warning</span>
                            </div>
                            <h2 className="font-headline-md text-on-surface">Delete Student?</h2>
                            <p className="font-body-md text-on-surface-variant">
                                Are you sure you want to delete <strong>{currentStudent?.name || currentStudent?.email}</strong>? This action cannot be undone.
                            </p>
                            <div className="flex justify-center gap-3 mt-6 w-full">
                                <button 
                                    onClick={() => setIsDeleteModalOpen(false)}
                                    className="flex-1 py-2 rounded-full border border-outline-variant text-on-surface hover:bg-surface-container transition-colors"
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={handleDelete}
                                    className="flex-1 py-2 rounded-full bg-error text-on-error hover:bg-error/90 transition-colors shadow-md"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
