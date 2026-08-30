'use client';

import { useState, useEffect } from 'react';
import { useCEOContext } from '../CEOContext';

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
    { value: 'Level 5', label: 'Level 5', bg: 'bg-green-500/15', text: 'text-green-600', border: 'border-green-600' },
    { value: 'Level 4', label: 'Level 4', bg: 'bg-blue-500/15', text: 'text-blue-600', border: 'border-blue-600' },
    { value: 'Level 3', label: 'Level 3', bg: 'bg-yellow-500/15', text: 'text-yellow-600', border: 'border-yellow-600' },
    { value: 'Level 2', label: 'Level 2', bg: 'bg-orange-500/15', text: 'text-orange-600', border: 'border-orange-600' },
    { value: 'Level 1', label: 'Level 1', bg: 'bg-red-500/15', text: 'text-red-600', border: 'border-red-600' },
];

export default function SchedulePage() {
    const { selectedBatch } = useCEOContext();
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
        color: 'Level 5',
        class_link: '',
        batch: ''
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
            const batchQuery = (selectedBatch && selectedBatch !== 'All Batches' && selectedBatch !== 'Global' && selectedBatch !== 'Global Access') 
                ? `?batch=${encodeURIComponent(selectedBatch)}` 
                : '';
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/schedule${batchQuery}`, { headers });
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
    }, [selectedBatch]);

    const openAddModal = () => {
        setEditingSchedule(null);
        setFormData({
            name: '',
            time: '09:00 AM - 10:30 AM',
            location: '',
            students: 15,
            day_of_week: activeTab,
            color: 'Level 5',
            class_link: '',
            batch: (selectedBatch && selectedBatch !== 'All Batches' && selectedBatch !== 'Global' && selectedBatch !== 'Global Access') ? selectedBatch : 'Batch - 1'
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
            color: schedule.color,
            class_link: schedule.class_link || '',
            batch: schedule.batch || ''
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
            ? `${process.env.NEXT_PUBLIC_API_URL || ''}/api/schedule/${editingSchedule.id}`
            : `${process.env.NEXT_PUBLIC_API_URL || ''}/api/schedule`;
        
        const method = editingSchedule ? 'PUT' : 'POST';

        const payload = {
            ...formData,
            level: formData.color
        };

        try {
            const res = await fetch(url, {
                method,
                headers,
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.detail || 'Failed to save schedule');
            }

            // Refresh schedules list
            await fetchSchedules();
            if (typeof window !== 'undefined' && !editingSchedule) {
                window.dispatchEvent(new CustomEvent('fledge_new_class_created', {
                    detail: {
                        name: formData.name,
                        day_of_week: formData.day_of_week,
                        time: formData.time,
                        location: formData.location
                    }
                }));
            }
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
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/schedule/${id}`, {
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
        <div className="max-w-[1440px] mx-auto p-gutter space-y-lg relative pb-32 animate-fade-in">
            {/* Header Section */}
            <section className="flex flex-col md:flex-row md:items-center justify-between gap-md mb-lg">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="material-symbols-outlined text-primary text-3xl">calendar_month</span>
                        <h1 className="text-3xl md:text-4xl font-bold tracking-tight bg-gradient-to-r from-[#6FB7E4] via-[#5D8BCC] to-[#465AA3] text-transparent bg-clip-text">Class Schedule</h1>
                    </div>
                    <p className="font-body-md text-on-surface-variant max-w-2xl">Create, update, and manage weekly class sessions and room allocations.</p>
                </div>
                <button 
                    onClick={openAddModal}
                    className="bg-primary text-on-primary px-5 py-2.5 rounded-2xl font-label-md text-sm hover:bg-primary/90 transition-all flex items-center justify-center gap-2 self-start md:self-auto shadow-xs cursor-pointer active:scale-95"
                >
                    <span className="material-symbols-outlined text-[20px]">add</span>
                    <span>Add Class</span>
                </button>
            </section>

            {/* Error Callout */}
            {error && (
                <div className="p-4 bg-error-container text-on-error-container rounded-2xl flex items-center gap-2 text-xs sm:text-sm">
                    <span className="material-symbols-outlined text-[24px]">error</span>
                    <div>
                        <h3 className="font-bold">Error Loading Schedules</h3>
                        <p>{error}</p>
                    </div>
                </div>
            )}

            {/* Main Schedule Workspace */}
            <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-3xl p-5 md:p-6 custom-shadow hover:shadow-md transition-all grid grid-cols-1 lg:grid-cols-4 gap-5 items-start w-full max-w-full">
                
                {/* Left Side: Days Navigation */}
                <div className="bg-surface-container-lowest p-1.5 sm:p-sm rounded-xl custom-shadow border border-surface-container flex flex-row lg:flex-col overflow-x-auto lg:overflow-x-visible gap-1 scrollbar-none w-full max-w-full">
                    {DAYS_OF_WEEK.map((day) => {
                        const count = schedules.filter(s => s.day_of_week === day).length;
                        const isActive = activeTab === day;
                        return (
                            <button
                                key={day}
                                onClick={() => setActiveTab(day)}
                                className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs sm:text-sm whitespace-nowrap transition-all cursor-pointer min-w-[100px] lg:w-full ${
                                    isActive
                                        ? 'bg-secondary-container text-on-secondary-container font-bold'
                                        : 'text-on-surface-variant hover:bg-surface-container-low'
                                }`}
                            >
                                <span>{day}</span>
                                <span className={`ml-2 px-1.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold ${
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
                                <p className="font-body-md">No class activities have been planned for {activeTab} yet. Click "Add Class" to schedule one.</p>
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
                                                        {item.batch && (
                                                            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20 flex items-center gap-1">
                                                                <span className="material-symbols-outlined text-[13px]">groups</span>
                                                                {item.batch}
                                                            </span>
                                                        )}
                                                        {item.class_link && (
                                                            <span className="flex items-center gap-1">
                                                                <span className="material-symbols-outlined text-sm">link</span>
                                                                <a href={item.class_link} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Virtual Link</a>
                                                            </span>
                                                        )}
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
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 animate-fade-in">
                    <div className="bg-surface-container-lowest w-full max-w-[500px] max-h-[88vh] sm:max-h-[90vh] rounded-2xl sm:rounded-3xl shadow-2xl border border-outline-variant/60 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
                        {/* Modal Header */}
                        <div className="px-4 py-3 sm:px-5 sm:py-3.5 bg-surface-container border-b border-outline-variant flex items-center justify-between shrink-0">
                            <h3 className="font-bold text-base sm:text-lg text-on-surface">
                                {editingSchedule ? 'Edit Class Schedule' : 'Add New Class Schedule'}
                            </h3>
                            <button 
                                onClick={() => setIsModalOpen(false)}
                                className="w-8 h-8 rounded-full hover:bg-surface-container-high text-on-surface-variant flex items-center justify-center transition-colors cursor-pointer"
                            >
                                <span className="material-symbols-outlined text-[18px]">close</span>
                            </button>
                        </div>

                        {/* Modal Form */}
                        <form onSubmit={handleFormSubmit} className="p-3.5 sm:p-5 space-y-3 sm:space-y-4 overflow-y-auto custom-scrollbar flex-1">
                            {formError && (
                                <div className="p-2.5 bg-error-container text-on-error-container rounded-xl text-xs flex items-center gap-2">
                                    <span className="material-symbols-outlined text-[18px]">error</span>
                                    <span>{formError}</span>
                                </div>
                            )}

                            {/* Class Name */}
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-on-surface-variant" htmlFor="className">
                                    Class Name / Course Title
                                </label>
                                <input
                                    id="className"
                                    type="text"
                                    required
                                    className="w-full h-10 px-3.5 bg-surface-container-low border border-outline-variant rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all text-xs sm:text-sm text-on-surface"
                                    placeholder="e.g. Adv. Mathematics II"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>

                            {/* Grid row for Day & Time */}
                            <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                                {/* Day of Week */}
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-on-surface-variant" htmlFor="dayOfWeek">
                                        Day of Week
                                    </label>
                                    <select
                                        id="dayOfWeek"
                                        className="w-full h-10 px-3 bg-surface-container-low border border-outline-variant rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all text-xs sm:text-sm text-on-surface cursor-pointer"
                                        value={formData.day_of_week}
                                        onChange={(e) => setFormData({ ...formData, day_of_week: e.target.value })}
                                    >
                                        {DAYS_OF_WEEK.map(day => (
                                            <option key={day} value={day}>{day}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Time Slot */}
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-on-surface-variant" htmlFor="timeSlot">
                                        Time Slot
                                    </label>
                                    <input
                                        id="timeSlot"
                                        type="text"
                                        required
                                        className="w-full h-10 px-3 bg-surface-container-low border border-outline-variant rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all text-xs sm:text-sm text-on-surface"
                                        placeholder="e.g. 09:00 AM - 10:30 AM"
                                        value={formData.time}
                                        onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                                    />
                                </div>
                            </div>

                            {/* Grid row for Location & Students */}
                            <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                                {/* Location */}
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-on-surface-variant" htmlFor="location">
                                        Location / Room
                                    </label>
                                    <input
                                        id="location"
                                        type="text"
                                        required
                                        className="w-full h-10 px-3 bg-surface-container-low border border-outline-variant rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all text-xs sm:text-sm text-on-surface"
                                        placeholder="e.g. Room 304 or Virtual"
                                        value={formData.location}
                                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                    />
                                </div>

                                {/* Enrolled Students */}
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-on-surface-variant" htmlFor="students">
                                        Students Enrolled
                                    </label>
                                    <input
                                        id="students"
                                        type="number"
                                        min="0"
                                        required
                                        className="w-full h-10 px-3 bg-surface-container-low border border-outline-variant rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all text-xs sm:text-sm text-on-surface"
                                        value={formData.students}
                                        onChange={(e) => setFormData({ ...formData, students: parseInt(e.target.value) || 0 })}
                                    />
                                </div>
                            </div>

                            {/* Class Link */}
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-on-surface-variant" htmlFor="classLink">
                                    Class Link
                                </label>
                                <input
                                    id="classLink"
                                    type="url"
                                    className="w-full h-10 px-3.5 bg-surface-container-low border border-outline-variant rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all text-xs sm:text-sm text-on-surface"
                                    placeholder="e.g. https://zoom.us/j/123456789"
                                    value={formData.class_link}
                                    onChange={(e) => setFormData({ ...formData, class_link: e.target.value })}
                                />
                            </div>

                            {/* Target Batch */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-on-surface-variant" htmlFor="batchInput">
                                    Target Batch
                                </label>
                                <div className="space-y-1.5">
                                    <input
                                        id="batchInput"
                                        type="text"
                                        className="w-full h-10 px-3.5 bg-surface-container-low border border-outline-variant rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all text-xs sm:text-sm text-on-surface"
                                        placeholder="e.g. Batch - 1, Batch - 2, or All Batches"
                                        value={formData.batch}
                                        onChange={(e) => setFormData({ ...formData, batch: e.target.value })}
                                    />
                                    {/* Quick Batch Suggestions */}
                                    <div className="flex flex-wrap gap-1 items-center">
                                        <span className="text-[10px] text-on-surface-variant font-medium mr-1">Quick select:</span>
                                        {['Batch - 1', 'Batch - 2', 'Batch - 3', 'Batch - 4'].map((b) => (
                                            <button
                                                key={b}
                                                type="button"
                                                onClick={() => setFormData({ ...formData, batch: b })}
                                                className={`text-[10px] px-2 py-0.5 rounded-full border transition-all cursor-pointer ${
                                                    formData.batch === b
                                                        ? 'bg-primary text-on-primary border-primary font-semibold'
                                                        : 'border-outline-variant hover:bg-surface-container text-on-surface'
                                                }`}
                                            >
                                                {b}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Level Category */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-on-surface-variant">
                                    Japanese Level
                                </label>
                                <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                                    {COLOR_OPTIONS.map((opt) => (
                                        <button
                                            key={opt.value}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, color: opt.value })}
                                            className={`flex items-center gap-1.5 p-1.5 sm:p-2 rounded-xl border text-[11px] sm:text-xs font-medium transition-all cursor-pointer ${
                                                formData.color === opt.value
                                                    ? `${opt.border} bg-surface-container-high ring-2 ring-primary/20 font-bold`
                                                    : 'border-outline-variant hover:bg-surface-container-low text-on-surface'
                                            }`}
                                        >
                                            <span className={`w-2.5 h-2.5 rounded-full ${opt.bg} ${opt.border} border-2 shrink-0`} />
                                            <span className="truncate">{opt.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Form Actions */}
                            <div className="flex justify-end gap-2 pt-3 border-t border-outline-variant mt-2 shrink-0">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 border border-outline-variant text-on-surface hover:bg-surface-container-low rounded-xl text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="px-4 py-2 bg-primary text-on-primary hover:opacity-90 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-1 cursor-pointer"
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
