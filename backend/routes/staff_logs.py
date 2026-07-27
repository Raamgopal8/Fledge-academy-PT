from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from database import get_db
import models
from routes.auth import get_current_user
from pydantic import BaseModel

router = APIRouter()

class StaffLogCreate(BaseModel):
    action: str
    details: str = None

@router.get("")
async def get_staff_logs(db: AsyncSession = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role != "ceo":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only CEO can view staff logs"
        )
    
    result = await db.execute(select(models.StaffLog).order_by(desc(models.StaffLog.timestamp)))
    logs = result.scalars().all()
    
    # Enrich with staff name
    enriched_logs = []
    for log in logs:
        staff_result = await db.execute(select(models.User).filter(models.User.id == log.staff_id))
        staff = staff_result.scalars().first()
        staff_name = staff.name if staff else "Unknown Staff"
        enriched_logs.append({
            "id": log.id,
            "staff_id": log.staff_id,
            "staff_name": staff_name,
            "action": log.action,
            "details": log.details,
            "timestamp": log.timestamp
        })
        
    return enriched_logs

@router.post("")
async def create_staff_log(
    log_in: StaffLogCreate,
    db: AsyncSession = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role != "staff":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only staff can create staff logs"
        )
    
    new_log = models.StaffLog(
        staff_id=current_user.id,
        action=log_in.action,
        details=log_in.details
    )
    db.add(new_log)
    await db.commit()
    await db.refresh(new_log)
    return new_log

@router.delete("")
async def clear_staff_logs(
    db: AsyncSession = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role != "ceo":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only CEO can clear staff logs"
        )
    
    await db.execute(models.StaffLog.__table__.delete())
    await db.commit()
    return {"message": "All staff logs cleared successfully"}

