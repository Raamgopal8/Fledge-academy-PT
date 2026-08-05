import os

services = {
    "announcement_service": {
        "models": ["Announcement", "AnnouncementView"],
        "routes": ["announcement.py"],
        "port": 8001
    },
    "attendance_service": {
        "models": ["Attendance"],
        "routes": ["attendance.py"],
        "port": 8002
    },
    "test_service": {
        "models": ["Test"],
        "routes": ["tests.py"],
        "port": 8003
    },
    "testsub_service": {
        "models": ["TestSubmission"],
        "routes": [], # Test submissions might be in tests.py originally
        "port": 8004
    }
}

database_py_template = """import os
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from dotenv import load_dotenv

load_dotenv()

MONGODB_URL = os.getenv("MONGODB_URL")

if not MONGODB_URL:
    raise ValueError("MONGODB_URL environment variable is not set.")

async def init_db():
    client = AsyncIOMotorClient(MONGODB_URL)
    database = client.get_default_database()
    import models
    await init_beanie(
        database=database,
        document_models=[
            {model_list}
        ]
    )
"""

main_py_template = """from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import init_db

@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield

app = FastAPI(title="{title}", lifespan=lifespan)

origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

{route_imports}

@app.get("/")
async def root():
    return {{"message": "{title} is running"}}
"""

for service, config in services.items():
    base = f"backend/{service}"
    os.makedirs(f"{base}/routes", exist_ok=True)
    
    # database.py
    models_str = ",\n            ".join([f"models.{m}" for m in config["models"]])
    with open(f"{base}/database.py", "w") as f:
        f.write(database_py_template.format(model_list=models_str))
        
    # main.py
    route_imports = ""
    for r in config["routes"]:
        name = r.replace(".py", "")
        route_imports += f"from routes import {name}\n"
        route_imports += f"app.include_router({name}.router, prefix='/api/{name}', tags=['{name}'])\n"
        
    with open(f"{base}/main.py", "w") as f:
        f.write(main_py_template.format(title=service.replace("_", " ").title(), route_imports=route_imports))
        
print("Scaffolding complete.")
