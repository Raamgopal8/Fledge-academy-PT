import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
import sys

async def check():
    client = AsyncIOMotorClient("mongodb+srv://fledgeceo:fledgeportal@fledgeportal.feyjvwi.mongodb.net/?appName=fledgeportal")
    db = client.fledgeportal
    users = await db.users.find().to_list(length=None)
    print("Users:")
    for u in users:
        print(f"Role: {u.get('role')}, Email: {u.get('email')}, Name: {u.get('name')}, Batch: {u.get('batch')}")

if __name__ == "__main__":
    asyncio.run(check())
