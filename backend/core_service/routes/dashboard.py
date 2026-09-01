# pyrefly: ignore [missing-import]
from fastapi import APIRouter, Depends
from typing import Optional
import models
from routes.auth import get_current_user
from datetime import datetime, timedelta
import calendar
from redis_client import get_cache, set_cache, delete_cache

router = APIRouter()

@router.get("/ceo/kpi")
async def get_ceo_kpi(batch: Optional[str] = None):
    cache_key = f"dashboard:ceo:kpi:{batch or 'all'}"
    cached = await get_cache(cache_key)
    if cached is not None:
        return cached

    # Total Students
    student_query = {"role": "student"}
    if batch:
        student_query["batch"] = batch
    total_students = await models.User.find(student_query).count()

    # Total Staff
    staff_query = {"role": {"$in": ["staff", "ceo"]}}
    if batch:
        staff_query["batch"] = batch
    total_staff = await models.User.find(staff_query).count()

    # For "Revenue", assuming a fixed value per student
    total_revenue = total_students * 500
    
    # Average Rating - from test submissions score (mapped to a 5-point scale)
    submissions_with_scores = await models.TestSubmission.find(models.TestSubmission.score != None).to_list()
    if submissions_with_scores:
        avg_score = sum(sub.score for sub in submissions_with_scores) / len(submissions_with_scores)
    else:
        avg_score = 0
    
    average_rating = round((avg_score / 100) * 5, 1) if avg_score else 0.0

    # Course Completion Rate - calculated from submissions vs expected submissions
    total_tests = await models.Test.find_all().count()
    total_submissions = await models.TestSubmission.find_all().count()
    
    if total_tests > 0 and total_students > 0:
        completion_rate = (total_submissions / (total_tests * total_students)) * 100
    else:
        completion_rate = 0
        
    completion_rate = min(round(completion_rate), 100) # cap at 100%
    
    result = {
        "totalRevenue": f"${total_revenue:,}",
        "revenueGrowth": "+15%",
        "activeStudents": f"{total_students:,}",
        "studentsGrowth": "+5%",
        "activeStaff": f"{total_staff:,}",
        "courseCompletionRate": f"{completion_rate}%",
        "completionGrowth": "+2%",
        "averageRating": str(average_rating),
        "ratingGrowth": "+0.1"
    }
    await set_cache(cache_key, result, ttl=30)
    return result

@router.get("/ceo/performance-chart")
async def get_ceo_performance_chart():
    cache_key = "dashboard:ceo:performance-chart"
    cached = await get_cache(cache_key)
    if cached is not None:
        return cached

    submissions = await models.TestSubmission.find(models.TestSubmission.score != None).to_list()
    
    today = (datetime.utcnow() + timedelta(hours=5, minutes=30))
    months_data = {}
    
    # Initialize 6 months starting from August
    start_month = 8
    for i in range(6):
        month = (start_month - 1 + i) % 12 + 1
        month_abbr = calendar.month_abbr[month]
        months_data[month_abbr] = {"total_score": 0, "count": 0}
        
    for sub in submissions:
        if sub.submitted_at:
            month_abbr = calendar.month_abbr[sub.submitted_at.month]
            if month_abbr in months_data:
                months_data[month_abbr]["total_score"] += sub.score
                months_data[month_abbr]["count"] += 1
                
    chart_data = []
    for month_abbr, data in months_data.items():
        avg_score = (data["total_score"] / data["count"]) if data["count"] > 0 else 0
        chart_data.append({
            "name": month_abbr,
            "score": round(avg_score, 1)
        })
        
    await set_cache(cache_key, chart_data, ttl=60)
    return chart_data

@router.get("/ceo/recent-activity")
async def get_ceo_recent_activity():
    cache_key = "dashboard:ceo:recent-activity"
    cached = await get_cache(cache_key)
    if cached is not None:
        return cached

    activities = await models.Activity.find_all().to_list()
    result = [{"id": str(a.id), "user": a.user, "action": a.action, "time": a.time, "type": a.type} for a in activities]
    await set_cache(cache_key, result, ttl=15)
    return result

@router.delete("/ceo/recent-activity")
async def delete_all_recent_activity():
    await models.Activity.delete_all()
    await delete_cache("dashboard:ceo:recent-activity")
    return {"message": "All activities deleted successfully"}

@router.get("/staff/summary")
async def get_staff_summary(
    batch: Optional[str] = None,
    current_user: models.User = Depends(get_current_user)
):
    user_email = (current_user.email or "").lower()
    cache_key = f"dashboard:staff:summary:{user_email}:{batch or 'default'}"
    cached = await get_cache(cache_key)
    if cached is not None:
        return cached

    student_query = {"role": "student"}
    if batch and batch not in ["All Batches", "All Assigned Batches", "Global", "Global Access"]:
        student_query["batch"] = batch
    elif current_user.role == "staff":
        staff_batches = getattr(current_user, "batches", None) or []
        staff_batch = getattr(current_user, "batch", None)
        if staff_batches and len(staff_batches) > 1:
            student_query["batch"] = {"$in": staff_batches}
        elif staff_batches and len(staff_batches) == 1:
            student_query["batch"] = staff_batches[0]
        elif staff_batch:
            student_query["batch"] = staff_batch
        elif not staff_batches and not staff_batch:
            return {
                "name": current_user.name or current_user.email.split('@')[0],
                "classesToday": 0,
                "ungradedAssignments": 0,
                "attendanceRate": "--%"
            }
        
    students = await models.User.find(student_query).to_list()
    total_students = len(students)
    
    today = datetime.now().strftime("%Y-%m-%d")
    student_ids = [s.id for s in students]
    
    if student_ids:
        attendance_records = await models.Attendance.find({
            "date": today,
            "status": "present"
        }).to_list()
        
        present_count = sum(1 for r in attendance_records if r.user_id in student_ids)
        attendance_rate = f"{int((present_count / total_students) * 100)}%" if total_students > 0 else "--%"
    else:
        attendance_rate = "--%"
        
    result = {
        "name": current_user.name or current_user.email.split('@')[0],
        "classesToday": 0,
        "ungradedAssignments": 0,
        "attendanceRate": attendance_rate
    }
    await set_cache(cache_key, result, ttl=30)
    return result

@router.get("/staff/classes")
async def get_staff_classes(
    batch: Optional[str] = None,
    current_user: models.User = Depends(get_current_user)
):
    query = {}
    if batch and batch not in ["All Batches", "All Assigned Batches", "Global", "Global Access"]:
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
        
    classes = await models.ClassSchedule.find(query).to_list()
    now = (datetime.utcnow() + timedelta(hours=5, minutes=30))
    valid_classes = []
    
    for cls in classes:
        loc = (getattr(cls, "location", "") or "").lower()
        if "online" in loc:
            exp = getattr(cls, "expires_at", None)
            if exp:
                try:
                    exp_naive = exp.replace(tzinfo=None) if hasattr(exp, "tzinfo") and exp.tzinfo else exp
                    now_naive = now.replace(tzinfo=None)
                    if exp_naive < now_naive:
                        await cls.delete()
                        continue
                except Exception:
                    pass
        valid_classes.append(cls)
        
    return valid_classes

@router.get("/staff/activities")
async def get_staff_activities():
    return [
        {
            "id": 1, "name": "Midterm Quiz: Calculus", "created": "2 days ago",
            "course": "Mathematics", "participants_done": 45, "participants_total": None,
            "status": "Graded", "status_color": "secondary", "average_score": "84.5%", "action_text": "Details"
        },
        {
            "id": 2, "name": "Weekly Assessment 4", "created": "Ends tomorrow",
            "course": "Digital Literacy", "participants_done": 12, "participants_total": 18,
            "status": "Active", "status_color": "tertiary", "average_score": "—", "action_text": "Details"
        },
        {
            "id": 3, "name": "Ethics Group Project", "created": "Due Oct 24",
            "course": "Ethics & Tech", "participants_done": 0, "participants_total": 120,
            "status": "Draft", "status_color": "surface", "average_score": "—", "action_text": "Edit"
        }
    ]
