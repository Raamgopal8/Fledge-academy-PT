'use client';
import { useState, useEffect } from 'react';
import { useCEOContext } from '@/app/ceo/CEOContext';

export default function CEOStaff() {
    const { searchQuery, selectedBatch } = useCEOContext();
    const [staff, setStaff] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    
    const [currentStaff, setCurrentStaff] = useState(null);
    const [formData, setFormData] = useState({ 
        name: '', 
        email: '', 
        password: '', 
        level: 'Level 5', 
        batches: selectedBatch && selectedBatch !== 'All Batches' ? [selectedBatch] : [] 
    });
    const [newBatchInput, setNewBatchInput] = useState('');
    const [formError, setFormError] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const fetchStaff = async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/user/staff`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Failed to fetch staff');
            const data = await res.json();
            setStaff(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchStaff();
    }, []);

    const handleAddBatchTag = (batchToAdd) => {
        const trimmed = (batchToAdd || newBatchInput).trim();
        if (!trimmed) return;
        if (!formData.batches.includes(trimmed)) {
            setFormData(prev => ({ ...prev, batches: [...prev.batches, trimmed] }));
        }
        setNewBatchInput('');
    };

    const handleRemoveBatchTag = (batchToRemove) => {
        setFormData(prev => ({
            ...prev,
            batches: prev.batches.filter(b => b !== batchToRemove)
        }));
    };

    const handleAddSubmit = async (e) => {
        e.preventDefault();
        setFormError('');
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/user/staff`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    name: formData.name,
                    email: formData.email,
                    password: formData.password,
                    level: formData.level,
                    batch: formData.batches[0] || '',
                    batches: formData.batches
                })
            });
            if (!res.ok) {
                let errText = 'Failed to add staff member';
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
            await fetchStaff();
            setIsAddModalOpen(false);
            setFormData({ name: '', email: '', password: '', level: 'Level 5', batches: selectedBatch && selectedBatch !== 'All Batches' ? [selectedBatch] : [] });
            setNewBatchInput('');
        } catch (err) {
            setFormError(err.message);
        }
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        setFormError('');
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/user/staff/${currentStaff.id}`, {
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
                    batch: formData.batches[0] || '',
                    batches: formData.batches
                })
            });
            if (!res.ok) {
                let errText = 'Failed to update staff member';
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
            await fetchStaff();
            setIsEditModalOpen(false);
            setCurrentStaff(null);
            setFormData({ name: '', email: '', password: '', level: 'Level 5', batches: selectedBatch && selectedBatch !== 'All Batches' ? [selectedBatch] : [] });
            setNewBatchInput('');
        } catch (err) {
            setFormError(err.message);
        }
    };

    const handleDelete = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/user/staff/${currentStaff.id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!res.ok) throw new Error('Failed to delete staff member');
            await fetchStaff();
            setIsDeleteModalOpen(false);
            setCurrentStaff(null);
        } catch (err) {
            alert(err.message);
        }
    };

    const openEditModal = (staffMember) => {
        setCurrentStaff(staffMember);
        const existingBatches = staffMember.batches && staffMember.batches.length > 0 
            ? staffMember.batches 
            : (staffMember.batch ? [staffMember.batch] : []);
        setFormData({ 
            name: staffMember.name || '', 
            email: staffMember.email, 
            password: '', 
            level: staffMember.level || 'Level 5', 
            batches: existingBatches 
        });
        setNewBatchInput('');
        setIsEditModalOpen(true);
    };

    const openDeleteModal = (staffMember) => {
        setCurrentStaff(staffMember);
        setIsDeleteModalOpen(true);
    };

    if (isLoading) {
        return (
            <section className="p-gutter max-w-[1440px] mx-auto min-h-[50vh] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4 text-primary">
                    <span className="material-symbols-outlined text-[48px] animate-spin">progress_activity</span>
                    <p className="font-label-lg">Loading Staff...</p>
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

    const filteredStaff = staff.filter(staffMember => {
        const matchesSearch = (staffMember.name || '').toLowerCase().includes((searchQuery || '').toLowerCase()) ||
                              staffMember.email.toLowerCase().includes((searchQuery || '').toLowerCase());
        const overrideBatch = (selectedBatch === 'All Batches' || selectedBatch === 'Global' || selectedBatch === 'Global Access') ? '' : (selectedBatch || '');
        const bList = staffMember.batches && staffMember.batches.length > 0 ? staffMember.batches : (staffMember.batch ? [staffMember.batch] : []);
        const matchesBatch = overrideBatch 
            ? bList.some(b => (b || '').trim().toLowerCase() === overrideBatch.trim().toLowerCase()) 
            : true;
        return matchesSearch && matchesBatch;
    });

    return (
        <div className="max-w-[1440px] mx-auto p-gutter space-y-lg relative pb-32 animate-fade-in">
            <section className="flex flex-col md:flex-row md:items-center justify-between gap-md mb-lg">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="material-symbols-outlined text-primary text-3xl">manage_accounts</span>
                        <h1 className="text-3xl md:text-4xl font-bold tracking-tight bg-gradient-to-r from-[#6FB7E4] via-[#5D8BCC] to-[#465AA3] text-transparent bg-clip-text">
                            Staff Management
                        </h1>
                    </div>
                    <p className="font-body-md text-on-surface-variant max-w-2xl">
                        View, add, edit, and assign multiple batches to staff accounts.
                    </p>
                </div>
                <button 
                    onClick={() => { setFormData({ name: '', email: '', password: '', level: 'Level 5', batches: selectedBatch && selectedBatch !== 'All Batches' ? [selectedBatch] : [] }); setFormError(''); setNewBatchInput(''); setIsAddModalOpen(true); }}
                    className="bg-primary text-on-primary px-5 py-2.5 rounded-2xl font-label-md text-sm hover:bg-primary/90 transition-all flex items-center justify-center gap-2 self-start md:self-auto shadow-xs cursor-pointer active:scale-95"
                >
                    <span className="material-symbols-outlined text-[20px]">person_add</span>
                    <span>Add Staff</span>
                </button>
            </section>

            <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-3xl p-5 md:p-6 custom-shadow hover:shadow-md transition-all flex flex-col">
                <div className="w-full overflow-x-auto custom-scrollbar border border-outline-variant/40 rounded-2xl">
                    <table className="w-full text-left border-collapse min-w-[580px]">
                        <thead className="bg-surface-container-low border-b border-outline-variant/60">
                            <tr>
                                <th className="p-2.5 md:p-md text-xs sm:text-sm font-semibold text-on-surface-variant">Name</th>
                                <th className="p-2.5 md:p-md text-xs sm:text-sm font-semibold text-on-surface-variant">Email</th>
                                <th className="p-2.5 md:p-md text-xs sm:text-sm font-semibold text-on-surface-variant">Level</th>
                                <th className="p-2.5 md:p-md text-xs sm:text-sm font-semibold text-on-surface-variant">Assigned Batches</th>
                                <th className="p-2.5 md:p-md text-xs sm:text-sm font-semibold text-on-surface-variant text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredStaff.map(staffMember => {
                                const bList = staffMember.batches && staffMember.batches.length > 0 ? staffMember.batches : (staffMember.batch ? [staffMember.batch] : []);
                                return (
                                    <tr key={staffMember.id} className="border-b border-outline-variant hover:bg-surface-container-lowest transition-colors">
                                        <td className="p-md font-body-md text-on-surface">{staffMember.name || 'N/A'}</td>
                                        <td className="p-md font-body-md text-on-surface-variant">{staffMember.email}</td>
                                        <td className="p-md font-body-md text-on-surface-variant">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                staffMember.level === 'Level 5' ? 'bg-blue-100 text-blue-800' :
                                                staffMember.level === 'Level 4' ? 'bg-purple-100 text-purple-800' :
                                                staffMember.level === 'Level 3' ? 'bg-orange-100 text-orange-800' :
                                                staffMember.level === 'Level 2' ? 'bg-green-100 text-green-800' :
                                                staffMember.level === 'Level 1' ? 'bg-red-100 text-red-800' :
                                                'bg-gray-100 text-gray-800'
                                            }`}>
                                                {staffMember.level || 'Level 5'}
                                            </span>
                                        </td>
                                        <td className="p-md font-body-md text-on-surface-variant">
                                            <div className="flex flex-wrap gap-1.5 items-center">
                                                {bList.length > 0 ? (
                                                    bList.map((b, idx) => (
                                                        <span key={idx} className="bg-primary/10 text-primary border border-primary/20 px-2.5 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1">
                                                            <span className="material-symbols-outlined text-[14px]">groups</span>
                                                            {b}
                                                        </span>
                                                    ))
                                                ) : (
                                                    <span className="bg-surface-container-high px-2 py-0.5 rounded text-xs font-medium text-on-surface-variant">
                                                        Unassigned
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-md flex justify-end gap-sm">
                                            <button 
                                                onClick={() => openEditModal(staffMember)}
                                                className="text-secondary hover:text-primary transition-colors p-2 rounded-full hover:bg-secondary-container flex items-center justify-center"
                                                title="Edit Staff"
                                            >
                                                <span className="material-symbols-outlined">edit</span>
                                            </button>
                                            <button 
                                                onClick={() => openDeleteModal(staffMember)}
                                                className="text-error hover:text-error/80 transition-colors p-2 rounded-full hover:bg-error-container flex items-center justify-center"
                                                title="Delete Staff"
                                            >
                                                <span className="material-symbols-outlined">delete</span>
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                            {filteredStaff.length === 0 && (
                                <tr>
                                    <td colSpan="5" className="p-xl text-center text-on-surface-variant font-body-lg">
                                        No staff found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add Staff Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-surface rounded-2xl p-xl w-[90%] max-w-[540px] shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
                        <h2 className="font-headline-md text-on-surface mb-md">Add New Staff</h2>
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
                                <label className="block text-label-md text-on-surface-variant mb-1">Assigned Batches (Multiple)</label>
                                <div className="flex gap-2 mb-2">
                                    <input 
                                        type="text" 
                                        placeholder="e.g. Batch - 1"
                                        className="flex-1 bg-surface-container-low border border-outline-variant rounded-lg p-3 text-on-surface focus:outline-none focus:border-primary transition-colors text-sm"
                                        value={newBatchInput}
                                        onChange={(e) => setNewBatchInput(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                handleAddBatchTag();
                                            }
                                        }}
                                    />
                                    <button 
                                        type="button"
                                        onClick={() => handleAddBatchTag()}
                                        className="px-4 py-2 bg-primary/10 text-primary hover:bg-primary/20 border border-primary/30 rounded-lg text-sm font-semibold transition-colors flex items-center gap-1"
                                    >
                                        <span className="material-symbols-outlined text-[18px]">add</span>
                                        Add Batch
                                    </button>
                                </div>

                                {/* Active Assigned Batches Chips */}
                                <div className="flex flex-wrap gap-2 min-h-[38px] p-2 bg-surface-container-low border border-outline-variant/50 rounded-lg items-center">
                                    {formData.batches && formData.batches.length > 0 ? (
                                        formData.batches.map((b, idx) => (
                                            <span key={idx} className="bg-primary text-on-primary px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 shadow-sm">
                                                <span>{b}</span>
                                                <button 
                                                    type="button" 
                                                    onClick={() => handleRemoveBatchTag(b)} 
                                                    className="hover:bg-black/20 rounded-full p-0.5 transition-colors flex items-center justify-center"
                                                >
                                                    <span className="material-symbols-outlined text-[14px]">close</span>
                                                </button>
                                            </span>
                                        ))
                                    ) : (
                                        <span className="text-xs text-on-surface-variant/70 italic">No batches assigned yet. Enter batch above or click quick suggestions below.</span>
                                    )}
                                </div>

                                {/* Quick Suggestions */}
                                <div className="flex flex-wrap gap-1.5 mt-2 items-center">
                                    <span className="text-[11px] text-on-surface-variant font-medium mr-1">Quick add:</span>
                                    {['Batch - 1', 'Batch - 2', 'Batch - 3', 'Batch - 4'].map((b) => (
                                        <button 
                                            key={b}
                                            type="button"
                                            onClick={() => handleAddBatchTag(b)}
                                            disabled={formData.batches.includes(b)}
                                            className="text-[11px] px-2 py-0.5 rounded-full border border-outline-variant hover:bg-surface-container-high text-on-surface disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                        >
                                            + {b}
                                        </button>
                                    ))}
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
                                    Add Staff
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Staff Modal */}
            {isEditModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-surface rounded-2xl p-xl w-[90%] max-w-[540px] shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
                        <h2 className="font-headline-md text-on-surface mb-md">Edit Staff</h2>
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
                                <label className="block text-label-md text-on-surface-variant mb-1">Assigned Batches (Multiple)</label>
                                <div className="flex gap-2 mb-2">
                                    <input 
                                        type="text" 
                                        placeholder="e.g. Batch - 1"
                                        className="flex-1 bg-surface-container-low border border-outline-variant rounded-lg p-3 text-on-surface focus:outline-none focus:border-primary transition-colors text-sm"
                                        value={newBatchInput}
                                        onChange={(e) => setNewBatchInput(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                handleAddBatchTag();
                                            }
                                        }}
                                    />
                                    <button 
                                        type="button"
                                        onClick={() => handleAddBatchTag()}
                                        className="px-4 py-2 bg-primary/10 text-primary hover:bg-primary/20 border border-primary/30 rounded-lg text-sm font-semibold transition-colors flex items-center gap-1"
                                    >
                                        <span className="material-symbols-outlined text-[18px]">add</span>
                                        Add Batch
                                    </button>
                                </div>

                                {/* Active Assigned Batches Chips */}
                                <div className="flex flex-wrap gap-2 min-h-[38px] p-2 bg-surface-container-low border border-outline-variant/50 rounded-lg items-center">
                                    {formData.batches && formData.batches.length > 0 ? (
                                        formData.batches.map((b, idx) => (
                                            <span key={idx} className="bg-primary text-on-primary px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 shadow-sm">
                                                <span>{b}</span>
                                                <button 
                                                    type="button" 
                                                    onClick={() => handleRemoveBatchTag(b)} 
                                                    className="hover:bg-black/20 rounded-full p-0.5 transition-colors flex items-center justify-center"
                                                >
                                                    <span className="material-symbols-outlined text-[14px]">close</span>
                                                </button>
                                            </span>
                                        ))
                                    ) : (
                                        <span className="text-xs text-on-surface-variant/70 italic">No batches assigned yet. Enter batch above or click quick suggestions below.</span>
                                    )}
                                </div>

                                {/* Quick Suggestions */}
                                <div className="flex flex-wrap gap-1.5 mt-2 items-center">
                                    <span className="text-[11px] text-on-surface-variant font-medium mr-1">Quick add:</span>
                                    {['Batch - 1', 'Batch - 2', 'Batch - 3', 'Batch - 4'].map((b) => (
                                        <button 
                                            key={b}
                                            type="button"
                                            onClick={() => handleAddBatchTag(b)}
                                            disabled={formData.batches.includes(b)}
                                            className="text-[11px] px-2 py-0.5 rounded-full border border-outline-variant hover:bg-surface-container-high text-on-surface disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                        >
                                            + {b}
                                        </button>
                                    ))}
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

            {/* Delete Staff Modal */}
            {isDeleteModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-surface rounded-2xl p-xl w-[90%] max-w-[500px] shadow-2xl">
                        <div className="flex flex-col items-center text-center gap-4">
                            <div className="w-16 h-16 rounded-full bg-error-container text-error flex items-center justify-center">
                                <span className="material-symbols-outlined text-[32px]">warning</span>
                            </div>
                            <h2 className="font-headline-md text-on-surface">Delete Staff Member?</h2>
                            <p className="font-body-md text-on-surface-variant">
                                Are you sure you want to delete <strong>{currentStaff?.name || currentStaff?.email}</strong>? This action cannot be undone.
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
