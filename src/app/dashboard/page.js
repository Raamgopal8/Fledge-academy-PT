"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

const COLOR_CLASSES = {
  primary: 'border-primary',
  secondary: 'border-secondary',
  tertiary: 'border-tertiary',
  error: 'border-error'
};

export default function DashboardOverview() {
  const scrollContainerRef = useRef(null);
  const router = useRouter();
  
  const [schedules, setSchedules] = useState([]);
  const [attendanceStatus, setAttendanceStatus] = useState(null);
  const [attendanceStats, setAttendanceStats] = useState(null);
  const [materials, setMaterials] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [tests, setTests] = useState([]);
  const [profile, setProfile] = useState(null);
  const [activeMaterialFilter, setActiveMaterialFilter] = useState("All");

  // Notes state
  const [notes, setNotes] = useState([]);
  const [noteTitle, setNoteTitle] = useState("");
  const [noteLink, setNoteLink] = useState("");
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);
  const [noteMessage, setNoteMessage] = useState({ type: '', text: '' });
  
  const [isLoading, setIsLoading] = useState({
    schedules: true,
    materials: true,
    announcements: true,
    tests: true,
    attendanceStats: true,
    notes: true,
  });

  const [error, setError] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;

      const headers = { 'Authorization': `Bearer ${token}` };
      const level = localStorage.getItem('level') || 'Level 5';
            const batch = localStorage.getItem('batch') || '';
            
      // Fetch Schedules
      fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/schedule?level=${encodeURIComponent(level)}&batch=${encodeURIComponent(batch)}`, { headers, cache: 'no-store' })
        .then(res => res.ok ? res.json() : Promise.reject('Failed to fetch schedules'))
        .then(data => { setSchedules(data); setIsLoading(prev => ({ ...prev, schedules: false })); })
        .catch(err => { setError(prev => ({ ...prev, schedules: err })); setIsLoading(prev => ({ ...prev, schedules: false })); });

      // Fetch Profile
      fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/user/profile`, { headers, cache: 'no-store' })
        .then(res => res.ok ? res.json() : null)
        .then(data => { if (data) setProfile(data); })
        .catch(err => console.error("Error fetching profile:", err));

      // Fetch Attendance
      fetch(`${process.env.NEXT_PUBLIC_ATTENDANCE_API_URL || 'http://localhost:8002'}/api/attendance/my-status`, { headers, cache: 'no-store' })
        .then(res => res.ok ? res.json() : null)
        .then(data => { if (data) setAttendanceStatus(data.status); })
        .catch(err => console.error("Error fetching attendance:", err));

      // Fetch Attendance Stats
      fetch(`${process.env.NEXT_PUBLIC_ATTENDANCE_API_URL || 'http://localhost:8002'}/api/attendance/my-stats`, { headers, cache: 'no-store' })
        .then(res => res.ok ? res.json() : null)
        .then(data => { 
          if (data) setAttendanceStats(data);
          setIsLoading(prev => ({ ...prev, attendanceStats: false }));
        })
        .catch(err => {
          console.error("Error fetching attendance stats:", err);
          setIsLoading(prev => ({ ...prev, attendanceStats: false }));
        });

      // Fetch Materials
      fetch(`${process.env.NEXT_PUBLIC_MATERIALS_API_URL || 'http://localhost:8005'}/api/materials?level=${encodeURIComponent(level)}&batch=${encodeURIComponent(batch)}`, { headers, cache: 'no-store' })
        .then(res => res.ok ? res.json() : Promise.reject('Failed to fetch materials'))
        .then(data => { setMaterials(data); setIsLoading(prev => ({ ...prev, materials: false })); })
        .catch(err => { setError(prev => ({ ...prev, materials: err })); setIsLoading(prev => ({ ...prev, materials: false })); });

      // Fetch Announcements
      fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/announcement?level=${encodeURIComponent(level)}&batch=${encodeURIComponent(batch)}`, { headers, cache: 'no-store' })
        .then(res => res.ok ? res.json() : Promise.reject('Failed to fetch announcements'))
        .then(data => { setAnnouncements(data); setIsLoading(prev => ({ ...prev, announcements: false })); })
        .catch(err => { setError(prev => ({ ...prev, announcements: err })); setIsLoading(prev => ({ ...prev, announcements: false })); });

      // Fetch Tests (Pending Tasks)
      fetch(`${process.env.NEXT_PUBLIC_TEST_API_URL || 'http://localhost:8003'}/api/tests?level=${encodeURIComponent(level)}&batch=${encodeURIComponent(batch)}`, { headers, cache: 'no-store' })
        .then(res => res.ok ? res.json() : Promise.reject('Failed to fetch tests'))
        .then(data => { setTests(data); setIsLoading(prev => ({ ...prev, tests: false })); })
        .catch(err => { setError(prev => ({ ...prev, tests: err })); setIsLoading(prev => ({ ...prev, tests: false })); });

      // Fetch Student Notes
      fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/student-notes?batch=${encodeURIComponent(batch)}&level=${encodeURIComponent(level)}`, { headers, cache: 'no-store' })
        .then(res => res.ok ? res.json() : [])
        .then(data => { setNotes(data); setIsLoading(prev => ({ ...prev, notes: false })); })
        .catch(err => { console.error("Error fetching notes:", err); setIsLoading(prev => ({ ...prev, notes: false })); });
    };

    fetchData();
  }, []);

  const handleUploadNote = async (e) => {
    e.preventDefault();
    if (!noteLink.trim()) {
      setNoteMessage({ type: 'error', text: 'Please enter a valid notes link URL.' });
      return;
    }

    setIsSubmittingNote(true);
    setNoteMessage({ type: '', text: '' });

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Your session has expired or you are not logged in. Please log in again.');
      }

      const level = localStorage.getItem('level') || 'Level 5';
      const batch = localStorage.getItem('batch') || '';

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/student-notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: noteTitle.trim() || 'Study Notes',
          note_link: noteLink.trim(),
          level,
          batch
        })
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || 'Failed to upload notes link.');
      }

      const createdNote = await res.json();
      setNotes(prev => [createdNote, ...prev]);
      setNoteTitle('');
      setNoteLink('');
      setNoteMessage({ type: 'success', text: 'Notes link uploaded successfully and shared with your instructors!' });

      setTimeout(() => setNoteMessage({ type: '', text: '' }), 4000);
    } catch (err) {
      setNoteMessage({ type: 'error', text: err.message || 'Error submitting notes link.' });
    } finally {
      setIsSubmittingNote(false);
    }
  };

  const handleDeleteNote = async (noteId) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/student-notes/${noteId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        setNotes(prev => prev.filter(n => n.id !== noteId));
      }
    } catch (err) {
      console.error("Failed to delete note:", err);
    }
  };

  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) return;

    const handleWheel = (evt) => {
      // Prevent default vertical scroll only if scrolling horizontally
      if (evt.deltaY !== 0) {
        evt.preventDefault();
        scrollContainer.scrollLeft += evt.deltaY;
      }
    };

    scrollContainer.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      scrollContainer.removeEventListener("wheel", handleWheel);
    };
  }, [isLoading.materials]);

  // Filter pending tests (not submitted)
  const pendingTests = tests.filter(test => !test.has_submitted);

  const getTaskUrgency = (dueDateStr) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(dueDateStr);
    dueDate.setHours(0, 0, 0, 0);
    
    const diffTime = dueDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    
    if (diffDays < 0) {
      return { label: 'Overdue', color: 'error', icon: 'error' };
    } else if (diffDays === 0) {
      return { label: 'Due Today', color: 'error', icon: 'assignment_late' };
    } else if (diffDays === 1) {
      return { label: 'Due Tomorrow', color: 'tertiary', icon: 'warning' };
    } else if (diffDays <= 7) {
      return { label: 'This Week', color: 'primary', icon: 'event' };
    } else {
      return { label: 'Upcoming', color: 'outline', icon: 'calendar_today' };
    }
  };

  const getClassStatus = (schedule) => {
    if (!schedule.time || !schedule.day_of_week) return null;
    
    const now = new Date();
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const currentDay = days[now.getDay()];
    
    // For demo purposes, we can optionally make a mock status if we want it to show up. 
    // But strictly following the requirement, we calculate actual diff.
    if (schedule.day_of_week !== currentDay) return null;

    const [time, period] = schedule.time.split(' ');
    if (!time) return null;
    
    let [hours, minutes] = time.split(':').map(Number);
    if (period === 'PM' && hours !== 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;
    
    const classTime = new Date();
    classTime.setHours(hours, minutes || 0, 0, 0);
    
    const diffMins = (classTime - now) / (1000 * 60);
    
    if (diffMins <= 0 && diffMins > -60) {
      return { status: 'live', text: 'Live Now' }; // Assuming class is 1 hour long
    } else if (diffMins > 0 && diffMins <= 15) {
      return { status: 'starting_soon', text: `Starts in ${Math.round(diffMins)} mins` };
    }
    return null;
  };

  const getFileMeta = (url) => {
    if (!url) return { type: 'Link', icon: 'link', size: 'External' };
    const ext = url.split('.').pop().toLowerCase();
    if (['pdf'].includes(ext)) return { type: 'PDF', icon: 'picture_as_pdf', size: '2.4 MB' };
    if (['zip', 'rar', 'tar'].includes(ext)) return { type: 'Archive', icon: 'folder_zip', size: '12.0 MB' };
    if (['doc', 'docx'].includes(ext)) return { type: 'Word', icon: 'description', size: '1.8 MB' };
    if (['xls', 'xlsx'].includes(ext)) return { type: 'Excel', icon: 'table', size: '3.2 MB' };
    if (['ppt', 'pptx'].includes(ext)) return { type: 'PowerPoint', icon: 'slideshow', size: '5.5 MB' };
    if (url.startsWith('http')) return { type: 'Link', icon: 'link', size: 'External' };
    return { type: 'File', icon: 'draft', size: '1.0 MB' };
  };

  const getGreeting = () => {
      const hour = new Date().getHours();
      if (hour < 12) return 'Good morning';
      if (hour < 18) return 'Good afternoon';
      return 'Good evening';
  };
  const greeting = `${getGreeting()}, ${profile?.name?.split(' ')[0] || profile?.username || 'Student'}`;
   
  return (
    <div className="max-w-[1440px] mx-auto p-gutter space-y-xs">
      {/* Welcome Section */}
      <section className="mb-lg animate-fade-in mt-2">
        <div className="flex flex-col md:flex-row md:items-end justify-start gap-xs mb-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold mb-sm text-transparent bg-clip-text bg-gradient-to-r from-[#6FB7E4] via-[#5D8BCC] to-[#465AA3]">
              {greeting}
            </h1>
            <p className="font-body-lg text-body-lg text-on-surface-variant">
              Here is your overview for today. Keep up the good work!
            </p>
          </div>
        </div>

        {/* Quick Stats Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-md mt-6">
          {/* Overall Attendance Card */}
          <div className="bg-white rounded-2xl shadow-[0px_4px_20px_rgba(0,0,0,0.04)] border border-outline-variant p-md flex items-center gap-md hover:shadow-[0px_10px_30px_rgba(0,0,0,0.06)] hover:border-primary/30 transition-all">
            <div className="relative flex items-center justify-center w-14 h-14">
              {isLoading.attendanceStats ? (
                <span className="material-symbols-outlined animate-spin text-primary">refresh</span>
              ) : (
                <>
                  <svg className="w-14 h-14 transform -rotate-90">
                    <circle cx="28" cy="28" r="24" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-surface-container-high" />
                    <circle cx="28" cy="28" r="24" stroke="currentColor" strokeWidth="4" fill="transparent" strokeDasharray="150" strokeDashoffset={150 - (150 * (attendanceStats?.percentage || 0)) / 100} className="text-primary transition-all duration-1000 ease-out" />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center font-bold text-sm text-on-surface">
                    {attendanceStats ? `${Math.round(attendanceStats.percentage)}%` : '0%'}
                  </div>
                </>
              )}
            </div>
            <div>
              <p className="font-label-sm text-on-surface-variant uppercase tracking-wider">Attendance</p>
              <p className="font-headline-sm text-on-surface">Overall</p>
            </div>
          </div>

          {/* Upcoming Deadlines Card */}
          <div className="bg-white rounded-2xl shadow-[0px_4px_20px_rgba(0,0,0,0.04)] border border-outline-variant p-md flex items-center gap-md hover:shadow-[0px_10px_30px_rgba(0,0,0,0.06)] hover:border-primary/30 transition-all">
            <div className="w-14 h-14 rounded-full bg-error-container text-error flex items-center justify-center">
              <span className="material-symbols-outlined text-2xl">assignment_late</span>
            </div>
            <div>
              <p className="font-label-sm text-on-surface-variant uppercase tracking-wider">Deadlines</p>
              <p className="font-headline-sm text-on-surface">
                {pendingTests.length} <span className="text-sm font-normal text-on-surface-variant">Due</span>
              </p>
            </div>
          </div>

          {/* Scheduled Classes Card */}
          <div className="bg-white rounded-2xl shadow-[0px_4px_20px_rgba(0,0,0,0.04)] border border-outline-variant p-md flex items-center gap-md hover:shadow-[0px_10px_30px_rgba(0,0,0,0.06)] hover:border-primary/30 transition-all">
            <div className="w-14 h-14 rounded-full bg-tertiary-container text-tertiary flex items-center justify-center">
              <span className="material-symbols-outlined text-2xl">calendar_today</span>
            </div>
            <div>
              <p className="font-label-sm text-on-surface-variant uppercase tracking-wider">Scheduled Classes</p>
              <p className="font-headline-sm text-on-surface">
                {schedules.length} <span className="text-sm font-normal text-on-surface-variant">Total</span>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Dashboard Grid (Bento Style) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter items-start animate-fade-in" style={{ animationDelay: '0.1s' }}>
        
        {/* Main Content Area (Left Column) */}
        <div className="lg:col-span-8 flex flex-col gap-gutter">
          
          {/* Recent Announcements */}
          <div 
            className="bg-white rounded-2xl shadow-[0px_4px_20px_rgba(0,0,0,0.04)] border border-outline-variant p-md cursor-pointer hover:shadow-[0px_10px_30px_rgba(0,0,0,0.06)] hover:border-primary/30 transition-all"
            onClick={() => router.push('/dashboard/announcements')}
          >
            <div className="flex items-center justify-between mb-md">
              <h3 className="font-headline-md text-headline-md text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">campaign</span>
                Recent Announcements
              </h3>
            </div>
            <div className="space-y-md">
              {isLoading.announcements ? (
                <div className="flex justify-center p-md text-primary">
                  <span className="material-symbols-outlined animate-spin text-2xl">refresh</span>
                </div>
              ) : error.announcements ? (
                <p className="text-error font-body-sm text-center">Failed to load announcements.</p>
              ) : announcements.length === 0 ? (
                <p className="text-on-surface-variant font-body-sm text-center">Check announcement to display.</p>
              ) : (
                announcements.slice(0, 3).map((ann) => (
                  <div key={ann.id} className="p-sm rounded-xl bg-surface-container-lowest border border-outline-variant hover:border-primary/30 transition-colors">
                    <div className="flex justify-between items-start mb-1">
                      <h4 className="font-label-lg text-on-surface">{ann.title}</h4>
                      <span className="text-xs text-outline">{new Date(ann.created_at).toLocaleDateString()}</span>
                    </div>
                    <p className="font-body-sm text-on-surface-variant line-clamp-2">{ann.content}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Learning Materials */}
          <div className="bg-white rounded-2xl shadow-[0px_4px_20px_rgba(0,0,0,0.04)] border border-outline-variant p-md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-md gap-4">
              <h3 className="font-headline-md text-headline-md text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">library_books</span>
                Course Materials
              </h3>
              
              {/* Filter Tabs */}
              {!isLoading.materials && materials.length > 0 && (
                <div className="flex gap-2 overflow-x-auto pb-1 custom-scrollbar">
                  {['All', ...new Set(materials.map(m => m.course_name || 'General'))].map(category => (
                    <button
                      key={category}
                      onClick={() => setActiveMaterialFilter(category)}
                      className={`px-4 py-1.5 rounded-full font-label-sm whitespace-nowrap transition-colors ${
                        activeMaterialFilter === category 
                          ? 'bg-primary text-white shadow-sm' 
                          : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high'
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            {isLoading.materials ? (
              <div className="flex justify-center p-md text-primary">
                <span className="material-symbols-outlined animate-spin text-2xl">refresh</span>
              </div>
            ) : error.materials ? (
              <p className="text-error font-body-sm text-center">Failed to load materials.</p>
            ) : materials.length === 0 ? (
              <p className="text-on-surface-variant font-body-sm text-center p-lg bg-surface-container/30 rounded-xl border border-dashed border-outline-variant">
                No materials found. Check back later!
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {(activeMaterialFilter === 'All' ? materials : materials.filter(m => (m.course_name || 'General') === activeMaterialFilter)).map((material) => {
                  const meta = getFileMeta(material.file_url);
                  return (
                    <div key={material.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-sm bg-white rounded-xl border border-outline-variant hover:border-primary/40 hover:shadow-sm transition-all group">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-1 sm:mt-0">
                          <span className="material-symbols-outlined">{meta.icon}</span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-label-md text-on-surface line-clamp-1" title={material.title}>
                              {material.title}
                            </h4>
                            {material.level && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-secondary-container text-on-secondary-container whitespace-nowrap">
                                {material.level}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="font-body-sm text-xs text-on-surface-variant">
                              {new Date(material.created_at).toLocaleDateString()}
                            </span>
                            <span className="w-1 h-1 rounded-full bg-outline-variant"></span>
                            <span className="font-label-sm text-[10px] uppercase tracking-wider text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                              {meta.type} • {meta.size}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-3 sm:mt-0 sm:ml-4 flex justify-end">
                        <a 
                          href={material.file_url?.startsWith('http') ? material.file_url : `${process.env.NEXT_PUBLIC_MATERIALS_API_URL || 'http://localhost:8005'}${material.file_url}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-surface-container-lowest border border-outline-variant text-primary font-label-sm hover:bg-primary hover:text-white hover:border-primary transition-colors"
                        >
                          <span className="material-symbols-outlined text-[18px]">
                            {meta.type === 'Link' ? 'open_in_new' : 'download'}
                          </span>
                          {meta.type === 'Link' ? 'Open' : 'Download'}
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Student Upload Notes Links Section */}
          <div className="bg-white rounded-2xl shadow-[0px_4px_20px_rgba(0,0,0,0.04)] border border-outline-variant p-md">
            <div className="flex items-center justify-between mb-md">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <span className="material-symbols-outlined text-[22px]">note_add</span>
                </div>
                <div>
                  <h3 className="font-headline-md text-headline-md text-on-surface">
                    Upload Notes Link
                  </h3>
                  <p className="font-body-sm text-xs text-on-surface-variant">
                    Submit links to your study notes (Google Docs, Notion, OneDrive) for staff review.
                  </p>
                </div>
              </div>
            </div>

            {/* Notification messages */}
            {noteMessage.text && (
              <div className={`p-3 rounded-xl mb-4 text-xs font-medium flex items-center gap-2 ${
                noteMessage.type === 'success' 
                  ? 'bg-green-500/10 text-green-700 dark:text-green-400 border border-green-500/30' 
                  : 'bg-error/10 text-error border border-error/30'
              }`}>
                <span className="material-symbols-outlined text-[18px]">
                  {noteMessage.type === 'success' ? 'check_circle' : 'error'}
                </span>
                <span>{noteMessage.text}</span>
              </div>
            )}

            {/* Upload Input Form */}
            <form onSubmit={handleUploadNote} className="space-y-3 bg-surface-container-lowest/60 p-4 rounded-xl border border-outline-variant/60">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                <div className="md:col-span-4">
                  <label className="block text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">
                    Topic / Title
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Chapter 4 Summary"
                    value={noteTitle}
                    onChange={(e) => setNoteTitle(e.target.value)}
                    className="w-full h-[42px] px-3.5 bg-white border border-outline-variant rounded-xl text-xs text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                  />
                </div>
                <div className="md:col-span-8">
                  <label className="block text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">
                    Notes Link URL <span className="text-primary">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline text-[18px]">
                      link
                    </span>
                    <input
                      type="url"
                      required
                      placeholder="https://docs.google.com/... or https://notion.so/..."
                      value={noteLink}
                      onChange={(e) => setNoteLink(e.target.value)}
                      className="w-full h-[42px] pl-10 pr-3.5 bg-white border border-outline-variant rounded-xl text-xs text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  disabled={isSubmittingNote}
                  className="px-5 py-2.5 bg-primary text-white text-xs font-bold rounded-xl hover:bg-primary/90 transition-all shadow-sm active:scale-[0.98] flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
                >
                  {isSubmittingNote ? (
                    <>
                      <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
                      <span>Uploading...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[16px]">cloud_upload</span>
                      <span>Upload Notes Link</span>
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Submitted Notes List */}
            <div className="mt-4 space-y-2">
              <h4 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                My Shared Notes ({notes.length})
              </h4>
              {isLoading.notes ? (
                <div className="flex justify-center p-4 text-primary">
                  <span className="material-symbols-outlined animate-spin text-xl">progress_activity</span>
                </div>
              ) : notes.length === 0 ? (
                <p className="text-xs text-on-surface-variant text-center py-4 bg-surface-container-low/30 rounded-xl border border-dashed border-outline-variant/60">
                  No notes uploaded yet. Paste your first notes link above!
                </p>
              ) : (
                <div className="divide-y divide-outline-variant/40 rounded-xl border border-outline-variant/60 overflow-hidden bg-white">
                  {notes.map((n) => (
                    <div key={n.id} className="p-3 flex items-center justify-between hover:bg-surface-container-low/40 transition-colors gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                          <span className="material-symbols-outlined text-[18px]">description</span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-on-surface truncate">
                            {n.title || 'Study Notes'}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5 text-[11px] text-on-surface-variant">
                            <span className="truncate max-w-[200px] text-primary">{n.note_link}</span>
                            <span>•</span>
                            <span>{new Date(n.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <a
                          href={n.note_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 rounded-lg bg-surface-container-low border border-outline-variant text-primary hover:bg-primary hover:text-white transition-colors text-xs font-semibold flex items-center gap-1"
                        >
                          <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                          <span>Open</span>
                        </a>
                        <button
                          onClick={() => handleDeleteNote(n.id)}
                          className="p-1.5 text-outline hover:text-error hover:bg-error/10 rounded-lg transition-colors"
                          title="Delete Note"
                        >
                          <span className="material-symbols-outlined text-[16px]">delete</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar Content (Right Column) */}
        <div className="lg:col-span-4 flex flex-col gap-gutter">
          
          {/* Today's Attendance */}
          <div className="bg-white rounded-2xl shadow-[0px_4px_20px_rgba(0,0,0,0.04)] border border-outline-variant overflow-hidden hover:shadow-[0px_10px_30px_rgba(0,0,0,0.06)] transition-all p-md flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-headline-md text-headline-md text-on-surface">Today's Attendance</h3>
                <p className="font-body-sm text-on-surface-variant">Your status for today's classes.</p>
              </div>
              <div className={`px-4 py-2 rounded-lg font-bold text-sm ${attendanceStatus === 'present' ? 'bg-primary-container text-on-primary-container' : attendanceStatus === 'absent' ? 'bg-error-container text-on-error-container' : 'bg-surface-variant text-on-surface-variant'}`}>
                {attendanceStatus === 'present' ? 'Present' : attendanceStatus === 'absent' ? 'Absent' : 'Not Marked'}
              </div>
            </div>
          </div>

          {/* Pending Tasks */}
          <div 
            className="bg-white rounded-2xl shadow-[0px_4px_20px_rgba(0,0,0,0.04)] border border-outline-variant overflow-hidden hover:shadow-[0px_10px_30px_rgba(0,0,0,0.06)] hover:border-primary/30 transition-all cursor-pointer"
            onClick={() => router.push('/dashboard/tasks')}
          >
            <div className="p-md border-b border-outline-variant flex items-center justify-between">
              <h3 className="font-headline-md text-headline-md text-on-surface">Pending Tasks</h3>
              {pendingTests.length > 0 && (
                <span className="bg-primary text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {pendingTests.length}
                </span>
              )}
            </div>
            
            <div className="p-xs">
              {isLoading.tests ? (
                <div className="flex justify-center p-md text-primary">
                  <span className="material-symbols-outlined animate-spin text-2xl">refresh</span>
                </div>
              ) : error.tests ? (
                <p className="text-error font-body-sm text-center p-md">Failed to load tasks.</p>
              ) : pendingTests.length === 0 ? (
                <p className="text-on-surface-variant font-body-sm text-center p-md">You're all caught up!</p>
              ) : (
                pendingTests.slice(0, 4).map((test) => {
                  const urgency = getTaskUrgency(test.due_date);
                  
                  return (
                    <div key={test.id} className="flex flex-col gap-sm p-md hover:bg-surface-container-low transition-colors rounded-xl group border border-transparent hover:border-outline-variant">
                      <div className="flex items-start gap-md cursor-pointer" onClick={() => router.push('/dashboard/tasks')}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center mt-1
                          ${urgency.color === 'error' ? 'bg-error-container text-error' : 
                            urgency.color === 'tertiary' ? 'bg-tertiary-container text-tertiary' : 
                            urgency.color === 'primary' ? 'bg-primary-container text-primary' : 
                            'bg-surface-variant text-on-surface-variant'}`}>
                          <span className="material-symbols-outlined text-sm">{urgency.icon}</span>
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <p className="font-label-md text-label-md text-on-surface line-clamp-2 mb-1">
                              {test.title}
                            </p>
                            {test.level && (
                              <span className="ml-2 px-2 py-0.5 rounded text-[10px] font-bold bg-secondary-container text-on-secondary-container whitespace-nowrap">
                                {test.level}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-sm uppercase tracking-wider
                              ${urgency.color === 'error' ? 'bg-error/10 text-error' : 
                                urgency.color === 'tertiary' ? 'bg-tertiary/10 text-tertiary' : 
                                urgency.color === 'primary' ? 'bg-primary/10 text-primary' : 
                                'bg-surface-variant text-outline'}`}>
                              {urgency.label}
                            </span>
                            <span className="font-body-sm text-xs text-on-surface-variant">
                              {new Date(test.due_date).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex justify-end mt-1">
                        <button 
                          onClick={(e) => { e.stopPropagation(); router.push('/dashboard/tasks'); }}
                          className="text-xs font-bold text-primary hover:text-primary/80 flex items-center gap-1 px-3 py-1.5 rounded-lg border border-primary/20 hover:bg-primary/5 transition-colors cursor-pointer"
                        >
                          Submit Work
                          <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            {pendingTests.length > 4 && (
              <div className="p-md pt-0">
                <a href="/dashboard/tasks" className="block w-full py-2 bg-surface-container-highest text-primary text-center font-label-md rounded-xl hover:bg-surface-container-high transition-colors">
                  View All Tasks
                </a>
              </div>
            )}
          </div>

          {/* My Class Schedule */}
          <div className="bg-white rounded-2xl shadow-[0px_4px_20px_rgba(0,0,0,0.04)] border border-outline-variant overflow-hidden hover:shadow-[0px_10px_30px_rgba(0,0,0,0.06)] transition-all">
            <div className="p-md border-b border-outline-variant flex items-center justify-between">
              <h3 className="font-headline-md text-headline-md text-on-surface">My Class Schedule</h3>
              <span className="material-symbols-outlined text-primary">calendar_today</span>
            </div>
            
            <div className="p-xs space-y-xs max-h-[350px] overflow-y-auto custom-scrollbar">
              {isLoading.schedules ? (
                <div className="p-md flex flex-col items-center gap-2 text-primary">
                  <span className="material-symbols-outlined animate-spin">progress_activity</span>
                </div>
              ) : error.schedules ? (
                <div className="p-md text-center text-error font-body-sm">
                  Error loading schedule.
                </div>
              ) : schedules.length === 0 ? (
                <div className="p-md text-center text-on-surface-variant font-body-sm">
                  No classes scheduled.
                </div>
              ) : (
                schedules.map((c) => {
                  const timeParts = c.time ? c.time.split(' ') : ['09:00', 'AM'];
                  const time = timeParts[0] || '09:00';
                  const period = timeParts[1] || 'AM';
                  const status = getClassStatus(c);
                  const isLiveOrSoon = status !== null;

                  return (
                    <div key={c.id} className={`flex flex-col p-md bg-surface-container-low rounded-xl border-l-4 ${COLOR_CLASSES[c.color] || 'border-primary'} transition-colors hover:bg-surface-container-high`}>
                      <div className="flex items-center">
                        <div className="mr-md text-center min-w-[60px]">
                          <span className="block font-label-sm text-label-sm text-outline">{time}</span>
                          <span className="block font-label-md text-label-md font-bold text-on-surface">{period}</span>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="font-label-md text-label-md text-on-surface font-semibold">{c.name}</h4>
                            {isLiveOrSoon && (
                              <span className={`flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${status.status === 'live' ? 'bg-error-container text-error' : 'bg-tertiary-container text-tertiary'}`}>
                                <span className="relative flex h-2 w-2">
                                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${status.status === 'live' ? 'bg-error' : 'bg-tertiary'}`}></span>
                                  <span className={`relative inline-flex rounded-full h-2 w-2 ${status.status === 'live' ? 'bg-error' : 'bg-tertiary'}`}></span>
                                </span>
                                {status.text}
                              </span>
                            )}
                          </div>
                          <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
                            {c.day_of_week} • {c.location}
                          </p>
                        </div>
                      </div>
                      
                      {isLiveOrSoon && (
                        <div className="mt-sm pt-sm border-t border-outline-variant">
                          {c.class_link ? (
                            <a 
                              href={c.class_link.startsWith('http') ? c.class_link : `https://${c.class_link}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-full py-2 bg-primary text-white rounded-lg font-label-sm flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors shadow-sm active:scale-[0.98]"
                            >
                              <span className="material-symbols-outlined text-sm">video_camera_front</span>
                              Join
                            </a>
                          ) : (
                            <button disabled className="w-full py-2 bg-surface-variant text-on-surface-variant rounded-lg font-label-sm flex items-center justify-center gap-2 opacity-70 cursor-not-allowed shadow-sm">
                              <span className="material-symbols-outlined text-sm">videocam_off</span>
                              No Class
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
