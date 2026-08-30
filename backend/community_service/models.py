from datetime import datetime
from typing import Optional, List
from beanie import Document, PydanticObjectId
from pydantic import Field

class User(Document):
    email: str
    password: str
    role: str = "student"
    name: Optional[str] = None
    profile_image_url: Optional[str] = None
    level: Optional[str] = None
    batch: Optional[str] = None
    batches: Optional[List[str]] = []
    total_fee: Optional[float] = None
    preferences: dict = {}

    class Settings:
        name = "users"

class ClassSchedule(Document):
    level: Optional[str] = None
    batch: Optional[str] = None
    batches: Optional[List[str]] = []
    name: str
    time: str
    location: str
    students: int = 0
    color: str = "primary"
    day_of_week: str
    class_link: Optional[str] = None
    expires_at: Optional[datetime] = None

    class Settings:
        name = "class_schedules"

class Attendance(Document):
    user_id: PydanticObjectId
    date: str # Format: YYYY-MM-DD
    status: str = "absent" # present, absent

    class Settings:
        name = "attendance"

class Announcement(Document):
    level: Optional[str] = None
    batch: Optional[str] = None
    batches: Optional[List[str]] = []
    title: str
    content: str
    created_at: datetime = Field(default_factory=lambda: datetime.utcnow() + timedelta(hours=5, minutes=30))
    updated_at: datetime = Field(default_factory=lambda: datetime.utcnow() + timedelta(hours=5, minutes=30))
    author_id: PydanticObjectId

    class Settings:
        name = "announcements"

class AnnouncementView(Document):
    user_id: PydanticObjectId
    announcement_id: PydanticObjectId
    viewed_at: datetime = Field(default_factory=lambda: datetime.utcnow() + timedelta(hours=5, minutes=30))

    class Settings:
        name = "announcement_views"

class Material(Document):
    level: Optional[str] = None
    batch: Optional[str] = None
    batches: Optional[List[str]] = []
    title: str
    description: Optional[str] = None
    file_url: str
    uploaded_by_id: PydanticObjectId
    created_at: datetime = Field(default_factory=lambda: datetime.utcnow() + timedelta(hours=5, minutes=30))

    class Settings:
        name = "materials"

class Test(Document):
    level: Optional[str] = None
    batch: Optional[str] = None
    batches: Optional[List[str]] = []
    title: str
    description: Optional[str] = None
    created_by_id: PydanticObjectId
    created_at: datetime = Field(default_factory=lambda: datetime.utcnow() + timedelta(hours=5, minutes=30))
    due_date: Optional[datetime] = None

    class Settings:
        name = "tests"

class TestSubmission(Document):
    test_id: PydanticObjectId
    student_id: PydanticObjectId
    submission_content: str
    submitted_at: datetime = Field(default_factory=lambda: datetime.utcnow() + timedelta(hours=5, minutes=30))
    staff_comments: Optional[str] = None
    status: str = "Pending Review"
    score: Optional[int] = None

    class Settings:
        name = "test_submissions"

class StaffLog(Document):
    staff_id: PydanticObjectId
    action: str
    details: Optional[str] = None
    timestamp: datetime = Field(default_factory=lambda: datetime.utcnow() + timedelta(hours=5, minutes=30))

    class Settings:
        name = "staff_logs"

class Activity(Document):
    user: str
    action: str
    time: str
    type: str

    class Settings:
        name = "activities"

class FinancialTransaction(Document):
    amount: float
    type: str # "income" or "expense"
    category: str
    description: Optional[str] = None
    student_id: Optional[PydanticObjectId] = None
    date: datetime = Field(default_factory=lambda: datetime.utcnow() + timedelta(hours=5, minutes=30))

    class Settings:
        name = "financial_transactions"


class CommunityMessage(Document):
    content: Optional[str] = None
    audio_url: Optional[str] = None
    author_id: str
    author_name: str
    author_image: Optional[str] = None
    role: str
    level: Optional[str] = None
    batch: Optional[str] = None
    batches: Optional[List[str]] = []
    created_at: datetime = Field(default_factory=lambda: datetime.utcnow() + timedelta(hours=5, minutes=30))

    class Settings:
        name = "community_messages"


class Video(Document):
    title: str
    category: str
    video_url: str
    uploaded_by_id: PydanticObjectId
    created_at: datetime = Field(default_factory=lambda: datetime.utcnow() + timedelta(hours=5, minutes=30))
    level: Optional[str] = None
    batch: Optional[str] = None
    batches: Optional[List[str]] = []

    class Settings:
        name = "videos"
