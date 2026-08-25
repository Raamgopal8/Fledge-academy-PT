from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import init_db
import models
from routes import auth, dashboard, user, schedule

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize Beanie database connection
    await init_db()
    
    # Seed initial users (ceo and staff only)
    valid_users = [
        {"email": "ceo@gmail.com", "password": "password123", "role": "ceo", "name": "CEO", "profile_image_url": "https://i.pravatar.cc/150?u=ceo"},
    ]
    
    for user_data in valid_users:
        existing_user = await models.User.find_one(models.User.email == user_data["email"])
        if not existing_user:
            new_user = models.User(**user_data)
            await new_user.insert()
            
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
    "http://localhost:3001",
    "http://127.0.0.1:3001",
    "https://fledge-academy-f0akgh02f-raamgopal8s-projects.vercel.app",
    "https://fledge-academy-pt-1.onrender.com",
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
UPLOAD_DIR = "/tmp/uploads" if os.environ.get("VERCEL") else "uploads"
try:
    os.makedirs(UPLOAD_DIR, exist_ok=True)
except OSError:
    UPLOAD_DIR = "/tmp/uploads"
    os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

from routes import auth, dashboard, user, schedule, staff_logs, finance, notes

# Include Routers
app.include_router(auth.router, prefix="/api", tags=["Auth"])
app.include_router(dashboard.router, prefix="/api/dashboard", tags=["Dashboard"])
app.include_router(user.router, prefix="/api/user", tags=["User"])
app.include_router(schedule.router, prefix="/api/schedule", tags=["Schedule"])
app.include_router(staff_logs.router, prefix="/api/staff-logs", tags=["Staff Logs"])
app.include_router(finance.router, prefix="/api/finance", tags=["Finance"])
app.include_router(notes.router, prefix="/api/student-notes", tags=["Student Notes"])

@app.get("/")
async def root():
    return {"message": "Welcome to Fledge Portal API"}
