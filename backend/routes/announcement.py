from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from pydantic import BaseModel, Field
from datetime import datetime
from beanie import PydanticObjectId

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
    id: PydanticObjectId = Field(alias="_id")
    title: str
    content: str
    created_at: datetime
    updated_at: datetime
    author_id: PydanticObjectId
    viewed: bool = False

    class Config:
        populate_by_name = True
        from_attributes = True

@router.get("/", response_model=List[AnnouncementResponse])
async def get_announcements(
    current_user: models.User = Depends(get_current_user)
):
    announcements = await models.Announcement.find_all().sort("-created_at").to_list()
    
    # Get views for the current user
    views = await models.AnnouncementView.find(models.AnnouncementView.user_id == current_user.id).to_list()
    viewed_ids = {str(view.announcement_id) for view in views}
    
    response_data = []
    for ann in announcements:
        ann_dict = {
            "id": ann.id,
            "title": ann.title,
            "content": ann.content,
            "created_at": ann.created_at,
            "updated_at": ann.updated_at,
            "author_id": ann.author_id,
            "viewed": str(ann.id) in viewed_ids
        }
        response_data.append(ann_dict)
        
    return response_data

@router.get("/unread_count")
async def get_unread_count(
    current_user: models.User = Depends(get_current_user)
):
    announcements = await models.Announcement.find_all().to_list()
    ann_ids = {str(ann.id) for ann in announcements}
    
    views = await models.AnnouncementView.find(models.AnnouncementView.user_id == current_user.id).to_list()
    viewed_ann_ids = {str(view.announcement_id) for view in views}
    
    unread_count = len(ann_ids - viewed_ann_ids)
    return {"unread_count": unread_count}

@router.post("/", response_model=AnnouncementResponse)
async def create_announcement(
    announcement: AnnouncementCreate,
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role != "ceo":
        raise HTTPException(status_code=403, detail="Only CEO can create announcements")
        
    new_ann = models.Announcement(
        title=announcement.title,
        content=announcement.content,
        author_id=current_user.id
    )
    await new_ann.insert()
    
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
    announcement_id: PydanticObjectId,
    announcement_update: AnnouncementUpdate,
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role != "ceo":
        raise HTTPException(status_code=403, detail="Only CEO can update announcements")
        
    db_ann = await models.Announcement.get(announcement_id)
    
    if not db_ann:
        raise HTTPException(status_code=404, detail="Announcement not found")
        
    if announcement_update.title is not None:
        db_ann.title = announcement_update.title
    if announcement_update.content is not None:
        db_ann.content = announcement_update.content
        
    db_ann.updated_at = datetime.utcnow()
    await db_ann.save()
    
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
    announcement_id: PydanticObjectId,
    current_user: models.User = Depends(get_current_user)
):
    # Check if announcement exists
    announcement = await models.Announcement.get(announcement_id)
    if not announcement:
        raise HTTPException(status_code=404, detail="Announcement not found")
        
    # Check if already viewed
    existing_view = await models.AnnouncementView.find_one(
        models.AnnouncementView.user_id == current_user.id,
        models.AnnouncementView.announcement_id == announcement_id
    )
    if existing_view:
        return {"message": "Already viewed"}
        
    new_view = models.AnnouncementView(
        user_id=current_user.id,
        announcement_id=announcement_id
    )
    await new_view.insert()
    
    return {"message": "Marked as viewed"}
