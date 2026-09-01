from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from beanie import PydanticObjectId
from datetime import datetime, timedelta
import models
from routes.auth import get_current_user
from redis_client import get_cache, set_cache, delete_cache, delete_pattern

router = APIRouter()

class NotificationCreate(BaseModel):
    recipient_id: str  # user email, user id, or 'all', 'role:student', 'role:staff', 'role:ceo'
    recipient_role: Optional[str] = None
    title: str
    message: str
    type: str = "general"
    link: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = {}

def format_notification(n: models.Notification) -> dict:
    return {
        "id": str(n.id),
        "_id": str(n.id),
        "recipient_id": n.recipient_id,
        "recipient_role": n.recipient_role,
        "title": n.title,
        "message": n.message,
        "type": n.type,
        "link": n.link,
        "read": n.read,
        "is_deleted": n.is_deleted,
        "metadata": n.metadata or {},
        "created_at": n.created_at.isoformat() if getattr(n, "created_at", None) else None
    }

@router.get("", response_model=List[dict])
async def get_user_notifications(current_user: models.User = Depends(get_current_user)):
    """Fetch all active notifications for current user with Redis acceleration"""
    user_email = (current_user.email or "").lower()
    user_id = str(current_user.id)
    user_role = (current_user.role or "student").lower()

    cache_key = f"user:notifications:{user_email}"
    cached = await get_cache(cache_key)
    if cached is not None:
        return cached

    # Query matching notifications
    query = {
        "is_deleted": {"$ne": True},
        "$or": [
            {"recipient_id": user_email},
            {"recipient_id": user_id},
            {"recipient_id": "all"},
            {"recipient_role": "all"},
            {"recipient_role": user_role},
            {"recipient_id": f"role:{user_role}"}
        ]
    }

    notifications = await models.Notification.find(query).sort("-created_at").limit(100).to_list()
    result = [format_notification(n) for n in notifications]

    # Cache for 15 seconds in Redis for rapid repeated bell opens
    await set_cache(cache_key, result, ttl=15)
    return result

@router.post("", response_model=dict)
async def create_notification(
    payload: NotificationCreate,
    current_user: models.User = Depends(get_current_user)
):
    """Create and persist a new notification in DB and invalidate target user caches"""
    new_notif = models.Notification(
        recipient_id=payload.recipient_id.strip().lower(),
        recipient_role=payload.recipient_role.lower() if payload.recipient_role else None,
        title=payload.title,
        message=payload.message,
        type=payload.type,
        link=payload.link,
        metadata=payload.metadata or {}
    )
    await new_notif.insert()

    # Invalidate Redis notification cache for target or all
    if payload.recipient_id in ["all", "role:student", "role:staff", "role:ceo"]:
        await delete_pattern("user:notifications:*")
    else:
        await delete_cache(f"user:notifications:{payload.recipient_id.strip().lower()}")

    return format_notification(new_notif)

@router.patch("/{notification_id}/read", response_model=dict)
async def mark_notification_read(
    notification_id: str,
    current_user: models.User = Depends(get_current_user)
):
    """Mark a notification as read"""
    notif = None
    try:
        notif = await models.Notification.get(PydanticObjectId(notification_id))
    except Exception:
        pass
    if not notif:
        notif = await models.Notification.find_one({"_id": notification_id})

    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")

    notif.read = True
    await notif.save()

    # Invalidate cache
    user_email = (current_user.email or "").lower()
    await delete_cache(f"user:notifications:{user_email}")
    return {"message": "Notification marked as read", "id": notification_id}

@router.post("/read-all", response_model=dict)
async def mark_all_notifications_read(current_user: models.User = Depends(get_current_user)):
    """Mark all active notifications for the current user as read"""
    user_email = (current_user.email or "").lower()
    user_id = str(current_user.id)
    user_role = (current_user.role or "student").lower()

    query = {
        "is_deleted": {"$ne": True},
        "$or": [
            {"recipient_id": user_email},
            {"recipient_id": user_id},
            {"recipient_id": "all"},
            {"recipient_role": "all"},
            {"recipient_role": user_role},
            {"recipient_id": f"role:{user_role}"}
        ]
    }

    await models.Notification.find(query).update({"$set": {"read": True}})
    await delete_cache(f"user:notifications:{user_email}")
    return {"message": "All notifications marked as read"}

@router.delete("/{notification_id}")
async def delete_single_notification(
    notification_id: str,
    current_user: models.User = Depends(get_current_user)
):
    """Delete a single notification from DB (triggered by button 'X')"""
    notif = None
    try:
        notif = await models.Notification.get(PydanticObjectId(notification_id))
    except Exception:
        pass
    if not notif:
        notif = await models.Notification.find_one({"_id": notification_id})

    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")

    # If it's a direct user notification or user is CEO/admin, delete or soft-delete
    await notif.delete()

    user_email = (current_user.email or "").lower()
    await delete_cache(f"user:notifications:{user_email}")
    return {"message": "Notification deleted successfully", "id": notification_id}

@router.delete("/clear-all")
async def clear_all_user_notifications(current_user: models.User = Depends(get_current_user)):
    """Delete / clear all notifications for the current user"""
    user_email = (current_user.email or "").lower()
    user_id = str(current_user.id)
    user_role = (current_user.role or "student").lower()

    query = {
        "$or": [
            {"recipient_id": user_email},
            {"recipient_id": user_id},
            {"recipient_id": f"role:{user_role}"}
        ]
    }

    await models.Notification.find(query).delete()
    await delete_cache(f"user:notifications:{user_email}")
    return {"message": "All notifications cleared"}
