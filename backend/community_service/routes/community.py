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
    role: str

@router.post("/messages", response_model=CommunityMessage)
async def create_message(msg: MessageCreate):
    try:
        new_msg = CommunityMessage(
            content=msg.content,
            author_id=msg.author_id,
            author_name=msg.author_name,
            role=msg.role
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
    role: str = Form(...)
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
            role=role
        )
        await new_msg.insert()
        return new_msg
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/messages", response_model=List[CommunityMessage])
async def get_messages():
    try:
        messages = await CommunityMessage.find_all().sort("created_at").to_list()
        return messages
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

