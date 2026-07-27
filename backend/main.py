from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select
from database import engine, Base, AsyncSessionLocal
import models
from routes import auth, dashboard, user, schedule, attendance, announcement, materials, tests

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    # Seed initial users
    async with AsyncSessionLocal() as session:
        valid_users = [
            {"email": "ceo@gmail.com", "password": "password123", "role": "ceo", "name": "CEO", "profile_image_url": "https://i.pravatar.cc/150?u=ceo"},
            {"email": "staff@gmail.com", "password": "password123", "role": "staff", "name": "Staff Member", "profile_image_url": "https://i.pravatar.cc/150?u=staff"},
            {"email": "student@gmail.com", "password": "password123", "role": "student", "name": "Student", "profile_image_url": "https://i.pravatar.cc/150?u=student"},
        ]
        
        for user_data in valid_users:
            result = await session.execute(select(models.User).filter(models.User.email == user_data["email"]))
            existing_user = result.scalars().first()
            if not existing_user:
                new_user = models.User(**user_data)
                session.add(new_user)
        
        # Seed initial class schedules
        result = await session.execute(select(models.ClassSchedule))
        existing_schedules = result.scalars().all()
        if not existing_schedules:
            valid_schedules = [
                {"name": "Adv. Mathematics II", "time": "09:00 AM - 10:30 AM", "location": "Room 304", "students": 42, "color": "primary", "day_of_week": "Monday"},
                {"name": "Digital Literacy 101", "time": "11:30 AM - 01:00 PM", "location": "Virtual Lab", "students": 18, "color": "secondary", "day_of_week": "Wednesday"},
                {"name": "Ethics & Tech Seminar", "time": "02:00 PM - 03:30 PM", "location": "Main Hall", "students": 120, "color": "tertiary", "day_of_week": "Friday"},
            ]
            for schedule_data in valid_schedules:
                new_schedule = models.ClassSchedule(**schedule_data)
                session.add(new_schedule)

        # Seed initial staff logs
        result = await session.execute(select(models.StaffLog))
        existing_logs = result.scalars().all()
        if not existing_logs:
            # We need the staff user id to seed logs
            result = await session.execute(select(models.User).filter(models.User.email == "staff@gmail.com"))
            staff_user = result.scalars().first()
            if staff_user:
                import datetime
                valid_logs = [
                    {"staff_id": staff_user.id, "action": "Graded Test", "details": "Graded Midterm Exam for John Doe.", "timestamp": datetime.datetime.utcnow() - datetime.timedelta(hours=2)},
                    {"staff_id": staff_user.id, "action": "Posted Announcement", "details": "Posted 'Upcoming Assignment Deadlines'.", "timestamp": datetime.datetime.utcnow() - datetime.timedelta(hours=5)},
                    {"staff_id": staff_user.id, "action": "Updated Material", "details": "Updated 'Week 3 Slides' PDF.", "timestamp": datetime.datetime.utcnow() - datetime.timedelta(days=1)}
                ]
                for log_data in valid_logs:
                    new_log = models.StaffLog(**log_data)
                    session.add(new_log)
        await session.commit()
    yield

app = FastAPI(
    title="Fledge Portal API",
    description="Backend for Fledge Academy Portal",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS for Next.js frontend
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from fastapi.staticfiles import StaticFiles
import os

# Mount uploads directory
os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

from routes import auth, dashboard, user, schedule, attendance, announcement, materials, tests, staff_logs

# Include Routers
app.include_router(auth.router, prefix="/api", tags=["Auth"])
app.include_router(dashboard.router, prefix="/api/dashboard", tags=["Dashboard"])
app.include_router(user.router, prefix="/api/user", tags=["User"])
app.include_router(schedule.router, prefix="/api/schedule", tags=["Schedule"])
app.include_router(attendance.router, prefix="/api/attendance", tags=["Attendance"])
app.include_router(announcement.router, prefix="/api/announcement", tags=["Announcement"])
app.include_router(materials.router, prefix="/api/materials", tags=["Materials"])
app.include_router(tests.router, prefix="/api/tests", tags=["Tests"])
app.include_router(staff_logs.router, prefix="/api/staff-logs", tags=["Staff Logs"])

@app.get("/")
async def root():
    return {"message": "Welcome to Fledge Portal API"}
