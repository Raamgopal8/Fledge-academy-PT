import os
import shutil
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from beanie import PydanticObjectId
import models
from .auth import get_current_user

router = APIRouter()

# Ensure uploads directory exists
UPLOAD_DIR = "/tmp/uploads" if os.environ.get("VERCEL") else "uploads"
try:
    os.makedirs(UPLOAD_DIR, exist_ok=True)
except OSError:
    # Fallback to /tmp if we are on a read-only filesystem but VERCEL env var isn't set
    UPLOAD_DIR = "/tmp/uploads"
    os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.get("/", response_model=List[dict])
async def get_materials(current_user: models.User = Depends(get_current_user)):
    """Fetch all materials (accessible by all authenticated users)"""
    materials = await models.Material.find_all().sort("-created_at").to_list()
    
    return [
        {
            "id": str(m.id),
            "title": m.title,
            "description": m.description,
            "file_url": m.file_url,
            "uploaded_by_id": str(m.uploaded_by_id),
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
    
    await new_material.insert()
    
    return {
        "id": str(new_material.id),
        "title": new_material.title,
        "description": new_material.description,
        "file_url": new_material.file_url,
        "uploaded_by_id": str(new_material.uploaded_by_id),
        "created_at": new_material.created_at.isoformat() if new_material.created_at else None
    }

@router.delete("/{material_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_material(
    material_id: PydanticObjectId,
    current_user: models.User = Depends(get_current_user)
):
    """Delete a material (restricted to staff and ceo)"""
    if current_user.role not in ["staff", "ceo"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete materials"
        )
        
    material = await models.Material.get(material_id)
    
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
            
    await material.delete()
    return None
