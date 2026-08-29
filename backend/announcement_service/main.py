from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import init_db

@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield

app = FastAPI(title="Announcement Service", lifespan=lifespan)

origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3001",
    "https://fledgeportal.vercel.app",
    "https://fledgeportal.web.app",
    "https://fledgeportal-backend-844515198625.us-central1.run.app",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from routes import announcement
app.include_router(announcement.router, prefix='/api/announcement', tags=['announcement'])


@app.get("/")
async def root():
    return {"message": "Announcement Service is running"}
