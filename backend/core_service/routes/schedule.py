from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from typing import List, Optional
from beanie import PydanticObjectId
from datetime import datetime, timedelta

import models
from routes.auth import get_current_user

router = APIRouter()

def calculate_expiration(day_of_week: str) -> Optional[datetime]:
    days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    try:
        target_day = days.index(day_of_week)
    except ValueError:
        return None
    
    now = datetime.utcnow()
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
    batch: Optional[str] = None

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

@router.get("", response_model=List[ScheduleResponse])
async def get_schedules(level: Optional[str] = None, batch: Optional[str] = None):
    query = {}
    if level and level.strip().lower() not in ["all", "all levels"]:
        query["level"] = {"$regex": f"^{level.strip()}$", "$options": "i"}
    if batch and batch.strip().lower() not in ["all batches", "all assigned batches", "global", "global access", "all"]:
        query["batch"] = {"$regex": f"^{batch.strip()}$", "$options": "i"}
    schedules = await models.ClassSchedule.find(query).to_list()
    now = datetime.utcnow()
    valid_schedules = []
    
    for schedule in schedules:
        if "online" in schedule.location.lower():
            if schedule.expires_at and schedule.expires_at < now:
                await schedule.delete()
                continue
        valid_schedules.append(schedule)
        
    return valid_schedules

@router.post("", response_model=ScheduleResponse)
async def create_schedule(
    schema: ScheduleSchema,
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role not in ["staff", "ceo"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to perform this action"
        )
    
    expires_at = calculate_expiration(schema.day_of_week)
    
    new_schedule = models.ClassSchedule(
        name=schema.name,
        time=schema.time,
        location=schema.location,
        students=schema.students,
        color=schema.color,
        day_of_week=schema.day_of_week,
        class_link=schema.class_link,
        level=schema.level,
        batch=schema.batch,
        expires_at=expires_at
    )
    await new_schedule.insert()
    return new_schedule

@router.put("/{schedule_id}", response_model=ScheduleResponse)
async def update_schedule(
    schedule_id: PydanticObjectId,
    schema: ScheduleSchema,
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role not in ["staff", "ceo"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to perform this action"
        )
    
    schedule = await models.ClassSchedule.get(schedule_id)
    if not schedule:
        raise HTTPException(status_code=404, detail="Schedule not found")
        
    schedule.name = schema.name
    schedule.time = schema.time
    schedule.location = schema.location
    schedule.students = schema.students
    schedule.color = schema.color
    schedule.day_of_week = schema.day_of_week
    schedule.class_link = schema.class_link
    schedule.level = schema.level
    schedule.batch = schema.batch
    schedule.expires_at = calculate_expiration(schema.day_of_week)
    
    await schedule.save()
    return schedule

@router.delete("/{schedule_id}")
async def delete_schedule(
    schedule_id: PydanticObjectId,
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role not in ["staff", "ceo"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to perform this action"
        )
    
    schedule = await models.ClassSchedule.get(schedule_id)
    if not schedule:
        raise HTTPException(status_code=404, detail="Schedule not found")
        
    await schedule.delete()
    return {"message": "Schedule deleted successfully"}
