from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
import models
from .auth import get_current_user
from beanie import PydanticObjectId

router = APIRouter()

class VideoCreate(BaseModel):
    title: str
    category: str
    video_url: str

class VideoResponse(BaseModel):
    id: str
    title: str
    category: str
    video_url: str
    uploaded_by_id: str
    created_at: Optional[str] = None

@router.get("/", response_model=List[VideoResponse])
async def get_videos(category: Optional[str] = None, current_user: models.User = Depends(get_current_user)):
    """Fetch all videos, optionally filtered by category"""
    query = {}
    if category:
        query["category"] = category
        
    videos = await models.Video.find(query).sort("-created_at").to_list()
    
    return [
        VideoResponse(
            id=str(v.id),
            title=v.title,
            category=v.category,
            video_url=v.video_url,
            uploaded_by_id=str(v.uploaded_by_id),
            created_at=v.created_at.isoformat() if v.created_at else None
        )
        for v in videos
    ]

@router.post("/", response_model=VideoResponse)
async def upload_video(video: VideoCreate, current_user: models.User = Depends(get_current_user)):
    """Upload a new video link (restricted to staff and ceo)"""
    if current_user.role not in ["staff", "ceo"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to upload videos"
        )
        
    new_video = models.Video(
        title=video.title,
        category=video.category,
        video_url=video.video_url,
        uploaded_by_id=current_user.id
    )
    
    await new_video.insert()
    
    return VideoResponse(
        id=str(new_video.id),
        title=new_video.title,
        category=new_video.category,
        video_url=new_video.video_url,
        uploaded_by_id=str(new_video.uploaded_by_id),
        created_at=new_video.created_at.isoformat() if new_video.created_at else None
    )

@router.delete("/{video_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_video(video_id: PydanticObjectId, current_user: models.User = Depends(get_current_user)):
    """Delete a video (restricted to staff and ceo)"""
    if current_user.role not in ["staff", "ceo"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete videos"
        )
        
    video = await models.Video.get(video_id)
    
    if not video:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Video not found"
        )
            
    await video.delete()
    return None
