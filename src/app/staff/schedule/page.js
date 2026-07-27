'use client';

import { useState, useEffect } from 'react';

const DAYS_OF_WEEK = [
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
    'Sunday'
];

const COLOR_OPTIONS = [
    { value: 'primary', label: 'Primary (Blue)', bg: 'bg-primary-container/15', text: 'text-primary', border: 'border-primary' },
    { value: 'secondary', label: 'Secondary (Green)', bg: 'bg-secondary-container/30', text: 'text-secondary', border: 'border-secondary' },
    { value: 'tertiary', label: 'Tertiary (Gold/Brown)', bg: 'bg-tertiary-container/20', text: 'text-tertiary', border: 'border-tertiary' },
    { value: 'error', label: 'Error (Red)', bg: 'bg-error-container/20', text: 'text-error', border: 'border-error' }
];

export default function SchedulePage() {
    const [schedules, setSchedules] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('Monday');
    
    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSchedule, setEditingSchedule] = useState(null); // null means adding new
    
    // Form State
    const [formData, setFormData] = useState({
        name: '',
        time: '',
        location: '',
        students: 15,
        day_of_week: 'Monday',
        color: 'primary'
    });

    const [formError, setFormError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchSchedules = async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem('token');
            const headers = {
                'Authorization': `Bearer ${token}`
            };
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/schedule`, { headers });
            if (!res.ok) {
                throw new Error('Failed to fetch schedule items');
            }
            const data = await res.json();
            setSchedules(data);
        } catch (err) {
            console.error('Error fetching schedules:', err);
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchSchedules();
    }, []);

    const openAddModal = () => {
        setEditingSchedule(null);
        setFormData({
            name: '',
            time: '09:00 AM - 10:30 AM',
            location: '',
            students: 15,
            day_of_week: activeTab,
            color: 'primary'
        });
        setFormError('');
        setIsModalOpen(true);
    };

    const openEditModal = (schedule) => {
        setEditingSchedule(schedule);
        setFormData({
            name: schedule.name,
            time: schedule.time,
            location: schedule.location,
            students: schedule.students,
            day_of_week: schedule.day_of_week,
            color: schedule.color
        });
        setFormError('');
        setIsModalOpen(true);
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        setFormError('');
        setIsSubmitting(true);

        const token = localStorage.getItem('token');
        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        };

        const url = editingSchedule 
            ? `${process.env.NEXT_PUBLIC_API_URL}/api/schedule/${editingSchedule.id}`
            : `${process.env.NEXT_PUBLIC_API_URL}/api/schedule`;
        
        const method = editingSchedule ? 'PUT' : 'POST';

        try {
            const res = await fetch(url, {
                method,
                headers,
                body: JSON.stringify(formData)
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.detail || 'Failed to save schedule');
            }

            // Refresh schedules list
            await fetchSchedules();
            setIsModalOpen(false);
        } catch (err) {
            console.error('Error saving schedule:', err);
            setFormError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this class schedule?')) return;

        const token = localStorage.getItem('token');
        const headers = {
            'Authorization': `Bearer ${token}`
        };

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/schedule/${id}`, {
                method: 'DELETE',
                headers
            });

            if (!res.ok) {
                throw new Error('Failed to delete schedule item');
            }

            await fetchSchedules();
        } catch (err) {
            console.error('Error deleting schedule:', err);
            alert(err.message);
        }
    };

    // Helper for color configuration
    const getColorConfig = (colorVal) => {
        return COLOR_OPTIONS.find(opt => opt.value === colorVal) || COLOR_OPTIONS[0];
    };

    const filteredSchedules = schedules.filter(s => s.day_of_week === activeTab);

    if (isLoading && schedules.length === 0) {
        return (
            <div className="p-gutter max-w-[1440px] mx-auto min-h-[50vh] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4 text-primary">
                    <span className="material-symbols-outlined text-[48px] animate-spin">progress_activity</span>
                    <p className="font-label-lg">Loading Schedules...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-[1440px] mx-auto p-gutter space-y-lg mt-6">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-md">
                <div>
                    <h2 className="font-headline-lg text-headline-lg text-on-surface">Class Schedule Management</h2>
                    <p className="font-body-md text-body-md text-on-surface-variant">Create, update, and manage weekly class sessions and room allocations.</p>
                </div>
                <button 
                    onClick={openAddModal}
                    className="flex items-center justify-center bg-primary text-on-primary px-6 py-3 rounded-lg font-label-md text-label-md gap-2 hover:opacity-90 active:scale-95 transition-all shadow-sm cursor-pointer"
                >
                    <span className="material-symbols-outlined">add</span>
                    Add Class
                </button>
            </div>

            {/* Error Callout */}
            {error && (
                <div className="p-lg bg-error-container text-on-error-container rounded-xl flex items-center gap-md">
                    <span className="material-symbols-outlined text-[32px]">error</span>
                    <div>
                        <h3 className="font-headline-md">Error Loading Schedules</h3>
                        <p className="font-body-md">{error}</p>
                    </div>
                </div>
            )}

            {/* Main Workspace Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-md items-start">
                
                {/* Left Side: Days Navigation */}
                <div className="bg-surface-container-lowest p-sm rounded-xl custom-shadow border border-surface-container flex flex-row lg:flex-col overflow-x-auto lg:overflow-x-visible gap-1 scrollbar-none">
                    {DAYS_OF_WEEK.map((day) => {
                        const count = schedules.filter(s => s.day_of_week === day).length;
                        const isActive = activeTab === day;
                        return (
                            <button
                                key={day}
                                onClick={() => setActiveTab(day)}
                                className={`flex items-center justify-between px-4 py-3 rounded-lg font-label-md text-label-md whitespace-nowrap transition-all cursor-pointer min-w-[120px] lg:w-full ${
                                    isActive
                                        ? 'bg-secondary-container text-on-secondary-container font-bold'
                                        : 'text-on-surface-variant hover:bg-surface-container-low'
                                }`}
                            >
                                <span>{day}</span>
                                <span className={`ml-2 px-2 py-0.5 rounded-full text-[11px] font-bold ${
                                    isActive 
                                        ? 'bg-on-secondary-container/10 text-on-secondary-container'
                                        : 'bg-surface-container-highest text-outline'
                                }`}>
                                    {count}
                                </span>
                            </button>
                        );
                    })}
                </div>

                {/* Right Side: Schedule List */}
                <div className="lg:col-span-3 space-y-md">
                    <div className="bg-surface-container-lowest p-md rounded-xl custom-shadow border border-surface-container relative overflow-hidden">
                        <div className="h-1 w-full absolute top-0 left-0 bg-primary"></div>
                        <div className="flex items-center justify-between mb-md">
                            <h3 className="font-headline-md text-headline-md">{activeTab} Schedule</h3>
                            <span className="text-body-sm text-on-surface-variant">{filteredSchedules.length} class(es) scheduled</span>
                        </div>

                        {filteredSchedules.length === 0 ? (
                            <div className="py-xl flex flex-col items-center justify-center text-center text-outline">
                                <span className="material-symbols-outlined text-[64px] mb-sm opacity-50">calendar_today</span>
                                <h4 className="font-headline-md text-on-surface mb-xs">No Classes Scheduled</h4>
                                <p className="font-body-md max-w-sm">No class activities have been planned for {activeTab} yet. Click "Add Class" to schedule one.</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-outline-variant/30">
                                {filteredSchedules.map((item) => {
                                    const col = getColorConfig(item.color);
                                    return (
                                        <div key={item.id} className="py-md first:pt-0 last:pb-0 flex flex-col md:flex-row md:items-center justify-between gap-md group">
                                            <div className="flex items-start gap-md">
                                                {/* Left Icon Panel */}
                                                <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${col.bg} ${col.text} shrink-0`}>
                                                    <span className="material-symbols-outlined text-[28px]">school</span>
                                                </div>
                                                {/* Details Panel */}
                                                <div>
                                                    <h4 className="font-headline-md text-label-md text-on-surface group-hover:text-primary transition-colors">{item.name}</h4>
                                                    <div className="flex flex-wrap items-center gap-x-md gap-y-1 mt-1 text-body-sm text-on-surface-variant">
                                                        <span className="flex items-center gap-1">
                                                            <span className="material-symbols-outlined text-sm">schedule</span>
                                                            {item.time}
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <span className="material-symbols-outlined text-sm">location_on</span>
                                                            {item.location}
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <span className="material-symbols-outlined text-sm">group</span>
                                                            {item.students} Students
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Action Buttons */}
                                            <div className="flex items-center gap-sm self-end md:self-center">
                                                <button
                                                    onClick={() => openEditModal(item)}
                                                    className="p-2 text-outline hover:text-primary hover:bg-surface-container rounded-lg transition-colors cursor-pointer"
                                                    title="Edit Class"
                                                >
                                                    <span className="material-symbols-outlined">edit</span>
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(item.id)}
                                                    className="p-2 text-outline hover:text-error hover:bg-surface-container rounded-lg transition-colors cursor-pointer"
                                                    title="Delete Class"
                                                >
                                                    <span className="material-symbols-outlined">delete</span>
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Modal Dialog */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-gutter">
                    <div className="bg-surface-container-lowest w-full max-w-[540px] rounded-2xl shadow-xl border border-surface-container overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        {/* Modal Header */}
                        <div className="px-md py-md bg-surface-container border-b border-outline-variant flex items-center justify-between">
                            <h3 className="font-headline-md text-headline-md">
                                {editingSchedule ? 'Edit Class Schedule' : 'Add New Class Schedule'}
                            </h3>
                            <button 
                                onClick={() => setIsModalOpen(false)}
                                className="p-1 hover:bg-surface-container-high rounded-full transition-colors cursor-pointer"
                            >
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        {/* Modal Form */}
                        <form onSubmit={handleFormSubmit} className="p-md space-y-md">
                            {formError && (
                                <div className="p-3 bg-error-container text-on-error-container rounded-lg text-body-sm flex items-center gap-2">
                                    <span className="material-symbols-outlined text-[20px]">error</span>
                                    {formError}
                                </div>
                            )}

                            {/* Class Name */}
                            <div className="space-y-xs">
                                <label className="text-label-md text-on-surface-variant" htmlFor="className">
                                    Class Name / Course Title
                                </label>
                                <input
                                    id="className"
                                    type="text"
                                    required
                                    className="w-full h-[48px] px-4 bg-surface-container-low border border-outline-variant rounded-xl focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all text-body-md"
                                    placeholder="e.g. Adv. Mathematics II"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>

                            {/* Grid row for Day & Time */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
                                {/* Day of Week */}
                                <div className="space-y-xs">
                                    <label className="text-label-md text-on-surface-variant" htmlFor="dayOfWeek">
                                        Day of Week
                                    </label>
                                    <select
                                        id="dayOfWeek"
                                        className="w-full h-[48px] px-4 bg-surface-container-low border border-outline-variant rounded-xl focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all text-body-md cursor-pointer"
                                        value={formData.day_of_week}
                                        onChange={(e) => setFormData({ ...formData, day_of_week: e.target.value })}
                                    >
                                        {DAYS_OF_WEEK.map(day => (
                                            <option key={day} value={day}>{day}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Time Slot */}
                                <div className="space-y-xs">
                                    <label className="text-label-md text-on-surface-variant" htmlFor="timeSlot">
                                        Time Slot
                                    </label>
                                    <input
                                        id="timeSlot"
                                        type="text"
                                        required
                                        className="w-full h-[48px] px-4 bg-surface-container-low border border-outline-variant rounded-xl focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all text-body-md"
                                        placeholder="e.g. 09:00 AM - 10:30 AM"
                                        value={formData.time}
                                        onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                                    />
                                </div>
                            </div>

                            {/* Grid row for Location & Students */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
                                {/* Location */}
                                <div className="space-y-xs">
                                    <label className="text-label-md text-on-surface-variant" htmlFor="location">
                                        Location / Room
                                    </label>
                                    <input
                                        id="location"
                                        type="text"
                                        required
                                        className="w-full h-[48px] px-4 bg-surface-container-low border border-outline-variant rounded-xl focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all text-body-md"
                                        placeholder="e.g. Room 304 or Virtual"
                                        value={formData.location}
                                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                    />
                                </div>

                                {/* Enrolled Students */}
                                <div className="space-y-xs">
                                    <label className="text-label-md text-on-surface-variant" htmlFor="students">
                                        Students Enrolled
                                    </label>
                                    <input
                                        id="students"
                                        type="number"
                                        min="0"
                                        required
                                        className="w-full h-[48px] px-4 bg-surface-container-low border border-outline-variant rounded-xl focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all text-body-md"
                                        value={formData.students}
                                        onChange={(e) => setFormData({ ...formData, students: parseInt(e.target.value) || 0 })}
                                    />
                                </div>
                            </div>

                            {/* Color Category */}
                            <div className="space-y-xs">
                                <label className="text-label-md text-on-surface-variant">
                                    Color Category
                                </label>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-sm">
                                    {COLOR_OPTIONS.map((opt) => (
                                        <button
                                            key={opt.value}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, color: opt.value })}
                                            className={`flex items-center gap-2 p-2 rounded-xl border text-body-sm font-medium transition-all cursor-pointer ${
                                                formData.color === opt.value
                                                    ? `${opt.border} bg-surface-container-high ring-2 ring-primary/20 font-bold`
                                                    : 'border-outline-variant hover:bg-surface-container-low'
                                            }`}
                                        >
                                            <span className={`w-3 h-3 rounded-full ${opt.border} border-2`} style={{ backgroundColor: `var(--color-${opt.value})` }} />
                                            <span>{opt.value}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Form Actions */}
                            <div className="flex justify-end gap-sm pt-md border-t border-outline-variant mt-lg">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-5 py-2.5 border border-outline-variant text-on-surface hover:bg-surface-container-low rounded-lg font-label-md text-label-md transition-colors cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="px-5 py-2.5 bg-primary text-on-primary hover:opacity-90 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed rounded-lg font-label-md text-label-md transition-all flex items-center gap-1 cursor-pointer"
                                >
                                    {isSubmitting ? (
                                        <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>
                                    ) : (
                                        editingSchedule ? 'Save Changes' : 'Create Class'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
