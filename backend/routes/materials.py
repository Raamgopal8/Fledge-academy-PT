import os
import shutil
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from database import get_db
import models
from .auth import get_current_user

router = APIRouter()

# Ensure uploads directory exists
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.get("/", response_model=List[dict])
async def get_materials(db: AsyncSession = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    """Fetch all materials (accessible by all authenticated users)"""
    result = await db.execute(select(models.Material).order_by(models.Material.created_at.desc()))
    materials = result.scalars().all()
    
    return [
        {
            "id": m.id,
            "title": m.title,
            "description": m.description,
            "file_url": m.file_url,
            "uploaded_by_id": m.uploaded_by_id,
            "created_at": m.created_at.isoformat() if m.created_at else None
        }
        for m in materials
    ]

@router.post("/", response_model=dict)
async def upload_material(
    title: str = Form(...),
    description: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
    link: Optional[str] = Form(None),
    db: AsyncSession = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Upload a new material (restricted to staff and ceo)"""
    if current_user.role not in ["staff", "ceo"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to upload materials"
        )
        
    if not file and not link:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Must provide either a file or a link"
        )
    
    if file:
        # Save the file
        file_path = os.path.join(UPLOAD_DIR, file.filename)
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        file_url = f"/uploads/{file.filename}"
    else:
        file_url = link
    
    new_material = models.Material(
        title=title,
        description=description,
        file_url=file_url,
        uploaded_by_id=current_user.id
    )
    
    db.add(new_material)
    await db.commit()
    await db.refresh(new_material)
    
    return {
        "id": new_material.id,
        "title": new_material.title,
        "description": new_material.description,
        "file_url": new_material.file_url,
        "uploaded_by_id": new_material.uploaded_by_id,
        "created_at": new_material.created_at.isoformat() if new_material.created_at else None
    }

@router.delete("/{material_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_material(
    material_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Delete a material (restricted to staff and ceo)"""
    if current_user.role not in ["staff", "ceo"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete materials"
        )
        
    result = await db.execute(select(models.Material).filter(models.Material.id == material_id))
    material = result.scalars().first()
    
    if not material:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Material not found"
        )
        
    # Optional: Delete the actual file from disk
    if material.file_url and not material.file_url.startswith("http"):
        filename = material.file_url.replace("/uploads/", "")
        file_path = os.path.join(UPLOAD_DIR, filename)
        if os.path.exists(file_path):
            os.remove(file_path)
            
    await db.delete(material)
    await db.commit()
    return None
