from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from database import get_db
from models import User, Attendance
from routes.auth import get_current_user
from typing import List, Dict
import datetime

router = APIRouter()

def get_today_date_str():
    return datetime.date.today().strftime("%Y-%m-%d")

@router.get("/students")
async def get_students_attendance(
    db: AsyncSession = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in ["staff", "ceo"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    result = await db.execute(select(User).filter(User.role == "student"))
    students = result.scalars().all()
    today = get_today_date_str()
    
    # Fetch today's attendance records for all students
    result = await db.execute(select(Attendance).filter(Attendance.date == today))
    attendance_records = result.scalars().all()
    attendance_map = {record.user_id: record.status for record in attendance_records}
    
    result_list = []
    for student in students:
        result_list.append({
            "id": student.id,
            "name": student.name or student.email.split('@')[0],
            "email": student.email,
            "profile_image_url": student.profile_image_url,
            "status": attendance_map.get(student.id, "not_marked")
        })
    return result_list

@router.post("/mark")
async def mark_attendance(
    data: dict,
    db: AsyncSession = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "staff":
        raise HTTPException(status_code=403, detail="Not authorized")
        
    student_id = data.get("student_id")
    status = data.get("status") # present or absent
    
    if not student_id or not status:
        raise HTTPException(status_code=400, detail="student_id and status are required")
        
    result = await db.execute(select(User).filter(User.id == student_id, User.role == "student"))
    student = result.scalars().first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
        
    today = get_today_date_str()
    result = await db.execute(select(Attendance).filter(Attendance.user_id == student_id, Attendance.date == today))
    record = result.scalars().first()
    
    if record:
        record.status = status
    else:
        record = Attendance(user_id=student_id, date=today, status=status)
        db.add(record)
        
    await db.commit()
    return {"message": "Attendance marked successfully", "status": status}

@router.get("/today")
async def get_today_attendance(
    db: AsyncSession = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "ceo":
        raise HTTPException(status_code=403, detail="Not authorized")
        
    today = get_today_date_str()
    result = await db.execute(select(Attendance).filter(Attendance.date == today, Attendance.status == "present"))
    present_records = result.scalars().all()
    
    present_user_ids = [record.user_id for record in present_records]
    if present_user_ids:
        result = await db.execute(select(User).filter(User.id.in_(present_user_ids)))
        present_students = result.scalars().all()
    else:
        present_students = []
        
    names = [student.name or student.email.split('@')[0] for student in present_students]
    
    return {
        "date": today,
        "count": len(present_students),
        "names": names
    }

@router.get("/my-status")
async def get_my_attendance_status(
    db: AsyncSession = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "student":
        raise HTTPException(status_code=403, detail="Not authorized")
        
    today = get_today_date_str()
    result = await db.execute(select(Attendance).filter(Attendance.user_id == current_user.id, Attendance.date == today))
    record = result.scalars().first()
    
    if record:
        return {"date": today, "status": record.status}
    else:
        return {"date": today, "status": "not_marked"}
