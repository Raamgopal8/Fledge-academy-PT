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

    # Query matching notifications from database
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
    
    # Filter out any IDs recorded in user preferences as permanently cleared
    user_prefs = current_user.preferences or {}
    cleared_list = set(user_prefs.get("cleared_notifications", []))
    
    result = [
        format_notification(n) for n in notifications 
        if str(n.id) not in cleared_list
    ]

    # Cache for 15 seconds in Redis
    await set_cache(cache_key, result, ttl=15)
    return result

@router.get("/cleared-ids", response_model=List[str])
async def get_cleared_notification_ids(current_user: models.User = Depends(get_current_user)):
    """Fetch list of permanently cleared notification IDs for this user"""
    user_prefs = current_user.preferences or {}
    return list(user_prefs.get("cleared_notifications", []))

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

    if notif:
        notif.read = True
        await notif.save()

    # Also record read state in user preferences for event-based IDs
    user_prefs = current_user.preferences or {}
    read_list = list(user_prefs.get("read_notifications", []))
    if notification_id not in read_list:
        read_list.append(notification_id)
        user_prefs["read_notifications"] = read_list[-500:]
        current_user.preferences = user_prefs
        await current_user.save()

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
    """Permanently delete a single notification from DB and register cleared ID"""
    notif = None
    try:
        notif = await models.Notification.get(PydanticObjectId(notification_id))
    except Exception:
        pass
    if not notif:
        notif = await models.Notification.find_one({"_id": notification_id})

    # If it's a direct MongoDB notification document, delete it permanently
    if notif:
        await notif.delete()

    # Permanently store ID in user's cleared list in MongoDB
    user_prefs = current_user.preferences or {}
    cleared_list = list(user_prefs.get("cleared_notifications", []))
    if notification_id not in cleared_list:
        cleared_list.append(notification_id)
        user_prefs["cleared_notifications"] = cleared_list[-500:]  # keep last 500
        current_user.preferences = user_prefs
        await current_user.save()

    user_email = (current_user.email or "").lower()
    await delete_cache(f"user:notifications:{user_email}")
    return {"message": "Notification permanently deleted", "id": notification_id}

@router.delete("/clear-all")
async def clear_all_user_notifications(current_user: models.User = Depends(get_current_user)):
    """Permanently delete / clear all notifications for the current user"""
    user_email = (current_user.email or "").lower()
    user_id = str(current_user.id)
    user_role = (current_user.role or "student").lower()

    # Delete user's own persistent notifications from DB
    query = {
        "$or": [
            {"recipient_id": user_email},
            {"recipient_id": user_id}
        ]
    }
    # Find all current matching IDs before deleting
    existing_notifs = await models.Notification.find({
        "$or": [
            {"recipient_id": user_email},
            {"recipient_id": user_id},
            {"recipient_id": "all"},
            {"recipient_role": "all"},
            {"recipient_role": user_role},
            {"recipient_id": f"role:{user_role}"}
        ]
    }).to_list()
    
    await models.Notification.find(query).delete()

    # Add all to permanent cleared list
    user_prefs = current_user.preferences or {}
    cleared_list = list(user_prefs.get("cleared_notifications", []))
    for n in existing_notifs:
        nid = str(n.id)
        if nid not in cleared_list:
            cleared_list.append(nid)
    
    user_prefs["cleared_notifications"] = cleared_list[-500:]
    current_user.preferences = user_prefs
    await current_user.save()

    await delete_cache(f"user:notifications:{user_email}")
    return {"message": "All notifications cleared permanently"}
