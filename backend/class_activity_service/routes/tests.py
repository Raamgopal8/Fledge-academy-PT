from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from pydantic import BaseModel, Field
from datetime import datetime
from beanie import PydanticObjectId

import models
from routes.auth import get_current_user

router = APIRouter()

class TestCreate(BaseModel):
    title: str
    description: Optional[str] = None
    due_date: Optional[datetime] = None
    level: Optional[str] = None
    batch: Optional[str] = None

class TestSubmit(BaseModel):
    submission_content: str

class TestReview(BaseModel):
    staff_comments: str
    status: str = "Reviewed"

@router.get("")
async def get_tests(
    level: Optional[str] = None,
    batch: Optional[str] = None,
    current_user: models.User = Depends(get_current_user)
):
    query = {}
    if level:
        query["level"] = level
    if batch:
        query["batch"] = batch
    tests = await models.Test.find(query).sort("-created_at").to_list()
    
    response_data = []
    for test in tests:
        test_dict = {
            "id": str(test.id),
            "title": test.title,
            "description": test.description,
            "created_by_id": str(test.created_by_id),
            "created_at": test.created_at,
            "due_date": test.due_date,
            "level": test.level,
            "batch": test.batch,
        }
        
        # If student, attach their submission status
        if current_user.role == "student":
            submission = await models.TestSubmission.find_one(
                models.TestSubmission.test_id == test.id,
                models.TestSubmission.student_id == current_user.id
            )
            
            if submission:
                test_dict["submission"] = {
                    "id": str(submission.id),
                    "status": submission.status,
                    "submitted_at": submission.submitted_at,
                    "staff_comments": submission.staff_comments
                }
            else:
                test_dict["submission"] = None
                
        response_data.append(test_dict)
        
    return response_data

@router.post("")
async def create_test(
    test_data: TestCreate,
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role != "staff":
        raise HTTPException(status_code=403, detail="Only staff can create tests")
        
    new_test = models.Test(
        title=test_data.title,
        description=test_data.description,
        created_by_id=current_user.id,
        due_date=test_data.due_date,
        level=test_data.level,
        batch=test_data.batch
    )
    await new_test.insert()
    
    return {
        "id": str(new_test.id),
        "title": new_test.title,
        "description": new_test.description,
        "created_by_id": str(new_test.created_by_id),
        "created_at": new_test.created_at,
        "due_date": new_test.due_date,
        "level": new_test.level,
        "batch": new_test.batch
    }

@router.post("/{test_id}/submit")
async def submit_test(
    test_id: PydanticObjectId,
    submission_data: TestSubmit,
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role != "student":
        raise HTTPException(status_code=403, detail="Only students can submit tests")
        
    # Check if test exists
    test = await models.Test.get(test_id)
    if not test:
        raise HTTPException(status_code=404, detail="Test not found")
        
    # Check if already submitted
    existing_submission = await models.TestSubmission.find_one(
        models.TestSubmission.test_id == test_id,
        models.TestSubmission.student_id == current_user.id
    )
    
    if existing_submission:
        raise HTTPException(status_code=400, detail="Test already submitted")
        
    new_submission = models.TestSubmission(
        test_id=test_id,
        student_id=current_user.id,
        submission_content=submission_data.submission_content
    )
    await new_submission.insert()
    
    return {
        "id": str(new_submission.id),
        "test_id": str(new_submission.test_id),
        "student_id": str(new_submission.student_id),
        "submission_content": new_submission.submission_content,
        "submitted_at": new_submission.submitted_at,
        "status": new_submission.status
    }

@router.get("/{test_id}/submissions")
async def get_test_submissions(
    test_id: PydanticObjectId,
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role not in ["staff", "ceo"]:
        raise HTTPException(status_code=403, detail="Not authorized to view all submissions")
        
    # Fetch submissions for this test
    submissions = await models.TestSubmission.find(models.TestSubmission.test_id == test_id).sort("-submitted_at").to_list()
    
    response = []
    for sub in submissions:
        # Get student name
        student = await models.User.get(sub.student_id)
        
        response.append({
            "id": str(sub.id),
            "test_id": str(sub.test_id),
            "student_id": str(sub.student_id),
            "student_name": student.name if student else "Unknown",
            "submission_content": sub.submission_content,
            "submitted_at": sub.submitted_at,
            "status": sub.status,
            "staff_comments": sub.staff_comments
        })
        
    return response

@router.put("/submissions/{submission_id}/review")
async def review_submission(
    submission_id: PydanticObjectId,
    review_data: TestReview,
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role != "staff":
        raise HTTPException(status_code=403, detail="Only staff can review tests")
        
    submission = await models.TestSubmission.get(submission_id)
    
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")
        
    submission.staff_comments = review_data.staff_comments
    submission.status = review_data.status
    
    await submission.save()
    
    return {
        "id": str(submission.id),
        "test_id": str(submission.test_id),
        "student_id": str(submission.student_id),
        "submission_content": submission.submission_content,
        "submitted_at": submission.submitted_at,
        "status": submission.status,
        "staff_comments": submission.staff_comments
    }

@router.get("/submissions/all")
async def get_all_submissions(
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role not in ["staff", "ceo"]:
        raise HTTPException(status_code=403, detail="Not authorized to view all submissions")
        
    submissions = await models.TestSubmission.find_all().sort("-submitted_at").to_list()
    
    response = []
    for sub in submissions:
        # Get student name
        student = await models.User.get(sub.student_id)
        
        # Get test title
        test = await models.Test.get(sub.test_id)
        
        response.append({
            "id": str(sub.id),
            "test_id": str(sub.test_id),
            "test_title": test.title if test else "Unknown",
            "student_id": str(sub.student_id),
            "student_name": student.name if student else "Unknown",
            "submission_content": sub.submission_content,
            "submitted_at": sub.submitted_at,
            "status": sub.status,
            "staff_comments": sub.staff_comments
        })
        
    return response
