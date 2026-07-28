from fastapi import APIRouter, Depends, HTTPException, status
import models
from routes.auth import get_current_user
from pydantic import BaseModel

router = APIRouter()

class StaffLogCreate(BaseModel):
    action: str
    details: str = None

@router.get("")
async def get_staff_logs(current_user: models.User = Depends(get_current_user)):
    if current_user.role != "ceo":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only CEO can view staff logs"
        )
    
    logs = await models.StaffLog.find_all().sort("-timestamp").to_list()
    
    # Enrich with staff name
    enriched_logs = []
    for log in logs:
        staff = await models.User.get(log.staff_id)
        staff_name = staff.name if staff else "Unknown Staff"
        enriched_logs.append({
            "id": str(log.id),
            "staff_id": str(log.staff_id),
            "staff_name": staff_name,
            "action": log.action,
            "details": log.details,
            "timestamp": log.timestamp
        })
        
    return enriched_logs

@router.post("")
async def create_staff_log(
    log_in: StaffLogCreate,
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
    await new_log.insert()
    return new_log

@router.delete("")
async def clear_staff_logs(
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role != "ceo":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only CEO can clear staff logs"
        )
    
    await models.StaffLog.delete_all()
    return {"message": "All staff logs cleared successfully"}

