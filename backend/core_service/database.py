import os
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from dotenv import load_dotenv
from models import User, Material, TestSubmission, Test, ClassSchedule, Activity

load_dotenv()

MONGODB_URL = os.getenv("MONGODB_URL_1") or os.getenv("MONGODB_URL")

if not MONGODB_URL:
    raise ValueError("MONGODB_URL_1 or MONGODB_URL environment variable is not set.")

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
            models.Material,
            models.TestSubmission,
            models.Test,
            models.ClassSchedule,
            models.Activity,
            models.FinancialTransaction,
            models.Attendance,
            models.StudentNote,
            models.UserActivityLog
        ]
    )
