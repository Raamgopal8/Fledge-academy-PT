import asyncio
from datetime import timedelta
import sys
import os
import requests
from pymongo import MongoClient
import jwt
from dotenv import load_dotenv
from bson import ObjectId

load_dotenv("backend/materials_service/.env")
SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
MONGODB_URL = os.getenv("MONGODB_URL")

def create_access_token(data: dict):
    to_encode = data.copy()
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def test():
    print("Connecting to DB...")
    client = MongoClient(MONGODB_URL)
    db = client.get_database("test") # from the url usually defaults to test, let's see
    
    # Actually wait, maybe the database name is "test"? In beanie we usually connect to it.
    # Let's check what db it uses in main monolith
    staff = client.test.users.find_one({"role": "staff"}) or client.fledgeportal.users.find_one({"role": "staff"})
    
    if staff:
        user_id = str(staff['_id'])
        role = staff['role']
        print(f"Found user: {staff.get('email')} with role {role}")
    else:
        print("No staff user found, generating mock token")
        user_id = str(ObjectId())
        role = "staff"
        
    token = create_access_token(
        data={"sub": user_id, "role": role}
    )
    
    # Test new materials microservice on 8005
    url = "http://localhost:8005/api/materials"
    headers = {"Authorization": f"Bearer {token}"}
    
    print(f"Testing fetching materials at {url}...")
    response = requests.get(url, headers=headers)
    print("Status:", response.status_code)
    print("Response:", response.text[:200])

    multipart_data = {
        "title": (None, "Test Link from Microservice API Test"),
        "description": (None, "Test Description"),
        "link": (None, "https://example.com/test-microservice")
    }
    
    print(f"\nTesting link upload...")
    response = requests.post(url, headers=headers, files=multipart_data)
    print("Status:", response.status_code)
    print("Response:", response.text)
    
    print(f"\nTesting fetching materials after upload...")
    response = requests.get(url, headers=headers)
    print("Status:", response.status_code)
    if response.status_code == 200:
        materials = response.json()
        print(f"Found {len(materials)} materials")
        for m in materials[-2:]:
            print(f"- {m['title']} ({m['file_url']})")

if __name__ == "__main__":
    test()
