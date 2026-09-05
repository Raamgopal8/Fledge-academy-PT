from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form
from models import CommunityMessage
from pydantic import BaseModel
from typing import List, Optional
from beanie import PydanticObjectId
from datetime import datetime, timedelta
import os
import shutil
import uuid
import base64

router = APIRouter()

def normalize_role(r: str) -> str:
    clean = (r or "student").lower()
    if clean in ["ceo", "admin"]:
        return "Admin"
    elif clean in ["staff", "sensi"]:
        return "Sensi"
    return "Student"

class MessageCreate(BaseModel):
    content: str
    author_id: str
    author_name: str
    author_image: Optional[str] = None
    role: str
    level: Optional[str] = None
    batch: Optional[str] = None

class MessageUpdate(BaseModel):
    content: str

@router.post("/messages", response_model=CommunityMessage)
async def create_message(msg: MessageCreate):
    try:
        new_msg = CommunityMessage(
            content=msg.content,
            author_id=msg.author_id,
            author_name=msg.author_name,
            author_image=msg.author_image,
            role=normalize_role(msg.role),
            level=msg.level,
            batch=msg.batch
        )
        await new_msg.insert()
        return new_msg
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/messages/{message_id}", response_model=CommunityMessage)
async def update_message(message_id: str, update: MessageUpdate):
    try:
        msg = None
        try:
            msg = await CommunityMessage.get(PydanticObjectId(message_id))
        except Exception:
            pass
        if not msg:
            msg = await CommunityMessage.find_one({"_id": message_id})
        if not msg:
            raise HTTPException(status_code=404, detail="Message not found")
        
        msg.content = update.content
        msg.is_edited = True
        msg.edited_at = datetime.utcnow() + timedelta(hours=5, minutes=30)
        await msg.save()
        return msg
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

def extract_r2_key(media_url: Optional[str]) -> Optional[str]:
    if not media_url:
        return None
    if "/community/" in media_url:
        # Extract from /community/...
        parts = media_url.split("/community/")
        if len(parts) > 1:
            return f"community/{parts[1].split('?')[0]}"
    if R2_PUBLIC_URL and media_url.startswith(R2_PUBLIC_URL.rstrip('/')):
        return media_url.replace(f"{R2_PUBLIC_URL.rstrip('/')}/", "").split('?')[0]
    return None

@router.delete("/messages/{message_id}")
async def delete_message(message_id: str):
    try:
        msg = None
        try:
            msg = await CommunityMessage.get(PydanticObjectId(message_id))
        except Exception:
            pass
        if not msg:
            msg = await CommunityMessage.find_one({"_id": message_id})
        if not msg:
            raise HTTPException(status_code=404, detail="Message not found")
        
        # If message has an image or document in Cloudflare R2, delete it
        if msg.media_url:
            s3_key = extract_r2_key(msg.media_url)
            if s3_key:
                s3 = get_s3_client()
                if s3 and R2_BUCKET_NAME:
                    try:
                        s3.delete_object(Bucket=R2_BUCKET_NAME, Key=s3_key)
                    except Exception as ce:
                        print(f"Failed to delete Cloudflare R2 object {s3_key}: {ce}")
            elif msg.media_url.startswith("/uploads/"):
                # Clean up local upload fallback
                local_path = msg.media_url.lstrip("/")
                if os.path.exists(local_path):
                    try:
                        os.remove(local_path)
                    except Exception as le:
                        print(f"Failed to remove local file {local_path}: {le}")

        await msg.delete()
        return {"message": "Message and associated media deleted successfully", "id": message_id}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/messages/audio", response_model=CommunityMessage)
@router.post("/audio", response_model=CommunityMessage)
async def create_audio_message(
    audio_file: Optional[UploadFile] = File(None),
    audio: Optional[UploadFile] = File(None),
    author_id: str = Form("Anonymous"),
    author_name: str = Form("Anonymous"),
    author_image: Optional[str] = Form(None),
    role: str = Form("user"),
    level: Optional[str] = Form(None),
    batch: Optional[str] = Form(None)
):
    try:
        target_file = audio_file or audio
        if not target_file:
            raise HTTPException(status_code=400, detail="No audio file provided.")

        contents = await target_file.read()
        if not contents:
            raise HTTPException(status_code=400, detail="Empty audio file.")

        # Encode to high-reliability base64 data URI for instant and persistent cross-cloud playback
        mime_type = target_file.content_type or "audio/webm"
        b64_audio = base64.b64encode(contents).decode("utf-8")
        audio_url = f"data:{mime_type};base64,{b64_audio}"

        new_msg = CommunityMessage(
            audio_url=audio_url,
            author_id=author_id,
            author_name=author_name,
            author_image=author_image,
            role=normalize_role(role),
            level=level,
            batch=batch
        )
        await new_msg.insert()
        return new_msg
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

import mimetypes
import re
from dotenv import load_dotenv
import boto3
from botocore.client import Config
from botocore.exceptions import ClientError

load_dotenv()

# Cloudflare R2 Configuration
R2_ACCOUNT_ID = os.environ.get("R2_ACCOUNT_ID")
R2_ACCESS_KEY_ID = os.environ.get("R2_ACCESS_KEY_ID")
R2_SECRET_ACCESS_KEY = os.environ.get("R2_SECRET_ACCESS_KEY")
R2_BUCKET_NAME = os.environ.get("R2_BUCKET_NAME", "fledgedocuments")
R2_PUBLIC_URL = os.environ.get("R2_PUBLIC_URL")
S3_API_URL = os.environ.get("S3API")

# Parse S3API if provided
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
        print(f"Error initializing Cloudflare R2 client in community service: {e}")
        return None

@router.post("/messages/upload", response_model=CommunityMessage)
@router.post("/upload", response_model=CommunityMessage)
async def upload_community_media(
    file: UploadFile = File(...),
    content: Optional[str] = Form(None),
    caption: Optional[str] = Form(None),
    author_id: str = Form("Anonymous"),
    author_name: str = Form("Anonymous"),
    author_image: Optional[str] = Form(None),
    role: str = Form("user"),
    level: Optional[str] = Form(None),
    batch: Optional[str] = Form(None)
):
    try:
        if not file or not file.filename:
            raise HTTPException(status_code=400, detail="No file uploaded.")

        file_bytes = await file.read()
        file_size = len(file_bytes)
        if file_size == 0:
            raise HTTPException(status_code=400, detail="Uploaded file is empty.")

        # Determine media type: image vs document
        content_type = file.content_type or ""
        raw_name = os.path.basename(file.filename)
        clean_name = re.sub(r'[^a-zA-Z0-9_.-]', '_', raw_name)
        
        if not content_type or content_type == "application/octet-stream":
            guessed_type, _ = mimetypes.guess_type(raw_name)
            content_type = guessed_type or "application/octet-stream"

        is_image = content_type.startswith("image/")
        media_type = "image" if is_image else "document"

        s3 = get_s3_client()
        media_url = ""

        if s3 and R2_BUCKET_NAME:
            s3_key = f"community/{uuid.uuid4()}-{clean_name}"
            try:
                s3.put_object(
                    Bucket=R2_BUCKET_NAME,
                    Key=s3_key,
                    Body=file_bytes,
                    ContentType=content_type,
                    ContentDisposition=f'inline; filename="{clean_name}"'
                )
                if R2_PUBLIC_URL and R2_PUBLIC_URL.strip():
                    media_url = f"{R2_PUBLIC_URL.strip().rstrip('/')}/{s3_key}"
                else:
                    media_url = f"https://{R2_BUCKET_NAME}.r2.cloudflarestorage.com/{s3_key}"
            except ClientError as ce:
                print(f"Cloudflare R2 upload error in community service: {ce}")
                raise HTTPException(status_code=502, detail=f"Cloudflare R2 upload failed: {str(ce)}")
        else:
            # Fallback to local uploads if R2 is not configured
            os.makedirs("uploads/community", exist_ok=True)
            local_filename = f"{uuid.uuid4()}-{clean_name}"
            local_path = os.path.join("uploads/community", local_filename)
            with open(local_path, "wb") as f:
                f.write(file_bytes)
            media_url = f"/uploads/community/{local_filename}"

        text_content = (caption or content or "").strip()

        new_msg = CommunityMessage(
            content=text_content if text_content else None,
            media_url=media_url,
            media_type=media_type,
            file_name=raw_name,
            file_size=file_size,
            author_id=author_id,
            author_name=author_name,
            author_image=author_image,
            role=normalize_role(role),
            level=level,
            batch=batch
        )
        await new_msg.insert()
        return new_msg
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in upload_community_media: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/messages", response_model=List[CommunityMessage])
async def get_messages(level: Optional[str] = None, batch: Optional[str] = None):
    try:
        query = {}
        if level:
            query["level"] = level
        if batch:
            query["batch"] = batch
        messages = await CommunityMessage.find(query).sort("+created_at").to_list()
        for m in messages:
            m.role = normalize_role(m.role)
        return messages
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/messages")
async def clear_all_messages(
    level: Optional[str] = None,
    batch: Optional[str] = None,
    role: Optional[str] = None,
    user_id: Optional[str] = None
):
    """
    Clear all messages for the specified level/batch, including purging 
    all uploaded images/documents from Cloudflare R2 storage account.
    Applicable only to Admin and Sensi roles.
    """
    normalized_role = normalize_role(role or "")
    if normalized_role not in ["Admin", "Sensi"]:
        raise HTTPException(
            status_code=403, 
            detail="Permission denied. Only Sensi and Admin roles can clear community messages."
        )

    try:
        query = {}
        if level:
            query["level"] = level
        if batch:
            query["batch"] = batch

        # Find all messages matching filter
        matching_messages = await CommunityMessage.find(query).to_list()
        if not matching_messages:
            return {
                "message": "No messages found to clear.",
                "deleted_count": 0,
                "deleted_files_count": 0
            }

        # 1. Collect all Cloudflare R2 S3 keys from media_url
        r2_keys_to_delete = []
        local_files_to_delete = []

        for msg in matching_messages:
            if msg.media_url:
                s3_key = extract_r2_key(msg.media_url)
                if s3_key:
                    r2_keys_to_delete.append(s3_key)
                elif msg.media_url.startswith("/uploads/"):
                    local_path = msg.media_url.lstrip("/")
                    if os.path.exists(local_path):
                        local_files_to_delete.append(local_path)

        # 2. Bulk delete from Cloudflare R2 storage
        deleted_r2_count = 0
        if r2_keys_to_delete:
            s3 = get_s3_client()
            if s3 and R2_BUCKET_NAME:
                # S3 delete_objects supports up to 1000 objects per call
                chunk_size = 1000
                for i in range(0, len(r2_keys_to_delete), chunk_size):
                    chunk = r2_keys_to_delete[i:i + chunk_size]
                    try:
                        delete_payload = {'Objects': [{'Key': k} for k in chunk], 'Quiet': True}
                        s3.delete_objects(Bucket=R2_BUCKET_NAME, Delete=delete_payload)
                        deleted_r2_count += len(chunk)
                    except Exception as s3_err:
                        print(f"Error bulk deleting from Cloudflare R2: {s3_err}")
                        # Fallback to single deletions
                        for key in chunk:
                            try:
                                s3.delete_object(Bucket=R2_BUCKET_NAME, Key=key)
                                deleted_r2_count += 1
                            except Exception:
                                pass

        # 3. Clean local fallback files if any
        for l_path in local_files_to_delete:
            try:
                os.remove(l_path)
            except Exception:
                pass

        # 4. Delete all messages from MongoDB database
        delete_result = await CommunityMessage.find(query).delete()
        total_deleted = delete_result.deleted_count if hasattr(delete_result, 'deleted_count') else len(matching_messages)

        return {
            "message": "All messages and Cloudflare files cleared successfully.",
            "deleted_count": total_deleted,
            "deleted_files_count": deleted_r2_count + len(local_files_to_delete)
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in clear_all_messages: {e}")
        raise HTTPException(status_code=500, detail=str(e))


