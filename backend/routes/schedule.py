from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import List, Optional

from database import get_db
import models
from routes.auth import get_current_user

router = APIRouter()

class ScheduleSchema(BaseModel):
    name: str
    time: str
    location: str
    students: int
    color: str
    day_of_week: str

    class Config:
        from_attributes = True

class ScheduleResponse(BaseModel):
    id: int
    name: str
    time: str
    location: str
    students: int
    color: str
    day_of_week: str

    class Config:
        from_attributes = True

@router.get("", response_model=List[ScheduleResponse])
async def get_schedules(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(models.ClassSchedule))
    return result.scalars().all()

@router.post("", response_model=ScheduleResponse)
async def create_schedule(
    schema: ScheduleSchema,
    current_user: models.User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if current_user.role not in ["staff", "ceo"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to perform this action"
        )
    
    new_schedule = models.ClassSchedule(
        name=schema.name,
        time=schema.time,
        location=schema.location,
        students=schema.students,
        color=schema.color,
        day_of_week=schema.day_of_week
    )
    db.add(new_schedule)
    await db.commit()
    await db.refresh(new_schedule)
    return new_schedule

@router.put("/{schedule_id}", response_model=ScheduleResponse)
async def update_schedule(
    schedule_id: int,
    schema: ScheduleSchema,
    current_user: models.User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if current_user.role not in ["staff", "ceo"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to perform this action"
        )
    
    result = await db.execute(select(models.ClassSchedule).filter(models.ClassSchedule.id == schedule_id))
    schedule = result.scalars().first()
    if not schedule:
        raise HTTPException(status_code=404, detail="Schedule not found")
        
    schedule.name = schema.name
    schedule.time = schema.time
    schedule.location = schema.location
    schedule.students = schema.students
    schedule.color = schema.color
    schedule.day_of_week = schema.day_of_week
    
    db.add(schedule)
    await db.commit()
    await db.refresh(schedule)
    return schedule

@router.delete("/{schedule_id}")
async def delete_schedule(
    schedule_id: int,
    current_user: models.User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if current_user.role not in ["staff", "ceo"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to perform this action"
        )
    
    result = await db.execute(select(models.ClassSchedule).filter(models.ClassSchedule.id == schedule_id))
    schedule = result.scalars().first()
    if not schedule:
        raise HTTPException(status_code=404, detail="Schedule not found")
        
    await db.delete(schedule)
    await db.commit()
    return {"message": "Schedule deleted successfully"}
