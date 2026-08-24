import os
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

MONGODB_URL = "mongodb+srv://fledgeceo:fledgeportal@fledgeportal.feyjvwi.mongodb.net/?appName=fledgeportal"

level_map = {
    "N5": "Level 5",
    "N4": "Level 4",
    "N3": "Level 3",
    "N2": "Level 2",
    "N1": "Level 1"
}

async def migrate():
    client = AsyncIOMotorClient(MONGODB_URL)
    db = client.fledgeportal

    collections_to_check = [
        "users",
        "class_schedules",
        "announcements",
        "materials",
        "tests"
    ]

    for collection_name in collections_to_check:
        collection = db[collection_name]
        print(f"Checking collection: {collection_name}")
        for old_lvl, new_lvl in level_map.items():
            result = await collection.update_many(
                {"level": old_lvl},
                {"$set": {"level": new_lvl}}
            )
            if result.modified_count > 0:
                print(f"  Updated {result.modified_count} documents from {old_lvl} to {new_lvl}")

    print("Migration complete.")

if __name__ == "__main__":
    asyncio.run(migrate())
