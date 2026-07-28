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

class ClassSchedule(Document):
    name: str
    time: str
    location: str
    students: int = 0
    color: str = "primary"
    day_of_week: str

    class Settings:
        name = "class_schedules"

class Attendance(Document):
    user_id: PydanticObjectId
    date: str # Format: YYYY-MM-DD
    status: str = "absent" # present, absent

    class Settings:
        name = "attendance"

class Announcement(Document):
    title: str
    content: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    author_id: PydanticObjectId

    class Settings:
        name = "announcements"

class AnnouncementView(Document):
    user_id: PydanticObjectId
    announcement_id: PydanticObjectId
    viewed_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "announcement_views"

class Material(Document):
    title: str
    description: Optional[str] = None
    file_url: str
    uploaded_by_id: PydanticObjectId
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "materials"

class Test(Document):
    title: str
    description: Optional[str] = None
    created_by_id: PydanticObjectId
    created_at: datetime = Field(default_factory=datetime.utcnow)
    due_date: Optional[datetime] = None

    class Settings:
        name = "tests"

class TestSubmission(Document):
    test_id: PydanticObjectId
    student_id: PydanticObjectId
    submission_content: str
    submitted_at: datetime = Field(default_factory=datetime.utcnow)
    staff_comments: Optional[str] = None
    status: str = "Pending Review"
    score: Optional[int] = None

    class Settings:
        name = "test_submissions"

class StaffLog(Document):
    staff_id: PydanticObjectId
    action: str
    details: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "staff_logs"

class Activity(Document):
    user: str
    action: str
    time: str
    type: str

    class Settings:
        name = "activities"
