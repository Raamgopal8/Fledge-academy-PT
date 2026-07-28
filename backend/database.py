import os
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from dotenv import load_dotenv

load_dotenv()

MONGODB_URL = os.getenv("MONGODB_URL")

if not MONGODB_URL:
    raise ValueError("MONGODB_URL environment variable is not set.")

async def init_db():
    # Create Motor client
    client = AsyncIOMotorClient(MONGODB_URL)
    
    # Select database
    database = client.fledgeportal
    
    # Import models here to avoid circular imports if needed, or import at top
    import models
    
    # Initialize Beanie with the document models
    await init_beanie(
        database=database,
        document_models=[
            models.User,
            models.ClassSchedule,
            models.Attendance,
            models.Announcement,
            models.AnnouncementView,
            models.Material,
            models.Test,
            models.TestSubmission,
            models.StaffLog,
            models.Activity
        ]
    )
