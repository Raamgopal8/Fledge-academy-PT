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
        
        await msg.delete()
        return {"message": "Message deleted successfully", "id": message_id}
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
