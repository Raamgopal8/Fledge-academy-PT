from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from beanie import PydanticObjectId

import re
import models
from routes.auth import get_current_user
from redis_client import get_user_account, set_user_account, invalidate_user_account, get_cache, set_cache

router = APIRouter()

def format_google_drive_image_url(url: Optional[str]) -> Optional[str]:
    if not url:
        return url
    url_str = url.strip()
    if not url_str:
        return url_str
    
    # Converts standard Google Drive shareable links to direct embeddable image URLs
    match = re.search(r"drive\.google\.com/(?:file/d/([a-zA-Z0-9_-]+)|open\?id=([a-zA-Z0-9_-]+)|uc\?(?:[^&]*&)*id=([a-zA-Z0-9_-]+))", url_str)
    if match:
        file_id = match.group(1) or match.group(2) or match.group(3)
        if file_id:
            return f"https://lh3.googleusercontent.com/d/{file_id}"
    return url_str

class UserProfileUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    profile_image_url: Optional[str] = None
    preferences: Optional[Dict[str, Any]] = None

@router.get("/profile")
async def get_profile(current_user: models.User = Depends(get_current_user)):
    user_email = (current_user.email or "").lower()
    cached = await get_user_account(user_email)
    if cached is not None:
        return cached

    user_batches = getattr(current_user, "batches", None) or ([current_user.batch] if getattr(current_user, "batch", None) else [])
    profile_data = {
        "email": current_user.email,
        "name": current_user.name,
        "phone": getattr(current_user, "phone", None),
        "role": current_user.role,
        "profile_image_url": current_user.profile_image_url,
        "level": current_user.level,
        "batch": current_user.batch or (user_batches[0] if user_batches else None),
        "batches": user_batches,
        "preferences": current_user.preferences
    }
    await set_user_account(user_email, profile_data, ttl=600)
    return profile_data

@router.put("/profile")
async def update_profile(
    profile_data: UserProfileUpdate, 
    current_user: models.User = Depends(get_current_user)
):
    user_role = (current_user.role or "").lower()
    old_email = (current_user.email or "").lower()

    if profile_data.email is not None:
        new_email = profile_data.email.strip().lower()
        if user_role == "student":
            if new_email != old_email:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST, 
                    detail="Student email address is permanent and cannot be modified."
                )
        else:
            if new_email and new_email != old_email:
                # Check uniqueness across existing users
                existing = await models.User.find_one(models.User.email == new_email)
                if existing and str(existing.id) != str(current_user.id):
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="This email address is already registered to another user."
                    )
                current_user.email = new_email
                await invalidate_user_account(old_email)

    if profile_data.name is not None:
        current_user.name = profile_data.name
    if profile_data.phone is not None:
        current_user.phone = profile_data.phone
    if profile_data.profile_image_url is not None:
        clean_image_url = format_google_drive_image_url(profile_data.profile_image_url)
        current_user.profile_image_url = clean_image_url
    if profile_data.preferences is not None:
        # Merge dicts
        current_prefs = current_user.preferences or {}
        current_prefs.update(profile_data.preferences)
        current_user.preferences = current_prefs

    await current_user.save()
    await invalidate_user_account(current_user.email)
    
    user_batches = getattr(current_user, "batches", None) or ([current_user.batch] if getattr(current_user, "batch", None) else [])
    user_dict = {
        "email": current_user.email,
        "name": current_user.name,
        "phone": getattr(current_user, "phone", None),
        "role": current_user.role,
        "profile_image_url": current_user.profile_image_url,
        "level": current_user.level,
        "batch": current_user.batch or (user_batches[0] if user_batches else None),
        "batches": user_batches,
        "preferences": current_user.preferences
    }
    result = {
        "message": "Profile updated successfully",
        **user_dict,
        "user": user_dict
    }
    await set_user_account(current_user.email, user_dict, ttl=600)
    return result

class StudentCreate(BaseModel):
    email: str
    name: Optional[str] = None
    password: Optional[str] = None
    level: Optional[str] = "Level 5"
    batch: Optional[str] = "Batch - 1"

class StudentUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    password: Optional[str] = None
    level: Optional[str] = None
    batch: Optional[str] = None

@router.get("/students")
async def get_students(current_user: models.User = Depends(get_current_user)):
    if (current_user.role or "").lower() not in ["ceo", "admin"]:
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
    if (current_user.role or "").lower() not in ["ceo", "admin"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    clean_email = student_data.email.strip().lower()
    if not clean_email or "@" not in clean_email:
        raise HTTPException(status_code=400, detail="Please provide a valid email address.")
    
    # Check if email exists (case-insensitive)
    existing_user = await models.User.find_one({
        "email": {"$regex": f"^{clean_email}$", "$options": "i"}
    })
    if existing_user:
        raise HTTPException(status_code=400, detail="This email is already registered or pre-enrolled.")
        
    new_student = models.User(
        name=student_data.name or "",
        email=clean_email,
        password=student_data.password or "",
        role="student",
        level=student_data.level or "Level 5",
        batch=student_data.batch or "Batch - 1"
    )
    await new_student.insert()
    
    return {"message": "Student pre-enrolled successfully", "id": str(new_student.id)}

@router.put("/students/{student_id}")
async def update_student(
    student_id: PydanticObjectId,
    student_data: StudentUpdate,
    current_user: models.User = Depends(get_current_user)
):
    if (current_user.role or "").lower() not in ["ceo", "admin"]:
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
    if (current_user.role or "").lower() not in ["ceo", "admin"]:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    student = await models.User.find_one({"_id": student_id, "role": "student"})
    
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
        
    await student.delete()
    return {"message": "Student deleted successfully"}

class SensiCreate(BaseModel):
    name: str
    email: str
    password: str
    level: Optional[str] = None
    batch: Optional[str] = None
    batches: Optional[List[str]] = None

class SensiUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    password: Optional[str] = None
    level: Optional[str] = None
    batch: Optional[str] = None
    batches: Optional[List[str]] = None

# Support both StaffCreate and SensiCreate for backward compatibility
StaffCreate = SensiCreate
StaffUpdate = SensiUpdate

@router.get("/sensi")
@router.get("/staff")
async def get_sensi(current_user: models.User = Depends(get_current_user)):
    if (current_user.role or "").lower() not in ["ceo", "admin"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    sensi_members = await models.User.find({"role": {"$in": ["sensi", "staff"]}}).to_list()
    
    return [
        {
            "id": str(s.id),
            "name": s.name,
            "email": s.email,
            "role": "sensi",
            "level": s.level,
            "batch": s.batch or (s.batches[0] if getattr(s, "batches", None) else None),
            "batches": s.batches if getattr(s, "batches", None) else ([s.batch] if getattr(s, "batch", None) else [])
        } for s in sensi_members
    ]

@router.post("/sensi")
@router.post("/staff")
async def create_sensi(
    sensi_data: SensiCreate,
    current_user: models.User = Depends(get_current_user)
):
    if (current_user.role or "").lower() not in ["ceo", "admin"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Check if email exists
    existing_user = await models.User.find_one({"email": sensi_data.email.strip().lower()})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
        
    sensi_batches = sensi_data.batches or ([sensi_data.batch] if sensi_data.batch else [])
    primary_batch = sensi_data.batch or (sensi_batches[0] if sensi_batches else None)

    new_sensi = models.User(
        name=sensi_data.name,
        email=sensi_data.email.strip().lower(),
        password=sensi_data.password,
        role="sensi",
        level=sensi_data.level,
        batch=primary_batch,
        batches=sensi_batches
    )
    await new_sensi.insert()
    
    return {"message": "Sensi member created successfully", "id": str(new_sensi.id)}

@router.put("/sensi/{sensi_id}")
@router.put("/staff/{sensi_id}")
async def update_sensi(
    sensi_id: PydanticObjectId,
    sensi_data: SensiUpdate,
    current_user: models.User = Depends(get_current_user)
):
    if (current_user.role or "").lower() not in ["ceo", "admin"]:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    sensi = await models.User.find_one({"_id": sensi_id, "role": {"$in": ["sensi", "staff"]}})
    
    if not sensi:
        raise HTTPException(status_code=404, detail="Sensi member not found")
        
    if sensi_data.name is not None:
        sensi.name = sensi_data.name
    if sensi_data.email is not None:
        sensi.email = sensi_data.email.strip().lower()
    if sensi_data.password is not None:
        sensi.password = sensi_data.password
    if sensi_data.level is not None:
        sensi.level = sensi_data.level
    if sensi_data.batches is not None:
        sensi.batches = sensi_data.batches
        if not sensi_data.batch and sensi_data.batches:
            sensi.batch = sensi_data.batches[0]
    if sensi_data.batch is not None:
        sensi.batch = sensi_data.batch
        if not sensi_data.batches:
            sensi.batches = [sensi_data.batch] if sensi_data.batch else []
        
    await sensi.save()
    return {"message": "Sensi member updated successfully"}

class SensiLevelUpdate(BaseModel):
    level: str

StaffLevelUpdate = SensiLevelUpdate

@router.put("/sensi/{sensi_id}/level")
@router.put("/staff/{sensi_id}/level")
async def update_sensi_level(
    sensi_id: PydanticObjectId,
    level_data: SensiLevelUpdate,
    current_user: models.User = Depends(get_current_user)
):
    if (current_user.role or "").lower() not in ["ceo", "admin"]:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    sensi = await models.User.find_one({"_id": sensi_id, "role": {"$in": ["sensi", "staff"]}})
    
    if not sensi:
        raise HTTPException(status_code=404, detail="Sensi member not found")
        
    sensi.level = level_data.level
    await sensi.save()
    return {"message": "Sensi level updated successfully"}

@router.delete("/sensi/{sensi_id}")
@router.delete("/staff/{sensi_id}")
async def delete_sensi(
    sensi_id: PydanticObjectId,
    current_user: models.User = Depends(get_current_user)
):
    if (current_user.role or "").lower() not in ["ceo", "admin"]:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    sensi = await models.User.find_one({"_id": sensi_id, "role": {"$in": ["sensi", "staff"]}})
    
    if not sensi:
        raise HTTPException(status_code=404, detail="Sensi member not found")
        
    await sensi.delete()
    return {"message": "Sensi member deleted successfully"}

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


@router.get("/available-batches", response_model=List[str])
async def get_available_batches(current_user: models.User = Depends(get_current_user)):
    """Fetch distinct available batch names across all users, class schedules, and materials in the database"""
    batches = set()

    # 1. Distinct batches from users (students and staff)
    users = await models.User.find_all().to_list()
    for u in users:
        if u.batch and u.batch.strip() and u.batch.strip().lower() not in ["all batches", "all assigned batches", "global", "global access", "all"]:
            batches.add(u.batch.strip())
        for b in getattr(u, "batches", []) or []:
            if b and b.strip() and b.strip().lower() not in ["all batches", "all assigned batches", "global", "global access", "all"]:
                batches.add(b.strip())

    # 2. Distinct batches from class schedules
    try:
        schedules = await models.ClassSchedule.find_all().to_list()
        for s in schedules:
            if s.batch and s.batch.strip() and s.batch.strip().lower() not in ["all batches", "all assigned batches", "global", "global access", "all"]:
                batches.add(s.batch.strip())
            for b in getattr(s, "batches", []) or []:
                if b and b.strip() and b.strip().lower() not in ["all batches", "all assigned batches", "global", "global access", "all"]:
                    batches.add(b.strip())
    except Exception:
        pass

    # Sort batches naturally
    def sort_key(item: str):
        nums = re.findall(r'\d+', item)
        return (int(nums[0]) if nums else 9999, item.lower())

    sorted_batches = sorted(list(batches), key=sort_key)
    return sorted_batches

