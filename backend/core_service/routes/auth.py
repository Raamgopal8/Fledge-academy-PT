import os
from datetime import datetime, timedelta
from typing import Optional, List

from fastapi import APIRouter, HTTPException, status, Depends
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel
import jwt
from dotenv import load_dotenv

import models

load_dotenv()

router = APIRouter()

SECRET_KEY = os.getenv("SECRET_KEY", "fledge_portal_super_secret_key_change_in_production")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "10080")) # 7 days

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/login")

class LoginRequest(BaseModel):
    username: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    role: str
    level: Optional[str] = None
    batch: Optional[str] = None
    batches: Optional[List[str]] = None
    name: Optional[str] = None
    email: Optional[str] = None
    profile_image_url: Optional[str] = None

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = (datetime.utcnow() + timedelta(hours=5, minutes=30)) + expires_delta
    else:
        expire = (datetime.utcnow() + timedelta(hours=5, minutes=30)) + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

import re
from beanie import PydanticObjectId

async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        uid: str = payload.get("uid")
        role: str = payload.get("role", "student")
        batch: str = payload.get("batch")
        batches: list = payload.get("batches", [])
        if email is None and uid is None:
            raise credentials_exception
    except jwt.PyJWTError:
        raise credentials_exception
    
    # 1. Try finding by database UID directly
    if uid:
        try:
            user = await models.User.get(PydanticObjectId(uid))
            if user:
                return user
        except Exception:
            pass

    # 2. Try finding by email (case-insensitive)
    if email:
        clean_email = email.strip()
        user = await models.User.find_one({
            "email": {"$regex": f"^{re.escape(clean_email)}$", "$options": "i"}
        })
        if user:
            return user
        
        user = await models.User.find_one(models.User.email == email)
        if user:
            return user

    # 3. Fallback to valid authenticated token identity
    user = models.User(
        email=email or "user@fledgeacademy.com",
        password="",
        role=role,
        batch=batch,
        batches=batches
    )
    if uid:
        try:
            user.id = PydanticObjectId(uid)
        except Exception:
            pass
            
    return user

@router.post("/login", response_model=Token)
async def login(request: LoginRequest):
    user = await models.User.find_one(models.User.email == request.username)
    
    if not user or user.password != request.password:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_batches = getattr(user, "batches", None) or ([user.batch] if getattr(user, "batch", None) else [])
    primary_batch = getattr(user, "batch", None) or (user_batches[0] if user_batches else None)

    # Track login timestamp and online status
    now = (datetime.utcnow() + timedelta(hours=5, minutes=30))
    user.last_login_at = now
    user.last_seen_at = now
    user.is_online = True
    await user.save()

    try:
        activity = models.UserActivityLog(
            user_id=user.id,
            user_name=user.name or user.email.split("@")[0],
            user_email=user.email,
            role=user.role,
            level=user.level,
            batch=primary_batch,
            activity_type="login",
            action=f"Logged into {user.role.capitalize()} Portal",
            timestamp=now
        )
        await activity.insert()
    except Exception as e:
        print("Error logging login activity:", e)

    normalized_role = "admin" if (user.role or "").lower() == "ceo" else ("sensi" if (user.role or "").lower() == "staff" else (user.role or "student").lower())
    if user.role != normalized_role:
        user.role = normalized_role
        await user.save()

    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={
            "sub": request.username, 
            "name": user.name or (user.email.split("@")[0].title() if user.email else "Student"),
            "role": normalized_role, 
            "uid": str(user.id), 
            "batch": primary_batch,
            "batches": user_batches
        }, 
        expires_delta=access_token_expires
    )
    return {
        "access_token": access_token, 
        "token_type": "bearer", 
        "role": normalized_role, 
        "level": user.level, 
        "batch": primary_batch,
        "batches": user_batches,
        "name": user.name,
        "email": user.email,
        "profile_image_url": user.profile_image_url
    }

class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str
    phone: Optional[str] = None
    dob: Optional[str] = None
    level: Optional[str] = "Level 5"
    batch: Optional[str] = "Batch - 1"
    terms_accepted: bool = True

@router.post("/register", response_model=Token)
async def register(request: RegisterRequest):
    clean_email = request.email.strip().lower()
    if not clean_email or "@" not in clean_email:
        raise HTTPException(status_code=400, detail="Please provide a valid email address.")
        
    if not request.password or len(request.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters long.")

    if not request.name or not request.name.strip():
        raise HTTPException(status_code=400, detail="Name is required.")

    if not request.terms_accepted:
        raise HTTPException(status_code=400, detail="You must accept the Terms of Service and Privacy Policy.")

    # Verify if email ID was pre-enrolled in database by CEO / Admin
    user = await models.User.find_one({
        "email": {"$regex": f"^{clean_email}$", "$options": "i"}
    })

    if not user:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your email is not enrolled in academy records. Please contact the admin at fledgeacademy@gmail.com."
        )

    # Override user record with the student's registered details
    user.name = request.name.strip()
    user.password = request.password
    if request.phone:
        user.phone = request.phone.strip()
    if request.dob:
        user.dob = request.dob.strip()
    user.terms_accepted = request.terms_accepted
    
    # Ensure role, level, batch defaults if not present
    if not getattr(user, "role", None):
        user.role = "student"
    if not getattr(user, "level", None):
        user.level = request.level or "Level 5"
    if not getattr(user, "batch", None):
        user.batch = request.batch or "Batch - 1"
    if not getattr(user, "batches", None) or len(user.batches) == 0:
        user.batches = [user.batch]

    now = (datetime.utcnow() + timedelta(hours=5, minutes=30))
    user.last_login_at = now
    user.last_seen_at = now
    user.is_online = True
    await user.save()

    user_batches = getattr(user, "batches", None) or ([user.batch] if getattr(user, "batch", None) else [])
    primary_batch = getattr(user, "batch", None) or (user_batches[0] if user_batches else None)

    try:
        activity = models.UserActivityLog(
            user_id=user.id,
            user_name=user.name or user.email.split("@")[0],
            user_email=user.email,
            role=user.role,
            level=user.level,
            batch=primary_batch,
            activity_type="login",
            action="Completed Account Registration & Logged In",
            timestamp=now
        )
        await activity.insert()
    except Exception as e:
        print("Error logging registration activity:", e)

    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={
            "sub": user.email, 
            "role": user.role, 
            "uid": str(user.id), 
            "batch": primary_batch,
            "batches": user_batches
        }, 
        expires_delta=access_token_expires
    )

    return {
        "access_token": access_token, 
        "token_type": "bearer", 
        "role": user.role, 
        "level": user.level, 
        "batch": primary_batch,
        "batches": user_batches,
        "name": user.name,
        "email": user.email,
        "profile_image_url": user.profile_image_url
    }

class FirebaseLoginRequest(BaseModel):
    email: str
    name: Optional[str] = None
    photo_url: Optional[str] = None
    firebase_uid: Optional[str] = None
    id_token: Optional[str] = None

@router.post("/firebase-login", response_model=Token)
@router.post("/auth/firebase-login", response_model=Token)
async def firebase_login(request: FirebaseLoginRequest):
    clean_email = request.email.strip().lower()
    if not clean_email or "@" not in clean_email:
        raise HTTPException(status_code=400, detail="Invalid email address from Google authentication.")

    # 1. Find existing user in MongoDB
    user = await models.User.find_one({
        "email": {"$regex": f"^{re.escape(clean_email)}$", "$options": "i"}
    })

    now = (datetime.utcnow() + timedelta(hours=5, minutes=30))

    if not user:
        # Create new user in MongoDB with Google details
        user = models.User(
            email=clean_email,
            password="",
            name=request.name or clean_email.split("@")[0].title(),
            profile_image_url=request.photo_url or "",
            role="student",
            level="Level 5",
            batch="Batch - 1",
            batches=["Batch - 1"],
            terms_accepted=True,
            last_login_at=now,
            last_seen_at=now,
            is_online=True
        )
        await user.insert()
    else:
        # Update user with Google profile image and login timestamp
        if request.photo_url and not user.profile_image_url:
            user.profile_image_url = request.photo_url
        if request.name and not user.name:
            user.name = request.name
        user.last_login_at = now
        user.last_seen_at = now
        user.is_online = True
        await user.save()

    user_batches = getattr(user, "batches", None) or ([user.batch] if getattr(user, "batch", None) else [])
    primary_batch = getattr(user, "batch", None) or (user_batches[0] if user_batches else None)

    # Activity Log
    try:
        activity = models.UserActivityLog(
            user_id=user.id,
            user_name=user.name or user.email.split("@")[0],
            user_email=user.email,
            role=user.role,
            level=user.level,
            batch=primary_batch,
            activity_type="login",
            action=f"Logged in via Google & Firebase Auth ({user.role.capitalize()} Portal)",
            timestamp=now
        )
        await activity.insert()
    except Exception as e:
        print("Error logging Google login activity:", e)

    normalized_role = "admin" if (user.role or "").lower() == "ceo" else ("sensi" if (user.role or "").lower() == "staff" else (user.role or "student").lower())
    if user.role != normalized_role:
        user.role = normalized_role
        await user.save()

    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={
            "sub": user.email,
            "name": user.name or (user.email.split("@")[0].title() if user.email else "Student"),
            "role": normalized_role,
            "uid": str(user.id),
            "batch": primary_batch,
            "batches": user_batches
        },
        expires_delta=access_token_expires
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": normalized_role,
        "level": user.level,
        "batch": primary_batch,
        "batches": user_batches,
        "name": user.name,
        "email": user.email,
        "profile_image_url": user.profile_image_url
    }

@router.post("/logout")
async def logout(current_user: models.User = Depends(get_current_user)):
    now = (datetime.utcnow() + timedelta(hours=5, minutes=30))
    db_user = None
    if getattr(current_user, "id", None):
        try:
            db_user = await models.User.get(current_user.id)
        except Exception:
            pass
    if not db_user and getattr(current_user, "email", None):
        db_user = await models.User.find_one(models.User.email == current_user.email)

    if db_user:
        db_user.last_logout_at = now
        db_user.last_seen_at = now
        db_user.is_online = False
        await db_user.save()

    primary_batch = getattr(current_user, "batch", None) or (current_user.batches[0] if getattr(current_user, "batches", None) else None)
    
    try:
        activity = models.UserActivityLog(
            user_id=getattr(current_user, "id", None),
            user_name=getattr(current_user, "name", None) or current_user.email.split("@")[0],
            user_email=current_user.email,
            role=current_user.role,
            level=getattr(current_user, "level", None),
            batch=primary_batch,
            activity_type="logout",
            action=f"Logged out of {current_user.role.capitalize()} Portal",
            timestamp=now
        )
        await activity.insert()
    except Exception as e:
        print("Error logging logout activity:", e)

    return {"message": "Logged out successfully"}
