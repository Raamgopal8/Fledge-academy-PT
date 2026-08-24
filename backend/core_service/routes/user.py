from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from beanie import PydanticObjectId

import models
from routes.auth import get_current_user

router = APIRouter()

class UserProfileUpdate(BaseModel):
    name: Optional[str] = None
    profile_image_url: Optional[str] = None
    preferences: Optional[Dict[str, Any]] = None

@router.get("/profile")
async def get_profile(current_user: models.User = Depends(get_current_user)):
    user_batches = getattr(current_user, "batches", None) or ([current_user.batch] if getattr(current_user, "batch", None) else [])
    return {
        "email": current_user.email,
        "name": current_user.name,
        "role": current_user.role,
        "profile_image_url": current_user.profile_image_url,
        "level": current_user.level,
        "batch": current_user.batch or (user_batches[0] if user_batches else None),
        "batches": user_batches,
        "preferences": current_user.preferences
    }

@router.put("/profile")
async def update_profile(
    profile_data: UserProfileUpdate, 
    current_user: models.User = Depends(get_current_user)
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

    await current_user.save()
    
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
    level: Optional[str] = None
    batch: Optional[str] = None

class StudentUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    password: Optional[str] = None
    level: Optional[str] = None
    batch: Optional[str] = None

@router.get("/students")
async def get_students(current_user: models.User = Depends(get_current_user)):
    if current_user.role != "ceo":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    students = await models.User.find({"role": "student"}).to_list()
    
    return [
        {
            "id": str(s.id),
            "name": s.name,
            "email": s.email,
            "level": s.level,
            "batch": s.batch
        } for s in students
    ]

@router.post("/students")
async def create_student(
    student_data: StudentCreate,
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role != "ceo":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Check if email exists
    existing_user = await models.User.find_one({"email": student_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
        
    new_student = models.User(
        name=student_data.name,
        email=student_data.email,
        password=student_data.password,
        role="student",
        level=student_data.level,
        batch=student_data.batch
    )
    await new_student.insert()
    
    return {"message": "Student created successfully", "id": str(new_student.id)}

@router.put("/students/{student_id}")
async def update_student(
    student_id: PydanticObjectId,
    student_data: StudentUpdate,
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role != "ceo":
        raise HTTPException(status_code=403, detail="Not authorized")
        
    student = await models.User.find_one({"_id": student_id, "role": "student"})
    
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
        
    if student_data.name is not None:
        student.name = student_data.name
    if student_data.email is not None:
        student.email = student_data.email
    if student_data.password is not None:
        student.password = student_data.password
    if student_data.level is not None:
        student.level = student_data.level
    if student_data.batch is not None:
        student.batch = student_data.batch
        
    await student.save()
    return {"message": "Student updated successfully"}

@router.delete("/students/{student_id}")
async def delete_student(
    student_id: PydanticObjectId,
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role != "ceo":
        raise HTTPException(status_code=403, detail="Not authorized")
        
    student = await models.User.find_one({"_id": student_id, "role": "student"})
    
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
        
    await student.delete()
    return {"message": "Student deleted successfully"}

class StaffCreate(BaseModel):
    name: str
    email: str
    password: str
    level: Optional[str] = None
    batch: Optional[str] = None
    batches: Optional[List[str]] = None

class StaffUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    password: Optional[str] = None
    level: Optional[str] = None
    batch: Optional[str] = None
    batches: Optional[List[str]] = None

@router.get("/staff")
async def get_staff(current_user: models.User = Depends(get_current_user)):
    if current_user.role != "ceo":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    staff_members = await models.User.find({"role": "staff"}).to_list()
    
    return [
        {
            "id": str(s.id),
            "name": s.name,
            "email": s.email,
            "level": s.level,
            "batch": s.batch or (s.batches[0] if getattr(s, "batches", None) else None),
            "batches": s.batches if getattr(s, "batches", None) else ([s.batch] if getattr(s, "batch", None) else [])
        } for s in staff_members
    ]

@router.post("/staff")
async def create_staff(
    staff_data: StaffCreate,
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role != "ceo":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Check if email exists
    existing_user = await models.User.find_one({"email": staff_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
        
    staff_batches = staff_data.batches or ([staff_data.batch] if staff_data.batch else [])
    primary_batch = staff_data.batch or (staff_batches[0] if staff_batches else None)

    new_staff = models.User(
        name=staff_data.name,
        email=staff_data.email,
        password=staff_data.password,
        role="staff",
        level=staff_data.level,
        batch=primary_batch,
        batches=staff_batches
    )
    await new_staff.insert()
    
    return {"message": "Staff member created successfully", "id": str(new_staff.id)}

@router.put("/staff/{staff_id}")
async def update_staff(
    staff_id: PydanticObjectId,
    staff_data: StaffUpdate,
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role != "ceo":
        raise HTTPException(status_code=403, detail="Not authorized")
        
    staff = await models.User.find_one({"_id": staff_id, "role": "staff"})
    
    if not staff:
        raise HTTPException(status_code=404, detail="Staff member not found")
        
    if staff_data.name is not None:
        staff.name = staff_data.name
    if staff_data.email is not None:
        staff.email = staff_data.email
    if staff_data.password is not None:
        staff.password = staff_data.password
    if staff_data.level is not None:
        staff.level = staff_data.level
    if staff_data.batches is not None:
        staff.batches = staff_data.batches
        if not staff_data.batch and staff_data.batches:
            staff.batch = staff_data.batches[0]
    if staff_data.batch is not None:
        staff.batch = staff_data.batch
        if not staff_data.batches:
            staff.batches = [staff_data.batch] if staff_data.batch else []
        
    await staff.save()
    return {"message": "Staff member updated successfully"}

class StaffLevelUpdate(BaseModel):
    level: str

@router.put("/staff/{staff_id}/level")
async def update_staff_level(
    staff_id: PydanticObjectId,
    level_data: StaffLevelUpdate,
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role != "ceo":
        raise HTTPException(status_code=403, detail="Not authorized")
        
    staff = await models.User.find_one({"_id": staff_id, "role": "staff"})
    
    if not staff:
        raise HTTPException(status_code=404, detail="Staff member not found")
        
    staff.level = level_data.level
    await staff.save()
    return {"message": "Staff level updated successfully"}

@router.delete("/staff/{staff_id}")
async def delete_staff(
    staff_id: PydanticObjectId,
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role != "ceo":
        raise HTTPException(status_code=403, detail="Not authorized")
        
    staff = await models.User.find_one({"_id": staff_id, "role": "staff"})
    
    if not staff:
        raise HTTPException(status_code=404, detail="Staff member not found")
        
    await staff.delete()
    return {"message": "Staff member deleted successfully"}

@router.get("/classroom/members")
async def get_classroom_members(
    level: Optional[str] = None,
    batch: Optional[str] = None,
    current_user: models.User = Depends(get_current_user)
):
    """Fetch instructors and classmates for a given level and batch"""
    # 1. Student matching
    student_conditions = [{"role": {"$in": ["student", "Student"]}}]
    if level and level.strip().lower() not in ["all", "all levels"]:
        student_conditions.append({"level": {"$regex": f"^{level.strip()}$", "$options": "i"}})
    if batch and batch.strip().lower() not in ["all batches", "all assigned batches", "global", "global access", "all"]:
        clean_batch = batch.strip()
        student_conditions.append({
            "$or": [
                {"batch": {"$regex": f"^{clean_batch}$", "$options": "i"}},
                {"batches": {"$in": [clean_batch]}}
            ]
        })
    student_query = {"$and": student_conditions}

    # 2. Staff / Instructor matching
    staff_conditions = [{"role": {"$in": ["staff", "Staff", "ceo", "CEO", "admin", "Admin"]}}]
    if level and level.strip().lower() not in ["all", "all levels"]:
        clean_level = level.strip()
        staff_conditions.append({
            "$or": [
                {"level": {"$regex": f"^{clean_level}$", "$options": "i"}},
                {"level": {"$regex": "^all levels$", "$options": "i"}},
                {"level": {"$regex": "^all$", "$options": "i"}},
                {"level": None},
                {"level": ""}
            ]
        })
    if batch and batch.strip().lower() not in ["all batches", "all assigned batches", "global", "global access", "all"]:
        clean_batch = batch.strip()
        staff_conditions.append({
            "$or": [
                {"batch": {"$regex": f"^{clean_batch}$", "$options": "i"}},
                {"batches": {"$in": [clean_batch]}},
                {"batch": {"$regex": "^all batches$", "$options": "i"}},
                {"batch": {"$regex": "^all$", "$options": "i"}},
                {"batch": {"$regex": "^global$", "$options": "i"}},
                {"batches": {"$in": ["All Batches", "All", "Global"]}},
                {"batch": None},
                {"batch": ""}
            ]
        })
    staff_query = {"$and": staff_conditions}

    combined_query = {"$or": [student_query, staff_query]}
    members = await models.User.find(combined_query).to_list()
    
    return [
        {
            "id": str(m.id),
            "name": m.name,
            "email": m.email,
            "role": (m.role or "").lower(),
            "profile_image_url": m.profile_image_url,
            "level": m.level,
            "batch": m.batch,
            "batches": getattr(m, "batches", []) or []
        } for m in members
    ]
