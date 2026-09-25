import uuid
from datetime import UTC, datetime
from enum import Enum

from sqlmodel import Field, Relationship, SQLModel


class UserRole(str, Enum):
    ADMIN = "admin"
    USER = "user"


class User(SQLModel, table=True):
    __tablename__ = "users"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True, index=True)
    username: str = Field(max_length=50, unique=True, index=True, nullable=False)
    email: str = Field(max_length=255, unique=True, index=True, nullable=False)
    hashed_password: str = Field(nullable=False)
    role: UserRole = Field(default=UserRole.USER, nullable=False)
    created_at: datetime = Field(default=datetime.now(UTC), nullable=False)

    # Relationships
    tasks: list["Task"] = Relationship(back_populates="owner", cascade_delete=True)



