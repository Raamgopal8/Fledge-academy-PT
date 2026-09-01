from fastapi import APIRouter, Depends, HTTPException, Query, Request
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from datetime import datetime, timedelta
import models
from routes.auth import get_current_user

router = APIRouter()

class ActivityLogCreate(BaseModel):
    action: str
    activity_type: Optional[str] = "page_view"
    details: Optional[Dict[str, Any]] = None

@router.post("/log")
async def log_activity(
    log_data: ActivityLogCreate,
    request: Request,
    current_user: models.User = Depends(get_current_user)
):
    now = (datetime.utcnow() + timedelta(hours=5, minutes=30))
    
    # Refresh user active status in database
    db_user = None
    if getattr(current_user, "id", None):
        try:
            db_user = await models.User.get(current_user.id)
        except Exception:
            pass
    if not db_user and getattr(current_user, "email", None):
        db_user = await models.User.find_one(models.User.email == current_user.email)

    if db_user:
        db_user.last_seen_at = now
        db_user.is_online = True
        await db_user.save()

    user_batches = getattr(current_user, "batches", None) or ([current_user.batch] if getattr(current_user, "batch", None) else [])
    primary_batch = getattr(current_user, "batch", None) or (user_batches[0] if user_batches else None)

    client_ip = request.client.host if request.client else None
    user_agent = request.headers.get("user-agent", "")

    activity = models.UserActivityLog(
        user_id=getattr(current_user, "id", None),
        user_name=getattr(current_user, "name", None) or current_user.email.split("@")[0],
        user_email=current_user.email,
        role=current_user.role,
        level=getattr(current_user, "level", None),
        batch=primary_batch,
        activity_type=log_data.activity_type or "page_view",
        action=log_data.action,
        details=log_data.details or {},
        ip_address=client_ip,
        user_agent=user_agent[:200] if user_agent else None,
        timestamp=now
    )
    await activity.insert()

    return {"status": "logged", "id": str(activity.id)}

@router.post("/heartbeat")
async def user_heartbeat(current_user: models.User = Depends(get_current_user)):
    now = (datetime.utcnow() + timedelta(hours=5, minutes=30))
    db_user = None
    if getattr(current_user, "id", None):
        try:
            db_user = await models.User.get(current_user.id)
        except Exception:
            pass
    if not db_user and getattr(current_user, "email", None):
        db_user = await models.User.find_one(models.User.email == current_user.email)

    if db_user:
        db_user.last_seen_at = now
        db_user.is_online = True
        await db_user.save()

    return {"status": "ok", "last_seen_at": now.isoformat()}

@router.get("/ceo/logs")
async def get_activity_logs(
    role: Optional[str] = None,
    activity_type: Optional[str] = None,
    batch: Optional[str] = None,
    search: Optional[str] = None,
    limit: Optional[int] = Query(None),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role != "ceo":
        raise HTTPException(status_code=403, detail="Only CEO can access activity logs")

    query = {}
    if role and role.lower() not in ["all", "all roles"]:
        query["role"] = role.lower()

    if activity_type and activity_type.lower() not in ["all", "all types"]:
        query["activity_type"] = activity_type.lower()

    if batch and batch.lower() not in ["all", "all batches", "global", "global access"]:
        query["batch"] = batch

    if search and search.strip():
        s = search.strip()
        query["$or"] = [
            {"user_name": {"$regex": s, "$options": "i"}},
            {"user_email": {"$regex": s, "$options": "i"}},
            {"action": {"$regex": s, "$options": "i"}}
        ]

    db_query = models.UserActivityLog.find(query).sort("-timestamp")
    if limit and limit > 0:
        db_query = db_query.limit(limit)
    logs = await db_query.to_list()

    return [
        {
            "id": str(log.id),
            "user_id": str(log.user_id) if log.user_id else None,
            "user_name": log.user_name,
            "user_email": log.user_email,
            "role": log.role,
            "level": log.level,
            "batch": log.batch,
            "activity_type": log.activity_type,
            "action": log.action,
            "details": log.details,
            "ip_address": log.ip_address,
            "timestamp": log.timestamp.isoformat() if log.timestamp else None
        }
        for log in logs
    ]

@router.get("/ceo/user-sessions")
async def get_user_sessions(
    role: Optional[str] = None,
    batch: Optional[str] = None,
    search: Optional[str] = None,
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role != "ceo":
        raise HTTPException(status_code=403, detail="Only CEO can access user session monitor")

    query = {}
    if role and role.lower() not in ["all", "all roles"]:
        query["role"] = role.lower()
    else:
        query["role"] = {"$in": ["student", "staff"]}

    if batch and batch.lower() not in ["all", "all batches", "global", "global access"]:
        query["batch"] = batch

    if search and search.strip():
        s = search.strip()
        query["$or"] = [
            {"name": {"$regex": s, "$options": "i"}},
            {"email": {"$regex": s, "$options": "i"}}
        ]

    users = await models.User.find(query).to_list()
    now = (datetime.utcnow() + timedelta(hours=5, minutes=30))
    five_mins_ago = now - timedelta(minutes=5)

    # Fetch latest activity for each user
    user_results = []
    for u in users:
        # Determine actual online status: must have been seen within 5 minutes and not explicitly marked offline
        is_actually_online = bool(
            u.is_online and u.last_seen_at and u.last_seen_at >= five_mins_ago
        )

        # Get latest activity log
        latest_log = None
        try:
            latest_log = await models.UserActivityLog.find(
                models.UserActivityLog.user_email == u.email
            ).sort("-timestamp").first_or_none()
        except Exception as e:
            print(f"Error fetching activity log for {u.email}:", e)

        latest_action = latest_log.action if latest_log else (
            "Logged into portal" if u.last_login_at else "No activity recorded"
        )

        user_results.append({
            "id": str(u.id),
            "name": u.name or u.email.split("@")[0],
            "email": u.email,
            "role": u.role,
            "level": u.level or "Level 5",
            "batch": u.batch or (u.batches[0] if getattr(u, "batches", None) else "Batch - 1"),
            "profile_image_url": u.profile_image_url,
            "is_online": is_actually_online,
            "last_seen_at": u.last_seen_at.isoformat() if u.last_seen_at else None,
            "last_login_at": u.last_login_at.isoformat() if u.last_login_at else None,
            "last_logout_at": u.last_logout_at.isoformat() if u.last_logout_at else None,
            "latest_action": latest_action,
            "latest_activity_type": latest_log.activity_type if latest_log else None,
            "latest_activity_time": latest_log.timestamp.isoformat() if (latest_log and latest_log.timestamp) else None
        })

    # Sort: Online users first, then by last_seen_at descending
    user_results.sort(key=lambda x: (x["is_online"], x["last_seen_at"] or ""), reverse=True)

    return user_results

@router.get("/ceo/summary")
async def get_activity_summary(current_user: models.User = Depends(get_current_user)):
    if current_user.role != "ceo":
        raise HTTPException(status_code=403, detail="Only CEO can access activity summary")

    now = (datetime.utcnow() + timedelta(hours=5, minutes=30))
    start_of_today = datetime(now.year, now.month, now.day)
    five_mins_ago = now - timedelta(minutes=5)

    # 1. Online Users Count
    online_students = await models.User.find({
        "role": "student",
        "is_online": True,
        "last_seen_at": {"$gte": five_mins_ago}
    }).count()

    online_staff = await models.User.find({
        "role": {"$in": ["staff", "ceo"]},
        "is_online": True,
        "last_seen_at": {"$gte": five_mins_ago}
    }).count()

    # 2. Total Logins Today
    logins_today = await models.UserActivityLog.find({
        "activity_type": "login",
        "timestamp": {"$gte": start_of_today}
    }).count()

    # 3. Total Actions Today
    total_actions_today = await models.UserActivityLog.find({
        "timestamp": {"$gte": start_of_today}
    }).count()

    # 4. Total Users Count
    total_students = await models.User.find({"role": "student"}).count()
    total_staff = await models.User.find({"role": "staff"}).count()

    return {
        "online_students": online_students,
        "online_staff": online_staff,
        "total_online": online_students + online_staff,
        "logins_today": logins_today,
        "total_actions_today": total_actions_today,
        "total_students": total_students,
        "total_staff": total_staff
    }

@router.delete("/ceo/logs")
async def clear_activity_logs(current_user: models.User = Depends(get_current_user)):
    if current_user.role != "ceo":
        raise HTTPException(status_code=403, detail="Only CEO can clear activity logs")

    await models.UserActivityLog.delete_all()
    return {"message": "All activity logs cleared successfully"}
