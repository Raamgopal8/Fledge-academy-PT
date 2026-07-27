from sqlalchemy import Column, Integer, String, JSON
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    password = Column(String, nullable=False)
    role = Column(String, nullable=False, default="student")
    name = Column(String, nullable=True)
    profile_image_url = Column(String, nullable=True)
    preferences = Column(JSON, nullable=True, default={})

class ClassSchedule(Base):
    __tablename__ = "class_schedules"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    time = Column(String, nullable=False)
    location = Column(String, nullable=False)
    students = Column(Integer, nullable=False, default=0)
    color = Column(String, nullable=False, default="primary")
    day_of_week = Column(String, nullable=False)


class Attendance(Base):
    __tablename__ = "attendance"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True, nullable=False)
    date = Column(String, index=True, nullable=False) # Format: YYYY-MM-DD
    status = Column(String, nullable=False, default="absent") # present, absent

from datetime import datetime
from sqlalchemy import DateTime, Text, ForeignKey

class Announcement(Base):
    __tablename__ = "announcements"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    author_id = Column(Integer, ForeignKey("users.id"), nullable=False)


class AnnouncementView(Base):
    __tablename__ = "announcement_views"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=False)
    announcement_id = Column(Integer, ForeignKey("announcements.id"), index=True, nullable=False)
    viewed_at = Column(DateTime, default=datetime.utcnow)

class Material(Base):
    __tablename__ = "materials"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    file_url = Column(String, nullable=False)
    uploaded_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class Test(Base):
    __tablename__ = "tests"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    due_date = Column(DateTime, nullable=True)

class TestSubmission(Base):
    __tablename__ = "test_submissions"

    id = Column(Integer, primary_key=True, index=True)
    test_id = Column(Integer, ForeignKey("tests.id"), nullable=False)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    submission_content = Column(Text, nullable=False)  # Can be a URL, link, or text
    submitted_at = Column(DateTime, default=datetime.utcnow)
    staff_comments = Column(Text, nullable=True)
    status = Column(String, default="Pending Review")  # "Pending Review", "Reviewed"
    score = Column(Integer, nullable=True)

class StaffLog(Base):
    __tablename__ = "staff_logs"

    id = Column(Integer, primary_key=True, index=True)
    staff_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    action = Column(String, nullable=False)
    details = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)

class Activity(Base):
    __tablename__ = "activities"

    id = Column(Integer, primary_key=True, index=True)
    user = Column(String, nullable=False)
    action = Column(String, nullable=False)
    time = Column(String, nullable=False)
    type = Column(String, nullable=False)
