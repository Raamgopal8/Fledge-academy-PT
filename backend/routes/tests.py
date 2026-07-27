from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

from database import get_db
import models
from routes.auth import get_current_user

router = APIRouter()

class TestCreate(BaseModel):
    title: str
    description: Optional[str] = None
    due_date: Optional[datetime] = None

class TestSubmit(BaseModel):
    submission_content: str

class TestReview(BaseModel):
    staff_comments: str
    status: str = "Reviewed"

@router.get("/")
async def get_tests(
    db: AsyncSession = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    result = await db.execute(select(models.Test).order_by(models.Test.created_at.desc()))
    tests = result.scalars().all()
    
    response_data = []
    for test in tests:
        test_dict = {
            "id": test.id,
            "title": test.title,
            "description": test.description,
            "created_by_id": test.created_by_id,
            "created_at": test.created_at,
            "due_date": test.due_date,
        }
        
        # If student, attach their submission status
        if current_user.role == "student":
            sub_result = await db.execute(
                select(models.TestSubmission)
                .where((models.TestSubmission.test_id == test.id) & (models.TestSubmission.student_id == current_user.id))
            )
            submission = sub_result.scalars().first()
            if submission:
                test_dict["submission"] = {
                    "id": submission.id,
                    "status": submission.status,
                    "submitted_at": submission.submitted_at,
                    "staff_comments": submission.staff_comments
                }
            else:
                test_dict["submission"] = None
                
        response_data.append(test_dict)
        
    return response_data

@router.post("/")
async def create_test(
    test_data: TestCreate,
    db: AsyncSession = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role != "staff":
        raise HTTPException(status_code=403, detail="Only staff can create tests")
        
    new_test = models.Test(
        title=test_data.title,
        description=test_data.description,
        created_by_id=current_user.id,
        due_date=test_data.due_date
    )
    db.add(new_test)
    await db.commit()
    await db.refresh(new_test)
    
    return new_test

@router.post("/{test_id}/submit")
async def submit_test(
    test_id: int,
    submission_data: TestSubmit,
    db: AsyncSession = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role != "student":
        raise HTTPException(status_code=403, detail="Only students can submit tests")
        
    # Check if test exists
    result = await db.execute(select(models.Test).where(models.Test.id == test_id))
    test = result.scalars().first()
    if not test:
        raise HTTPException(status_code=404, detail="Test not found")
        
    # Check if already submitted
    sub_result = await db.execute(
        select(models.TestSubmission)
        .where((models.TestSubmission.test_id == test_id) & (models.TestSubmission.student_id == current_user.id))
    )
    if sub_result.scalars().first():
        raise HTTPException(status_code=400, detail="Test already submitted")
        
    new_submission = models.TestSubmission(
        test_id=test_id,
        student_id=current_user.id,
        submission_content=submission_data.submission_content
    )
    db.add(new_submission)
    await db.commit()
    await db.refresh(new_submission)
    
    return new_submission

@router.get("/{test_id}/submissions")
async def get_test_submissions(
    test_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role not in ["staff", "ceo"]:
        raise HTTPException(status_code=403, detail="Not authorized to view all submissions")
        
    # Fetch submissions for this test
    result = await db.execute(
        select(models.TestSubmission)
        .where(models.TestSubmission.test_id == test_id)
        .order_by(models.TestSubmission.submitted_at.desc())
    )
    submissions = result.scalars().all()
    
    response = []
    for sub in submissions:
        # Get student name
        user_result = await db.execute(select(models.User).where(models.User.id == sub.student_id))
        student = user_result.scalars().first()
        
        response.append({
            "id": sub.id,
            "test_id": sub.test_id,
            "student_id": sub.student_id,
            "student_name": student.name if student else "Unknown",
            "submission_content": sub.submission_content,
            "submitted_at": sub.submitted_at,
            "status": sub.status,
            "staff_comments": sub.staff_comments
        })
        
    return response

@router.put("/submissions/{submission_id}/review")
async def review_submission(
    submission_id: int,
    review_data: TestReview,
    db: AsyncSession = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role != "staff":
        raise HTTPException(status_code=403, detail="Only staff can review tests")
        
    result = await db.execute(select(models.TestSubmission).where(models.TestSubmission.id == submission_id))
    submission = result.scalars().first()
    
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")
        
    submission.staff_comments = review_data.staff_comments
    submission.status = review_data.status
    
    await db.commit()
    await db.refresh(submission)
    
    return submission

@router.get("/submissions/all")
async def get_all_submissions(
    db: AsyncSession = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role not in ["staff", "ceo"]:
        raise HTTPException(status_code=403, detail="Not authorized to view all submissions")
        
    result = await db.execute(
        select(models.TestSubmission)
        .order_by(models.TestSubmission.submitted_at.desc())
    )
    submissions = result.scalars().all()
    
    response = []
    for sub in submissions:
        # Get student name
        user_result = await db.execute(select(models.User).where(models.User.id == sub.student_id))
        student = user_result.scalars().first()
        
        # Get test title
        test_result = await db.execute(select(models.Test).where(models.Test.id == sub.test_id))
        test = test_result.scalars().first()
        
        response.append({
            "id": sub.id,
            "test_id": sub.test_id,
            "test_title": test.title if test else "Unknown",
            "student_id": sub.student_id,
            "student_name": student.name if student else "Unknown",
            "submission_content": sub.submission_content,
            "submitted_at": sub.submitted_at,
            "status": sub.status,
            "staff_comments": sub.staff_comments
        })
        
    return response
