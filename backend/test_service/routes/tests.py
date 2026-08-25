from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from pydantic import BaseModel, Field
from datetime import datetime
from beanie import PydanticObjectId
from beanie.operators import In
import models
from routes.auth import get_current_user

router = APIRouter()

class TestCreate(BaseModel):
    title: str
    description: Optional[str] = None
    level: Optional[str] = None
    batch: Optional[str] = None
    batches: Optional[List[str]] = []
    due_date: Optional[datetime] = None

class TestSubmit(BaseModel):
    student_name: str
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
    conditions = []
    if level and level.strip().lower() not in ["all", "all levels"]:
        clean_level = level.strip()
        conditions.append({
            "$or": [
                {"level": {"$regex": f"^{clean_level}$", "$options": "i"}},
                {"level": {"$regex": "^all levels$", "$options": "i"}},
                {"level": {"$regex": "^all$", "$options": "i"}},
                {"level": None},
                {"level": ""}
            ]
        })
    if batch and batch.strip().lower() not in ["all batches", "all assigned batches", "global", "global access", "all"]:
        clean_batch = batch.strip()
        conditions.append({
            "$or": [
                {"batch": {"$regex": f"^{clean_batch}$", "$options": "i"}},
                {"batches": {"$in": [clean_batch]}},
                {"batch": {"$regex": "^all batches$", "$options": "i"}},
                {"batch": {"$regex": "^all$", "$options": "i"}},
                {"batch": {"$regex": "^global$", "$options": "i"}},
                {"batches": {"$in": ["All Batches", "All", "Global"]}},
                {"batch": None},
                {"batch": ""}
            ]
        })
        
    query = {"$and": conditions} if conditions else {}
    tests = await models.Test.find(query).sort("-created_at").to_list()
    
    response_data = []
    for test in tests:
        test_dict = {
            "id": str(test.id),
            "title": test.title,
            "description": test.description,
            "level": test.level,
            "batch": test.batch,
            "batches": getattr(test, "batches", []) or [],
            "created_by_id": str(test.created_by_id),
            "created_at": test.created_at,
            "due_date": test.due_date,
        }
        
        # If student, attach their submission status
        user_role = (current_user.role or "").lower()
        if user_role == "student":
            submission = await models.TestSubmission.find_one(
                models.TestSubmission.test_id == test.id,
                models.TestSubmission.student_id == PydanticObjectId(current_user.id)
            )
            
            if submission:
                test_dict["submission"] = {
                    "id": str(submission.id),
                    "status": submission.status,
                    "submitted_at": submission.submitted_at,
                    "staff_comments": submission.staff_comments
                }
                test_dict["has_submitted"] = True
            else:
                test_dict["submission"] = None
                test_dict["has_submitted"] = False
                
        response_data.append(test_dict)
        
    return response_data

@router.post("")
async def create_test(
    test_data: TestCreate,
    current_user: models.User = Depends(get_current_user)
):
    user_role = (current_user.role or "").lower()
    if user_role not in ["staff", "ceo", "admin"]:
        raise HTTPException(status_code=403, detail="Only staff and CEO can create tests")
        
    new_test = models.Test(
        title=test_data.title,
        description=test_data.description,
        level=test_data.level,
        batch=test_data.batch,
        batches=test_data.batches or ([test_data.batch] if test_data.batch else []),
        created_by_id=PydanticObjectId(current_user.id),
        due_date=test_data.due_date
    )
    await new_test.insert()
    
    return {
        "id": str(new_test.id),
        "title": new_test.title,
        "description": new_test.description,
        "level": new_test.level,
        "batch": new_test.batch,
        "batches": new_test.batches or [],
        "created_by_id": str(new_test.created_by_id),
        "created_at": new_test.created_at,
        "due_date": new_test.due_date
    }

@router.delete("/{test_id}")
async def delete_test(
    test_id: str,
    current_user: models.User = Depends(get_current_user)
):
    user_role = (current_user.role or "").lower()
    if user_role not in ["staff", "ceo", "admin"]:
        raise HTTPException(status_code=403, detail="Not authorized to delete tests")
    try:
        obj_id = PydanticObjectId(test_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid test ID")
        
    test = await models.Test.get(obj_id)
    if not test:
        raise HTTPException(status_code=404, detail="Test not found")
        
    await test.delete()
    submissions = await models.TestSubmission.find(models.TestSubmission.test_id == obj_id).to_list()
    for s in submissions:
        await s.delete()
    return {"message": "Test deleted successfully"}

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
        models.TestSubmission.student_id == PydanticObjectId(current_user.id)
    )
    
    if existing_submission:
        if existing_submission.status == "Needs Work":
            # Overwrite existing submission for resubmission
            existing_submission.submission_content = submission_data.submission_content
            existing_submission.submitted_at = datetime.utcnow()
            existing_submission.status = "Pending Review"
            existing_submission.staff_comments = None
            await existing_submission.save()
            
            return {
                "id": str(existing_submission.id),
                "test_id": str(existing_submission.test_id),
                "student_id": str(existing_submission.student_id),
                "student_name": existing_submission.student_name,
                "submission_content": existing_submission.submission_content,
                "submitted_at": existing_submission.submitted_at,
                "status": existing_submission.status
            }
        else:
            raise HTTPException(status_code=400, detail="Test already submitted")
        
    new_submission = models.TestSubmission(
        test_id=test_id,
        student_id=PydanticObjectId(current_user.id),
        student_name=submission_data.student_name,
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
            "student_name": getattr(sub, "student_name", None) if getattr(sub, "student_name", None) else (student.name if student else "Unknown"),
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
    user_role = (current_user.role or "").lower()
    if user_role not in ["staff", "ceo", "admin"]:
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
    batch: Optional[str] = None,
    current_user: models.User = Depends(get_current_user)
):
    user_role = (current_user.role or "").lower()
    if user_role not in ["staff", "ceo", "admin"]:
        raise HTTPException(status_code=403, detail="Not authorized to view all submissions")
        
    target_batch = batch if (batch and batch.strip().lower() not in ["all", "all batches", "all assigned batches", "global"]) else None
    
    if target_batch:
        tests = await models.Test.find({
            "$or": [
                {"batch": {"$regex": f"^{target_batch.strip()}$", "$options": "i"}},
                {"batches": {"$in": [target_batch.strip()]}},
                {"batch": {"$regex": "^all batches$", "$options": "i"}},
                {"batches": {"$in": ["All Batches", "All", "Global"]}},
                {"batch": None},
                {"batch": ""}
            ]
        }).to_list()
        test_ids = [t.id for t in tests]
        if test_ids:
            submissions = await models.TestSubmission.find(In(models.TestSubmission.test_id, test_ids)).sort("-submitted_at").to_list()
        else:
            submissions = []
    else:
        staff_batches = getattr(current_user, "batches", []) or []
        staff_batch = getattr(current_user, "batch", None)
        if user_role == "staff" and (staff_batches or staff_batch):
            allowed_batches = list(staff_batches)
            if staff_batch and staff_batch not in allowed_batches:
                allowed_batches.append(staff_batch)
            allowed_batches.extend(["All Batches", "All", "Global", None, ""])
            
            tests = await models.Test.find({
                "$or": [
                    {"batch": {"$in": allowed_batches}},
                    {"batches": {"$in": allowed_batches}},
                    {"batch": None},
                    {"batch": ""}
                ]
            }).to_list()
            test_ids = [t.id for t in tests]
            if test_ids:
                submissions = await models.TestSubmission.find(In(models.TestSubmission.test_id, test_ids)).sort("-submitted_at").to_list()
            else:
                submissions = []
        else:
            submissions = await models.TestSubmission.find_all().sort("-submitted_at").to_list()    

    response = []
    for sub in submissions:
        student = await models.User.get(sub.student_id)
        test = await models.Test.get(sub.test_id)
        
        response.append({
            "id": str(sub.id),
            "test_id": str(sub.test_id),
            "test_title": test.title if test else "Unknown",
            "test_level": test.level if test else None,
            "test_batch": test.batch if test else None,
            "student_id": str(sub.student_id),
            "student_name": getattr(sub, "student_name", None) if getattr(sub, "student_name", None) else (student.name if student else "Unknown"),
            "student_email": student.email if student else None,
            "submission_content": sub.submission_content,
            "submitted_at": sub.submitted_at,
            "status": sub.status,
            "staff_comments": sub.staff_comments
        })
        
    return response
