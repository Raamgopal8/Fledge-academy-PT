import asyncio
import database
import models
from sqlalchemy import select

async def main():
    async with database.engine.begin() as conn:
        await conn.run_sync(models.Base.metadata.create_all)
        
    async with database.AsyncSessionLocal() as session:
        res = await session.execute(select(models.User))
        users = res.scalars().all()
        print([(u.email, u.name) for u in users])

if __name__ == "__main__":
    asyncio.run(main())
