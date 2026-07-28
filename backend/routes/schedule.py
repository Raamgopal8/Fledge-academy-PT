from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from typing import List, Optional
from beanie import PydanticObjectId

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
    id: PydanticObjectId = Field(alias="_id")
    name: str
    time: str
    location: str
    students: int
    color: str
    day_of_week: str

    class Config:
        populate_by_name = True
        from_attributes = True

@router.get("", response_model=List[ScheduleResponse])
async def get_schedules():
    schedules = await models.ClassSchedule.find_all().to_list()
    return schedules

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
    
    new_schedule = models.ClassSchedule(
        name=schema.name,
        time=schema.time,
        location=schema.location,
        students=schema.students,
        color=schema.color,
        day_of_week=schema.day_of_week
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
