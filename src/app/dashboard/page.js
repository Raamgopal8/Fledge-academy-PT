"use client";

import { useState, useEffect, useRef } from "react";

const COLOR_CLASSES = {
  primary: 'border-primary',
  secondary: 'border-secondary',
  tertiary: 'border-tertiary',
  error: 'border-error'
};

export default function DashboardOverview() {
  const scrollContainerRef = useRef(null);
  
  const [schedules, setSchedules] = useState([]);
  const [attendanceStatus, setAttendanceStatus] = useState(null);
  const [materials, setMaterials] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [tests, setTests] = useState([]);
  
  const [isLoading, setIsLoading] = useState({
    schedules: true,
    materials: true,
    announcements: true,
    tests: true,
  });

  const [error, setError] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;

      const headers = { 'Authorization': `Bearer ${token}` };

      // Fetch Schedules
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/schedule`, { headers })
        .then(res => res.ok ? res.json() : Promise.reject('Failed to fetch schedules'))
        .then(data => { setSchedules(data); setIsLoading(prev => ({ ...prev, schedules: false })); })
        .catch(err => { setError(prev => ({ ...prev, schedules: err })); setIsLoading(prev => ({ ...prev, schedules: false })); });

      // Fetch Attendance
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/attendance/my-status`, { headers })
        .then(res => res.ok ? res.json() : null)
        .then(data => { if (data) setAttendanceStatus(data.status); })
        .catch(err => console.error("Error fetching attendance:", err));

      // Fetch Materials
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/materials`, { headers })
        .then(res => res.ok ? res.json() : Promise.reject('Failed to fetch materials'))
        .then(data => { setMaterials(data); setIsLoading(prev => ({ ...prev, materials: false })); })
        .catch(err => { setError(prev => ({ ...prev, materials: err })); setIsLoading(prev => ({ ...prev, materials: false })); });

      // Fetch Announcements
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/announcement`, { headers })
        .then(res => res.ok ? res.json() : Promise.reject('Failed to fetch announcements'))
        .then(data => { setAnnouncements(data); setIsLoading(prev => ({ ...prev, announcements: false })); })
        .catch(err => { setError(prev => ({ ...prev, announcements: err })); setIsLoading(prev => ({ ...prev, announcements: false })); });

      // Fetch Tests (Pending Tasks)
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/tests`, { headers })
        .then(res => res.ok ? res.json() : Promise.reject('Failed to fetch tests'))
        .then(data => { setTests(data); setIsLoading(prev => ({ ...prev, tests: false })); })
        .catch(err => { setError(prev => ({ ...prev, tests: err })); setIsLoading(prev => ({ ...prev, tests: false })); });
    };

    fetchData();
  }, []);

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

  return (
    <>
      {/* Welcome Section */}
      <section className="mb-lg animate-fade-in">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-md">
          <div>
            <h1 className="font-display-lg text-headline-lg-mobile md:text-display-lg text-on-surface mb-xs">
              Welcome Back!
            </h1>
            <p className="font-body-lg text-body-lg text-on-surface-variant">
              Here is your overview for today. Keep up the good work!
            </p>
          </div>
        </div>
      </section>

      {/* Dashboard Grid (Bento Style) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter items-start animate-fade-in" style={{ animationDelay: '0.1s' }}>
        
        {/* Main Content Area (Left Column) */}
        <div className="lg:col-span-8 flex flex-col gap-gutter">
          
          {/* Recent Announcements */}
          <div className="bg-white rounded-2xl shadow-[0px_4px_20px_rgba(0,0,0,0.04)] border border-outline-variant p-md">
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
                <p className="text-on-surface-variant font-body-sm text-center">No announcements to display.</p>
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
            <div className="flex items-center justify-between mb-md">
              <h3 className="font-headline-md text-headline-md text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">library_books</span>
                Course Materials
              </h3>
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
              <div ref={scrollContainerRef} className="flex gap-md overflow-x-auto pb-sm custom-scrollbar -mx-2 px-2">
                {materials.map((material) => (
                  <div key={material.id} className="min-w-[280px] bg-surface-container-low rounded-xl p-md border border-outline-variant shadow-sm hover:border-primary/50 hover:shadow-md transition-all cursor-pointer">
                    <div className="w-12 h-12 rounded-lg bg-primary-container text-primary flex items-center justify-center mb-md">
                      <span className="material-symbols-outlined">
                        {material.file_url.startsWith('http') ? 'link' : 'description'}
                      </span>
                    </div>
                    <h4 className="font-label-md text-label-md text-on-surface mb-xs truncate" title={material.title}>
                      {material.title}
                    </h4>
                    <p className="font-body-sm text-body-sm text-outline mb-md line-clamp-2">
                      {material.description || 'No description provided.'}
                    </p>
                    <div className="flex items-center justify-between border-t border-outline-variant/50 pt-2 mt-auto">
                      <span className="font-label-sm text-label-sm text-on-surface-variant">
                        {new Date(material.created_at).toLocaleDateString()}
                      </span>
                      <a 
                        href={material.file_url.startsWith('http') ? material.file_url : `${process.env.NEXT_PUBLIC_API_URL}${material.file_url}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:bg-primary/10 rounded-full p-1 transition-colors"
                      >
                        <span className="material-symbols-outlined">
                          {material.file_url.startsWith('http') ? 'open_in_new' : 'download'}
                        </span>
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Content (Right Column) */}
        <div className="lg:col-span-4 flex flex-col gap-gutter">
          
          {/* Today's Attendance */}
          <div className="bg-white rounded-2xl shadow-[0px_4px_20px_rgba(0,0,0,0.04)] border border-outline-variant overflow-hidden hover:shadow-[0px_10px_30px_rgba(0,0,0,0.06)] transition-all p-md flex items-center justify-between">
            <div>
              <h3 className="font-headline-md text-headline-md text-on-surface">Today's Attendance</h3>
              <p className="font-body-sm text-on-surface-variant">Your status for today's classes.</p>
            </div>
            <div className={`px-4 py-2 rounded-lg font-bold text-sm ${attendanceStatus === 'present' ? 'bg-primary-container text-on-primary-container' : attendanceStatus === 'absent' ? 'bg-error-container text-on-error-container' : 'bg-surface-variant text-on-surface-variant'}`}>
              {attendanceStatus === 'present' ? 'Present' : attendanceStatus === 'absent' ? 'Absent' : 'Not Marked'}
            </div>
          </div>

          {/* Pending Tasks */}
          <div className="bg-white rounded-2xl shadow-[0px_4px_20px_rgba(0,0,0,0.04)] border border-outline-variant overflow-hidden hover:shadow-[0px_10px_30px_rgba(0,0,0,0.06)] transition-all">
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
                pendingTests.slice(0, 4).map((test) => (
                  <div key={test.id} className="flex items-center gap-md p-md hover:bg-surface-container-low transition-colors rounded-xl group cursor-pointer active:scale-[0.98]">
                    <div className="w-8 h-8 rounded-full bg-error-container/20 text-error flex items-center justify-center">
                      <span className="material-symbols-outlined text-sm">assignment_late</span>
                    </div>
                    <div className="flex-1">
                      <p className="font-label-md text-label-md text-on-surface truncate">
                        {test.title}
                      </p>
                      <p className="font-label-sm text-label-sm text-error">
                        Due: {new Date(test.due_date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))
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
                  return (
                    <div key={c.id} className={`flex items-center p-md bg-surface-container-low rounded-xl border-l-4 ${COLOR_CLASSES[c.color] || 'border-primary'} transition-colors hover:bg-surface-container-high`}>
                      <div className="mr-md text-center min-w-[60px]">
                        <span className="block font-label-sm text-label-sm text-outline">{time}</span>
                        <span className="block font-label-md text-label-md font-bold text-on-surface">{period}</span>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-label-md text-label-md text-on-surface font-semibold">{c.name}</h4>
                        <p className="font-body-sm text-body-sm text-on-surface-variant">
                          {c.day_of_week} • {c.location}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
