import asyncio
from datetime import timedelta
import sys
import os
from pymongo import MongoClient

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
# Remove dotenv so we get the default secret key that the running server uses
# Wait, MONGODB_URL might not be set in the server? Yes it is! It connects!
# If it's not set in the server, how does the server connect? It has default to local mongodb!
# Let's see models.py: it might have a default MONGODB_URL.

from routes.auth import create_access_token, SECRET_KEY
import requests

def test():
    # Use local mongo because server is using local mongo!
    client = MongoClient("mongodb://localhost:27017/")
    db = client['fledgeportal'] 
    staff = db.users.find_one({"role": "staff"}) or db.users.find_one({"role": "ceo"})
    if not staff:
        print("No user found")
        return
        
    user_id = str(staff['_id'])
    
    # We use the default secret key from auth.py which is what the server is using
    token = create_access_token(
        data={"sub": user_id, "role": staff['role']},
        expires_delta=timedelta(days=1)
    )
    
    url = "http://localhost:8000/api/materials/"
    headers = {"Authorization": f"Bearer {token}"}
    
    multipart_data = {
        "title": (None, "Test Link"),
        "description": (None, ""),
        "link": (None, "https://example.com")
    }
    print(f"Testing link upload with token: {token[:10]}...")
    response = requests.post(url, headers=headers, files=multipart_data)
    print("Status:", response.status_code)
    print("Response:", response.text)

if __name__ == "__main__":
    test()
