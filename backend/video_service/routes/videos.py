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
    category_color: Optional[str] = None
    video_url: str
    level: Optional[str] = None
    batch: Optional[str] = None
    batches: Optional[List[str]] = []

class VideoResponse(BaseModel):
    id: str
    title: str
    category: str
    category_color: Optional[str] = None
    video_url: str
    uploaded_by_id: str
    created_at: Optional[str] = None
    level: Optional[str] = None
    batch: Optional[str] = None
    batches: Optional[List[str]] = []

@router.get("", response_model=List[VideoResponse])
@router.get("/", response_model=List[VideoResponse])
async def get_videos(
    category: Optional[str] = None, 
    level: Optional[str] = None, 
    batch: Optional[str] = None, 
    current_user: models.User = Depends(get_current_user)
):
    """Fetch all videos with optional filtering"""
    conditions = []
    
    # 1. Category Filter
    if category and category.strip().lower() not in ["all", "all categories"]:
        conditions.append({"category": {"$regex": f"^{category.strip()}$", "$options": "i"}})
        
    # 2. Level Filter: match specific level OR global level videos
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
        
    # 3. Batch Filter: match specific batch OR global batch videos ("All Batches", "All", "Global", empty, None)
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
    videos = await models.Video.find(query).sort("-created_at").to_list()
    
    return [
        VideoResponse(
            id=str(v.id),
            title=v.title,
            category=v.category,
            category_color=getattr(v, "category_color", None),
            video_url=v.video_url,
            uploaded_by_id=str(v.uploaded_by_id),
            created_at=v.created_at.isoformat() if v.created_at else None,
            level=v.level,
            batch=v.batch,
            batches=getattr(v, "batches", []) or []
        )
        for v in videos
    ]

@router.post("", response_model=VideoResponse)
@router.post("/", response_model=VideoResponse)
async def upload_video(video: VideoCreate, current_user: models.User = Depends(get_current_user)):
    """Upload a new video link (restricted to staff, ceo, and admin)"""
    user_role = (current_user.role or "").lower()
    if user_role not in ["staff", "sensi", "ceo", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to upload videos"
        )
        
    new_video = models.Video(
        title=video.title,
        category=video.category,
        category_color=video.category_color.strip() if video.category_color else None,
        video_url=video.video_url,
        uploaded_by_id=current_user.id,
        level=video.level,
        batch=video.batch,
        batches=video.batches or ([video.batch] if video.batch else [])
    )
    
    await new_video.insert()
    
    return VideoResponse(
        id=str(new_video.id),
        title=new_video.title,
        category=new_video.category,
        category_color=new_video.category_color,
        video_url=new_video.video_url,
        uploaded_by_id=str(new_video.uploaded_by_id),
        created_at=new_video.created_at.isoformat() if new_video.created_at else None,
        level=new_video.level,
        batch=new_video.batch,
        batches=new_video.batches or []
    )

@router.delete("/{video_id}")
async def delete_video(video_id: str, current_user: models.User = Depends(get_current_user)):
    """Delete a video (restricted to staff, ceo, and admin)"""
    user_role = (current_user.role or "").lower()
    if user_role not in ["staff", "sensi", "ceo", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete videos"
        )
    
    try:
        obj_id = PydanticObjectId(video_id)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid video ID format"
        )
        
    video = await models.Video.get(obj_id)
    
    if not video:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Video not found"
        )
            
    await video.delete()
    return {"message": "Video deleted successfully"}
