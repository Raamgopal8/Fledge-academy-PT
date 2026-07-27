from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from pydantic import BaseModel
from typing import Optional, Dict, Any, List

from database import get_db
import models
from routes.auth import get_current_user

router = APIRouter()

class UserProfileUpdate(BaseModel):
    name: Optional[str] = None
    profile_image_url: Optional[str] = None
    preferences: Optional[Dict[str, Any]] = None

@router.get("/profile")
async def get_profile(current_user: models.User = Depends(get_current_user)):
    return {
        "email": current_user.email,
        "name": current_user.name,
        "role": current_user.role,
        "profile_image_url": current_user.profile_image_url,
        "preferences": current_user.preferences
    }

@router.put("/profile")
async def update_profile(
    profile_data: UserProfileUpdate, 
    current_user: models.User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if profile_data.name is not None:
        current_user.name = profile_data.name
    if profile_data.profile_image_url is not None:
        current_user.profile_image_url = profile_data.profile_image_url
    if profile_data.preferences is not None:
        # Merge dicts
        current_prefs = current_user.preferences or {}
        current_prefs.update(profile_data.preferences)
        current_user.preferences = current_prefs

    db.add(current_user)
    await db.commit()
    await db.refresh(current_user)
    
    return {
        "message": "Profile updated successfully",
        "user": {
            "email": current_user.email,
            "name": current_user.name,
            "role": current_user.role,
            "profile_image_url": current_user.profile_image_url,
            "preferences": current_user.preferences
        }
    }

class StudentCreate(BaseModel):
    name: str
    email: str
    password: str

class StudentUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    password: Optional[str] = None

@router.get("/students")
async def get_students(
    current_user: models.User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if current_user.role != "ceo":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    result = await db.execute(select(models.User).filter(models.User.role == "student"))
    students = result.scalars().all()
    
    return [
        {
            "id": s.id,
            "name": s.name,
            "email": s.email
        } for s in students
    ]

@router.post("/students")
async def create_student(
    student_data: StudentCreate,
    current_user: models.User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if current_user.role != "ceo":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Check if email exists
    result = await db.execute(select(models.User).filter(models.User.email == student_data.email))
    existing_user = result.scalars().first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
        
    new_student = models.User(
        name=student_data.name,
        email=student_data.email,
        password=student_data.password,
        role="student"
    )
    db.add(new_student)
    await db.commit()
    await db.refresh(new_student)
    
    return {"message": "Student created successfully", "id": new_student.id}

@router.put("/students/{student_id}")
async def update_student(
    student_id: int,
    student_data: StudentUpdate,
    current_user: models.User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if current_user.role != "ceo":
        raise HTTPException(status_code=403, detail="Not authorized")
        
    result = await db.execute(select(models.User).filter(models.User.id == student_id, models.User.role == "student"))
    student = result.scalars().first()
    
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
        
    if student_data.name is not None:
        student.name = student_data.name
    if student_data.email is not None:
        student.email = student_data.email
    if student_data.password is not None:
        student.password = student_data.password
        
    await db.commit()
    return {"message": "Student updated successfully"}

@router.delete("/students/{student_id}")
async def delete_student(
    student_id: int,
    current_user: models.User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if current_user.role != "ceo":
        raise HTTPException(status_code=403, detail="Not authorized")
        
    result = await db.execute(select(models.User).filter(models.User.id == student_id, models.User.role == "student"))
    student = result.scalars().first()
    
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
        
    await db.delete(student)
    await db.commit()
    return {"message": "Student deleted successfully"}

class StaffCreate(BaseModel):
    name: str
    email: str
    password: str

class StaffUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    password: Optional[str] = None

@router.get("/staff")
async def get_staff(
    current_user: models.User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if current_user.role != "ceo":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    result = await db.execute(select(models.User).filter(models.User.role == "staff"))
    staff_members = result.scalars().all()
    
    return [
        {
            "id": s.id,
            "name": s.name,
            "email": s.email
        } for s in staff_members
    ]

@router.post("/staff")
async def create_staff(
    staff_data: StaffCreate,
    current_user: models.User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if current_user.role != "ceo":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Check if email exists
    result = await db.execute(select(models.User).filter(models.User.email == staff_data.email))
    existing_user = result.scalars().first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
        
    new_staff = models.User(
        name=staff_data.name,
        email=staff_data.email,
        password=staff_data.password,
        role="staff"
    )
    db.add(new_staff)
    await db.commit()
    await db.refresh(new_staff)
    
    return {"message": "Staff member created successfully", "id": new_staff.id}

@router.put("/staff/{staff_id}")
async def update_staff(
    staff_id: int,
    staff_data: StaffUpdate,
    current_user: models.User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if current_user.role != "ceo":
        raise HTTPException(status_code=403, detail="Not authorized")
        
    result = await db.execute(select(models.User).filter(models.User.id == staff_id, models.User.role == "staff"))
    staff = result.scalars().first()
    
    if not staff:
        raise HTTPException(status_code=404, detail="Staff member not found")
        
    if staff_data.name is not None:
        staff.name = staff_data.name
    if staff_data.email is not None:
        staff.email = staff_data.email
    if staff_data.password is not None:
        staff.password = staff_data.password
        
    await db.commit()
    return {"message": "Staff member updated successfully"}

@router.delete("/staff/{staff_id}")
async def delete_staff(
    staff_id: int,
    current_user: models.User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if current_user.role != "ceo":
        raise HTTPException(status_code=403, detail="Not authorized")
        
    result = await db.execute(select(models.User).filter(models.User.id == staff_id, models.User.role == "staff"))
    staff = result.scalars().first()
    
    if not staff:
        raise HTTPException(status_code=404, detail="Staff member not found")
        
    await db.delete(staff)
    await db.commit()
    return {"message": "Staff member deleted successfully"}
