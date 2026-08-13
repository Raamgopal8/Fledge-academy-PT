import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
import os
import sys

# Add backend paths to import models
sys.path.append(os.path.abspath('backend/attendance_service'))
from models import User, Attendance

async def main():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    await init_beanie(database=client.fledgeportal, document_models=[User, Attendance])
    
    users = await User.find({"role": "student"}).to_list()
    for u in users:
        print(f"Student: {u.name}, ID: {u.id}")
        att = await Attendance.find_one(Attendance.user_id == u.id)
        if att:
            print(f"  Attendance: {att.date} - {att.status}")
        else:
            print("  No attendance records.")

if __name__ == "__main__":
    asyncio.run(main())
