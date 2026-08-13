import os
import shutil
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from beanie import PydanticObjectId
import models
import boto3
import uuid
from .auth import get_current_user

# R2 configuration
R2_ACCOUNT_ID = os.environ.get("R2_ACCOUNT_ID")
R2_ACCESS_KEY_ID = os.environ.get("R2_ACCESS_KEY_ID")
R2_SECRET_ACCESS_KEY = os.environ.get("R2_SECRET_ACCESS_KEY")
R2_BUCKET_NAME = os.environ.get("R2_BUCKET_NAME")
R2_PUBLIC_URL = os.environ.get("R2_PUBLIC_URL")

s3_client = boto3.client(
    service_name="s3",
    endpoint_url=f"https://{R2_ACCOUNT_ID}.r2.cloudflarestorage.com",
    aws_access_key_id=R2_ACCESS_KEY_ID,
    aws_secret_access_key=R2_SECRET_ACCESS_KEY,
    region_name="auto",
) if R2_ACCOUNT_ID else None

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
            "level": m.level,
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
    level: Optional[str] = Form(None),
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
    
    if file and file.filename:
        if s3_client and R2_BUCKET_NAME and R2_PUBLIC_URL:
            # Save to Cloudflare R2
            unique_filename = f"{uuid.uuid4()}-{file.filename}"
            s3_client.upload_fileobj(
                file.file,
                R2_BUCKET_NAME,
                unique_filename,
                ExtraArgs={"ContentType": file.content_type}
            )
            file_url = f"{R2_PUBLIC_URL.rstrip('/')}/{unique_filename}"
        else:
            # Fallback to local disk
            file_path = os.path.join(UPLOAD_DIR, file.filename)
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
            file_url = f"/uploads/{file.filename}"
    elif link:
        file_url = link
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Must provide either a file or a valid link"
        )
    
    new_material = models.Material(
        title=title,
        description=description,
        level=level,
        file_url=file_url,
        uploaded_by_id=current_user.id
    )
    
    await new_material.insert()
    
    return {
        "id": str(new_material.id),
        "title": new_material.title,
        "description": new_material.description,
        "level": new_material.level,
        "file_url": new_material.file_url,
        "uploaded_by_id": str(new_material.uploaded_by_id),
        "created_at": new_material.created_at.isoformat() if new_material.created_at else None
    }

@router.delete("/{material_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_material(
    material_id: str,
    current_user: models.User = Depends(get_current_user)
):
    """Delete a material (restricted to staff and ceo)"""
    if current_user.role not in ["staff", "ceo"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete materials"
        )
        
    try:
        obj_id = PydanticObjectId(material_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid material ID")

    material = await models.Material.get(obj_id)
    
    if not material:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Material not found"
        )
        
    # Optional: Delete the actual file from disk or R2
    if material.file_url and not material.file_url.startswith("http"):
        filename = material.file_url.replace("/uploads/", "")
        file_path = os.path.join(UPLOAD_DIR, filename)
        if os.path.exists(file_path):
            os.remove(file_path)
    elif material.file_url and R2_PUBLIC_URL and material.file_url.startswith(R2_PUBLIC_URL.rstrip('/')):
        filename = material.file_url.replace(f"{R2_PUBLIC_URL.rstrip('/')}/", "")
        if s3_client and R2_BUCKET_NAME:
            try:
                s3_client.delete_object(Bucket=R2_BUCKET_NAME, Key=filename)
            except Exception as e:
                print(f"Failed to delete object from R2: {e}")
            
    await material.delete()
    return None
