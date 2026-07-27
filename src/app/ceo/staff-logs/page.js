'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCEOContext } from '@/app/ceo/CEOContext';

export default function CEOStaffLogs() {
    const { searchQuery } = useCEOContext();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('logs'); // 'logs' or 'manage'

    // Logs state
    const [logs, setLogs] = useState([]);
    const [logsLoading, setLogsLoading] = useState(true);
    const [logsError, setLogsError] = useState(null);

    // Staff state
    const [staffList, setStaffList] = useState([]);
    const [staffLoading, setStaffLoading] = useState(true);
    const [staffError, setStaffError] = useState(null);
    
    // Modals state
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isClearLogsModalOpen, setIsClearLogsModalOpen] = useState(false);
    const [showLogsMenu, setShowLogsMenu] = useState(false);
    
    const [currentStaff, setCurrentStaff] = useState(null);
    const [formData, setFormData] = useState({ name: '', email: '', password: '' });
    const [formError, setFormError] = useState('');

    const fetchLogs = async () => {
        setLogsLoading(true);
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/staff-logs`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (response.status === 401) {
                localStorage.removeItem('token');
                router.push('/login');
                return;
            }

            if (response.ok) {
                const data = await response.json();
                setLogs(data);
            } else {
                const errData = await response.json();
                setLogsError(errData.detail || 'Failed to fetch logs');
            }
        } catch (error) {
            console.error("Error fetching staff logs:", error);
            setLogsError('Network error occurred while fetching logs');
        } finally {
            setLogsLoading(false);
        }
    };

    const fetchStaff = async () => {
        setStaffLoading(true);
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/user/staff`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (res.status === 401) {
                localStorage.removeItem('token');
                router.push('/login');
                return;
            }

            if (!res.ok) throw new Error('Failed to fetch staff');
            const data = await res.json();
            setStaffList(data);
        } catch (err) {
            setStaffError(err.message);
        } finally {
            setStaffLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
        fetchStaff();
    }, []);

    const handleAddSubmit = async (e) => {
        e.preventDefault();
        setFormError('');
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/user/staff`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.detail || 'Failed to add staff');
            }
            await fetchStaff();
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
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/user/staff/${currentStaff.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    name: formData.name,
                    email: formData.email,
                    password: formData.password || undefined
                })
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.detail || 'Failed to update staff');
            }
            await fetchStaff();
            setIsEditModalOpen(false);
            setCurrentStaff(null);
            setFormData({ name: '', email: '', password: '' });
        } catch (err) {
            setFormError(err.message);
        }
    };

    const handleDelete = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/user/staff/${currentStaff.id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!res.ok) throw new Error('Failed to delete staff');
            await fetchStaff();
            setIsDeleteModalOpen(false);
            setCurrentStaff(null);
        } catch (err) {
            alert(err.message);
        }
    };

    const handleClearLogs = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/staff-logs`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!res.ok) throw new Error('Failed to clear logs');
            await fetchLogs();
            setIsClearLogsModalOpen(false);
        } catch (err) {
            alert(err.message);
        }
    };


    const openEditModal = (staff) => {
        setCurrentStaff(staff);
        setFormData({ name: staff.name || '', email: staff.email, password: '' });
        setIsEditModalOpen(true);
    };

    const openDeleteModal = (staff) => {
        setCurrentStaff(staff);
        setIsDeleteModalOpen(true);
    };

    const filteredLogs = logs.filter(log => 
        log.staff_name?.toLowerCase().includes((searchQuery || '').toLowerCase()) ||
        log.action?.toLowerCase().includes((searchQuery || '').toLowerCase()) ||
        (log.details && log.details.toLowerCase().includes((searchQuery || '').toLowerCase()))
    );

    const filteredStaff = staffList.filter(staff => 
        (staff.name || '').toLowerCase().includes((searchQuery || '').toLowerCase()) ||
        staff.email.toLowerCase().includes((searchQuery || '').toLowerCase())
    );

    const formatDate = (isoString) => {
        const date = new Date(isoString);
        return date.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <section className="p-gutter max-w-6xl mx-auto space-y-lg animate-fade-in">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-md mb-md">
                <div>
                    <div className="flex items-center gap-sm mb-xs">
                        <span className="material-symbols-outlined text-primary text-3xl">group</span>
                        <h1 className="font-display-sm md:font-display-md text-on-surface">Staff Management</h1>
                    </div>
                    <p className="font-body-lg text-on-surface-variant max-w-2xl">
                        Monitor staff engagement and manage staff accounts
                    </p>
                </div>
                {activeTab === 'manage' && (
                    <button 
                        onClick={() => { setFormData({ name: '', email: '', password: '' }); setFormError(''); setIsAddModalOpen(true); }}
                        className="bg-primary text-on-primary px-lg py-sm rounded-full font-label-lg hover:bg-primary/90 transition-colors flex items-center gap-sm"
                    >
                        <span className="material-symbols-outlined">person_add</span>
                        Add Staff
                    </button>
                )}
            </div>

            {/* Tabs */}
            <div className="flex justify-between items-center border-b border-outline-variant mb-6">
                <div className="flex gap-4">
                    <button
                        onClick={() => setActiveTab('logs')}
                        className={`pb-2 px-4 font-label-lg transition-colors ${activeTab === 'logs' ? 'border-b-2 border-primary text-primary' : 'text-on-surface-variant hover:text-on-surface'}`}
                    >
                        Activity Logs
                    </button>
                    <button
                        onClick={() => setActiveTab('manage')}
                        className={`pb-2 px-4 font-label-lg transition-colors ${activeTab === 'manage' ? 'border-b-2 border-primary text-primary' : 'text-on-surface-variant hover:text-on-surface'}`}
                    >
                        Manage Staff
                    </button>
                </div>
                {activeTab === 'logs' && (
                    <div className="relative mb-2">
                        <button 
                            onClick={() => setShowLogsMenu(!showLogsMenu)}
                            className="p-2 text-on-surface-variant hover:bg-surface-container rounded-full transition-colors flex items-center justify-center"
                        >
                            <span className="material-symbols-outlined">more_vert</span>
                        </button>
                        {showLogsMenu && (
                            <>
                                <div className="fixed inset-0 z-40" onClick={() => setShowLogsMenu(false)}></div>
                                <div className="absolute right-0 mt-2 w-48 bg-surface border border-outline-variant rounded-xl shadow-lg overflow-hidden z-50 animate-fade-in">
                                    <button
                                        onClick={() => {
                                            setShowLogsMenu(false);
                                            setIsClearLogsModalOpen(true);
                                        }}
                                        className="w-full text-left px-4 py-3 text-error hover:bg-error-container hover:text-on-error-container transition-colors font-label-md flex items-center gap-2"
                                    >
                                        <span className="material-symbols-outlined text-[20px]">delete_sweep</span>
                                        Clear All Logs
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>

            {/* Tab Content: Logs */}
            {activeTab === 'logs' && (
                <div className="bento-card overflow-hidden animate-fade-in">
                    <div className="overflow-x-auto custom-scrollbar">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-surface-container-low border-b border-outline-variant">
                                <tr>
                                    <th className="p-md text-label-lg font-label-lg text-on-surface-variant">Timestamp</th>
                                    <th className="p-md text-label-lg font-label-lg text-on-surface-variant">Staff Name</th>
                                    <th className="p-md text-label-lg font-label-lg text-on-surface-variant">Action</th>
                                    <th className="p-md text-label-lg font-label-lg text-on-surface-variant">Details</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-outline-variant">
                                {logsLoading ? (
                                    <tr>
                                        <td colSpan="4" className="p-xl text-center">
                                            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent"></div>
                                            <p className="mt-sm text-body-md text-on-surface-variant">Loading logs...</p>
                                        </td>
                                    </tr>
                                ) : logsError ? (
                                    <tr>
                                        <td colSpan="4" className="p-xl text-center text-error">
                                            <span className="material-symbols-outlined text-4xl mb-2">error</span>
                                            <p className="text-title-md font-title-md">{logsError}</p>
                                        </td>
                                    </tr>
                                ) : filteredLogs.length === 0 ? (
                                    <tr>
                                        <td colSpan="4" className="p-xl text-center text-on-surface-variant">
                                            <span className="material-symbols-outlined text-4xl mb-2">history_toggle_off</span>
                                            <p className="text-title-md font-title-md">No logs found</p>
                                            <p className="text-body-md">Adjust your search or check back later.</p>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredLogs.map((log) => (
                                        <tr key={log.id} className="hover:bg-surface-container-low transition-colors group">
                                            <td className="p-md text-body-md text-on-surface-variant whitespace-nowrap">
                                                {formatDate(log.timestamp)}
                                            </td>
                                            <td className="p-md">
                                                <div className="flex items-center gap-sm">
                                                    <div className="w-8 h-8 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-bold text-label-md group-hover:scale-105 transition-transform">
                                                        {log.staff_name?.charAt(0).toUpperCase()}
                                                    </div>
                                                    <span className="text-body-md font-bold text-on-surface">{log.staff_name}</span>
                                                </div>
                                            </td>
                                            <td className="p-md">
                                                <span className="inline-flex items-center gap-1 bg-tertiary-container text-on-tertiary-container px-3 py-1 rounded-full text-label-sm font-bold capitalize shadow-sm">
                                                    {log.action?.replace(/_/g, ' ')}
                                                </span>
                                            </td>
                                            <td className="p-md text-body-md text-on-surface">
                                                {log.details || <span className="text-on-surface-variant italic">No details</span>}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Tab Content: Manage Staff */}
            {activeTab === 'manage' && (
                <div className="bento-card overflow-hidden animate-fade-in">
                    <div className="overflow-x-auto custom-scrollbar">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-surface-container-low border-b border-outline-variant">
                                <tr>
                                    <th className="p-md font-label-lg text-on-surface-variant">Name</th>
                                    <th className="p-md font-label-lg text-on-surface-variant">Email</th>
                                    <th className="p-md font-label-lg text-on-surface-variant text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-outline-variant">
                                {staffLoading ? (
                                    <tr>
                                        <td colSpan="3" className="p-xl text-center">
                                            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent"></div>
                                            <p className="mt-sm text-body-md text-on-surface-variant">Loading staff...</p>
                                        </td>
                                    </tr>
                                ) : staffError ? (
                                    <tr>
                                        <td colSpan="3" className="p-xl text-center text-error">
                                            <span className="material-symbols-outlined text-4xl mb-2">error</span>
                                            <p className="text-title-md font-title-md">{staffError}</p>
                                        </td>
                                    </tr>
                                ) : filteredStaff.length === 0 ? (
                                    <tr>
                                        <td colSpan="3" className="p-xl text-center text-on-surface-variant font-body-lg">
                                            No staff members found.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredStaff.map(staff => (
                                        <tr key={staff.id} className="hover:bg-surface-container-low transition-colors group">
                                            <td className="p-md font-body-md text-on-surface">
                                                <div className="flex items-center gap-sm">
                                                    <div className="w-8 h-8 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center font-bold text-label-md group-hover:scale-105 transition-transform">
                                                        {staff.name?.charAt(0).toUpperCase() || 'S'}
                                                    </div>
                                                    <span className="font-bold">{staff.name || 'N/A'}</span>
                                                </div>
                                            </td>
                                            <td className="p-md font-body-md text-on-surface-variant">{staff.email}</td>
                                            <td className="p-md flex justify-end gap-sm">
                                                <button 
                                                    onClick={() => openEditModal(staff)}
                                                    className="text-secondary hover:text-primary transition-colors p-2 rounded-full hover:bg-secondary-container flex items-center justify-center"
                                                    title="Edit Staff"
                                                >
                                                    <span className="material-symbols-outlined">edit</span>
                                                </button>
                                                <button 
                                                    onClick={() => openDeleteModal(staff)}
                                                    className="text-error hover:text-error/80 transition-colors p-2 rounded-full hover:bg-error-container flex items-center justify-center"
                                                    title="Delete Staff"
                                                >
                                                    <span className="material-symbols-outlined">delete</span>
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Add Staff Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-surface rounded-2xl p-6 w-full max-w-[400px] shadow-2xl">
                        <h2 className="font-headline-md text-on-surface mb-md">Add New Staff Member</h2>
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
                                <input 
                                    type="password" 
                                    required
                                    className="w-full bg-surface-container-low border border-outline-variant rounded-lg p-3 text-on-surface focus:outline-none focus:border-primary transition-colors"
                                    value={formData.password}
                                    onChange={(e) => setFormData({...formData, password: e.target.value})}
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
                    <div className="bg-surface rounded-2xl p-6 w-full max-w-[400px] shadow-2xl">
                        <h2 className="font-headline-md text-on-surface mb-md">Edit Staff Member</h2>
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
                                <input 
                                    type="password" 
                                    className="w-full bg-surface-container-low border border-outline-variant rounded-lg p-3 text-on-surface focus:outline-none focus:border-primary transition-colors"
                                    value={formData.password}
                                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                                />
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
                    <div className="bg-surface rounded-2xl p-6 w-full max-w-[400px] shadow-2xl">
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

            {/* Clear Logs Modal */}
            {isClearLogsModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-surface rounded-2xl p-6 w-full max-w-[400px] shadow-2xl">
                        <div className="flex flex-col items-center text-center gap-4">
                            <div className="w-16 h-16 rounded-full bg-error-container text-error flex items-center justify-center">
                                <span className="material-symbols-outlined text-[32px]">delete_sweep</span>
                            </div>
                            <h2 className="font-headline-md text-on-surface">Clear All Logs?</h2>
                            <p className="font-body-md text-on-surface-variant">
                                Are you sure you want to delete all staff activity logs? This action cannot be undone.
                            </p>
                            <div className="flex justify-center gap-3 mt-6 w-full">
                                <button 
                                    onClick={() => setIsClearLogsModalOpen(false)}
                                    className="flex-1 py-2 rounded-full border border-outline-variant text-on-surface hover:bg-surface-container transition-colors"
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={handleClearLogs}
                                    className="flex-1 py-2 rounded-full bg-error text-on-error hover:bg-error/90 transition-colors shadow-md"
                                >
                                    Clear Logs
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}
