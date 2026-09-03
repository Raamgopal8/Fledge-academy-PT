import asyncio
import sys
import os

# Add backend/core_service to sys.path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "backend", "core_service"))

from database import init_db
import models

async def set_admin(email: str):
    await init_db()
    clean_email = email.strip().lower()
    
    user = await models.User.find_one({
        "email": {"$regex": f"^{clean_email}$", "$options": "i"}
    })
    
    if user:
        user.role = "admin"
        await user.save()
        print(f"SUCCESS: Existing user '{clean_email}' promoted to role 'admin'.")
    else:
        new_user = models.User(
            email=clean_email,
            password="password123",
            name=clean_email.split("@")[0].title(),
            role="admin",
            terms_accepted=True
        )
        await new_user.insert()
        print(f"SUCCESS: Created new record for '{clean_email}' with role 'admin'.")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python promote_admin.py <email>")
        sys.exit(1)
    
    target_email = sys.argv[1]
    asyncio.run(set_admin(target_email))
