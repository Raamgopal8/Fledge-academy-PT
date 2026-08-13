import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
import json
from datetime import datetime

class JSONEncoder(json.JSONEncoder):
    def default(self, o):
        if isinstance(o, ObjectId):
            return str(o)
        if isinstance(o, datetime):
            return o.isoformat()
        return super().default(o)

async def main():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client["fledgeportal"]
    
    users = await db.users.find({"role": "student"}).to_list(10)
    print("Users:")
    for u in users:
        print(f"ID: {u['_id']}, Email: {u.get('email')}, Type: {type(u['_id'])}")
        
    attendances = await db.attendance.find({}).to_list(10)
    print("\nAttendance Records:")
    for a in attendances:
        print(f"ID: {a['_id']}, UserID: {a.get('user_id')}, Date: {a.get('date')}, Status: {a.get('status')}, UserIDType: {type(a.get('user_id'))}")

asyncio.run(main())
