from fastapi import APIRouter, Depends, HTTPException
from models import User, Attendance
from routes.auth import get_current_user
from typing import List, Dict
import datetime
from beanie import PydanticObjectId
from beanie.operators import In

router = APIRouter()

def get_today_date_str():
    return datetime.date.today().strftime("%Y-%m-%d")

@router.get("/students")
async def get_students_attendance(
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in ["staff", "ceo"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    students = await User.find({"role": "student"}).to_list()
    today = get_today_date_str()
    
    # Fetch today's attendance records for all students
    attendance_records = await Attendance.find(Attendance.date == today).to_list()
    attendance_map = {record.user_id: record.status for record in attendance_records}
    
    result_list = []
    for student in students:
        result_list.append({
            "id": str(student.id),
            "name": student.name or student.email.split('@')[0],
            "email": student.email,
            "profile_image_url": student.profile_image_url,
            "status": attendance_map.get(student.id, "not_marked")
        })
    return result_list

@router.post("/mark")
async def mark_attendance(
    data: dict,
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "staff":
        raise HTTPException(status_code=403, detail="Not authorized")
        
    student_id_str = data.get("student_id")
    status = data.get("status") # present or absent
    
    if not student_id_str or not status:
        raise HTTPException(status_code=400, detail="student_id and status are required")
        
    try:
        student_id = PydanticObjectId(student_id_str)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid student_id format")
        
    student = await User.find_one(User.id == student_id, User.role == "student")
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
        
    today = get_today_date_str()
    record = await Attendance.find_one(Attendance.user_id == student_id, Attendance.date == today)
    
    if record:
        record.status = status
        await record.save()
    else:
        record = Attendance(user_id=student_id, date=today, status=status)
        await record.insert()
        
    return {"message": "Attendance marked successfully", "status": status}

@router.get("/today")
async def get_today_attendance(
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "ceo":
        raise HTTPException(status_code=403, detail="Not authorized")
        
    today = get_today_date_str()
    present_records = await Attendance.find(Attendance.date == today, Attendance.status == "present").to_list()
    
    present_user_ids = [record.user_id for record in present_records]
    if present_user_ids:
        present_students = await User.find(In(User.id, present_user_ids)).to_list()
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
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "student":
        raise HTTPException(status_code=403, detail="Not authorized")
        
    today = get_today_date_str()
    record = await Attendance.find_one(Attendance.user_id == current_user.id, Attendance.date == today)
    
    if record:
        return {"date": today, "status": record.status}
    else:
        return {"date": today, "status": "not_marked"}
