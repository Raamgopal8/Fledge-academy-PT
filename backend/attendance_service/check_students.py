import asyncio
from database import init_db
from models import User
import pprint

async def main():
    await init_db()
    students = await User.find({"role": "student"}).to_list()
    print("Dict find:")
    for s in students:
        print(s.email, s.role)
        
    students2 = await User.find(User.role == "student").to_list()
    print("Attr find:")
    for s in students2:
        print(s.email, s.role)

if __name__ == "__main__":
    asyncio.run(main())
