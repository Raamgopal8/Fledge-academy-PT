from datetime import datetime
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
    
    note = models.StudentNote(
        title=request.title.strip() if request.title and request.title.strip() else "Study Notes",
        note_link=clean_link,
        uploader_name=uploader_name,
        uploader_id=str(current_user.id),
        level=request.level or getattr(current_user, "level", None),
        batch=request.batch or getattr(current_user, "batch", None),
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
    """Fetch student notes. Staff sees batch notes with uploader name; Students see notes."""
    query = {}
    
    if current_user.role == "student":
        # Return student's own notes or batch notes
        student_batch = getattr(current_user, "batch", None)
        if student_batch and student_batch not in ["All Batches", "Global"]:
            query["$or"] = [
                {"uploader_id": str(current_user.id)},
                {"batch": student_batch},
                {"batch": None},
                {"batch": ""}
            ]
    else:
        # Staff / CEO
        if batch and batch not in ["All Batches", "All Assigned Batches", "Global", "Global Access"]:
            query["batch"] = batch
            
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

    # Only uploader or staff/ceo can delete
    if current_user.role not in ["staff", "ceo", "admin"] and note.uploader_id != str(current_user.id):
        raise HTTPException(status_code=403, detail="Not authorized to delete this note")

    await note.delete()
    return None
