import uuid

from pydantic import BaseModel, EmailStr, Field

from src.models.user import UserRole


class UserRegister(BaseModel):
    email: EmailStr = Field(
        description="Valid email address",
    )
    username: str = Field(
        min_length=3,
        max_length=50,
        pattern=r"^[a-zA-Z0-9_-]+$",
        description="Username (alphanumeric, underscores, hyphens only)",
    )
    password: str = Field(
        min_length=6,
        description="Password must be at least 6 characters long",
    )
    role: UserRole | None = Field(
        default=UserRole.USER,
        description="Role of the user (admin or user). Defaults to user.",
    )


class UserLogin(BaseModel):
    username_or_email: str = Field(
        min_length=3,
        description="Username or email address",
    )
    password: str = Field(
        min_length=1,
        description="User password",
    )


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    user_id: uuid.UUID | None = None
    username: str | None = None
    role: str | None = None

class TokenRefresh(BaseModel):
    token : str
