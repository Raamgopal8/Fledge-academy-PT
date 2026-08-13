from datetime import datetime
from typing import Optional
from beanie import Document, PydanticObjectId
from pydantic import Field

class CommunityMessage(Document):
    content: Optional[str] = None
    audio_url: Optional[str] = None
    author_id: str
    author_name: str
    role: str = "student"
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Settings:
        name = "community_messages"
