from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from typing import List, Optional
from beanie import PydanticObjectId
from datetime import datetime, timedelta
import re

import models
from routes.auth import get_current_user

router = APIRouter()

def calculate_expiration(day_of_week: str) -> Optional[datetime]:
    days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    try:
        target_day = days.index(day_of_week)
    except ValueError:
        return None
    
    now = (datetime.utcnow() + timedelta(hours=5, minutes=30))
    current_day = now.weekday()
    
    days_ahead = target_day - current_day
    if days_ahead < 0:
        days_ahead += 7
        
    target_date = now + timedelta(days=days_ahead)
    return target_date.replace(hour=23, minute=59, second=59, microsecond=999999)

class ScheduleSchema(BaseModel):
    name: str
    time: str
    location: str
    students: int
    color: str
    day_of_week: str
    class_link: Optional[str] = None
    level: Optional[str] = None
    levels: Optional[List[str]] = []
    batch: Optional[str] = None
    batches: Optional[List[str]] = []

    class Config:
        from_attributes = True

class ScheduleResponse(BaseModel):
    id: PydanticObjectId = Field(alias="_id")
    name: str
    time: str
    location: str
    students: int
    color: str
    day_of_week: str
    class_link: Optional[str] = None
    level: Optional[str] = None
    batch: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        populate_by_name = True
        from_attributes = True

def format_schedule_response(schedule: models.ClassSchedule) -> dict:
    level_val = getattr(schedule, "level", None)
    color_val = getattr(schedule, "color", "primary") or "primary"
    if not level_val and color_val and "level" in color_val.lower():
        level_val = color_val

    return {
        "id": str(schedule.id),
        "_id": str(schedule.id),
        "name": getattr(schedule, "name", "") or "",
        "time": getattr(schedule, "time", "") or "",
        "location": getattr(schedule, "location", "") or "",
        "students": getattr(schedule, "students", 0) or 0,
        "color": color_val,
        "day_of_week": getattr(schedule, "day_of_week", "") or "",
        "class_link": getattr(schedule, "class_link", None),
        "level": level_val,
        "levels": getattr(schedule, "levels", []) or ([level_val] if level_val else []),
        "batch": getattr(schedule, "batch", None),
        "batches": getattr(schedule, "batches", []) or ([schedule.batch] if getattr(schedule, "batch", None) else []),
        "created_at": schedule.created_at.isoformat() if getattr(schedule, "created_at", None) else None
    }

@router.get("", response_model=List[dict])
async def get_schedules(level: Optional[str] = None, batch: Optional[str] = None):
    try:
        conditions = []
        if level and level.strip().lower() not in ["all", "all levels", "global"]:
            clean_level = level.strip()
            escaped_clean = re.escape(clean_level)
            level_match = re.match(r"^(Level\s*\d+)", clean_level, re.IGNORECASE)
            level_core = level_match.group(1) if level_match else clean_level
            escaped_core = re.escape(level_core)
            conditions.append({
                "$or": [
                    {"level": {"$regex": f"^{escaped_clean}$", "$options": "i"}},
                    {"level": {"$regex": f"^{escaped_core}", "$options": "i"}},
                    {"level": {"$regex": f"{escaped_core}", "$options": "i"}},
                    {"color": {"$regex": f"^{escaped_clean}$", "$options": "i"}},
                    {"color": {"$regex": f"^{escaped_core}", "$options": "i"}},
                    {"color": {"$regex": f"{escaped_core}", "$options": "i"}},
                    {"levels": {"$elemMatch": {"$regex": f"{escaped_core}", "$options": "i"}}},
                    {"levels": {"$in": [clean_level, level_core, "All Levels", "All", "Global"]}},
                    {"level": {"$regex": "^all levels$", "$options": "i"}},
                    {"level": {"$regex": "^all$", "$options": "i"}},
                    {"level": {"$regex": "^global$", "$options": "i"}},
                    {"level": None},
                    {"level": ""}
                ]
            })
        if batch and batch.strip().lower() not in ["all batches", "all assigned batches", "global", "global access", "all"]:
            clean_batch = batch.strip()
            conditions.append({
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
        query = {"$and": conditions} if conditions else {}
        schedules = await models.ClassSchedule.find(query).to_list()
        now = (datetime.utcnow() + timedelta(hours=5, minutes=30))
        valid_schedules = []
        
        for schedule in schedules:
            loc = (getattr(schedule, "location", "") or "").lower()
            if "online" in loc:
                exp = getattr(schedule, "expires_at", None)
                if exp:
                    try:
                        # Make naive if needed
                        exp_naive = exp.replace(tzinfo=None) if hasattr(exp, "tzinfo") and exp.tzinfo else exp
                        now_naive = now.replace(tzinfo=None)
                        if exp_naive < now_naive:
                            await schedule.delete()
                            continue
                    except Exception as ex:
                        print(f"Expiration check warning: {ex}")
            valid_schedules.append(format_schedule_response(schedule))
            
        return valid_schedules
    except Exception as e:
        print(f"Error in get_schedules: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch schedules: {str(e)}")

@router.post("", response_model=dict)
async def create_schedule(
    schema: ScheduleSchema,
    current_user: models.User = Depends(get_current_user)
):
    user_role = (current_user.role or "").lower()
    if user_role not in ["staff", "sensi", "ceo", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to perform this action"
        )
    
    expires_at = calculate_expiration(schema.day_of_week)
    
    lvl = schema.level or schema.color
    new_schedule = models.ClassSchedule(
        name=schema.name,
        time=schema.time,
        location=schema.location,
        students=schema.students,
        color=schema.color,
        day_of_week=schema.day_of_week,
        class_link=schema.class_link,
        level=lvl,
        levels=schema.levels or ([lvl] if lvl else []),
        batch=schema.batch,
        batches=schema.batches or ([schema.batch] if schema.batch else []),
        expires_at=expires_at
    )
    await new_schedule.insert()
    return format_schedule_response(new_schedule)

@router.put("/{schedule_id}", response_model=dict)
async def update_schedule(
    schedule_id: str,
    schema: ScheduleSchema,
    current_user: models.User = Depends(get_current_user)
):
    user_role = (current_user.role or "").lower()
    if user_role not in ["staff", "sensi", "ceo", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to perform this action"
        )
    
    try:
        obj_id = PydanticObjectId(schedule_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid schedule ID format")

    schedule = await models.ClassSchedule.get(obj_id)
    if not schedule:
        raise HTTPException(status_code=404, detail="Schedule not found")
        
    lvl = schema.level or schema.color
    schedule.name = schema.name
    schedule.time = schema.time
    schedule.location = schema.location
    schedule.students = schema.students
    schedule.color = schema.color
    schedule.day_of_week = schema.day_of_week
    schedule.class_link = schema.class_link
    schedule.level = lvl
    schedule.levels = schema.levels or ([lvl] if lvl else [])
    schedule.batch = schema.batch
    schedule.batches = schema.batches or ([schema.batch] if schema.batch else [])
    schedule.expires_at = calculate_expiration(schema.day_of_week)
    
    await schedule.save()
    return format_schedule_response(schedule)

@router.delete("/{schedule_id}")
async def delete_schedule(
    schedule_id: str,
    current_user: models.User = Depends(get_current_user)
):
    user_role = (current_user.role or "").lower()
    if user_role not in ["staff", "sensi", "ceo", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to perform this action"
        )
    
    try:
        obj_id = PydanticObjectId(schedule_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid schedule ID format")

    schedule = await models.ClassSchedule.get(obj_id)
    if not schedule:
        raise HTTPException(status_code=404, detail="Schedule not found")
        
    await schedule.delete()
    return {"message": "Schedule deleted successfully"}
