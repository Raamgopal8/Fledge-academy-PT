import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from backend.core_service import models

async def check():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client.fledgeportal
    from beanie import init_beanie
    await init_beanie(database=db, document_models=[models.User])
    
    users = await models.User.find_all().to_list()
    for u in users:
        print(f"Role: {u.role}, Name: {u.name}, Batch: {getattr(u, 'batch', 'None')}")

if __name__ == "__main__":
    asyncio.run(check())
