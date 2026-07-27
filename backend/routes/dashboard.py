from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from database import get_db
import models

router = APIRouter()

from sqlalchemy import func

@router.get("/ceo/kpi")
async def get_ceo_kpi(db: AsyncSession = Depends(get_db)):
    # Total Students
    students_query = await db.execute(select(func.count(models.User.id)).where(models.User.role == 'student'))
    total_students = students_query.scalar() or 0

    # Total Staff
    staff_query = await db.execute(select(func.count(models.User.id)).where(models.User.role.in_(['staff', 'ceo'])))
    total_staff = staff_query.scalar() or 0

    # For "Revenue", assuming a fixed value per student
    total_revenue = total_students * 500
    
    # Average Rating - from test submissions score (mapped to a 5-point scale)
    score_query = await db.execute(select(func.avg(models.TestSubmission.score)).where(models.TestSubmission.score.isnot(None)))
    avg_score = score_query.scalar() or 0
    average_rating = round((avg_score / 100) * 5, 1) if avg_score else 0.0

    # Course Completion Rate - calculated from submissions vs expected submissions
    tests_query = await db.execute(select(func.count(models.Test.id)))
    total_tests = tests_query.scalar() or 0
    
    submissions_query = await db.execute(select(func.count(models.TestSubmission.id)))
    total_submissions = submissions_query.scalar() or 0
    
    if total_tests > 0 and total_students > 0:
        completion_rate = (total_submissions / (total_tests * total_students)) * 100
    else:
        completion_rate = 0
        
    completion_rate = min(round(completion_rate), 100) # cap at 100%
    
    return {
        "totalRevenue": f"${total_revenue:,}",
        "revenueGrowth": "+15%", # Keeping placeholder for growth as it requires historical comparison
        "activeStudents": f"{total_students:,}",
        "studentsGrowth": "+5%",
        "activeStaff": f"{total_staff:,}",
        "courseCompletionRate": f"{completion_rate}%",
        "completionGrowth": "+2%",
        "averageRating": str(average_rating),
        "ratingGrowth": "+0.1"
    }

from datetime import datetime
import calendar

@router.get("/ceo/performance-chart")
async def get_ceo_performance_chart(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(models.TestSubmission).where(models.TestSubmission.score.isnot(None)))
    submissions = result.scalars().all()
    
    today = datetime.utcnow()
    months_data = {}
    
    # Initialize the last 6 months with 0
    for i in range(5, -1, -1):
        month = (today.month - 1 - i) % 12 + 1
        month_abbr = calendar.month_abbr[month]
        months_data[month_abbr] = {"total_score": 0, "count": 0}
        
    for sub in submissions:
        if sub.submitted_at:
            month_abbr = calendar.month_abbr[sub.submitted_at.month]
            # Only count if the month is within our 6-month window (keys in months_data)
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
        
    return chart_data

from sqlalchemy import delete

@router.get("/ceo/recent-activity")
async def get_ceo_recent_activity(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(models.Activity))
    activities = result.scalars().all()
    return [{"id": a.id, "user": a.user, "action": a.action, "time": a.time, "type": a.type} for a in activities]

@router.delete("/ceo/recent-activity")
async def delete_all_recent_activity(db: AsyncSession = Depends(get_db)):
    await db.execute(delete(models.Activity))
    await db.commit()
    return {"message": "All activities deleted successfully"}

@router.get("/staff/summary")
async def get_staff_summary():
    return {
        "name": "Prof. Aris",
        "classesToday": 4,
        "ungradedAssignments": 12
    }

@router.get("/staff/classes")
async def get_staff_classes(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(models.ClassSchedule))
    return result.scalars().all()

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
