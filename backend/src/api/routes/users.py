import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, or_, select

from src.api.deps import get_current_admin, get_current_user
from src.database import get_db
from src.models.user import User, UserRole
from src.schemas.user import MessageResponse, UserCreate, UserResponse, UserUpdate
from src.services.auth_service import hash_password

router = APIRouter(prefix="/users", tags=["Users"])


@router.get(
    "/me",
    response_model=UserResponse,
    status_code=status.HTTP_200_OK,
    summary="Get current user profile",
    description="Allows any authenticated user to view their own profile information.",
)
def get_current_user_profile(
    current_user: User = Depends(get_current_user),
) -> User:
    return current_user


@router.get(
    "",
    response_model=list[UserResponse],
    status_code=status.HTTP_200_OK,
    summary="Get all users (Admin only)",
    description="Enables administrator to view all registered users in the system.",
)
def get_all_users(
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_current_admin),
) -> list[User]:
    users = db.exec(select(User).order_by(User.created_at.desc())).all()
    return users


@router.post(
    "",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED
)
def create_user_by_admin(
    user_in: UserCreate,
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_current_admin),
) -> User:
    statement = select(User).where(
        or_(User.username == user_in.username, User.email == user_in.email)
    )
    existing_user = db.exec(statement).first()
    if existing_user:
        if existing_user.username == user_in.username:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username is already registered.",
            )
        if existing_user.email == user_in.email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email is already registered.",
            )

    hashed_pwd = hash_password(user_in.password)
    new_user = User(
        username=user_in.username.strip(),
        email=user_in.email.strip(),
        hashed_password=hashed_pwd,
        role=user_in.role or UserRole.USER,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


@router.get(
    "/{id}",
    response_model=UserResponse,
    status_code=status.HTTP_200_OK,
    summary="Get user by ID (Admin only)",
)
def get_user_by_id(
    id: uuid.UUID,
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_current_admin),
) -> User:
    user = db.get(User, id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with ID {id} not found.",
        )
    return user


@router.put(
    "/{id}",
    response_model=UserResponse,
    status_code=status.HTTP_200_OK,
)
def update_user_by_admin(
    id: uuid.UUID,
    user_update: UserUpdate,
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_current_admin),
) -> User:
    from loguru import logger

    logger.debug("update by admin")
    user = db.get(User, id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with ID {id} not found.",
        )

    if user_update.username and user_update.username != user.username:
        existing = db.exec(select(User).where(User.username == user_update.username)).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username is already taken.",
            )
        user.username = user_update.username.strip()

    if user_update.email and user_update.email != user.email:
        existing = db.exec(select(User).where(User.email == user_update.email)).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email is already taken.",
            )
        user.email = user_update.email.strip()

    if user_update.role is not None:
        if user.id == admin_user.id and user_update.role != UserRole.ADMIN:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Admin cannot demote their own account.",
            )
        user.role = user_update.role

    if user_update.password:
        user.hashed_password = hash_password(user_update.password)

    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.delete(
    "/{id}",
    response_model=MessageResponse,
    status_code=status.HTTP_200_OK,
    summary="Delete user by ID (Admin only)",
    description="Enables administrator to delete a user account and associated tasks.",
)
def delete_user(
    id: uuid.UUID,
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_current_admin),
) -> dict:
    target_user = db.get(User, id)
    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with ID {id} not found.",
        )

    if target_user.id == admin_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Admin cannot delete their own account.",
        )

    db.delete(target_user)
    db.commit()

    return {
        "message": f"User '{target_user.username}' (ID: {id}) deleted successfully."
    }
