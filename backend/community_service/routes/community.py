from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form
from models import CommunityMessage
from pydantic import BaseModel
from typing import List, Optional
import os
import shutil
import uuid

router = APIRouter()

class MessageCreate(BaseModel):
    content: str
    author_id: str
    author_name: str
    author_image: Optional[str] = None
    role: str
    level: Optional[str] = None
    batch: Optional[str] = None

@router.post("/messages", response_model=CommunityMessage)
async def create_message(msg: MessageCreate):
    try:
        new_msg = CommunityMessage(
            content=msg.content,
            author_id=msg.author_id,
            author_name=msg.author_name,
            author_image=msg.author_image,
            role=msg.role,
            level=msg.level,
            batch=msg.batch
        )
        await new_msg.insert()
        return new_msg
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/messages/audio", response_model=CommunityMessage)
async def create_audio_message(
    audio_file: UploadFile = File(...),
    author_id: str = Form(...),
    author_name: str = Form(...),
    author_image: Optional[str] = Form(None),
    role: str = Form(...),
    level: Optional[str] = Form(None),
    batch: Optional[str] = Form(None)
):
    try:
        # Save the audio file
        file_ext = audio_file.filename.split(".")[-1] if "." in audio_file.filename else "webm"
        unique_filename = f"{uuid.uuid4()}.{file_ext}"
        file_path = os.path.join("uploads", unique_filename)
        
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(audio_file.file, buffer)
            
        audio_url = f"http://localhost:8009/uploads/{unique_filename}"
        
        new_msg = CommunityMessage(
            audio_url=audio_url,
            author_id=author_id,
            author_name=author_name,
            author_image=author_image,
            role=role,
            level=level,
            batch=batch
        )
        await new_msg.insert()
        return new_msg
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
        return messages
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

