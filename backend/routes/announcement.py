from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

from database import get_db
import models
from routes.auth import get_current_user

router = APIRouter()

class AnnouncementCreate(BaseModel):
    title: str
    content: str

class AnnouncementUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None

class AnnouncementResponse(BaseModel):
    id: int
    title: str
    content: str
    created_at: datetime
    updated_at: datetime
    author_id: int
    viewed: bool = False

    class Config:
        from_attributes = True

@router.get("/", response_model=List[AnnouncementResponse])
async def get_announcements(
    db: AsyncSession = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    result = await db.execute(select(models.Announcement).order_by(models.Announcement.created_at.desc()))
    announcements = result.scalars().all()
    
    # Get views for the current user
    views_result = await db.execute(
        select(models.AnnouncementView.announcement_id)
        .where(models.AnnouncementView.user_id == current_user.id)
    )
    viewed_ids = set(views_result.scalars().all())
    
    response_data = []
    for ann in announcements:
        ann_dict = {
            "id": ann.id,
            "title": ann.title,
            "content": ann.content,
            "created_at": ann.created_at,
            "updated_at": ann.updated_at,
            "author_id": ann.author_id,
            "viewed": ann.id in viewed_ids
        }
        response_data.append(ann_dict)
        
    return response_data

@router.get("/unread_count")
async def get_unread_count(
    db: AsyncSession = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    # Total announcements
    result = await db.execute(select(models.Announcement.id))
    total_announcements = len(result.scalars().all())
    
    # Viewed announcements
    views_result = await db.execute(
        select(models.AnnouncementView.announcement_id)
        .where(models.AnnouncementView.user_id == current_user.id)
    )
    viewed_count = len(views_result.scalars().all())
    
    unread_count = total_announcements - viewed_count
    return {"unread_count": max(0, unread_count)}

@router.post("/", response_model=AnnouncementResponse)
async def create_announcement(
    announcement: AnnouncementCreate,
    db: AsyncSession = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role != "ceo":
        raise HTTPException(status_code=403, detail="Only CEO can create announcements")
        
    new_ann = models.Announcement(
        title=announcement.title,
        content=announcement.content,
        author_id=current_user.id
    )
    db.add(new_ann)
    await db.commit()
    await db.refresh(new_ann)
    
    return {
        "id": new_ann.id,
        "title": new_ann.title,
        "content": new_ann.content,
        "created_at": new_ann.created_at,
        "updated_at": new_ann.updated_at,
        "author_id": new_ann.author_id,
        "viewed": False
    }

@router.put("/{announcement_id}", response_model=AnnouncementResponse)
async def update_announcement(
    announcement_id: int,
    announcement_update: AnnouncementUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role != "ceo":
        raise HTTPException(status_code=403, detail="Only CEO can update announcements")
        
    result = await db.execute(select(models.Announcement).where(models.Announcement.id == announcement_id))
    db_ann = result.scalars().first()
    
    if not db_ann:
        raise HTTPException(status_code=404, detail="Announcement not found")
        
    if announcement_update.title is not None:
        db_ann.title = announcement_update.title
    if announcement_update.content is not None:
        db_ann.content = announcement_update.content
        
    await db.commit()
    await db.refresh(db_ann)
    
    return {
        "id": db_ann.id,
        "title": db_ann.title,
        "content": db_ann.content,
        "created_at": db_ann.created_at,
        "updated_at": db_ann.updated_at,
        "author_id": db_ann.author_id,
        "viewed": True # CEO viewed it by editing
    }

@router.post("/{announcement_id}/view")
async def mark_as_viewed(
    announcement_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    # Check if announcement exists
    result = await db.execute(select(models.Announcement).where(models.Announcement.id == announcement_id))
    if not result.scalars().first():
        raise HTTPException(status_code=404, detail="Announcement not found")
        
    # Check if already viewed
    view_result = await db.execute(
        select(models.AnnouncementView)
        .where(
            (models.AnnouncementView.user_id == current_user.id) & 
            (models.AnnouncementView.announcement_id == announcement_id)
        )
    )
    if view_result.scalars().first():
        return {"message": "Already viewed"}
        
    new_view = models.AnnouncementView(
        user_id=current_user.id,
        announcement_id=announcement_id
    )
    db.add(new_view)
    await db.commit()
    
    return {"message": "Marked as viewed"}
