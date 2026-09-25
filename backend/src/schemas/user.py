import uuid
from datetime import datetime

from pydantic import BaseModel, EmailStr, Field

from src.models.user import UserRole


class UserCreate(BaseModel):
    email: EmailStr
    username: str = Field(min_length=3, max_length=50, pattern=r"^[a-zA-Z0-9_-]+$")
    password: str = Field(min_length=6)
    role: UserRole = Field(default=UserRole.USER)


class UserUpdate(BaseModel):
    email: EmailStr | None = None
    username: str | None = Field(default=None, min_length=3, max_length=50, pattern=r"^[a-zA-Z0-9_-]+$")
    password: str | None = Field(default=None, min_length=6)
    role: UserRole | None = None


class UserResponse(BaseModel):
    id: uuid.UUID
    username: str
    email: EmailStr
    role: UserRole
    created_at: datetime


class MessageResponse(BaseModel):
    message: str
