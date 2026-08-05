from fastapi import APIRouter, HTTPException, Depends
from models import CommunityMessage
from pydantic import BaseModel
from typing import List

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

@router.get("/messages", response_model=List[CommunityMessage])
async def get_messages():
    try:
        messages = await CommunityMessage.find_all().sort("created_at").to_list()
        return messages
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
