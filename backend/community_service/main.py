from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
from database import init_db
from routes import community

@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield

os.makedirs("uploads", exist_ok=True)

app = FastAPI(title="Community Service", lifespan=lifespan)

app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(community.router, prefix='/api/community', tags=['community'])

@app.get("/")
async def root():
    return {"message": "Community Service is running"}
