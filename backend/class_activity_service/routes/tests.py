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
    student_name: Optional[str] = None
    submission_content: str

class TestReview(BaseModel):
    staff_comments: str
    status: str = "Approved"

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
        
        # If user is student, fetch their submission
        if current_user.role == "student":
            submission = await models.TestSubmission.find_one(
                models.TestSubmission.test_id == test.id,
                models.TestSubmission.student_id == current_user.id
            )
            if submission:
                raw_status = submission.status
                display_status = "Approved" if raw_status == "Reviewed" else ("Need Work" if raw_status in ["Needs Work", "Failed", "Fail"] else raw_status)
                test_dict["submission"] = {
                    "id": str(submission.id),
                    "submission_content": submission.submission_content,
                    "submitted_at": submission.submitted_at,
                    "status": display_status,
                    "staff_comments": submission.staff_comments
                }
            else:
                test_dict["submission"] = None
                
        response_data.append(test_dict)
        
    return response_data

@router.post("", status_code=status.HTTP_201_CREATED)
async def create_test(
    test_data: TestCreate,
    current_user: models.User = Depends(get_current_user)
):
    if (current_user.role or "").lower() not in ["staff", "sensi", "ceo", "admin"]:
        raise HTTPException(status_code=403, detail="Only sensi and admin can create tests")
        
    new_test = models.Test(
        title=test_data.title,
        description=test_data.description,
        due_date=test_data.due_date,
        level=test_data.level,
        batch=test_data.batch,
        created_by_id=current_user.id
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

@router.delete("/{test_id}")
async def delete_test(
    test_id: PydanticObjectId,
    current_user: models.User = Depends(get_current_user)
):
    if (current_user.role or "").lower() not in ["staff", "sensi", "ceo", "admin"]:
        raise HTTPException(status_code=403, detail="Only sensi and admin can delete tests")
        
    test = await models.Test.get(test_id)
    if not test:
        raise HTTPException(status_code=404, detail="Test not found")
        
    await test.delete()
    return {"message": "Test deleted successfully"}

@router.post("/{test_id}/submit")
async def submit_test(
    test_id: PydanticObjectId,
    submission_data: TestSubmit,
    current_user: models.User = Depends(get_current_user)
):
    if (current_user.role or "").lower() != "student":
        raise HTTPException(status_code=403, detail="Only students can submit tests")
        
    # Check if test exists
    test = await models.Test.get(test_id)
    if not test:
        raise HTTPException(status_code=404, detail="Test not found")
        
    # Determine student name reliably
    input_name = (submission_data.student_name or "").strip()
    db_student = await models.User.get(PydanticObjectId(current_user.id))
    db_name = getattr(db_student, "name", None) if db_student else None
    user_jwt_name = getattr(current_user, "name", None)

    invalid_names = ["unknown", "unkown", "none", "null", "undefined", "student", ""]
    if db_name and db_name.strip().lower() not in invalid_names:
        resolved_name = db_name.strip()
    elif input_name and input_name.lower() not in invalid_names:
        resolved_name = input_name
    elif user_jwt_name and user_jwt_name.strip().lower() not in invalid_names:
        resolved_name = user_jwt_name.strip()
    else:
        email_str = getattr(current_user, "email", None) or (getattr(db_student, "email", None) if db_student else "")
        email_part = email_str.split('@')[0] if email_str else "Student"
        resolved_name = email_part.replace('.', ' ').replace('_', ' ').title()

    # Check if already submitted
    existing_submission = await models.TestSubmission.find_one(
        models.TestSubmission.test_id == test_id,
        models.TestSubmission.student_id == current_user.id
    )
    
    if existing_submission:
        if existing_submission.status in ["Need Work", "Needs Work", "Failed", "Fail"]:
            existing_submission.submission_content = submission_data.submission_content
            existing_submission.student_name = resolved_name
            existing_submission.submitted_at = (datetime.utcnow() + timedelta(hours=5, minutes=30))
            existing_submission.status = "Pending Review"
            existing_submission.staff_comments = None
            await existing_submission.save()
            return {
                "id": str(existing_submission.id),
                "test_id": str(existing_submission.test_id),
                "student_id": str(existing_submission.student_id),
                "student_name": existing_submission.student_name or resolved_name,
                "submission_content": existing_submission.submission_content,
                "submitted_at": existing_submission.submitted_at,
                "status": existing_submission.status
            }
        else:
            raise HTTPException(status_code=400, detail="Test already submitted")
        
    new_submission = models.TestSubmission(
        test_id=test_id,
        student_id=current_user.id,
        student_name=resolved_name,
        submission_content=submission_data.submission_content
    )
    await new_submission.insert()
    
    return {
        "id": str(new_submission.id),
        "test_id": str(new_submission.test_id),
        "student_id": str(new_submission.student_id),
        "student_name": new_submission.student_name,
        "submission_content": new_submission.submission_content,
        "submitted_at": new_submission.submitted_at,
        "status": new_submission.status
    }

@router.get("/{test_id}/submissions")
async def get_test_submissions(
    test_id: PydanticObjectId,
    current_user: models.User = Depends(get_current_user)
):
    if (current_user.role or "").lower() not in ["staff", "sensi", "ceo", "admin"]:
        raise HTTPException(status_code=403, detail="Not authorized to view all submissions")
        
    # Fetch submissions for this test
    submissions = await models.TestSubmission.find(models.TestSubmission.test_id == test_id).sort("-submitted_at").to_list()
    
    response = []
    invalid_names = ["unknown", "unkown", "none", "null", "undefined", "student", ""]
    for sub in submissions:
        student = await models.User.get(sub.student_id)
        sub_name = getattr(sub, "student_name", None)
        if student and student.name and student.name.strip().lower() not in invalid_names:
            sub_name = student.name.strip()
        elif not sub_name or sub_name.strip().lower() in invalid_names:
            if student and student.email:
                sub_name = student.email.split('@')[0].replace('.', ' ').replace('_', ' ').title()
            else:
                sub_name = "Student"
        try:
            if sub.student_name != sub_name:
                sub.student_name = sub_name
                await sub.save()
        except Exception:
            pass
            
        raw_status = sub.status
        display_status = "Approved" if raw_status == "Reviewed" else ("Need Work" if raw_status in ["Needs Work", "Failed", "Fail"] else raw_status)

        response.append({
            "id": str(sub.id),
            "test_id": str(sub.test_id),
            "student_id": str(sub.student_id),
            "student_name": sub_name,
            "student_email": student.email if student else None,
            "submission_content": sub.submission_content,
            "submitted_at": sub.submitted_at,
            "status": display_status,
            "staff_comments": sub.staff_comments
        })
        
    return response

@router.put("/submissions/{submission_id}/review")
async def review_submission(
    submission_id: PydanticObjectId,
    review_data: TestReview,
    current_user: models.User = Depends(get_current_user)
):
    user_role = (current_user.role or "").lower()
    if user_role not in ["staff", "sensi", "ceo", "admin"]:
        raise HTTPException(status_code=403, detail="Only sensi can review tests")
        
    submission = await models.TestSubmission.get(submission_id)
    
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")
        
    normalized_status = review_data.status
    if normalized_status == "Reviewed":
        normalized_status = "Approved"
    elif normalized_status in ["Needs Work", "Failed", "Fail"]:
        normalized_status = "Need Work"

    submission.staff_comments = review_data.staff_comments
    submission.status = normalized_status
    
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
    user_role = (current_user.role or "").lower()
    if user_role not in ["staff", "sensi", "ceo", "admin"]:
        raise HTTPException(status_code=403, detail="Not authorized to view all submissions")
        
    submissions = await models.TestSubmission.find_all().sort("-submitted_at").to_list()
    
    response = []
    invalid_names = ["unknown", "unkown", "none", "null", "undefined", "student", ""]
    for sub in submissions:
        student = await models.User.get(sub.student_id)
        test = await models.Test.get(sub.test_id)
        
        sub_name = getattr(sub, "student_name", None)
        if student and student.name and student.name.strip().lower() not in invalid_names:
            sub_name = student.name.strip()
        elif not sub_name or sub_name.strip().lower() in invalid_names:
            if student and student.email:
                sub_name = student.email.split('@')[0].replace('.', ' ').replace('_', ' ').title()
            else:
                sub_name = "Student"
        try:
            if sub.student_name != sub_name:
                sub.student_name = sub_name
                await sub.save()
        except Exception:
            pass
            
        raw_status = sub.status
        display_status = "Approved" if raw_status == "Reviewed" else ("Need Work" if raw_status in ["Needs Work", "Failed", "Fail"] else raw_status)

        response.append({
            "id": str(sub.id),
            "test_id": str(sub.test_id),
            "test_title": test.title if test else "Assessment",
            "student_id": str(sub.student_id),
            "student_name": sub_name,
            "student_email": student.email if student else None,
            "submission_content": sub.submission_content,
            "submitted_at": sub.submitted_at,
            "status": display_status,
            "staff_comments": sub.staff_comments
        })
        
    return response
