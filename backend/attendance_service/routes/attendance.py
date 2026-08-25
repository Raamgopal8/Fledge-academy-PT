from fastapi import APIRouter, Depends, HTTPException
from models import User, Attendance
from routes.auth import get_current_user
from typing import List, Dict, Optional
import datetime
from beanie import PydanticObjectId
from beanie.operators import In

router = APIRouter()

def get_today_date_str():
    return datetime.date.today().strftime("%Y-%m-%d")

@router.get("/students")
async def get_students_attendance(
    batch: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in ["staff", "ceo"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    query = {"role": "student"}
    if batch and batch not in ["All Batches", "All Assigned Batches", "Global", "Global Access"]:
        query["batch"] = batch
    elif current_user.role == "staff":
        staff_batches = getattr(current_user, "batches", None) or []
        staff_batch = getattr(current_user, "batch", None)
        if not staff_batches and not staff_batch:
            return []
        if staff_batches and len(staff_batches) > 1:
            query["batch"] = {"$in": staff_batches}
        elif staff_batches and len(staff_batches) == 1:
            query["batch"] = staff_batches[0]
        elif staff_batch:
            query["batch"] = staff_batch
        
    students = await User.find(query).to_list()
    today = get_today_date_str()
    
    # Fetch today's attendance records for all students
    attendance_records = await Attendance.find({"date": today}).to_list()
    attendance_map = {record.user_id: record.status for record in attendance_records}
    
    result_list = []
    for student in students:
        result_list.append({
            "id": str(student.id),
            "name": student.name or student.email.split('@')[0],
            "email": student.email,
            "profile_image_url": student.profile_image_url,
            "status": attendance_map.get(student.id, "not_marked"),
            "batch": getattr(student, "batch", None)
        })
    return result_list

@router.post("/mark")
async def mark_attendance(
    data: dict,
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in ["staff", "student"]:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    status = data.get("status") # present or absent
    
    if current_user.role == "student":
        if status != "present":
            raise HTTPException(status_code=400, detail="Students can only mark themselves as present")
        student_id_str = current_user.id
    else:
        student_id_str = data.get("student_id")
        if not student_id_str:
            raise HTTPException(status_code=400, detail="student_id is required for staff")
    
    if not status:
        raise HTTPException(status_code=400, detail="status is required")
        
    try:
        student_id = PydanticObjectId(student_id_str)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid student_id format")
        
    student = await User.find_one(User.id == student_id, User.role == "student")
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
        
    today = get_today_date_str()
    record = await Attendance.find_one({"user_id": student_id, "date": today})
    
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
    present_records = await Attendance.find({"date": today, "status": "present"}).to_list()
    
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
    try:
        user_id = PydanticObjectId(current_user.id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid user ID")
        
    record = await Attendance.find_one({"user_id": user_id, "date": today})
    
    if record:
        return {"date": today, "status": record.status}
    else:
        return {"date": today, "status": "not_marked"}

@router.get("/my-stats")
async def get_my_attendance_stats(
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "student":
        raise HTTPException(status_code=403, detail="Not authorized")
        
    try:
        user_id = PydanticObjectId(current_user.id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid user ID")
        
    total_records = await Attendance.find({"user_id": user_id}).count()
    present_records = await Attendance.find({"user_id": user_id, "status": "present"}).count()
    
    percentage = int((present_records / total_records) * 100) if total_records > 0 else 0
    
    return {
        "total": total_records,
        "present": present_records,
        "percentage": percentage
    }

@router.get("/export")
async def export_attendance_history(
    batch: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    """Fetch complete attendance history from start date to current date for CEO & Staff export"""
    if current_user.role not in ["ceo", "staff", "admin"]:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    query = {"role": "student"}
    if batch and batch not in ["All Batches", "All Assigned Batches", "Global", "Global Access", "All"]:
        query["batch"] = batch
    elif current_user.role == "staff":
        staff_batches = getattr(current_user, "batches", None) or []
        staff_batch = getattr(current_user, "batch", None)
        if staff_batches and len(staff_batches) > 1:
            query["batch"] = {"$in": staff_batches}
        elif staff_batches and len(staff_batches) == 1:
            query["batch"] = staff_batches[0]
        elif staff_batch:
            query["batch"] = staff_batch
            
    students = await User.find(query).to_list()
    
    # Build attendance query for dates if specified
    att_query = {}
    if start_date and end_date:
        att_query["date"] = {"$gte": start_date, "$lte": end_date}
    elif start_date:
        att_query["date"] = {"$gte": start_date}
    elif end_date:
        att_query["date"] = {"$lte": end_date}
        
    all_attendance = await Attendance.find(att_query).sort("+date").to_list()
    
    # Group attendance by student_id and collect all distinct dates sorted
    all_dates_set = set()
    student_records_map = {}
    
    for att in all_attendance:
        date_str = att.date
        all_dates_set.add(date_str)
        uid_str = str(att.user_id)
        if uid_str not in student_records_map:
            student_records_map[uid_str] = {}
        student_records_map[uid_str][date_str] = att.status
        
    all_dates = sorted(list(all_dates_set))
    
    # If no attendance records exist yet, at least include today
    if not all_dates:
        all_dates = [get_today_date_str()]
        
    student_data = []
    flat_records = []
    
    for s in students:
        s_id = str(s.id)
        s_name = s.name or (s.email.split('@')[0] if s.email else "Student")
        s_email = s.email
        s_batch = getattr(s, "batch", None) or "Unassigned"
        s_level = getattr(s, "level", None) or "Level 5"
        
        att_dict = student_records_map.get(s_id, {})
        
        present_count = sum(1 for d in all_dates if att_dict.get(d) == "present")
        absent_count = sum(1 for d in all_dates if att_dict.get(d) == "absent")
        not_marked_count = len(all_dates) - present_count - absent_count
        attendance_rate = round((present_count / len(all_dates) * 100), 1) if all_dates else 0
        
        daily_status = {d: att_dict.get(d, "not_marked") for d in all_dates}
        
        student_data.append({
            "id": s_id,
            "name": s_name,
            "email": s_email,
            "batch": s_batch,
            "level": s_level,
            "total_present": present_count,
            "total_absent": absent_count,
            "total_not_marked": not_marked_count,
            "attendance_rate": f"{attendance_rate}%",
            "daily_status": daily_status
        })
        
        for d in all_dates:
            status_val = att_dict.get(d, "not_marked")
            flat_records.append({
                "Date": d,
                "Student Name": s_name,
                "Email": s_email,
                "Batch": s_batch,
                "Level": s_level,
                "Status": status_val.replace('_', ' ').title()
            })
            
    return {
        "dates": all_dates,
        "students": student_data,
        "flat_records": flat_records,
        "total_students": len(students),
        "total_recorded_days": len(all_dates)
    }
