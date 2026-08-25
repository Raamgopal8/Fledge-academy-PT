import os
from typing import Optional, List
from fastapi import HTTPException, status, Depends
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel
import jwt
from dotenv import load_dotenv

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM", "HS256")

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="http://localhost:8000/api/login")

class DummyUser(BaseModel):
    id: str
    email: str
    role: str
    batch: Optional[str] = None
    batches: Optional[List[str]] = []

async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        role: str = payload.get("role", "student")
        uid: str = payload.get("uid") or ""
        batch: str = payload.get("batch")
        batches = payload.get('batches') or ([batch] if batch else [])
        if not email and not uid:
            raise credentials_exception
        return DummyUser(id=uid or email, email=email or "user@fledgeacademy.com", role=role, batch=batch, batches=batches)
    except jwt.PyJWTError:
        raise credentials_exception
