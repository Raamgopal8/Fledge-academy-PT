from datetime import datetime
from typing import Optional
from beanie import Document, PydanticObjectId
from pydantic import Field

class User(Document):
    email: str
    password: str
    role: str = "student"
    name: Optional[str] = None
    profile_image_url: Optional[str] = None
    preferences: dict = {}

    class Settings:
        name = "users"

class Material(Document):
    title: str
    description: Optional[str] = None
    file_url: str
    uploaded_by_id: PydanticObjectId
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "materials"
