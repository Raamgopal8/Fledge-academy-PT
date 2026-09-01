import os
import io
import re
import uuid
import mimetypes
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
# pyrefly: ignore [missing-import]
from fastapi.responses import StreamingResponse, RedirectResponse
# pyrefly: ignore [missing-import]
from beanie import PydanticObjectId
import models
import boto3
from botocore.config import Config
from botocore.exceptions import ClientError
from dotenv import load_dotenv
from .auth import get_current_user

load_dotenv()

# Cloudflare R2 Configuration
R2_ACCOUNT_ID = os.environ.get("R2_ACCOUNT_ID")
R2_ACCESS_KEY_ID = os.environ.get("R2_ACCESS_KEY_ID")
R2_SECRET_ACCESS_KEY = os.environ.get("R2_SECRET_ACCESS_KEY")
R2_BUCKET_NAME = os.environ.get("R2_BUCKET_NAME", "fledgedocuments")
R2_PUBLIC_URL = os.environ.get("R2_PUBLIC_URL")
S3_API_URL = os.environ.get("S3API")

if S3_API_URL and not R2_ACCOUNT_ID:
    match = re.search(r"https://([a-zA-Z0-9_-]+)\.r2\.cloudflarestorage\.com(?:/([a-zA-Z0-9_-]+))?", S3_API_URL)
    if match:
        R2_ACCOUNT_ID = match.group(1)
        if match.group(2) and not R2_BUCKET_NAME:
            R2_BUCKET_NAME = match.group(2)

def get_s3_client():
    if not R2_ACCOUNT_ID or not R2_ACCESS_KEY_ID or not R2_SECRET_ACCESS_KEY:
        return None
    try:
        return boto3.client(
            service_name="s3",
            endpoint_url=f"https://{R2_ACCOUNT_ID}.r2.cloudflarestorage.com",
            aws_access_key_id=R2_ACCESS_KEY_ID,
            aws_secret_access_key=R2_SECRET_ACCESS_KEY,
            region_name="auto",
            config=Config(signature_version="s3v4")
        )
    except Exception as e:
        print(f"Error initializing Cloudflare R2 client in core: {e}")
        return None

router = APIRouter()

@router.get("", response_model=List[dict])
@router.get("/", response_model=List[dict])
async def get_materials(
    level: Optional[str] = None, 
    batch: Optional[str] = None, 
    current_user: models.User = Depends(get_current_user)
):
    """Fetch all materials"""
    conditions = []
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
    if batch and batch.strip().lower() not in ["all batches", "all assigned batches", "global", "global access", "all"]:
        clean_batch = batch.strip()
        conditions.append({
            "$or": [
                {"batch": {"$regex": f"^{clean_batch}$", "$options": "i"}},
                {"batch": {"$regex": "^all batches$", "$options": "i"}},
                {"batch": {"$regex": "^all$", "$options": "i"}},
                {"batch": {"$regex": "^global$", "$options": "i"}},
                {"batch": None},
                {"batch": ""}
            ]
        })
        
    query = {"$and": conditions} if conditions else {}
    materials = await models.Material.find(query).sort("-created_at").to_list()
    
    return [
        {
            "id": str(m.id),
            "title": m.title,
            "description": m.description,
            "level": m.level,
            "batch": m.batch,
            "file_url": m.file_url,
            "uploaded_by_id": str(m.uploaded_by_id),
            "created_at": m.created_at.isoformat() if m.created_at else None
        }
        for m in materials
    ]

@router.post("", response_model=dict)
@router.post("/", response_model=dict)
async def upload_material(
    title: str = Form(...),
    description: Optional[str] = Form(None),
    level: Optional[str] = Form(None),
    batch: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
    link: Optional[str] = Form(None),
    current_user: models.User = Depends(get_current_user)
):
    """Upload material directly to Cloudflare R2 bucket"""
    user_role = (current_user.role or "").lower()
    if user_role not in ["staff", "sensi", "ceo", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to upload materials"
        )
        
    if not file and not link:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Must provide either a file or a link"
        )
    
    file_url = ""
    if file and file.filename:
        s3 = get_s3_client()
        if not s3 or not R2_BUCKET_NAME:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Cloudflare R2 storage credentials (R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_ACCOUNT_ID) are not configured."
            )
        
        raw_name = os.path.basename(file.filename)
        clean_name = re.sub(r'[^a-zA-Z0-9_.-]', '_', raw_name)
        s3_key = f"materials/{uuid.uuid4()}-{clean_name}"
        
        content_type = file.content_type
        if not content_type or content_type == "application/octet-stream":
            content_type, _ = mimetypes.guess_type(raw_name)
            content_type = content_type or "application/octet-stream"

        try:
            file_bytes = await file.read()
            s3.put_object(
                Bucket=R2_BUCKET_NAME,
                Key=s3_key,
                Body=file_bytes,
                ContentType=content_type,
                ContentDisposition=f'inline; filename="{clean_name}"'
            )
            
            if R2_PUBLIC_URL and R2_PUBLIC_URL.strip():
                file_url = f"{R2_PUBLIC_URL.strip().rstrip('/')}/{s3_key}"
            else:
                file_url = f"/api/materials/file/{s3_key}"
        except ClientError as ce:
            print(f"Cloudflare R2 Upload Error: {ce}")
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Failed to upload file to Cloudflare R2: {ce.response['Error']['Message']}"
            )
        except Exception as e:
            print(f"Unexpected upload error: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error uploading document to Cloudflare R2 storage."
            )
    elif link:
        file_url = link.strip()
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Must provide either a file or a valid link"
        )
    
    new_material = models.Material(
        title=title.strip(),
        description=description.strip() if description else None,
        level=level,
        batch=batch,
        file_url=file_url,
        uploaded_by_id=current_user.id
    )
    
    await new_material.insert()
    
    return {
        "id": str(new_material.id),
        "title": new_material.title,
        "description": new_material.description,
        "level": new_material.level,
        "batch": new_material.batch,
        "file_url": new_material.file_url,
        "uploaded_by_id": str(new_material.uploaded_by_id),
        "created_at": new_material.created_at.isoformat() if new_material.created_at else None
    }

@router.get("/file/{file_path:path}")
async def serve_r2_file(file_path: str):
    """Directly stream or redirect material file from Cloudflare R2"""
    s3 = get_s3_client()
    if not s3 or not R2_BUCKET_NAME:
        raise HTTPException(status_code=500, detail="Cloudflare R2 is not configured")
    
    clean_key = file_path.lstrip("/")
    
    if R2_PUBLIC_URL and R2_PUBLIC_URL.strip():
        return RedirectResponse(url=f"{R2_PUBLIC_URL.strip().rstrip('/')}/{clean_key}")
    
    try:
        obj = s3.get_object(Bucket=R2_BUCKET_NAME, Key=clean_key)
        body = obj['Body'].read()
        content_type = obj.get('ContentType', 'application/octet-stream')
        filename = os.path.basename(clean_key)
        
        return StreamingResponse(
            io.BytesIO(body),
            media_type=content_type,
            headers={
                "Content-Disposition": f'inline; filename="{filename}"',
                "Cache-Control": "public, max-age=86400"
            }
        )
    except ClientError as e:
        if e.response['Error']['Code'] == 'NoSuchKey':
            raise HTTPException(status_code=404, detail="Material file not found on Cloudflare R2")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{material_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_material(
    material_id: str,
    current_user: models.User = Depends(get_current_user)
):
    """Delete a material from database and Cloudflare R2"""
    user_role = (current_user.role or "").lower()
    if user_role not in ["staff", "sensi", "ceo", "admin"]:
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
        
    s3 = get_s3_client()
    if s3 and R2_BUCKET_NAME and material.file_url:
        s3_key = None
        if "/api/materials/file/" in material.file_url:
            s3_key = material.file_url.split("/api/materials/file/")[1]
        elif R2_PUBLIC_URL and material.file_url.startswith(R2_PUBLIC_URL.rstrip('/')):
            s3_key = material.file_url.replace(f"{R2_PUBLIC_URL.rstrip('/')}/", "")
            
        if s3_key:
            try:
                s3.delete_object(Bucket=R2_BUCKET_NAME, Key=s3_key)
            except Exception as e:
                print(f"Failed to delete object {s3_key} from Cloudflare R2: {e}")
            
    await material.delete()
    return None
