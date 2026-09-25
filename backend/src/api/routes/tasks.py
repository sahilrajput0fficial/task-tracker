from datetime import UTC, datetime

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlmodel import Session, select

from src.api.deps import get_current_user
from src.database import get_db
from src.models.task import Task, TaskStatus
from src.models.user import User, UserRole
from src.schemas.task import TaskCreate, TaskResponse, TaskUpdate
from src.schemas.user import MessageResponse

router = APIRouter(prefix="/tasks", tags=["Tasks"])


@router.post(
    "",
    response_model=TaskResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_task(
    task_in: TaskCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Task:
    target_user_id = current_user.id
    if current_user.role == UserRole.ADMIN and task_in.user_id:
        target_user_id = task_in.user_id

    task = Task(
        title=task_in.title.strip(),
        description=task_in.description.strip() if task_in.description else None,
        status=task_in.status,
        priority=task_in.priority,
        tag=task_in.tag,
        due_date=task_in.due_date,
        user_id=target_user_id,
    )
    db.add(task)
    db.commit()
    db.refresh(task)
    return task


@router.get(
    "",
    response_model=list[TaskResponse],
    status_code=status.HTTP_200_OK,
)
def get_tasks(
    status_filter: TaskStatus | None = Query(
        None,
        alias="status",
    ),
    mine: bool = Query(
        False,
        description="Filter only current user's own tasks",
    ),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[Task]:
    statement = select(Task)

    if current_user.role != UserRole.ADMIN or mine:
        statement = statement.where(Task.user_id == current_user.id)

    if status_filter:
        statement = statement.where(Task.status == status_filter)

    statement = statement.order_by(Task.created_at.desc())
    tasks = db.exec(statement).all()
    return tasks


@router.get(
    "/{id}",
    response_model=TaskResponse,
    status_code=status.HTTP_200_OK,
    summary="Get task by ID",
    description="Retrieves a specific task. Regular users can only access their own tasks; admins can access any task.",
)
def get_task_by_id(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Task:
    task = db.get(Task, id)
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Task with ID {id} not found.",
        )

    # Check permission
    if current_user.role != UserRole.ADMIN and task.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: You do not have permission to view this task.",
        )

    return task


@router.put(
    "/{id}",
    response_model=TaskResponse,
    status_code=status.HTTP_200_OK,
    summary="Update a task",
    description="Updates task title, description, or status. Regular users can only update their own tasks; admins can update any task.",
)
def update_task(
    id: int,
    task_update: TaskUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Task:
    task = db.get(Task, id)
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Task with ID {id} not found.",
        )

    # Check permission
    if current_user.role != UserRole.ADMIN and task.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: You do not have permission to modify this task.",
        )

    # Apply updates
    if task_update.title is not None:
        task.title = task_update.title.strip()
    if task_update.description is not None:
        task.description = task_update.description.strip()
    if task_update.status is not None:
        task.status = task_update.status
    if task_update.priority is not None:
        task.priority = task_update.priority
    if task_update.tag is not None:
        task.tag = task_update.tag
    if task_update.due_date is not None:
        task.due_date = task_update.due_date
    if current_user.role == UserRole.ADMIN and task_update.user_id is not None:
        task.user_id = task_update.user_id
    task.updated_at = datetime.now(UTC)

    db.commit()
    db.refresh(task)
    return task


@router.delete(
    "/{id}",
    response_model=MessageResponse,
    status_code=status.HTTP_200_OK,
    summary="Delete a task",
    description="Deletes a task. Regular users can only delete their own tasks; admins can delete any task.",
)
def delete_task(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict:
    task = db.get(Task, id)
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Task with ID {id} not found.",
        )

    # Check permission
    if current_user.role != UserRole.ADMIN and task.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: You do not have permission to delete this task.",
        )

    db.delete(task)
    db.commit()
    return {"message": f"Task {id} deleted successfully."}

