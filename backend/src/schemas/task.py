import uuid
from datetime import date, datetime

from pydantic import BaseModel, Field

from src.models.task import TaskPriority, TaskStatus


class TaskCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    description: str | None = Field(default=None, max_length=2000)
    status: TaskStatus = Field(default=TaskStatus.PENDING)
    priority: TaskPriority = Field(default=TaskPriority.MED)
    tag: str | None = Field(default=None, max_length=100)
    due_date: date | None = Field(default=None)
    user_id: uuid.UUID | None = Field(default=None)


class TaskUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=200)
    description: str | None = Field(default=None, max_length=2000)
    status: TaskStatus | None = Field(default=None)
    priority: TaskPriority | None = Field(default=None)
    tag: str | None = Field(default=None, max_length=100)
    due_date: date | None = Field(default=None)
    user_id: uuid.UUID | None = Field(default=None)


class TaskResponse(BaseModel):
    id: int
    title: str
    description: str | None = None
    status: TaskStatus
    priority: TaskPriority
    tag: str | None = None
    due_date: date | None = None
    created_at: datetime
    updated_at: datetime | None = None
    user_id: uuid.UUID
