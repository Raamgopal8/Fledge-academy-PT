# Fledge Portal

Fledge Portal is a comprehensive educational management application with role-based access for Students, Staff, and the CEO. The platform provides interactive dashboards, attendance tracking, scheduling, assignment management, and announcement systems.

## Tech Stack
- **Frontend**: Next.js, React, Tailwind CSS (Bento Grid aesthetics), Material Symbols
- **Backend**: Python, FastAPI, SQLAlchemy
- **Database**: SQLite / PostgreSQL (configured via SQLAlchemy)

## Features & Recent Updates

### Role-Based Portals & Navigation
- Dedicated dashboards and side-navigation panels for `Student`, `Staff`, and `CEO`.
- Clear routing and separation of concerns to prevent unauthorized access (e.g., separating Staff and CEO schedule views).
- **Consistent Footers**: A persistent footer layout implemented globally, fixed to the bottom of the window, preventing overlap with long page content.

### CEO Features
- **Dashboard Overview**: Comprehensive dashboard showing Total Students, Total Staff, Course Completion, Revenue, Average Rating, and Recent Activities.
- **Live Attendance Dashboard**: The "Today's Attendance" section automatically refreshes every 30 seconds to provide real-time updates on present students. A manual refresh button is also available.
- **Detailed Attendance Reports**: The `/ceo/attendance` page has been fully integrated with the backend. It offers live metrics (Total Enrolled, Present, Absent) and a filterable detailed list of all students and their real-time attendance status.
- **Excel Export**: Ability to download attendance reports in Excel format directly from the attendance page.
- **Announcements & Materials**: The CEO has full administrative access to create, edit, and manage global announcements and uploaded materials.

### Staff Features
- **Attendance Management**: Staff can fetch and mark the daily attendance status of students.
- **Tests & Assignments**: Dedicated navigation added for `/staff/tests` and assignment submissions. Staff can post assignments, review student submissions, and leave feedback.
- **Schedule**: A functional daily/weekly schedule specifically tailored to the logged-in staff member.

### Student Features
- **Announcements**: View-only access to global announcements with unread notifications.
- **Materials**: View-only access to materials uploaded by Staff or the CEO.
- **Assignments**: Students can view active assignments and submit their work via links or file uploads.
- **Attendance Status**: Students can view their personal daily attendance status.

## Getting Started

### Prerequisites
- Node.js (for frontend)
- Python 3.8+ (for backend)

### Backend Setup
1. Navigate to the `backend` directory: `cd backend`
2. Install dependencies: `pip install -r requirements.txt`
3. Run the FastAPI server: `uvicorn main:app --reload` (Server will start at `http://localhost:8000`)

### Frontend Setup
1. Navigate to the `frontend` directory: `cd frontend`
2. Install dependencies: `npm install`
3. Run the development server: `npm run dev` (App will start at `http://localhost:3000`)

## Future Enhancements
- Integration of actual charting libraries for the student performance trends graph.
- Further expansion of the assignments and feedback workflows.
