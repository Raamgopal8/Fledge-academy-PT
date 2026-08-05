import os
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from dotenv import load_dotenv

load_dotenv()

MONGODB_URL = os.getenv("MONGODB_URL")

if not MONGODB_URL:
    raise ValueError("MONGODB_URL environment variable is not set.")

async def init_db():
    client = AsyncIOMotorClient(MONGODB_URL)
    database = client.fledgeportal
    import models
    await init_beanie(
        database=database,
        document_models=[
            models.Announcement,
            models.AnnouncementView,
            models.User
        ]
    )
