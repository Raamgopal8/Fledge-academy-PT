from datetime import datetime, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from beanie import PydanticObjectId

import models
from .auth import get_current_user

router = APIRouter()

class NoteCreateRequest(BaseModel):
    title: Optional[str] = "Notes"
    note_link: str
    level: Optional[str] = None
    batch: Optional[str] = None

@router.post("", response_model=dict)
async def create_student_note(
    request: NoteCreateRequest,
    current_user: models.User = Depends(get_current_user)
):
    """Upload or submit a student notes link"""
    clean_link = request.note_link.strip()
    if not clean_link:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Notes link is required."
        )

    # Ensure link has http/https protocol prefix if missing
    if not clean_link.startswith("http://") and not clean_link.startswith("https://"):
        clean_link = "https://" + clean_link

    uploader_name = current_user.name or (current_user.email.split("@")[0] if current_user.email else "Student")
    
    note_level = (request.level or getattr(current_user, "level", None) or "Level 5").strip()
    note_batch = (request.batch or getattr(current_user, "batch", None) or "").strip() or None

    note = models.StudentNote(
        title=request.title.strip() if request.title and request.title.strip() else "Study Notes",
        note_link=clean_link,
        uploader_name=uploader_name,
        uploader_id=str(current_user.id),
        level=note_level,
        batch=note_batch,
        created_at=(datetime.utcnow() + timedelta(hours=5, minutes=30))
    )
    
    await note.insert()

    return {
        "id": str(note.id),
        "title": note.title,
        "note_link": note.note_link,
        "uploader_name": note.uploader_name,
        "uploader_id": note.uploader_id,
        "level": note.level,
        "batch": note.batch,
        "created_at": note.created_at.isoformat()
    }

@router.get("", response_model=List[dict])
async def get_student_notes(
    batch: Optional[str] = None,
    level: Optional[str] = None,
    current_user: models.User = Depends(get_current_user)
):
    """Fetch student notes. Level-scoped for students, assigned-batches scoped for Sensi."""
    query = {}
    user_role = (current_user.role or "").lower()
    
    if user_role == "student":
        student_level = (level or getattr(current_user, "level", None) or "Level 5").strip()
        student_batch = getattr(current_user, "batch", None)
        
        # Strictly isolate notes by level:
        # Level 5 notes are only visible to Level 5 members;
        # Level 4, 3, 2, 1 members only see notes for their level.
        if student_level == "Level 5":
            level_condition = {"$or": [{"level": "Level 5"}, {"level": None}, {"level": ""}]}
        else:
            level_condition = {"level": student_level}

        # Student scope: student's own notes or notes in their batch
        scope_conditions = [{"uploader_id": str(current_user.id)}]
        if student_batch and student_batch not in ["All Batches", "Global"]:
            scope_conditions.extend([
                {"batch": student_batch},
                {"batch": None},
                {"batch": ""}
            ])
            
        query = {
            "$and": [
                level_condition,
                {"$or": scope_conditions}
            ]
        }
    elif user_role in ["staff", "sensi"]:
        # Sensi strictly fetches notes for their assigned batches
        assigned_batches = getattr(current_user, "batches", None) or []
        if not assigned_batches and getattr(current_user, "batch", None):
            assigned_batches = [current_user.batch]
        assigned_batches = [b.strip() for b in assigned_batches if b and b.strip()]

        if not assigned_batches:
            return []

        # Batch filter
        if batch and batch.strip() and batch.strip() not in ["All Batches", "All Assigned Batches", "Global", "Global Access"]:
            target_batch = batch.strip()
            if target_batch in assigned_batches:
                query["batch"] = target_batch
            else:
                # Sensi is requesting a batch they are not assigned to
                return []
        else:
            if len(assigned_batches) == 1:
                query["batch"] = assigned_batches[0]
            else:
                query["batch"] = {"$in": assigned_batches}

        # Level filter for Sensi
        if level and level.strip() and level.strip() not in ["All Levels", "All", "Global"]:
            target_level = level.strip()
            if target_level == "Level 5":
                query["$or"] = [{"level": "Level 5"}, {"level": None}, {"level": ""}]
            else:
                query["level"] = target_level
    else:
        # Admin / CEO - Global access with optional filters
        if batch and batch.strip() and batch.strip() not in ["All Batches", "All Assigned Batches", "Global", "Global Access"]:
            query["batch"] = batch.strip()
            
        if level and level.strip() and level.strip() not in ["All Levels", "All", "Global"]:
            target_level = level.strip()
            if target_level == "Level 5":
                query["$or"] = [{"level": "Level 5"}, {"level": None}, {"level": ""}]
            else:
                query["level"] = target_level
            
    notes = await models.StudentNote.find(query).sort("-created_at").to_list()
    
    return [
        {
            "id": str(n.id),
            "title": n.title,
            "note_link": n.note_link,
            "uploader_name": n.uploader_name,
            "uploader_id": n.uploader_id,
            "level": n.level,
            "batch": n.batch,
            "created_at": n.created_at.isoformat() if n.created_at else None
        }
        for n in notes
    ]

@router.delete("/{note_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_student_note(
    note_id: str,
    current_user: models.User = Depends(get_current_user)
):
    """Delete note submission"""
    try:
        obj_id = PydanticObjectId(note_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid note ID")

    note = await models.StudentNote.get(obj_id)
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")

    user_role = (current_user.role or "").lower()
    
    if user_role == "student":
        if note.uploader_id != str(current_user.id):
            raise HTTPException(status_code=403, detail="Not authorized to delete this note")
    elif user_role in ["staff", "sensi"]:
        assigned_batches = getattr(current_user, "batches", None) or []
        if not assigned_batches and getattr(current_user, "batch", None):
            assigned_batches = [current_user.batch]
        if note.uploader_id != str(current_user.id) and note.batch not in assigned_batches:
            raise HTTPException(status_code=403, detail="Not authorized to delete notes outside assigned batches")
    elif user_role not in ["admin", "ceo"]:
        raise HTTPException(status_code=403, detail="Not authorized to delete this note")

    await note.delete()
    return None
