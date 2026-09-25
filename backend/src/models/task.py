import enum
import uuid
from datetime import UTC, date, datetime

from sqlmodel import Field, Relationship, SQLModel

from src.models.user import User


class TaskStatus(str, enum.Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"


class TaskPriority(str, enum.Enum):
    HIGH = "HIGH"
    MED = "MED"
    LOW = "LOW"


class Task(SQLModel, table=True):
    __tablename__ = "tasks"

    id: int | None = Field(default=None, primary_key=True, index=True)
    title: str = Field(max_length=200, nullable=False)
    description: str | None = Field(default=None, max_length=2000, nullable=True)
    status: TaskStatus = Field(default=TaskStatus.PENDING, nullable=False)
    priority: TaskPriority = Field(default=TaskPriority.MED, nullable=False)
    tag: str | None = Field(default=None, max_length=100, nullable=True)
    due_date: date | None = Field(default=None, nullable=True)
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(UTC),
        nullable=False,
    )
    updated_at: datetime | None = Field(
        default_factory=lambda: datetime.now(UTC),
        nullable=True,
    )
    user_id: uuid.UUID = Field(
        foreign_key="users.id",
        nullable=False,
        index=True,
        ondelete="CASCADE",
    )

    # Relationships
    owner: User | None = Relationship(back_populates="tasks")

    def __repr__(self) -> str:
        return f"<Task id={self.id} title='{self.title}' status={self.status} user_id={self.user_id}>"


