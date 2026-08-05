'use client';
import { useState, useEffect } from 'react';
import { useCEOContext } from '@/app/ceo/CEOContext';

export default function CEOStudents() {
    const { searchQuery } = useCEOContext();
    const [students, setStudents] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    
    const [currentStudent, setCurrentStudent] = useState(null);
    const [formData, setFormData] = useState({ name: '', email: '', password: '' });
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
                body: JSON.stringify(formData)
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.detail || 'Failed to add student');
            }
            await fetchStudents();
            setIsAddModalOpen(false);
            setFormData({ name: '', email: '', password: '' });
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
                    password: formData.password || undefined // Only send password if changed
                })
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.detail || 'Failed to update student');
            }
            await fetchStudents();
            setIsEditModalOpen(false);
            setCurrentStudent(null);
            setFormData({ name: '', email: '', password: '' });
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
        setFormData({ name: student.name || '', email: student.email, password: '' });
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

    const filteredStudents = students.filter(student => 
        (student.name || '').toLowerCase().includes((searchQuery || '').toLowerCase()) ||
        student.email.toLowerCase().includes((searchQuery || '').toLowerCase())
    );

    return (
        <section className="p-gutter max-w-[1440px] mx-auto space-y-lg">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="font-headline-lg text-primary">Student Management</h1>
                    <p className="font-body-md text-on-surface-variant">View, add, edit, and remove student accounts.</p>
                </div>
                <button 
                    onClick={() => { setFormData({ name: '', email: '', password: '' }); setFormError(''); setIsAddModalOpen(true); }}
                    className="bg-primary text-on-primary px-lg py-sm rounded-full font-label-lg hover:bg-primary/90 transition-colors flex items-center gap-sm"
                >
                    <span className="material-symbols-outlined">person_add</span>
                    Add Student
                </button>
            </div>

            <div className="bento-card overflow-hidden">
                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-surface-container-low border-b border-outline-variant">
                            <tr>
                                <th className="p-md font-label-lg text-on-surface-variant">Name</th>
                                <th className="p-md font-label-lg text-on-surface-variant">Email</th>
                                <th className="p-md font-label-lg text-on-surface-variant text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredStudents.map(student => (
                                <tr key={student.id} className="border-b border-outline-variant hover:bg-surface-container-lowest transition-colors">
                                    <td className="p-md font-body-md text-on-surface">{student.name || 'N/A'}</td>
                                    <td className="p-md font-body-md text-on-surface-variant">{student.email}</td>
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
                        <h2 className="font-headline-md text-on-surface mb-md">Add New Student</h2>
                        {formError && <p className="text-error mb-4 text-sm bg-error-container p-2 rounded">{formError}</p>}
                        <form onSubmit={handleAddSubmit} className="space-y-4">
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
                                <label className="block text-label-md text-on-surface-variant mb-1">Password</label>
                                <div className="relative">
                                    <input 
                                        type={showPassword ? "text" : "password"}
                                        required
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
                                    className="px-6 py-2 rounded-full bg-primary text-on-primary hover:bg-primary/90 transition-colors shadow-md"
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
        </section>
    );
}
